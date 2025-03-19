import { QueryEngine as QueryEngineSparql } from '@comunica/query-sparql';
import { QueryEngine as QueryEngineSolid } from '@comunica/query-sparql-solid';
import { Bindings } from '@comunica/types';
import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createContainerAt,
  saveFileInContainer,
  createThing,
  buildThing,
  setThing,
  Thing,
  getThingAll,
  getStringNoLocale,
  SolidDataset,
  getFile,
  getContainedResourceUrlAll,
  getUrl,
  getDatetime,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";

interface queryResultJson {
  head: { vars: string[] };
  results: { bindings: any[] };
}

/**
 * Executes a SPARQL query over one or many SPARQL endpoints and/or Solid Pods.
 * 
 * @param query The string representation of a SPARQL query to be executed.
 * @param providedSources a string[] that provides the sources for executing the specified query
 * @returns A Promise that resolves to a string of JSON results if results were found, or `null` if there were no results or an error.
*/
export async function executeQuery(query: string, providedSources: string[]): Promise<queryResultJson | null> {
  // remove "<>" from Endpoint IRIs
  const cleanedSources = providedSources.map(url => url.slice(1, -1));
  const sparqlSources: string[] = [];
  const solidSources: string[] = [];
  let queryType = 0;

  for (const sourceUrl of cleanedSources) {
    if (sourceUrl.includes('sparql')) {
      sparqlSources.push(sourceUrl);
    } else {
      solidSources.push(sourceUrl);
    }
  }
  console.log('SPARQL Sources: ', sparqlSources);
  console.log('Solid Sources: ', solidSources);
  
  let sparqlResults = null;
  let solidResults = null;

  if (sparqlSources.length > 0) {
    sparqlResults = await sparqlEndpointQuery(query, sparqlSources);
    queryType += 1;
  }
  if (solidSources.length > 0) {
    solidResults = await solidPodQuery(query, solidSources);
    queryType += 10;
  }

  // for just SPARQL sources
  // TODO: Make this BOTH sources type work with data display (probably two different tables??)
  if (queryType == 1) {
    console.log('Results displayed are from ONLY SPARQL sources.');
    return sparqlResults;
  } else {
    // for just Solid sources
    if (queryType == 10) {
      console.log('Results displayed are from ONLY SOLID Pod sources.');
      return solidResults;
    } else {
      // for combination of Solid and SPARQL sources
      if (queryType == 11) {
        console.log('Results displayed are from BOTH SPARQL and SOLID sources.');

        // Ensure both have `head.vars` and `results.bindings`
        const sparqlVars = sparqlResults ? sparqlResults.head.vars : [];
        const solidVars = solidResults ? solidResults.head.vars : [];
        
        // Merge unique variables
        const mergedVars = [...new Set([...sparqlVars, ...solidVars])];

        // Merge bindings while labeling sources
        const sparqlBindings = sparqlResults ? sparqlResults.results.bindings.map(binding => ({ ...binding, source: "SPARQL" })) : [];
        const solidBindings = solidResults ? solidResults.results.bindings.map(binding => ({ ...binding, source: "SOLID" })) : [];

        // Final merged JSON structure
        return {
          head: { vars: mergedVars },
          results: { bindings: [...sparqlBindings, ...solidBindings] }
        };
      } else {
        // for no valid sources
        console.log('No valid sources detected...');
        return null;
      }
    }
  }
}

/**
 * Executes a SPARQL query over one or many SPARQL endpoints.
 * 
 * @param inputQuery The string representation of a SPARQL query to be executed.
 * @param sparqlSources a string[] that provides the sources for executing the specified query
 * @returns A Promise that resolves to a string of JSON results if results were found, or `null` if there were no results or an error.
*/
async function sparqlEndpointQuery(inputQuery: string, sparqlSources: string[]): Promise<queryResultJson | null> {
    // execute query over SPARQL endpoint(s)
  const mySparqlEngine = new QueryEngineSparql();
  try {
    const bindingsStream = await mySparqlEngine.queryBindings(inputQuery, {sources: sparqlSources});

    const bindingsArray: any[] = [];
    let firstBinding: Bindings | undefined = undefined;

    // Process each binding from the stream.
    for await (const binding of bindingsStream) {
      // Capture the variable names from the first binding.
      if (!firstBinding) {
        firstBinding = binding;
      }
      const bindingObj: Record<string, { type: string; value: string }> = {};
      binding.forEach((term, variable) => {
        let termType: string;
        switch (term.termType) {
          case "Literal":
            termType = "literal";
            break;
          case "NamedNode":
            termType = "uri";
            break;
          case "BlankNode":
            termType = "bnode";
            break;
          default:
            termType = term.termType.toLowerCase();
        }
        bindingObj[variable.value] = { type: termType, value: term.value };
      });
      bindingsArray.push(bindingObj);
    }

    // If there were no results, use an empty array of variables.
    const vars = firstBinding 
      ? Array.from(firstBinding.keys()).map(variable => variable.value)
      : [];

    return {
      head: { vars },
      results: { bindings: bindingsArray },
    };
  } catch (err) {
    return null;
  }
}

/**
 * Executes a SPARQL query over a list of provided Solid Pod URLs.
 * 
 * @param inputQuery The string representation of a SPARQL query to be executed.
 * @param podSources a string[] that provides the Solid Pod sources for executing the specified query
 * @returns A Promise that resolves to a string of JSON results if results were found, or `null` if there were no results or an error.
*/
async function solidPodQuery(inputQuery: string, podSources: string[]): Promise<queryResultJson | null> {
  const mySolidEngine = new QueryEngineSolid();
  const allSources: string[] = [];

  // Discover all sources the current user has access to
  for (const podUrl of podSources) {
    try {
      const dataset = await getSolidDataset(podUrl, { fetch });
      const podResources = getContainedResourceUrlAll(dataset);
      allSources.push(...podResources);
    } catch (error) {
      console.error(`Failed to access pod: ${podUrl}`, error);
    }
  }

  // Log discovered sources
  if (allSources.length === 0) {
    console.log("No accessible RDF sources found in the provided Pods.");
    return;
  } else {
    console.log(`Found access to ${allSources.length} resources.\nQuerying the sources:`, allSources);
  }

  // Execute query over discovered sources
  try {
    const bindingsStream = await mySolidEngine.queryBindings(inputQuery, {
      sources: allSources,
      fetch: fetch,
    });

    const bindingsArray: any[] = [];
    let firstBinding: Bindings | undefined = undefined;

    // Process each binding from the stream.
    for await (const binding of bindingsStream) {
      // Capture the variable names from the first binding.
      if (!firstBinding) {
        firstBinding = binding;
      }
      const bindingObj: Record<string, { type: string; value: string }> = {};
      binding.forEach((term, variable) => {
        let termType: string;
        switch (term.termType) {
          case "Literal":
            termType = "literal";
            break;
          case "NamedNode":
            termType = "uri";
            break;
          case "BlankNode":
            termType = "bnode";
            break;
          default:
            termType = term.termType.toLowerCase();
        }
        bindingObj[variable.value] = { type: termType, value: term.value };
      });
      bindingsArray.push(bindingObj);
    }

    // If there were no results, use an empty array of variables.
    const vars = firstBinding 
      ? Array.from(firstBinding.keys()).map(variable => variable.value)
      : [];

    return {
      head: { vars },
      results: { bindings: bindingsArray },
    };
  } catch (err) {
    console.error("Error querying multiple pods:", err);
    return null;
  }
}


/**
 * Generates a unique 6-character hash using alphanumeric characters.
 * @param length - Optional length for the hash (default is 6)
 * @returns A string representing the hash.
 */
export function generateHash(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let hash = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    hash += charset.charAt(randomIndex);
  }
  return hash;
}

/**
 * Ensures that a container exists at the given URL.
 * If the container does not exist, it creates one.
 *
 * @param podUrl - The URL of the container (should end with a slash, e.g., "https://pod.example.com/").
 * @returns the query cache directory path.
 */
export async function ensureCacheContainer(podUrl: string): Promise<string> {
  const cacheUrl = podUrl + "querycache/";
  try {
    // Try to retrieve the dataset (container)
    await getSolidDataset(cacheUrl, { fetch });
    console.log(`Query Cache container exists at ${cacheUrl}`);
    return cacheUrl;
  } catch (error) {
    // If not found, create the container
    await createContainerAt(cacheUrl, { fetch });
    console.log(`Query Cache container was created at ${cacheUrl}`);
    return cacheUrl;
  }
}


/**
 * Recursively builds an RDF list (using rdf:first / rdf:rest) from an array of IRI strings.
 *
 * @param sources - An array of IRI strings.
 * @returns An object with:
 *    - head: A Thing representing the head of the RDF list.
 *    - nodes: An array of all list node Things (to be added to your dataset).
 */
function buildRdfList(sources: string[]): { head: Thing; nodes: Thing[] } {
  const RDF_FIRST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#first";
  const RDF_REST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
  const RDF_NIL = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";

  if (sources.length === 0) {
    // For an empty list, return rdf:nil.
    return { head: createThing({ url: RDF_NIL }), nodes: [] };
  }
  
  // Create a blank node for the current list element.
  let listNode = createThing(); // creates a blank node automatically
  listNode = buildThing(listNode)
    .addIri(RDF_FIRST, sources[0])
    .build();
  
  // Recursively build the rest of the list.
  const restList = buildRdfList(sources.slice(1));
  
  // Link the current node to the head of the rest of the list.
  listNode = buildThing(listNode)
    .addIri(RDF_REST, restList.head.url)
    .build();
  
  // Return the current node as the head and include all nodes.
  return { head: listNode, nodes: [listNode, ...restList.nodes] };
}


/**
 * Creates and uploads a Turtle file (Queries.ttl) into the container.
 * The function takes an array of source URLs and formats them into Turtle statements.
 *
 * Each source is converted into an entry like:
 *
 *     <hash1> a Query;
 *         date "date";
 *         query "hash1.rq";
 *         results "hash1.sparqljson";
 *         Source "<url>".
 *
 * @param containerUrl - The container URL (should end with a slash).
 * @param sources - An array of source URLs.
 * @param fileName - The file name to use (default: "queries.ttl").
 * @returns The hash of the query added to queries.ttl.
 */
export async function createQueriesTTL(
  containerUrl: string,
  sources: string[],
  fileName = "queries.ttl"
): Promise<string> {
  
  // Initiatize query cache variables
  const hash = generateHash(6);
  const queryFile = `${hash}.rq`;
  const queryResult = `${hash}.json`;

  // prefixes
  const TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
  const CREATED = "http://purl.org/dc/terms/created";
  const QUERYprop = "http://www.w3.org/2001/sw/DataAccess/tests/test-query#query";
  const QUERYsuperclass = "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryForm";
  const QUERYSELsubclass = "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QuerySelect";
  // TODO: create conditional to allow for labelling of non-select queries...
  const QUERYCONsubclass = "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryConstruct";
  const QUERYDESCsubclass = "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryDescribe";
  const QUERYASKsubclass = "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryAsk ";
  const RESULT = "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result";
  const SOURCE = "http://www.w3.org/ns/sparql-service-description#endpoint"

  const cleanedSources = sources.map(url => url.slice(1, -1));

  // Create a Thing for the new query cache
  const subjectUri = `${containerUrl + fileName}#${hash}`;
  // Create the RDF List of sources
  const { head: sourceListHead, nodes: sourceListNodes } = buildRdfList(cleanedSources);
  let newQueryThing: Thing = createThing({ url: subjectUri });
  newQueryThing = buildThing(newQueryThing)
    // Specify the query hash.
    .addUrl(`${TYPE}`, `${QUERYsuperclass}`)
    .addUrl(`${TYPE}`, `${QUERYSELsubclass}`)
    // Add date of query execution.
    .addDatetime(`${CREATED}`, new Date())
    // Add the query file name.
    .addUrl(`${QUERYprop}`, `${containerUrl}${queryFile}`)
    // Add the results file name.
    .addUrl(`${RESULT}`, `${containerUrl}${queryResult}`)
    .addIri(`${SOURCE}`, sourceListHead.url)
    .build();

  // Saves RDF data as queries.ttl
  let dataset: SolidDataset, message: string;
  try {
    // Try to retrieve the dataset (container) and save updated dataset
    dataset = await getSolidDataset(containerUrl + fileName, { fetch });
    message = `UPDATED queries.ttl which now includes: ${hash}`;
  } catch (error) {
    dataset = createSolidDataset();
    message = `CREATED queries.ttl with first query: ${hash}`;
  }

  dataset = setThing(dataset, newQueryThing);
  sourceListNodes.forEach((node) => {
    dataset = setThing(dataset, node);
  });
  await saveSolidDatasetAt(containerUrl + fileName, dataset, { fetch });
  console.log(message);
  return hash;
}

/**
 * Creates and uploads a SPARQL query file (e.g., hash1.rq) into the container.
 *
 * The provided query string should be formatted as in the example:
 *
 *     PREFIX foaf: <http://xmlns.com/foaf/0.1/>
 *     PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 *     SELECT ?name ?email
 *     WHERE {
 *         ?person rdf:type foaf:Person.
 *         ?person foaf:name ?name.
 *         OPTIONAL { ?person foaf:mbox ?email. }
 *     }
 *
 * @param containerUrl - The container URL (should end with a slash).
 * @param query - The SPARQL query as a string.
 * @param hashName - The hash name to use to name file (e.g., "hash1").
 * @param fetch - The authenticated fetch function.
 * @returns The URL of the uploaded file.
 */
export async function uploadQueryFile(
  containerUrl: string,
  query: string,
  hashName: string
): Promise<string> {

  const fileName = hashName + ".rq";
  const blob = new Blob([query], { type: "application/sparql-query" });

  try {
    const savedFile = await saveFileInContainer(containerUrl, blob, {
      slug: fileName,
      contentType: "application/sparql-query",
      fetch,
    });
    console.log(`Uploaded ${fileName} to ${savedFile.internal_resourceInfo.sourceIri}`);
    return savedFile.internal_resourceInfo.sourceIri;
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
}


/**
 * Creates and uploads a JSON file (e.g., hash1.sparqljson) into the container.
 *
 * The input should be a JSON string formatted like:
 *
 * {
 *   "head": { "vars": ["name", "email"] },
 *   "results": {
 *     "bindings": [
 *       {
 *         "name": {"type": "literal", "value": "Alice"},
 *         "email": {"type": "literal", "value": "alice@example.org"}
 *       },
 *       { ... }
 *     ]
 *   }
 * }
 *
 * @param containerUrl - The container URL (should end with a slash).
 * @param jsonString - The JSON string to upload.
 * @param hashName - The hash name to use to name file (e.g., "hash1").
 * @param fetch - The authenticated fetch function.
 * @returns The URL of the uploaded file.
 */
export async function uploadSparqlJson(
  containerUrl: string,
  jsonString: string,
  hashName: string
): Promise<string> {
  const fileName = hashName + ".json"
  const blob = new Blob([jsonString], { type: "application/sparql-results+json" });

  try {
    const savedFile = await saveFileInContainer(containerUrl, blob, {
      slug: fileName,
      contentType: "application/json",
      fetch,
    });
    console.log(`Uploaded ${fileName} to ${savedFile.internal_resourceInfo.sourceIri}`);
    return savedFile.internal_resourceInfo.sourceIri;
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
}

/**
 * Determines if there is are cached queries in the pod.
 *
 * @param containerUrl - The container URL (should end with a slash).
 * @returns boolean representing if a cache is present.
 */
export async function getQueriesTtl(
  containerUrl: string,
): Promise<boolean> {
  try {
    // Try to retrieve the dataset (container) and save updated dataset
    await getSolidDataset(containerUrl + "queries.ttl", { fetch });
    return true;
  } catch (error) {
    return false;
  }
}

export interface QueryEntry {
  hash: string;
  queryFile: string;
  resultsFile: string;
  sourceUrls: string[];
  created: string;
}


// TODO: Fix THIS
/**
 * Retrieves all query entries from a Queries.ttl file.
 *
 * It loads the dataset, iterates over all Things, and for each Thing with an RDF type "Query"
 * (stored as a string literal on the predicate http://www.w3.org/1999/02/22-rdf-syntax-ns#type),
 * it extracts:
 *
 * - The hash from the Thing’s URL fragment.
 * - The query file name from http://example.com/ns#query.
 * - The results file name from http://example.com/ns#results.
 * - The source URL from http://example.com/ns#Source.
 * - The created date from http://purl.org/dc/terms/created.
 *
 * @param ttlFileUrl - The URL of the Queries.ttl file.
 * @returns An array of QueryEntry objects.
 */
export async function getCachedQueries(
  ttlFileUrl: string
): Promise<QueryEntry[]> {
  // Load the dataset from the TTL file.
  const dataset: SolidDataset = await getSolidDataset(ttlFileUrl, { fetch });
  const things: Thing[] = getThingAll(dataset);
  const queryEntries: QueryEntry[] = [];

  let i = 0;
  things.forEach((thing) => {
    // Extract the hash from the Thing’s URL fragment.
    i += 1;
    const thingUrl = thing.url;
    const hash = thingUrl.includes("#") ? thingUrl.split("#")[1] : "";
    if (hash.length < 7) {
      const created =
        getDatetime(thing, "http://purl.org/dc/terms/created")?.toISOString() || "N/A";
      const queryFile =
        getUrl(thing, "http://www.w3.org/2001/sw/DataAccess/tests/test-query#query") || "N/A";
      const resultsFile =
        getUrl(thing, "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result") || "N/A";
      // For dereferencing RDF source list
      const sourceListUrl = getUrl(thing, "http://www.w3.org/ns/sparql-service-description#endpoint");
      let sourceUrls: string[] = [];
      if (sourceListUrl) {
        const sourceListHash = sourceListUrl.includes("#") ? sourceListUrl.split("#")[1] : "";
        sourceUrls = rdfListSources(sourceListHash, things, i);
      }
      queryEntries.push({
        hash,
        queryFile,
        resultsFile,
        sourceUrls,
        created,
      });
    }
  });
  return queryEntries;
}

/**
 * Iterates through an RDF list and extracts source URLs.
 * @param rdfHash The hash of the first node in the RDF list.
 * @param things Array of RDF Things from the dataset.
 * @param dataset The SolidDataset containing the RDF list.
 * @returns An array of extracted source URLs.
 */
function rdfListSources(rdfHash: string, things: Thing[], index: number): string[] {
  const RDF_FIRST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#first";
  const RDF_REST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
  const RDF_NIL = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";

  const extractedUrls: string[] = [];
  let currentNodeHash = `#${rdfHash}`;

  while (index < things.length) {
    if (currentNodeHash.length < 8) break;

    const url = getUrl(things[index], RDF_FIRST);
    if (url) extractedUrls.push(url);

    const nextNodeHash = getUrl(things[index], RDF_REST);
    if (!nextNodeHash || nextNodeHash === RDF_NIL) break; // Stop at rdf:nil

    currentNodeHash = nextNodeHash;
    index += 1;
  }
  return extractedUrls;
}

/**
 * Fetches a SPARQL query file (e.g. a "hash.rq" file) from the given URL and returns its text content.
 *
 * @param fileUrl - The URL of the SPARQL query file.
 * @returns A promise that resolves to the text content of the query file.
 */
export async function fetchQueryFileData(
  fileUrl: string
): Promise<string> {
  const file = await getFile(fileUrl, { fetch });
  const textContent = await file.text();
  return textContent;
}

/**
 * Fetches a SPARQL JSON results file (e.g. a "hash.sparqljson" file) from the given URL and returns its parsed JSON.
 *
 * @param fileUrl - The URL of the SPARQL JSON results file.
 * @returns A promise that resolves to the parsed JSON object.
 */
export async function fetchSparqlJsonFileData(
  fileUrl: string
): Promise<queryResultJson | null> {
  const file = await getFile(fileUrl, { fetch });
  const textContent = await file.text();
  try {
    const jsonData = JSON.parse(textContent);
    return {
      head: { vars: jsonData.head?.vars || [] },
      results: { bindings: jsonData.results?.bindings || [] }
    };
  } catch (error) {
    console.error(`Error parsing JSON from file at ${fileUrl}: ${error}`);
    return null;
  }
}
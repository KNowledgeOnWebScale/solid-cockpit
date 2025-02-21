import { Session } from "@inrupt/solid-client-authn-browser";
import { QueryEngine } from '@comunica/query-sparql-link-traversal-solid';
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
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";

const myEngine = new QueryEngine();

/**
 * Fetches a logged-in user's Pod URLs using a webID.
 * 
 * @param webid The webID URL of the current user.
 * @returns A Promise that resolves to a string[] of user Pod URLs, if available, or `undefined` if no pods are found.
*/
export async function executeQuery(source: string, session: Session): Promise<Bindings[] | null> {
  try {
    const bindingsStream = await myEngine.queryBindings(`
      SELECT ?o WHERE {
        ?s <http://www.w3.org/ns/ldp#contains> ?o .
      }`, {
      sources: [source],
      '@comunica/actor-http-inrupt-solid-client-authn:session': session
    });
    
    return await bindingsStream.toArray()
  } catch (err) {
    return null;
  }
}

/**
 * Generates a unique 6-character hash using alphanumeric characters.
 * @param length - Optional length for the hash (default is 6)
 * @returns A string representing the hash.
 */
function generateHash(length = 6): string {
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
  console.log(`Query Cache container exists at ${cacheUrl}`);
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
 * Creates and uploads a Turtle file (Queries.ttl) into the container.
 * The function takes an array of source URLs and formats them into Turtle statements.
 *
 * Each source is converted into an entry like:
 *
 *     <#hash1> a Query;
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
  const currentDate: Date = new Date();
  const isoDate: string = currentDate.toISOString();
  const hash = "#" + generateHash();
  const queryFile = `${hash}.rq`;
  const queryResult = `${hash}.sparqljson`;
  let querySources = '';
  sources.forEach((source, index) => {
    if (index < 1) {
      querySources += `${source}`;
    } else {
      querySources += `, ${source}`;
    }
  });

  // Create a Thing for the new query cache
  const subjectUri = `${containerUrl + fileName}${hash}`;
  let newQueryThing: Thing = createThing({ url: subjectUri });
  newQueryThing = buildThing(newQueryThing)
    // Specify the query hash.
    .addStringNoLocale("http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "Query")
    // Add date of query execution.
    .addStringNoLocale("http://purl.org/dc/terms/created", isoDate)
    // Add the query file name.
    .addStringNoLocale("http://example.com/terms#query", queryFile)
    // Add the results file name.
    .addStringNoLocale("http://example.com/terms#results", queryResult)
    // Add the source URLs.
    .addStringNoLocale("http://example.com/terms#sources", querySources)
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

  const updatedDataset = setThing(dataset, newQueryThing);
  await saveSolidDatasetAt(containerUrl + fileName, updatedDataset, { fetch });
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
 * @param hashName - The hash name to use to name file (e.g., "#hash1").
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
 * @param hashName - The hash name to use to name file (e.g., "#hash1").
 * @param fetch - The authenticated fetch function.
 * @returns The URL of the uploaded file.
 */
export async function uploadSparqlJson(
  containerUrl: string,
  jsonString: string,
  hashName: string
): Promise<string> {
  const fileName = hashName + ".sparqljson"
  const blob = new Blob([jsonString], { type: "application/json" });

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
  source: string;
  created: string;
}

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

  things.forEach((thing) => {
    // Check if the Thing has an RDF type of "Query".
    const typeValue = getStringNoLocale(
      thing,
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
    );
    if (typeValue !== "Query") {
      return;
    }

    // Extract the hash from the Thing’s URL fragment.
    const thingUrl = thing.url;
    const hash = thingUrl.includes("#") ? thingUrl.split("#")[1] : "";

    // Extract additional properties using their full predicate IRIs.
    const queryFile =
      getStringNoLocale(thing, "http://example.com/ns#query") || "";
    const resultsFile =
      getStringNoLocale(thing, "http://example.com/ns#results") || "";
    const source =
      getStringNoLocale(thing, "http://example.com/ns#Source") || "";
    const created =
      getStringNoLocale(thing, "http://purl.org/dc/terms/created") || "";

    queryEntries.push({
      hash,
      queryFile,
      resultsFile,
      source,
      created,
    });
  });

  return queryEntries;
}

/**
 * Fetches a SPARQL query file (e.g. a "#hash.rq" file) from the given URL and returns its text content.
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
 * Fetches a SPARQL JSON results file (e.g. a "#hash.sparqljson" file) from the given URL and returns its parsed JSON.
 *
 * @param fileUrl - The URL of the SPARQL JSON results file.
 * @returns A promise that resolves to the parsed JSON object.
 */
export async function fetchSparqlJsonFileData(
  fileUrl: string
): Promise<any> {
  const file = await getFile(fileUrl, { fetch });
  const textContent = await file.text();
  try {
    const jsonData = JSON.parse(textContent);
    return jsonData;
  } catch (error) {
    throw new Error(`Error parsing JSON from file at ${fileUrl}: ${error}`);
  }
}
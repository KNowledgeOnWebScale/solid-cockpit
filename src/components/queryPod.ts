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
  SolidDataset,
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


import { QueryEngine as SparqlEngineCache } from "query-sparql-remote-cache";
import { QueryEngine as SolidQueryEngine } from "@comunica/query-sparql";
import { KeyRemoteCache } from "actor-query-process-remote-cache";
import { createCoiFetch } from "./z3-headers";
import { Bindings } from "@comunica/types";
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
  SolidDataset,
  getFile,
  getUrl,
  getDatetime,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { Parser as SparqlParser } from "sparqljs";
import { changeAclPublic, generateAcl, Permissions } from "./privacyEdit";
import { fetchPermissionsData } from "./getData";

export interface QueryResultJson {
  head: { vars: string[] };
  results: { bindings: any[] };
}
export interface ProvenanceData {
  algorithm: string;
  id: {
    termType: string;
    value: string;
  };
}
export interface CacheOutput {
  provenanceOutput: ProvenanceData | null;
  resultsOutput: QueryResultJson;
}
export interface ComunicaSources {
  value: string;
  context?: Record<string, any>;
}
export interface CachedQuery {
  hash: string;
  queryFile: string;
  resultsFile: string;
  sourceUrls: string[];
  created: string;
}

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export interface CoiFetchOptions {
  /** Mimic SW behavior: for no-cors requests, drop credentials (except excluded URLs). Default: true */
  coepCredentialless?: boolean;

  /** Exclude certain URLs from the credentialless rewrite. Default: url.includes("sparql") */
  excludeUrl?: (url: string) => boolean;

  /** Optional logger for errors (mostly parity with SW's console.error on fetch failure). */
  onError?: (e: unknown) => void;
}

/**
 * Stops an ongoing query by destroying a main thread binding stream.
 * @param bindingStream - The Comunica bindings stream to destroy.
 */
export function stopQuery(bindingStream: any) {
  if (bindingStream && typeof bindingStream.destroy === "function") {
    // Destroy the main thread binding stream
    bindingStream.destroy();
    return true;
  }
  return false;
}

/**
 * Cleans an array of source URLs by removing angle brackets ("<" and ">")
 * Also turns string[] into a ComunicaSources[], meaning Solid sources are given auth context.
 *
 * @param dirtySources - An array of source URLs, some of which may be enclosed in angle brackets.
 * @returns A new array of cleaned source URLs without angle brackets.
 */
export function cleanSourcesUrls(dirtySources: string[]): ComunicaSources[] {
  const betterSources: string[] = [];
  const comunicasources: ComunicaSources[] = [];

  dirtySources.forEach((url) => {
    // removes unwanted URI indicating characters
    if (url.startsWith("<") && url.endsWith(">")) {
      betterSources.push(url.slice(1, -1));
    } else {
      betterSources.push(url);
    }
  });
  betterSources.forEach((url) => {
    // TODO: fix --> currently very dumb way of doing this
    if (url.includes("sparql") || url.includes("endpoint")) {
      comunicasources.push({ value: url });
    } else {
      comunicasources.push({ value: url, context: { fetch: fetch } });
    }
  });
  return comunicasources;
}

/**
 * Cleans an array of source URLs by removing angle brackets ("<" and ">")
 * Also turns string[] into a ComunicaSources[], meaning Solid sources are given auth context.
 *
 * @param dirtySources - An array of source URLs, some of which may be enclosed in angle brackets.
 * @returns A new array of cleaned source URLs without angle brackets.
 */
export function cleanSourcesUrlsForCache(dirtySources: string[]): string[] {
  const betterSourcesCache: string[] = [];

  dirtySources.forEach((url) => {
    // removes unwanted URI indicating characters
    if (url.startsWith("<") && url.endsWith(">")) {
      betterSourcesCache.push(url.slice(1, -1));
    } else {
      betterSourcesCache.push(url);
    }
  });
  return betterSourcesCache;
}

/**
 * Executes a SPARQL query over one or many SPARQL endpoints and/or Solid Pods.
 *
 * @param query The string representation of a SPARQL query to be executed.
 * @param providedSources a string[] that provides the sources for executing the specified query
 * @param userCachePath a string designating the user's pod url
 * @returns a CacheOutput object with either:
 *  a) cache provenance + query results
 *  b) provenance = null (if no cache was used) + query results
 *  c) an error: if there was an error
 */
export async function executeQueryWithPodConnected(
  query: string,
  providedSources: ComunicaSources[],
  userCachePath: string
): Promise<CacheOutput | string | null> {

  // TODO: z3-solver DOES NOT work on a Worker Thread... (maybe could fix?)
  // First, try to perform the query using the cache worker.
  // This worker attempts to find results in the user's cache (Solid Pod).
  // const cacheWorker = new Worker(new URL("./queryWorkerCache.js", import.meta.url), {
  //   type: "module",
  // });
  // cacheWorker.postMessage({
  //   query,
  //   sources: cleanedSources,
  //   cachepath: userCachePath,
  // });

  // Create a promise that resolves when the cache worker returns a result.
  // If the cache worker fails (no cache or error), start a regular worker to run the query without cache.
  // return new Promise<CacheOutput | null>((resolve) => {
  //   cacheWorker.onmessage = (e) => {
  //     const { data: c } = e;
  //     if (c.error) {
  //       // Cache worker did not find results or encountered an error.
  //       console.log("Cache search result:", c.error);
  //       // Start a regular worker to run the query directly (no cache).
  //       const regWorker = new Worker(
  //         new URL("./queryWorkerCache.js", import.meta.url),
  //         { type: "module" }
  //       );
  //       regWorker.postMessage({
  //         query,
  //         sources: cleanedSources,
  //       });
  //       // Listen for the result from the regular worker.
  //       regWorker.onmessage = (ev) => {
  //         const { data: r } = ev;
  //         if (r.error) {
  //           // Regular worker also failed.
  //           console.log("Regular worker error:", r.error);
  //           resolve(null);
  //         } else {
  //           // Regular worker succeeded, return results with no provenance.
  //           resolve({
  //             provenanceOutput: null,
  //             resultsOutput: r,
  //           });
  //         }
  //       };
  //     } else {
  //       // Cache worker succeeded, return cached results.
  //       resolve(c);
  //     }
  //   };
  // });

  const output = await sparqlQueryWithCache(
    query,
    providedSources,
    userCachePath
  );
  // case where cache is not used
  return output;
}

/**
 * Executes a SPARQL query over a list of provided Solid Pod URLs.
 *
 * @param inputQuery The string representation of a SPARQL query to be executed.
 * @param mixedSources a ComunicaSources[] that provides the Solid Pod or SPARQL Endpoint sources for executing the specified query.
 * @param cachePath a string designating the user's query cache url
 * @returns either:
 *  a) a CacheOutput object (containing cache provenance + query results)
 *  b) a string indicating no cache was used
 *  c) null if there was an error
 */
async function sparqlQueryWithCache(
  inputQuery: string,
  mixedSources: ComunicaSources[],
  cachePath: string
): Promise<CacheOutput | string | null> {
  const cacheLocation = { url: cachePath + "queries.ttl" };
  const mySparqlEngine = new SparqlEngineCache();

  try {
    const fetchForCache = createCoiFetch(fetch, { coepCredentialless: false, passthroughOpaque: true, noCors: false });

    // Query executor using Comunica
    const bindingsStream = await mySparqlEngine.queryBindings(inputQuery, {
      lenient: true,
      fetch: fetchForCache,
      [KeyRemoteCache.location.name]: cacheLocation,
      sources: mixedSources,
      failOnCacheMiss: true,
    });

    // extract provenance information
    let provenance: ProvenanceData | null = null;
    // Extract provenance information to display in the UI
    bindingsStream.getProperty("provenance", (val) => {
      if (val && typeof val === "object" && "algorithm" in val && "id" in val) {
        provenance = {
          algorithm: val.algorithm,
          id: {
            termType: val.id.termType,
            value: val.id.value,
          },
        };
      }
    });

    // Displays the results of the query
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
      ? Array.from(firstBinding.keys()).map((variable) => variable.value)
      : [];

    // results as an object
    const resultsOutput: QueryResultJson = {
      head: { vars },
      results: { bindings: bindingsArray },
    };

    const returnVal: CacheOutput = {
      provenanceOutput: provenance,
      resultsOutput: resultsOutput,
    };
    return returnVal;
  } catch (err) {
    return "no-cache";
  }
}

/**
 * Executes a SPARQL query over a list of provided Solid Pod URLs.
 *
 * @param inputQuery The string representation of a SPARQL query to be executed.
 * @param mixedSources a ComunicaSources[] that provides the Solid Pod or SPARQL Endpoint sources for executing the specified query.
 * @returns a CacheOutput object (containing cache provenance + query results)
 */
export async function executeQueryInMainThread(
  inputQuery: string,
  mixedSources: ComunicaSources[],
): Promise<CacheOutput | Error> {
  const mySparqlEngine = new SolidQueryEngine();

  const fetchForCache = createCoiFetch(fetch, { coepCredentialless: false, passthroughOpaque: true, noCors: true });
  try {
    // Query executor using Comunica
    const bindingsStream = await mySparqlEngine.queryBindings(inputQuery, {
      lenient: true,
      sources: mixedSources,
    });

    // Displays the results of the query
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
      ? Array.from(firstBinding.keys()).map((variable) => variable.value)
      : [];

    // results as an object
    const resultsOutput: QueryResultJson = {
      head: { vars },
      results: { bindings: bindingsArray },
    };

    const returnVal: CacheOutput = {
      provenanceOutput: null,
      resultsOutput: resultsOutput,
    };
    return returnVal;
  } catch (err) {
    return err;
  }
}


/**
 * Generates a unique 6-character hash using alphanumeric characters.
 * @param length - Length for the hash
 * @returns A string representing the hash.
 */
export function generateHash(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let hash = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    hash += charset.charAt(randomIndex);
  }
  return hash;
}

/**
 * Generates a deterministic alphanumeric hash of given length using a seed.
 * @param seedValue - The string used to seed the hash generation
 * @param length - Length of the output hash (default: 10)
 * @returns A deterministic hash string
 */
export function generateSeededHash(seedValue: string, length = 10): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const seed = stringToSeed(seedValue);
  const random = mulberry32(seed);

  let hash = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(random() * charset.length);
    hash += charset.charAt(index);
  }
  return hash;
}

/**
 * Creates a seeded pseudorandom number generator.
 * Mulberry32 is fast and well-suited for small tasks like this.
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a string into a numeric seed.
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Ensures that a container exists at the given URL.
 * If the container does not exist, it creates one.
 *
 * @param podUrl - The URL of the container (should end with a slash, e.g., "https://pod.example.com/").
 * @returns the query cache directory path.
 */
export async function ensureCacheContainer(podUrl: string, webId: string): Promise<string> {
  const cacheUrl = podUrl + "querycache/";
  try {
    // Try to retrieve the dataset (container)
    await getSolidDataset(cacheUrl, { fetch });
    return cacheUrl;
  } catch (error) {
    // If not found, create the container
    await createContainerAt(cacheUrl, { fetch });

    // TODO: Change this to just initialize acl with default permissions
    // Set public read permissions for the cache container
    const publicRead: Permissions = {
      read: true,
      append: false,
      write: false,
      control: false,
    };
    let aclDataset = await fetchPermissionsData(cacheUrl);
    if (aclDataset == null) {
      console.warn("Initializing an ACL for your inbox/ container...");
      await generateAcl(cacheUrl, webId);
      await changeAclPublic(cacheUrl, publicRead);
    } else {
      await changeAclPublic(cacheUrl, publicRead);
    }

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
  listNode = buildThing(listNode).addIri(RDF_FIRST, sources[0]).build();

  // Recursively build the rest of the list.
  const restList = buildRdfList(sources.slice(1));

  // Link the current node to the head of the rest of the list.
  listNode = buildThing(listNode).addIri(RDF_REST, restList.head.url).build();

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
 *         queryFile "hash1.rq";
 *         queryText """ ... """;
 *         resultsFile "hash1.sparqljson";
 *         Sources "<url>";
 *         date "date"^^xsdDate.
 *
 * @param containerUrl - The container URL (should end with a slash).
 * @param sources - An array of source URLs.
 * @param fileName - The file name to use (default: "queries.ttl").
 * @returns The hash of the query added to queries.ttl.
 */
export async function createQueriesTTL(
  containerUrl: string,
  query: string,
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
  const QUERYprop =
    "http://www.w3.org/2001/sw/DataAccess/tests/test-query#query";
  const sh = "http://www.w3.org/ns/shacl#";
  const QUERYsuperclass =
    "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryForm";
  const QUERYSELsubclass =
    "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QuerySelect";
  // TODO: create conditional to allow for labelling of non-select queries...
  const QUERYCONsubclass =
    "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryConstruct";
  const QUERYDESCsubclass =
    "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryDescribe";
  const QUERYASKsubclass =
    "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryAsk ";
  const RESULT =
    "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result";
  const SOURCE = "http://www.w3.org/ns/sparql-service-description#endpoint";
  const OWL = "http://www.w3.org/2002/07/owl#";
  const SCHEMA = "https://schema.org/";
  const SPEX = "https://purl.expasy.org/sparql-examples/ontology#";

  const cleanedSources: string[] = cleanSourcesUrlsForCache(sources);
  console.log(cleanedSources);
  // parse input query string using SPARQLjs
  const serviceSources = parseSparqlQuery(query);

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

  // Tried to get fancy with shacl prefixes here but not necessary :(
  // const prefixes: string[] = Object.entries(parsedQuery.prefixes).map(
  //   ([prefix, namespace]) => {
  //     // Add prefixes using SHACL's `sh:declare`
  //     let prefixDeclaration: Thing = createThing({ url: `_:${hash}_prefixes` });
  //     prefixDeclaration = buildThing(prefixDeclaration)
  //       .addIri(`${sh}declare`, `_:prefix_${prefix}`)
  //       .build();
  //     // Add actual prefix urls SHACL's `sh:prefix` and `sh:namespace`
  //     let prefixContent = createThing({ url: `_:${hash}_prefixes` });
  //     prefixContent = buildThing(prefixContent)
  //       .addStringNoLocale(`${sh}prefix`, prefix)
  //       .addUrl(`${sh}namespace`, namespace)
  //       .build();

  //     dataset = setThing(dataset, prefixDeclaration);
  //     dataset = setThing(dataset, prefixContent);
  //     return `_:${hash}_prefixes`;
  //   }
  // );

  // Create the RDF List of sources
  const { head: sourceListHead, nodes: sourceListNodes } =
    buildRdfList(cleanedSources);

  // Create a Thing for the new query cache
  const subjectUri = `${containerUrl + fileName}#${hash}`;
  let newQueryThing: Thing = createThing({ url: subjectUri });
  newQueryThing = buildThing(newQueryThing)
    // Specify the query hash.
    .addUrl(`${TYPE}`, `${QUERYsuperclass}`)
    .addUrl(`${TYPE}`, `${QUERYSELsubclass}`)
    .addIri(`${TYPE}`, `${sh}SPARQLExecutable`)
    // Add the query file
    .addUrl(`${QUERYprop}`, `${containerUrl}${queryFile}`)
    // add sh:prefixes
    // .addIri(`${sh}prefixes}`, prefixes[0])
    // add query body
    // TODO: fix this so the query is enclosed in """ """ not " " ...
    .addStringNoLocale(`${sh}select`, query)
    // Add the results file name
    .addUrl(`${RESULT}`, `${containerUrl}${queryResult}`)
    // Add sources as an RDF list
    .addIri(`${SOURCE}`, sourceListHead.url)

    // Add date of query execution.
    .addDatetime(`${CREATED}`, new Date())
    .build();

  // Adds any SERVICE description sources to query entry
  if (serviceSources.length > 0) {
    serviceSources.forEach((source) => {
      newQueryThing = buildThing(newQueryThing)
        .addUrl(`${SPEX}federatesWith`, source)
        .build();
    });
  }

  // Adds query sources to query entry
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
    console.log(
      `Uploaded ${fileName} to ${savedFile.internal_resourceInfo.sourceIri}`
    );
    return savedFile.internal_resourceInfo.sourceIri;
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
}

/**
 * Parses a SPARQL query file for SERVICE clauses and returns any federation source URLs.
 *
 * @param queryString The SPARQL query as a string.
 * @returns An object containing the prefixes and the query body.
 */
export function parseSparqlQuery(queryString: string): string[] {
  const parser = new SparqlParser();

  try {
    // Parse the SPARQL query string into a structured object
    const parsedQuery = parser.parse(queryString);

    // Initialize an array to store service sources
    const serviceSources: string[] = [];

    // Helper function to recursively search for SERVICE clauses
    function findServiceClauses(pattern: any) {
      if (pattern.type === "service" || pattern.type === "SERVICE") {
        // Add the service source (URL) to the array
        serviceSources.push(pattern.name.value);
      } else if (pattern.type === "group" || pattern.type === "union") {
        // Recursively check patterns in groups or unions
        pattern.patterns.forEach(findServiceClauses);
      } else if (pattern.type === "optional") {
        // Recursively check optional patterns
        findServiceClauses(pattern.pattern);
      }
    }

    // Start searching for SERVICE clauses in the query's WHERE clause
    if (parsedQuery.type === "query" && parsedQuery.where) {
      parsedQuery.where.forEach(findServiceClauses);
    }

    return serviceSources;
  } catch (error) {
    console.error("Error parsing SPARQL query for SERVICE clauses:", error);
    return [];
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
export async function uploadResults(
  containerUrl: string,
  jsonString: string,
  hashName: string
): Promise<string> {
  const fileName = hashName + ".json";
  const blob = new Blob([jsonString], {
    type: "application/sparql-results+json",
  });

  try {
    const savedFile = await saveFileInContainer(containerUrl, blob, {
      slug: fileName,
      contentType: "application/json",
      fetch,
    });
    console.log(
      `Uploaded ${fileName} to ${savedFile.internal_resourceInfo.sourceIri}`
    );
    return savedFile.internal_resourceInfo.sourceIri;
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
}

/**
 * Determines if there is are cached queries in the pod.
 *
 * @param containerUrl - The ttl URL
 * @returns boolean representing if a cache is present.
 */
export async function getStoredTtl(resourceUrl: string): Promise<boolean> {
  try {
    // Try to retrieve the dataset and save updated dataset
    await getSolidDataset(resourceUrl, { fetch });
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
        getDatetime(thing, "http://purl.org/dc/terms/created")?.toISOString() ||
        "N/A";
      const queryFile =
        getUrl(
          thing,
          "http://www.w3.org/2001/sw/DataAccess/tests/test-query#query"
        ) || "N/A";
      const resultsFile =
        getUrl(
          thing,
          "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result"
        ) || "N/A";
      // For dereferencing RDF source list
      const sourceListUrl = getUrl(
        thing,
        "http://www.w3.org/ns/sparql-service-description#endpoint"
      );
      let sourceUrls: string[] = [];
      if (sourceListUrl) {
        const sourceListHash = sourceListUrl.includes("#")
          ? sourceListUrl.split("#")[1]
          : "";
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
function rdfListSources(
  rdfHash: string,
  things: Thing[],
  index: number
): string[] {
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
export async function fetchQueryFileData(fileUrl: string): Promise<string> {
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
): Promise<QueryResultJson | null> {
  const file = await getFile(fileUrl, { fetch });
  const textContent = await file.text();
  try {
    const jsonData = JSON.parse(textContent);
    return {
      head: { vars: jsonData.head?.vars || [] },
      results: { bindings: jsonData.results?.bindings || [] },
    };
  } catch (error) {
    console.error(`Error parsing JSON from file at ${fileUrl}: ${error}`);
    return null;
  }
}

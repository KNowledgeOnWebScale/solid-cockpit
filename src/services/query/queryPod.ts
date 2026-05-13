import { QueryEngine as SparqlEngineCache } from "query-sparql-remote-cache";
import { QueryEngine as SolidQueryEngine } from "@comunica/query-sparql-solid";
import { QueryEngine as SolidLinkTraversalQueryEngine } from "@comunica/query-sparql-link-traversal-solid";
import { KeyRemoteCache } from "actor-query-process-remote-cache";
import { createCoiFetch } from "./z3-headers";
import { Bindings } from "@comunica/types";
import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createContainerAt,
  overwriteFile,
  createThing,
  buildThing,
  setThing,
  Thing,
  getThing,
  getThingAll,
  SolidDataset,
  getFile,
  getUrl,
  getStringNoLocale,
  getDatetime,
  removeThing,
  setStringNoLocale,
  setDatetime,
} from "@inrupt/solid-client";
import { fetch, getDefaultSession } from "@inrupt/solid-client-authn-browser";
import {
  stopQuery,
  cleanSourcesUrlsForCache,
  generateHash,
  generateSeededHash,
  parseSparqlQuery,
  cleanSourcesUrls as cleanSourcesUrlsInternal,
  type ComunicaSources as UtilityComunicaSources,
} from "./queryPodUtils";

export { stopQuery, cleanSourcesUrlsForCache, generateHash, generateSeededHash, parseSparqlQuery };

const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDF_FIRST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#first";
const RDF_REST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
const RDF_NIL = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";
const DCT_CREATED = "http://purl.org/dc/terms/created";
const DCT_MODIFIED = "http://purl.org/dc/terms/modified";
const DCT_TITLE = "http://purl.org/dc/terms/title";
const DCT_DESCRIPTION = "http://purl.org/dc/terms/description";
const TQ_QUERY = "http://www.w3.org/2001/sw/DataAccess/tests/test-query#query";
const TQ_QUERY_FORM =
  "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QueryForm";
const TQ_QUERY_SELECT =
  "http://www.w3.org/2001/sw/DataAccess/tests/test-query#QuerySelect";
const TM_RESULT =
  "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result";
const SH = "http://www.w3.org/ns/shacl#";
const SH_SELECT = `${SH}select`;
const SH_SPARQL_EXECUTABLE = `${SH}SPARQLExecutable`;
const SD_ENDPOINT = "http://www.w3.org/ns/sparql-service-description#endpoint";
const SPEX = "https://purl.expasy.org/sparql-examples/ontology#";
const PROV = "http://www.w3.org/ns/prov#";
const PROV_ACTIVITY = `${PROV}Activity`;
const PROV_USED = `${PROV}used`;
const PROV_MODIFIED = `${PROV}modified`;
const PROV_WAS_GENERATED_BY = `${PROV}wasGeneratedBy`;
const QVMC = "https://vocab.example/qvmc#";
const QVMC_INDEX = `${QVMC}Index`;
const QVMC_STATUS = `${QVMC}status`;
const QVMC_LINKED_QUERY = `${QVMC}linkedQuery`;
const LDP_RDF_SOURCE = "http://www.w3.org/ns/ldp#RDFSource";
const CACHE_STATUS_CURRENT = "current";

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
export type ComunicaSources = UtilityComunicaSources;
export interface CachedQuery {
  hash: string;
  title?: string;
  description?: string;
  queryFile: string;
  resultsFile: string;
  sourceUrls: string[];
  created: string;
  modified?: string;
  status?: string;
}

export interface QueryCacheEntryInput {
  hash: string;
  query: string;
  queryFileUrl: string;
  resultsFileUrl: string;
  sources: string[];
  status?: "current" | "stale" | "failed";
  title?: string;
  description?: string;
  linkedQueryHash?: string | null;
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

interface HttpFetchIssue {
  url: string;
  status: number;
  statusText: string;
}

/**
 * Returns the Solid SDK-authenticated fetch used across query/cache operations.
 *
 * We intentionally rely on the module-level `fetch` export from
 * `@inrupt/solid-client-authn-browser` because it is the most stable auth
 * bridge across redirects and route transitions in this app. Earlier
 * conditional session switching caused `queries.ttl` reads to intermittently
 * fall back to unauthorized requests, breaking Past Queries loading.
 */
function getSolidAuthenticatedFetch(): FetchLike {
  return fetch;
}

export type QueryExecutionMode =
  | "endpoint"
  | "solid-no-traversal"
  | "solid-link-traversal";

export interface QueryModeDefinition {
  id: QueryExecutionMode;
  label: string;
  description: string;
  validTargets: string;
  recommendedUse: string;
}

/**
 * Central mode metadata used by UI copy and validation hints so mode behavior
 * stays consistent between component and service layers.
 */
export const QUERY_MODE_DEFINITIONS: QueryModeDefinition[] = [
  {
    id: "endpoint",
    label: "SPARQL endpoint(s)",
    description:
      "Use Comunica @comunica/query-sparql for one or more SPARQL endpoints.",
    validTargets:
      "HTTP(S) SPARQL service URLs (for example /sparql, /query, /endpoint).",
    recommendedUse:
      "Best for classic endpoint querying and endpoint federation with SERVICE clauses.",
  },
  {
    id: "solid-no-traversal",
    label: "Solid Pod (no link traversal)",
    description:
      "Use Comunica @comunica/query-sparql-solid for direct pod/container/resource sources.",
    validTargets:
      "Solid pod resource/container URLs where you already know the RDF documents to query.",
    recommendedUse:
      "Best when you want predictable, bounded execution over explicit Solid documents.",
  },
  {
    id: "solid-link-traversal",
    label: "Solid Pod (link traversal)",
    description:
      "Use Comunica @comunica/query-sparql-link-traversal-solid to discover documents by following links.",
    validTargets:
      "Solid pod seed documents/containers that can be traversed to discover linked RDF documents.",
    recommendedUse:
      "Best for exploratory multi-document Solid queries when links must be followed dynamically.",
  },
];

/**
 * Cleans an array of source URLs by removing angle brackets ("<" and ">")
 * Also turns string[] into a ComunicaSources[], meaning Solid sources are given auth context.
 *
 * @param dirtySources - An array of source URLs, some of which may be enclosed in angle brackets.
 * @returns A new array of cleaned source URLs without angle brackets.
 */
export function cleanSourcesUrls(dirtySources: string[]): ComunicaSources[] {
  return cleanSourcesUrlsInternal(dirtySources, getSolidAuthenticatedFetch() as typeof fetch);
}

export function isQueryExecutionMode(modeLike: string): modeLike is QueryExecutionMode {
  return QUERY_MODE_DEFINITIONS.some((mode) => mode.id === modeLike);
}

function getQueryModeDefinition(mode: QueryExecutionMode): QueryModeDefinition {
  return (
    QUERY_MODE_DEFINITIONS.find((definition) => definition.id === mode) ??
    QUERY_MODE_DEFINITIONS[0]
  );
}

function isLikelySparqlEndpointUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    normalized.includes("/sparql") ||
    normalized.includes("/query") ||
    normalized.includes("/endpoint")
  );
}

/**
 * Validates source targets against the selected query mode and throws an
 * actionable error when a source list does not match the intended engine.
 */
export function validateQuerySourcesForMode(
  mode: QueryExecutionMode,
  mixedSources: ComunicaSources[]
): void {
  if (mixedSources.length === 0) {
    if (mode === "solid-link-traversal") {
      // Link-traversal execution may derive seed URLs directly from IRIs in the
      // query text, so explicit sources are optional for this mode.
      return;
    }
    throw new Error(
      "Select at least one datasource URL before running the query."
    );
  }

  const sourceUrls = mixedSources.map((source) => source.value);
  const endpointLikeSources = sourceUrls.filter((source) =>
    isLikelySparqlEndpointUrl(source)
  );
  const nonEndpointSources = sourceUrls.filter(
    (source) => !isLikelySparqlEndpointUrl(source)
  );
  const modeDefinition = getQueryModeDefinition(mode);

  if (mode === "endpoint") {
    if (endpointLikeSources.length !== sourceUrls.length) {
      const invalidSources = sourceUrls.filter(
        (source) => !isLikelySparqlEndpointUrl(source)
      );
      throw new Error(
        `Query mode "${modeDefinition.label}" expects SPARQL endpoint URLs only. Invalid target(s): ${invalidSources.join(
          ", "
        )}.`
      );
    }
    return;
  }

  if (nonEndpointSources.length === 0) {
    throw new Error(
      `Query mode "${modeDefinition.label}" expects Solid document/container targets. Current sources look like endpoint targets only.`
    );
  }

  if (endpointLikeSources.length > 0) {
    throw new Error(
      `Query mode "${modeDefinition.label}" does not accept SPARQL endpoint targets. Remove endpoint URL(s): ${endpointLikeSources.join(
        ", "
      )}.`
    );
  }
}

/**
 * Builds a deterministic 10-character cache entry identifier from the query
 * text and normalized source selection. This aligns the client-side cache key
 * more closely with the spec's stable opaque token guidance.
 */
export function buildCacheEntryHash(
  query: string,
  sources: string[],
  requestHeaders: string[] = []
): string {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const normalizedSources = Array.from(
    new Set(cleanSourcesUrlsForCache(sources).map((source) => source.trim()))
  ).sort();
  const normalizedHeaders = [...requestHeaders].sort();

  return generateSeededHash(
    JSON.stringify({
      query: normalizedQuery,
      sources: normalizedSources,
      headers: normalizedHeaders,
    }),
    10
  );
}

function getIndexResourceUrl(containerUrl: string, fileName = "queries.ttl"): string {
  return `${containerUrl}${fileName}`;
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

/**
 * Builds a deterministic cache member file URL inside a container.
 * This avoids server-dependent POST+Slug handling and keeps member URLs explicit.
 */
export function buildCacheMemberFileUrl(
  containerUrl: string,
  fileName: string
): string {
  const normalizedContainerUrl = ensureTrailingSlash(containerUrl.trim());
  return `${normalizedContainerUrl}${fileName}`;
}

function getQueryEntryUrl(
  containerUrl: string,
  hash: string,
  fileName = "queries.ttl"
): string {
  return `${getIndexResourceUrl(containerUrl, fileName)}#${hash}`;
}

function validateCacheSources(sources: string[]): string[] {
  const cleanedSources = cleanSourcesUrlsForCache(sources)
    .map((source) => source.trim())
    .filter((source) => source.length > 0);

  if (cleanedSources.length === 0) {
    throw new Error(
      "The query cache specification requires one or more source URIs."
    );
  }

  cleanedSources.forEach((source) => {
    new URL(source);
  });

  return cleanedSources;
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
  userCachePath: string,
  queryMode: QueryExecutionMode = "endpoint"
): Promise<CacheOutput | string | null> {

  const output = await sparqlQueryWithCache(
    query,
    providedSources,
    userCachePath,
    queryMode
  );
  // case where cache is not used
  return output;
}

interface QueryBindingsEngine {
  queryBindings: (
    inputQuery: string,
    context: Record<string, unknown>
  ) => Promise<BindingsStreamWithProperties>;
}

interface QueryStreamToJsonOptions {
  includeProvenance?: boolean;
}

interface BindingsStreamWithProperties extends AsyncIterable<Bindings> {
  getProperty?: (name: string, callback: (value: unknown) => void) => void;
}

function normalizeTermType(termType: string): string {
  switch (termType) {
    case "Literal":
      return "literal";
    case "NamedNode":
      return "uri";
    case "BlankNode":
      return "bnode";
    default:
      return termType.toLowerCase();
  }
}

/**
 * Parses a Comunica bindings stream into the JSON structure consumed by YASR/UI.
 * Provenance extraction is optional and used only for endpoint cache-hit reads.
 */
async function streamBindingsToOutput(
  bindingsStream: BindingsStreamWithProperties,
  options: QueryStreamToJsonOptions = {}
): Promise<CacheOutput> {
  let provenanceOutput: ProvenanceData | null = null;
  if (options.includeProvenance && typeof bindingsStream.getProperty === "function") {
    bindingsStream.getProperty("provenance", (val) => {
      if (
        val &&
        typeof val === "object" &&
        "algorithm" in val &&
        "id" in val &&
        val.id &&
        typeof val.id === "object" &&
        "termType" in val.id &&
        "value" in val.id
      ) {
        provenanceOutput = {
          algorithm: String(val.algorithm),
          id: {
            termType: String(val.id.termType),
            value: String(val.id.value),
          },
        };
      }
    });
  }

  const bindingsArray: any[] = [];
  let firstBinding: Bindings | undefined = undefined;

  for await (const binding of bindingsStream) {
    if (!firstBinding) {
      firstBinding = binding;
    }
    const bindingObj: Record<string, { type: string; value: string }> = {};
    binding.forEach((term, variable) => {
      bindingObj[variable.value] = {
        type: normalizeTermType(term.termType),
        value: term.value,
      };
    });
    bindingsArray.push(bindingObj);
  }

  const vars = firstBinding
    ? Array.from(firstBinding.keys()).map((variable) => variable.value)
    : [];

  return {
    provenanceOutput,
    resultsOutput: {
      head: { vars },
      results: { bindings: bindingsArray },
    },
  };
}

/**
 * Creates an authenticated fetch wrapper for endpoint/cache-related Comunica
 * contexts where response header normalization is needed.
 */
function createAuthenticatedQueryFetch(options: { noCors: boolean }): FetchLike {
  const baseFetch: FetchLike = getSolidAuthenticatedFetch();

  return createCoiFetch(baseFetch, {
    coepCredentialless: false,
    passthroughOpaque: true,
    noCors: options.noCors,
  });
}

function getFetchInputUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.url;
  }
  return String(input);
}

function isBlockingHttpStatus(status: number): boolean {
  return status >= 400;
}

function summarizeBlockingHttpIssues(
  issues: HttpFetchIssue[],
  mode: QueryExecutionMode
): string | null {
  const blockingIssues = issues.filter((issue) =>
    isBlockingHttpStatus(issue.status)
  );
  if (blockingIssues.length === 0) {
    return null;
  }

  const uniqueIssues = Array.from(
    new Map(
      blockingIssues.map((issue) => [
        `${issue.status}|${issue.url}`,
        `${issue.status} ${issue.statusText || ""}`.trim() +
          ` at ${issue.url}`,
      ])
    ).values()
  );

  return `HTTP request error(s) detected during ${mode} query execution: ${uniqueIssues.join(
    " | "
  )}`;
}

function createHttpIssueTrackingFetch(
  baseFetch: FetchLike,
  issues: HttpFetchIssue[]
): FetchLike {
  return async (input, init) => {
    const response = await baseFetch(input, init);
    if (response && isBlockingHttpStatus(response.status)) {
      issues.push({
        url: response.url || getFetchInputUrl(input),
        status: response.status,
        statusText: response.statusText || "",
      });
    }
    return response;
  };
}

function createSolidQueryContext(
  mixedSources: ComunicaSources[],
  httpIssues: HttpFetchIssue[]
): Record<string, unknown> {
  const session = getDefaultSession();
  const hasAuthenticatedSession = Boolean(session.info.isLoggedIn);
  const authenticatedFetchBase: FetchLike = getSolidAuthenticatedFetch();
  const authenticatedFetch = createHttpIssueTrackingFetch(
    authenticatedFetchBase,
    httpIssues
  );

  // Per Comunica Solid docs, provide the authn session in context so the Solid
  // HTTP actor can attach credentials for protected pod resources.
  const solidContext: Record<string, unknown> = {
    lenient: true,
    fetch: authenticatedFetch,
    // Solid engines are most stable when sources are explicit IRI strings.
    sources: mixedSources.map((source) => source.value),
  };

  if (hasAuthenticatedSession) {
    solidContext["@comunica/actor-http-inrupt-solid-client-authn:session"] = session;
  }

  return solidContext;
}

function createEndpointCacheContext(
  mixedSources: ComunicaSources[],
  cachePath: string,
  httpIssues: HttpFetchIssue[]
): Record<string, unknown> {
  const authenticatedFetch = createHttpIssueTrackingFetch(
    createAuthenticatedQueryFetch({ noCors: false }),
    httpIssues
  );
  return {
    lenient: true,
    fetch: authenticatedFetch,
    [KeyRemoteCache.location.name]: { url: `${cachePath}queries.ttl` },
    sources: mixedSources,
    failOnCacheMiss: true,
  };
}

async function executeWithEngine(
  engine: QueryBindingsEngine,
  inputQuery: string,
  context: Record<string, unknown>,
  options: QueryStreamToJsonOptions = {}
): Promise<CacheOutput> {
  const bindingsStream = await engine.queryBindings(inputQuery, context);
  return streamBindingsToOutput(bindingsStream, options);
}

async function executeEndpointCacheLookup(
  inputQuery: string,
  mixedSources: ComunicaSources[],
  cachePath: string
): Promise<CacheOutput | string> {
  const endpointEngine = new SparqlEngineCache();
  const httpIssues: HttpFetchIssue[] = [];
  try {
    const output = await executeWithEngine(
      endpointEngine,
      inputQuery,
      createEndpointCacheContext(mixedSources, cachePath, httpIssues),
      { includeProvenance: true }
    );
    // A cache hit that resolves to an empty set can be caused by hard HTTP
    // errors against one or more remote sources. Surface those explicitly.
    const httpIssueMessage = summarizeBlockingHttpIssues(httpIssues, "endpoint");
    if (httpIssueMessage && output.resultsOutput.results.bindings.length === 0) {
      throw new Error(httpIssueMessage);
    }
    return output;
  } catch {
    return "no-cache";
  }
}

async function executeSolidNoTraversalQuery(
  inputQuery: string,
  mixedSources: ComunicaSources[]
): Promise<CacheOutput | Error> {
  const httpIssues: HttpFetchIssue[] = [];
  try {
    const solidEngine = new SolidQueryEngine();
    const output = await executeWithEngine(
      solidEngine,
      inputQuery,
      createSolidQueryContext(mixedSources, httpIssues)
    );
    const httpIssueMessage = summarizeBlockingHttpIssues(
      httpIssues,
      "solid-no-traversal"
    );
    if (httpIssueMessage && output.resultsOutput.results.bindings.length === 0) {
      return new Error(httpIssueMessage);
    }
    return output;
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}

async function executeSolidLinkTraversalQuery(
  inputQuery: string,
  mixedSources: ComunicaSources[]
): Promise<CacheOutput | Error> {
  const httpIssues: HttpFetchIssue[] = [];
  try {
    const output = await executeWithEngine(
      new SolidLinkTraversalQueryEngine(),
      inputQuery,
      createSolidQueryContext(mixedSources, httpIssues)
    );
    const httpIssueMessage = summarizeBlockingHttpIssues(
      httpIssues,
      "solid-link-traversal"
    );
    if (httpIssueMessage && output.resultsOutput.results.bindings.length === 0) {
      return new Error(httpIssueMessage);
    }
    return output;
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Executes a SPARQL query with a pod cache conntected.
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
  cachePath: string,
  queryMode: QueryExecutionMode = "endpoint"
): Promise<CacheOutput | string | null> {
  // Current remote-cache engine is endpoint-focused; non-endpoint modes bypass
  // cache-hit probing and fall back to direct execution in the caller.
  if (queryMode !== "endpoint") {
    return "no-cache";
  }
  return executeEndpointCacheLookup(inputQuery, mixedSources, cachePath);
}

/**
 * Executes a SPARQL query in a woker thread.
 *
 * @param inputQuery The string representation of a SPARQL query to be executed.
 * @param mixedSources a ComunicaSources[] that provides the Solid Pod or SPARQL Endpoint sources for executing the specified query.
 * @returns a CacheOutput object (containing cache provenance + query results)
 */
export async function executeQueryInMainThread(
  inputQuery: string,
  mixedSources: ComunicaSources[],
  queryMode: QueryExecutionMode = "solid-no-traversal"
): Promise<CacheOutput | Error> {
  if (queryMode === "solid-link-traversal") {
    return executeSolidLinkTraversalQuery(inputQuery, mixedSources);
  }

  if (queryMode === "solid-no-traversal") {
    return executeSolidNoTraversalQuery(inputQuery, mixedSources);
  }

  return new Error(
    `Main-thread query execution is only supported for Solid modes. Received "${queryMode}".`
  );
}

/**
 * Ensures that a container exists at the given URL.
 * If the container does not exist, it creates one.
 *
 * @param podUrl - The URL of the container (should end with a slash, e.g., "https://pod.example.com/").
 * @returns the query cache directory path.
 */
export async function ensureCacheContainer(
  podUrl: string,
  webId: string,
  providedCache: string
): Promise<string> {
  let cacheUrl: string;

  // check if url contains querycache
  if (podUrl === providedCache) {
    cacheUrl = providedCache + "querycache/";
  } else {
    if (!providedCache.endsWith("/")) {
      cacheUrl = providedCache + "/";
    } else {
      cacheUrl = providedCache;
    }
  }

  try {
    // Try to retrieve the dataset (container)
    await getSolidDataset(cacheUrl, { fetch: getSolidAuthenticatedFetch() });
    return cacheUrl;
  } catch (error) {
    // If not found, create the container (if it is the users pod in question)
    if (providedCache === podUrl) {
      await createContainerAt(cacheUrl, { fetch: getSolidAuthenticatedFetch() });

      console.log(`Query Cache container was created at ${cacheUrl}`);
      return cacheUrl;
    } else {
      return error.toString();
    }
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
export function buildRdfList(sources: string[]): { head: Thing; nodes: Thing[] } {
  if (sources.length === 0) {
    throw new Error(
      "Cannot create a cache entry without at least one source URI."
    );
  }

  // Create a blank node for the current list element.
  let listNode = createThing(); // creates a blank node automatically
  listNode = buildThing(listNode).addIri(RDF_FIRST, sources[0]).build();

  // Base case: a single source terminates the RDF list with rdf:nil.
  if (sources.length === 1) {
    listNode = buildThing(listNode).addIri(RDF_REST, RDF_NIL).build();
    return { head: listNode, nodes: [listNode] };
  }

  // Recursively build the rest of the list.
  const restList = buildRdfList(sources.slice(1));

  // Link the current node to the head of the rest of the list.
  listNode = buildThing(listNode).addIri(RDF_REST, restList.head.url).build();

  // Return the current node as the head and include all nodes.
  return { head: listNode, nodes: [listNode, ...restList.nodes] };
}

function removeReferencedRdfList(
  dataset: SolidDataset,
  headUrl: string | null
): SolidDataset {
  let updatedDataset = dataset;
  let currentNodeUrl = headUrl;

  while (currentNodeUrl && currentNodeUrl !== RDF_NIL) {
    const currentNode = getThing(updatedDataset, currentNodeUrl);
    const nextNodeUrl = currentNode ? getUrl(currentNode, RDF_REST) : null;
    updatedDataset = removeThing(updatedDataset, currentNodeUrl);
    currentNodeUrl = nextNodeUrl;
  }

  return updatedDataset;
}

function removeQueryEntryArtifacts(
  dataset: SolidDataset,
  entryUrl: string
): { dataset: SolidDataset; createdAt: Date | null } {
  const entryThing = getThing(dataset, entryUrl);
  if (!entryThing) {
    return { dataset, createdAt: null };
  }

  const createdAt = getDatetime(entryThing, DCT_CREATED) ?? null;
  const sourceListHeadUrl = getUrl(entryThing, SD_ENDPOINT);
  const provenanceActivityUrl = getUrl(entryThing, PROV_WAS_GENERATED_BY);

  let updatedDataset = removeReferencedRdfList(dataset, sourceListHeadUrl);

  if (provenanceActivityUrl) {
    updatedDataset = removeThing(updatedDataset, provenanceActivityUrl);
  }

  updatedDataset = removeThing(updatedDataset, entryUrl);
  return { dataset: updatedDataset, createdAt };
}

function upsertIndexMetadata(
  dataset: SolidDataset,
  containerUrl: string,
  modifiedAt: Date,
  fileName = "queries.ttl"
): SolidDataset {
  const indexThingUrl = `${getIndexResourceUrl(containerUrl, fileName)}#index`;
  let indexThing = createThing({ url: indexThingUrl });
  indexThing = buildThing(indexThing)
    .addUrl(RDF_TYPE, QVMC_INDEX)
    .addUrl(RDF_TYPE, LDP_RDF_SOURCE)
    .addStringNoLocale(DCT_TITLE, "SPARQL Query Materialization Container")
    .addDatetime(DCT_MODIFIED, modifiedAt)
    .build();

  return setThing(dataset, indexThing);
}

/**
 * Creates or replaces a spec-shaped `queries.ttl` entry after the concrete
 * `.rq` and results files already exist in the container.
 */
export async function upsertQueryCacheEntry(
  containerUrl: string,
  entry: QueryCacheEntryInput,
  fileName = "queries.ttl"
): Promise<string> {
  const cleanedSources = validateCacheSources(entry.sources);
  const entryUrl = getQueryEntryUrl(containerUrl, entry.hash, fileName);
  const serviceSources = parseSparqlQuery(entry.query);
  const modifiedAt = new Date();

  let dataset: SolidDataset;
  try {
    dataset = await getSolidDataset(getIndexResourceUrl(containerUrl, fileName), {
      fetch: getSolidAuthenticatedFetch(),
    });
  } catch {
    dataset = createSolidDataset();
  }

  const { dataset: withoutExistingEntry, createdAt } = removeQueryEntryArtifacts(
    dataset,
    entryUrl
  );

  const { head: sourceListHead, nodes: sourceListNodes } =
    buildRdfList(cleanedSources);

  let generationActivity = createThing();
  generationActivity = buildThing(generationActivity)
    .addUrl(RDF_TYPE, PROV_ACTIVITY)
    .addUrl(PROV_USED, entry.queryFileUrl)
    .addIri(PROV_USED, sourceListHead.url)
    .addDatetime(PROV_MODIFIED, modifiedAt)
    .build();

  let queryThing = createThing({ url: entryUrl });
  queryThing = buildThing(queryThing)
    .addUrl(RDF_TYPE, TQ_QUERY_FORM)
    .addUrl(RDF_TYPE, TQ_QUERY_SELECT)
    .addIri(RDF_TYPE, SH_SPARQL_EXECUTABLE)
    .addUrl(TQ_QUERY, entry.queryFileUrl)
    .addStringNoLocale(SH_SELECT, entry.query)
    .addUrl(TM_RESULT, entry.resultsFileUrl)
    .addIri(SD_ENDPOINT, sourceListHead.url)
    .addDatetime(DCT_CREATED, createdAt ?? modifiedAt)
    .addDatetime(DCT_MODIFIED, modifiedAt)
    .addStringNoLocale(QVMC_STATUS, entry.status ?? CACHE_STATUS_CURRENT)
    .addIri(PROV_WAS_GENERATED_BY, generationActivity.url)
    .build();

  if (entry.title) {
    queryThing = buildThing(queryThing)
      .addStringNoLocale(DCT_TITLE, entry.title)
      .build();
  }

  if (entry.description) {
    queryThing = buildThing(queryThing)
      .addStringNoLocale(DCT_DESCRIPTION, entry.description)
      .build();
  }

  if (entry.linkedQueryHash) {
    queryThing = buildThing(queryThing)
      .addIri(
        QVMC_LINKED_QUERY,
        getQueryEntryUrl(containerUrl, entry.linkedQueryHash, fileName)
      )
      .build();
  }

  serviceSources.forEach((source) => {
    queryThing = buildThing(queryThing).addUrl(`${SPEX}federatesWith`, source).build();
  });

  let updatedDataset = upsertIndexMetadata(
    withoutExistingEntry,
    containerUrl,
    modifiedAt,
    fileName
  );
  updatedDataset = setThing(updatedDataset, generationActivity);
  updatedDataset = setThing(updatedDataset, queryThing);
  sourceListNodes.forEach((node) => {
    updatedDataset = setThing(updatedDataset, node);
  });

  await saveSolidDatasetAt(getIndexResourceUrl(containerUrl, fileName), updatedDataset, {
    fetch: getSolidAuthenticatedFetch(),
  });

  return entry.hash;
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
  const hash = buildCacheEntryHash(query, sources);
  await upsertQueryCacheEntry(
    containerUrl,
    {
      hash,
      query,
      queryFileUrl: `${containerUrl}${hash}.rq`,
      // Keep the legacy .json extension for compatibility with current SDK usage.
      resultsFileUrl: `${containerUrl}${hash}.json`,
      sources,
      status: CACHE_STATUS_CURRENT,
    },
    fileName
  );
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
  const fileUrl = buildCacheMemberFileUrl(containerUrl, fileName);

  try {
    const savedFile = await overwriteFile(fileUrl, blob, {
      contentType: "application/sparql-query",
      fetch: getSolidAuthenticatedFetch(),
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
  const fileUrl = buildCacheMemberFileUrl(containerUrl, fileName);

  try {
    const savedFile = await overwriteFile(fileUrl, blob, {
      contentType: "application/json",
      fetch: getSolidAuthenticatedFetch(),
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
 * Determines if there are cached queries in the pod.
 *
 * @param containerUrl - The ttl URL
 * @returns boolean representing if a cache is present.
 */
export async function getStoredTtl(resourceUrl: string): Promise<boolean> {
  try {
    // Try to retrieve the dataset and save updated dataset
    await getSolidDataset(resourceUrl, { fetch: getSolidAuthenticatedFetch() });
    return true;
  } catch (error) {
    return false;
  }
}

export interface QueryEntry {
  hash: string;
  title?: string;
  description?: string;
  queryFile: string;
  resultsFile: string;
  sourceUrls: string[];
  created: string;
  modified?: string;
  status?: string;
}

/**
 * Updates only the user-facing title for a cached query entry. The underlying
 * hash and file locations remain unchanged.
 */
export async function renameCachedQueryEntry(
  ttlFileUrl: string,
  targetHash: string,
  title: string
): Promise<boolean> {
  const entryUrl = `${ttlFileUrl}#${targetHash}`;
  try {
    let dataset = await getSolidDataset(ttlFileUrl, { fetch: getSolidAuthenticatedFetch() });
    const entryThing = getThing(dataset, entryUrl);
    if (!entryThing) {
      return false;
    }

    let renamedThing = setStringNoLocale(entryThing, DCT_TITLE, title.trim());
    renamedThing = setDatetime(renamedThing, DCT_MODIFIED, new Date());
    dataset = setThing(dataset, renamedThing);
    await saveSolidDatasetAt(ttlFileUrl, dataset, { fetch: getSolidAuthenticatedFetch() });
    return true;
  } catch (error) {
    console.error(`Could not rename cached query ${targetHash}:`, error);
    return false;
  }
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
  const dataset: SolidDataset = await getSolidDataset(ttlFileUrl, {
    fetch: getSolidAuthenticatedFetch(),
  });
  const things: Thing[] = getThingAll(dataset);
  const queryEntries: QueryEntry[] = [];

  things.forEach((thing) => {
    const queryFile = getUrl(thing, TQ_QUERY);
    const resultsFile = getUrl(thing, TM_RESULT);
    if (!queryFile || !resultsFile) {
      return;
    }

    const thingUrl = thing.url;
    const hash = thingUrl.includes("#") ? thingUrl.split("#")[1] : "";
    if (!hash) {
      return;
    }

    const created = getDatetime(thing, DCT_CREATED)?.toISOString() || "N/A";
    const modified = getDatetime(thing, DCT_MODIFIED)?.toISOString() || created;
    const status = getStringNoLocale(thing, QVMC_STATUS) || CACHE_STATUS_CURRENT;
    const title = getStringNoLocale(thing, DCT_TITLE) || hash;
    const description = getStringNoLocale(thing, DCT_DESCRIPTION) || "";
    const sourceListUrl = getUrl(thing, SD_ENDPOINT);
    const sourceUrls = rdfListSources(sourceListUrl, dataset);

    queryEntries.push({
      hash,
      title,
      description,
      queryFile,
      resultsFile,
      sourceUrls,
      created,
      modified,
      status,
    });
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
  listHeadUrl: string | null,
  dataset: SolidDataset
): string[] {
  const extractedUrls: string[] = [];
  let currentNodeUrl = listHeadUrl;
  const visited = new Set<string>();

  while (currentNodeUrl && currentNodeUrl !== RDF_NIL && !visited.has(currentNodeUrl)) {
    visited.add(currentNodeUrl);
    const currentNode = getThing(dataset, currentNodeUrl);
    if (!currentNode) break;

    const url = getUrl(currentNode, RDF_FIRST);
    if (url) {
      extractedUrls.push(url);
    }

    currentNodeUrl = getUrl(currentNode, RDF_REST);
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
  const file = await getFile(fileUrl, { fetch: getSolidAuthenticatedFetch() });
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
  const file = await getFile(fileUrl, { fetch: getSolidAuthenticatedFetch() });
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

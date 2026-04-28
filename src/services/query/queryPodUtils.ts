import { Parser as SparqlParser } from "sparqljs";

export interface ComunicaSources {
  value: string;
  context?: Record<string, any>;
}

/**
 * Stops an ongoing query by destroying a main thread binding stream.
 * @param bindingStream The Comunica bindings stream to destroy.
 */
export function stopQuery(bindingStream: any): boolean {
  if (bindingStream && typeof bindingStream.destroy === "function") {
    bindingStream.destroy();
    return true;
  }
  return false;
}

/**
 * Cleans an array of source URLs by removing angle brackets ("<" and ">")
 * and adapting the output to Comunica source objects.
 *
 * @param dirtySources input source URLs
 * @param authenticatedFetch authenticated fetch function for Solid sources
 * @returns cleaned Comunica source objects
 */
export function cleanSourcesUrls(
  dirtySources: string[],
  authenticatedFetch: typeof fetch
): ComunicaSources[] {
  return dirtySources.map((url) => {
    const cleanUrl =
      url.startsWith("<") && url.endsWith(">") ? url.slice(1, -1) : url;

    if (cleanUrl.includes("sparql") || cleanUrl.includes("endpoint")) {
      return { value: cleanUrl };
    }

    return { value: cleanUrl, context: { fetch: authenticatedFetch } };
  });
}

/**
 * Cleans an array of source URLs by removing angle brackets ("<" and ">").
 *
 * @param dirtySources input source URLs
 * @returns cleaned source URL strings
 */
export function cleanSourcesUrlsForCache(dirtySources: string[]): string[] {
  return dirtySources.map((url) =>
    url.startsWith("<") && url.endsWith(">") ? url.slice(1, -1) : url
  );
}

/**
 * Generates a unique alphanumeric hash.
 * @param length length for the hash
 * @returns random hash string
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
 * @param seedValue the seed value
 * @param length output hash length (default: 10)
 * @returns deterministic hash string
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
 * Parses a SPARQL query for SERVICE clauses and returns federation sources.
 *
 * @param queryString SPARQL query string
 * @returns list of SERVICE endpoint URLs
 */
export function parseSparqlQuery(queryString: string): string[] {
  const parser = new SparqlParser();

  try {
    const parsedQuery = parser.parse(queryString);
    const serviceSources: string[] = [];

    function findServiceClauses(pattern: any): void {
      if (!pattern || typeof pattern !== "object") {
        return;
      }

      const patternType =
        typeof pattern.type === "string" ? pattern.type.toLowerCase() : "";

      if (patternType === "service" && pattern.name?.value) {
        serviceSources.push(pattern.name.value);
      }

      if (Array.isArray(pattern.patterns)) {
        pattern.patterns.forEach(findServiceClauses);
      }

      if (Array.isArray(pattern.where)) {
        pattern.where.forEach(findServiceClauses);
      }
    }

    if (parsedQuery.type === "query" && parsedQuery.where) {
      parsedQuery.where.forEach(findServiceClauses);
    }

    return serviceSources;
  } catch (error) {
    console.error("Error parsing SPARQL query for SERVICE clauses:", error);
    return [];
  }
}

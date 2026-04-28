import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanSourcesUrls,
  cleanSourcesUrlsForCache,
  generateHash,
  generateSeededHash,
  parseSparqlQuery,
  stopQuery,
} from "../../src/services/query/queryPodUtils.ts";

test("stopQuery destroys a binding stream when destroy() exists", () => {
  let wasDestroyed = false;
  const mockBindingStream = {
    destroy: () => {
      wasDestroyed = true;
    },
  };

  assert.equal(stopQuery(mockBindingStream), true);
  assert.equal(wasDestroyed, true);
});

test("stopQuery returns false for null or non-destroyable streams", () => {
  assert.equal(stopQuery(null), false);
  assert.equal(stopQuery({}), false);
});

test("cleanSourcesUrls strips angle brackets and applies auth context to non-endpoint URLs", () => {
  const fakeFetch = (() =>
    Promise.resolve(new Response("ok"))) as unknown as typeof fetch;
  const cleaned = cleanSourcesUrls([
    "<https://pod.example/data.ttl>",
    "https://query.example/sparql",
    "https://query.example/endpoint",
  ], fakeFetch);

  assert.equal(cleaned[0].value, "https://pod.example/data.ttl");
  assert.equal(typeof cleaned[0].context?.fetch, "function");
  assert.equal(cleaned[1].value, "https://query.example/sparql");
  assert.equal(cleaned[1].context, undefined);
  assert.equal(cleaned[2].context, undefined);
});

test("cleanSourcesUrlsForCache strips angle brackets without changing URL order", () => {
  assert.deepEqual(
    cleanSourcesUrlsForCache([
      "<https://pod.example/data.ttl>",
      "https://query.example/sparql",
    ]),
    ["https://pod.example/data.ttl", "https://query.example/sparql"]
  );
});

test("generateHash returns alphanumeric hashes of the requested length", () => {
  const hash = generateHash(12);
  assert.equal(hash.length, 12);
  assert.match(hash, /^[A-Za-z0-9]+$/);
});

test("generateSeededHash is deterministic for a seed and length", () => {
  const hashA = generateSeededHash("triple-seed", 16);
  const hashB = generateSeededHash("triple-seed", 16);
  const hashC = generateSeededHash("different-seed", 16);

  assert.equal(hashA, hashB);
  assert.notEqual(hashA, hashC);
  assert.equal(hashA.length, 16);
});

test("generateSeededHash uses default output length when omitted", () => {
  assert.equal(generateSeededHash("default-length-seed").length, 10);
});

test("parseSparqlQuery extracts SERVICE endpoints from nested query patterns", () => {
  const query = `
    SELECT * WHERE {
      SERVICE <https://service.one/sparql> { ?s ?p ?o . }
      OPTIONAL {
        SERVICE <https://service.two/endpoint> { ?a ?b ?c . }
      }
    }
  `;
  const serviceSources = parseSparqlQuery(query);

  assert.deepEqual(serviceSources.sort(), [
    "https://service.one/sparql",
    "https://service.two/endpoint",
  ]);
});

test("parseSparqlQuery returns an empty list for invalid SPARQL input", () => {
  const oldError = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(parseSparqlQuery("THIS IS NOT SPARQL"), []);
  } finally {
    console.error = oldError;
  }
});

test("parseSparqlQuery returns no services for update statements", () => {
  assert.deepEqual(parseSparqlQuery("INSERT DATA { <urn:a> <urn:b> <urn:c> . }"), []);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  validateQuerySourcesForMode,
  QUERY_MODE_DEFINITIONS,
  type ComunicaSources,
} from "../../src/services/query/queryPod.ts";

function makeSources(urls: string[]): ComunicaSources[] {
  return urls.map((url) => ({ type: "sparql", value: url }));
}

test("query mode definitions expose the three documented execution modes", () => {
  assert.deepEqual(
    QUERY_MODE_DEFINITIONS.map((mode) => mode.id),
    ["endpoint", "solid-no-traversal", "solid-link-traversal"]
  );
});

test("endpoint mode accepts SPARQL endpoint-like targets", () => {
  const sources = makeSources([
    "https://query.wikidata.org/sparql",
    "https://example.org/endpoint",
  ]);
  assert.doesNotThrow(() => validateQuerySourcesForMode("endpoint", sources));
});

test("endpoint mode rejects non-endpoint targets", () => {
  const sources = makeSources(["https://pod.example.com/profile/card"]);
  assert.throws(
    () => validateQuerySourcesForMode("endpoint", sources),
    /expects SPARQL endpoint URLs only/i
  );
});

test("solid no-traversal mode rejects endpoint targets", () => {
  const sources = makeSources(["https://query.wikidata.org/sparql"]);
  assert.throws(
    () => validateQuerySourcesForMode("solid-no-traversal", sources),
    /expects Solid document\/container targets/i
  );
});

test("solid traversal mode accepts Solid-like document/container targets", () => {
  const sources = makeSources([
    "https://pod.example.com/profile/card",
    "https://pod.example.com/public/",
  ]);
  assert.doesNotThrow(() =>
    validateQuerySourcesForMode("solid-link-traversal", sources)
  );
});

test("solid traversal mode allows empty source lists", () => {
  assert.doesNotThrow(() =>
    validateQuerySourcesForMode("solid-link-traversal", [])
  );
});

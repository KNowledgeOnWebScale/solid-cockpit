import assert from "node:assert/strict";
import test from "node:test";
import { getUrl } from "@inrupt/solid-client";
import { buildRdfList } from "../../src/services/query/queryPod.ts";

const RDF_REST = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
const RDF_NIL = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";

test("buildRdfList terminates a single-source list with rdf:nil", () => {
  const { head, nodes } = buildRdfList(["https://pod.example.com/public/data.ttl"]);
  assert.equal(nodes.length, 1);
  assert.equal(getUrl(head, RDF_REST), RDF_NIL);
});

test("buildRdfList creates chained nodes for multi-source lists", () => {
  const { head, nodes } = buildRdfList([
    "https://pod.example.com/public/data-a.ttl",
    "https://pod.example.com/public/data-b.ttl",
  ]);
  assert.equal(nodes.length, 2);
  assert.notEqual(getUrl(head, RDF_REST), RDF_NIL);
  assert.equal(getUrl(nodes[1], RDF_REST), RDF_NIL);
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildCacheMemberFileUrl } from "../../src/services/query/queryPod.ts";

test("buildCacheMemberFileUrl appends filename inside container URLs with slash", () => {
  assert.equal(
    buildCacheMemberFileUrl("https://pod.example.com/querycache/", "abc123.rq"),
    "https://pod.example.com/querycache/abc123.rq"
  );
});

test("buildCacheMemberFileUrl normalizes missing trailing slash and trims whitespace", () => {
  assert.equal(
    buildCacheMemberFileUrl("  https://pod.example.com/querycache  ", "abc123.json"),
    "https://pod.example.com/querycache/abc123.json"
  );
});

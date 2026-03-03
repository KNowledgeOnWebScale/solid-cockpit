import assert from "node:assert/strict";
import test from "node:test";
import {
  webIdDataset,
  fetchData,
  fetchPermissionsData,
  fetchAclAgents,
  fetchPublicAccess,
} from "../../src/components/getData.ts";

test("webIdDataset throws for invalid WebID URL input", async () => {
  await assert.rejects(() => webIdDataset("not-a-url", ""), /Invalid URL/);
});

test("fetchData throws for invalid resource URL input", async () => {
  await assert.rejects(() => fetchData("not-a-url"), /Invalid URL/);
});

test("fetchPermissionsData returns null when ACL lookup fails", async () => {
  assert.equal(await fetchPermissionsData("not-a-url"), null);
});

test("fetchAclAgents returns null when ACL agent lookup fails", async () => {
  const oldError = console.error;
  console.error = () => {};
  try {
    assert.equal(await fetchAclAgents("not-a-url"), null);
  } finally {
    console.error = oldError;
  }
});

test("fetchPublicAccess returns null when public ACL lookup fails", async () => {
  const oldError = console.error;
  console.error = () => {};
  try {
    assert.equal(await fetchPublicAccess("not-a-url"), null);
  } finally {
    console.error = oldError;
  }
});

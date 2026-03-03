import assert from "node:assert/strict";
import test from "node:test";
import {
  addDatetime,
  createSolidDataset,
  createThing,
  getDatetime,
  getThing,
  getThingAll,
  setThing,
} from "@inrupt/solid-client";
import {
  checkUrl,
  createNewAcl,
  getCurrentRdfDateTime,
  recordLastAccessTime,
  saveNewAccessTime,
} from "../../src/components/privacyEdit.ts";

const DCT_MODIFIED = "http://purl.org/dc/terms/modified";

test("getCurrentRdfDateTime returns a valid ISO timestamp string", () => {
  const timestamp = getCurrentRdfDateTime();
  assert.equal(Number.isNaN(Date.parse(timestamp)), false);
  assert.match(timestamp, /\d{4}-\d{2}-\d{2}T/);
});

test("checkUrl validates URL input and compares against the current WebID", () => {
  assert.equal(checkUrl("https://pod.example/profile/card#me", "https://pod.example/profile/card#me"), true);
  assert.equal(checkUrl("https://pod.example/profile/card#me", "https://pod.example/other#me"), false);
  assert.equal(checkUrl("not-a-url", "https://pod.example/profile/card#me"), true);
});

test("createNewAcl builds a frozen ACL dataset with expected metadata", () => {
  const targetResource = {
    ...createSolidDataset(),
    internal_resourceInfo: {
      sourceIri: "https://pod.example/resource",
      aclUrl: "https://pod.example/resource.acl",
      isRawData: false,
      linkedResources: {},
    },
  } as any;

  const acl = createNewAcl(targetResource);
  assert.equal(Object.isFrozen(acl), true);
  assert.equal(acl.internal_accessTo, "https://pod.example/resource");
  assert.equal(acl.internal_resourceInfo.sourceIri, "https://pod.example/resource.acl");
});

test("recordLastAccessTime creates a last-access Thing when absent", () => {
  const fileUrl = "https://pod.example/inbox/sharedWithMe.ttl";
  const dataset = createSolidDataset();

  const updated = recordLastAccessTime(dataset, fileUrl);
  const things = getThingAll(updated);

  assert.equal(things.length, 1);
  assert.equal(Boolean(getDatetime(things[0], DCT_MODIFIED)), true);
});

test("recordLastAccessTime updates existing last-access Thing when present", () => {
  const fileUrl = "https://pod.example/inbox/sharedWithMe.ttl";
  const oldDate = new Date("2020-01-01T00:00:00.000Z");

  let dataset = createSolidDataset();
  let lastAccessThing = addDatetime(
    createThing({ url: `${fileUrl}#lastAccess` }),
    DCT_MODIFIED,
    oldDate
  );
  dataset = setThing(dataset, lastAccessThing);

  const updated = recordLastAccessTime(dataset, fileUrl);
  const updatedThing = getThing(updated, `${fileUrl}#lastAccess`);
  const updatedDate = updatedThing ? getDatetime(updatedThing, DCT_MODIFIED) : null;

  assert.ok(updatedDate);
  assert.notEqual(updatedDate?.toISOString(), oldDate.toISOString());
});

test("saveNewAccessTime returns false when the target pod URL is invalid", async () => {
  const oldError = console.error;
  console.error = () => {};
  try {
    assert.equal(await saveNewAccessTime("not-a-url"), false);
  } finally {
    console.error = oldError;
  }
});

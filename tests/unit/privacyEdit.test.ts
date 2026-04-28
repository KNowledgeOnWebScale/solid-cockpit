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
  buildSharedWithMeInsertData,
  buildSharedWithOthersInsertData,
  checkUrl,
  createOpaqueNotificationId,
  createNewAcl,
  getEnabledAccessModeIris,
  getCurrentRdfDateTime,
  getDueSharedWithOthersRevocations,
  getRevokedAccessModeIris,
  getWebIdDocumentUrl,
  recordLastAccessTime,
  saveNewAccessTime,
} from "../../src/services/solid/privacyEdit.ts";

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

test("getWebIdDocumentUrl removes the fragment identifier", () => {
  assert.equal(
    getWebIdDocumentUrl("https://pod.example/profile/card#me"),
    "https://pod.example/profile/card"
  );
});

test("getEnabledAccessModeIris returns only enabled ACL mode IRIs", () => {
  const modes = getEnabledAccessModeIris({
    read: true,
    append: false,
    write: true,
    control: false,
  });

  assert.deepEqual(modes, [
    "http://www.w3.org/ns/auth/acl#Read",
    "http://www.w3.org/ns/auth/acl#Write",
  ]);
});

test("getRevokedAccessModeIris returns only modes removed by the update", () => {
  const revoked = getRevokedAccessModeIris(
    {
      read: true,
      append: true,
      write: true,
      control: false,
    },
    {
      read: true,
      append: false,
      write: false,
      control: false,
    }
  );

  assert.deepEqual(revoked, [
    "http://www.w3.org/ns/auth/acl#Append",
    "http://www.w3.org/ns/auth/acl#Write",
  ]);
});

test("createOpaqueNotificationId returns distinct opaque IDs for append-only log entries", () => {
  const first = createOpaqueNotificationId("resource-a");
  const second = createOpaqueNotificationId("resource-a");
  assert.notEqual(first, second);
  assert.equal(first.length > 0, true);
  assert.equal(second.length > 0, true);
});

test("buildSharedWithMeInsertData creates a spec-compliant as:Offer notification payload", () => {
  const payload = buildSharedWithMeInsertData({
    entryId: "abc123",
    sharedBy: "https://sender.example/profile/card#me",
    resourceUrl: "https://sender.example/private/data/",
    modeIris: ["http://www.w3.org/ns/auth/acl#Read"],
  });

  assert.match(payload, /<#abc123>/);
  assert.match(payload, /a as:Offer/);
  assert.match(payload, /dct:creator <https:\/\/sender\.example\/profile\/card#me>/);
  assert.match(payload, /dct:created ".*"\^\^<http:\/\/www\.w3\.org\/2001\/XMLSchema#dateTime>/);
  assert.match(payload, /acl:accessTo <https:\/\/sender\.example\/private\/data\/>/);
  assert.match(payload, /acl:mode <http:\/\/www\.w3\.org\/ns\/auth\/acl#Read>/);
});

test("buildSharedWithMeInsertData creates a spec-compliant as:Undo notification payload", () => {
  const payload = buildSharedWithMeInsertData({
    entryId: "undo123",
    sharedBy: "https://sender.example/profile/card#me",
    resourceUrl: "https://sender.example/private/data/",
    modeIris: ["http://www.w3.org/ns/auth/acl#Write"],
    revokedOfferIri: "https://target.example/inbox/sharedWithMe.ttl#priorOffer",
  });

  assert.match(payload, /a as:Undo/);
  assert.match(payload, /as:object <https:\/\/target\.example\/inbox\/sharedWithMe\.ttl#priorOffer>/);
  assert.match(payload, /acl:mode <http:\/\/www\.w3\.org\/ns\/auth\/acl#Write>/);
});

test("buildSharedWithOthersInsertData creates a spec-compliant as:Offer notification payload", () => {
  const payload = buildSharedWithOthersInsertData({
    entryId: "offer456",
    resourceUrl: "https://owner.example/docs/",
    sharedWith: "https://target.example/profile/card#me",
    modeIris: [
      "http://www.w3.org/ns/auth/acl#Read",
      "http://www.w3.org/ns/auth/acl#Append",
    ],
  });

  assert.match(payload, /<https:\/\/owner\.example\/docs\/>/);
  assert.match(payload, /a ldp:Container/);
  assert.match(payload, /as:Offer <#offer456>/);
  assert.match(payload, /<#offer456>/);
  assert.match(payload, /a as:Offer/);
  assert.match(payload, /as:target <https:\/\/target\.example\/profile\/card#me>/);
  assert.match(payload, /acl:accessTo <https:\/\/owner\.example\/docs\/>/);
  assert.match(payload, /acl:mode <http:\/\/www\.w3\.org\/ns\/auth\/acl#Read>, <http:\/\/www\.w3\.org\/ns\/auth\/acl#Append>/);
  assert.doesNotMatch(payload, /dct:valid/);
});

test("buildSharedWithOthersInsertData includes revoke timestamp when provided", () => {
  const payload = buildSharedWithOthersInsertData({
    entryId: "offer789",
    resourceUrl: "https://owner.example/docs/",
    sharedWith: "https://target.example/profile/card#me",
    modeIris: ["http://www.w3.org/ns/auth/acl#Read"],
    revokeAt: "2030-01-01T12:00:00.000Z",
  });

  assert.match(payload, /dct:valid "2030-01-01T12:00:00.000Z"\^\^<http:\/\/www\.w3\.org\/2001\/XMLSchema#dateTime>/);
});

test("buildSharedWithOthersInsertData creates a spec-compliant as:Undo notification payload", () => {
  const payload = buildSharedWithOthersInsertData({
    entryId: "undo456",
    resourceUrl: "https://owner.example/docs/",
    sharedWith: "https://target.example/profile/card#me",
    modeIris: ["http://www.w3.org/ns/auth/acl#Write"],
    revokedOfferIri: "https://owner.example/inbox/sharedWithOthers.ttl#offer456",
  });

  assert.match(payload, /a as:Undo/);
  assert.match(payload, /as:object <https:\/\/owner\.example\/inbox\/sharedWithOthers\.ttl#offer456>/);
  assert.match(payload, /as:target <https:\/\/target\.example\/profile\/card#me>/);
  assert.match(payload, /acl:accessTo <https:\/\/owner\.example\/docs\/>/);
  assert.match(payload, /acl:mode <http:\/\/www\.w3\.org\/ns\/auth\/acl#Write>/);
});

test("getDueSharedWithOthersRevocations returns only entries with expired revoke schedules", () => {
  const dueEntries = getDueSharedWithOthersRevocations(
    [
      {
        resourceHash: "https://owner.example/docs/",
        owner: "https://owner.example/profile/card#me",
        whatKind: "https://www.w3.org/ns/ldp#Container",
        usersSharedWith: [
          {
            sharedWith: "https://target.example/profile/card#me",
            accessModes: ["http://www.w3.org/ns/auth/acl#Read"],
            resourceUrl: "https://owner.example/docs/",
            created: "2029-01-01T00:00:00.000Z",
            revokeAt: "2030-01-01T00:00:00.000Z",
            offerIri: "https://owner.example/inbox/sharedWithOthers.ttl#offer-a",
          },
          {
            sharedWith: "https://other.example/profile/card#me",
            accessModes: ["http://www.w3.org/ns/auth/acl#Read"],
            resourceUrl: "https://owner.example/docs/",
            created: "2029-01-01T00:00:00.000Z",
            revokeAt: "2031-01-01T00:00:00.000Z",
            offerIri: "https://owner.example/inbox/sharedWithOthers.ttl#offer-b",
          },
        ],
      },
    ],
    new Date("2030-06-01T00:00:00.000Z")
  );

  assert.equal(dueEntries.length, 1);
  assert.equal(dueEntries[0].sharedWith, "https://target.example/profile/card#me");
  assert.equal(
    dueEntries[0].offerIri,
    "https://owner.example/inbox/sharedWithOthers.ttl#offer-a"
  );
});

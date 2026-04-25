import assert from "node:assert/strict";
import test from "node:test";
import {
  alreadyExistsCheck,
  derefrenceFile,
  getMimeType,
  uploadSuccess,
} from "../../src/services/solid/fileUploadUtils.ts";
import { mimeTypes } from "../../src/services/solid/mime_types.js";

test("getMimeType resolves known MIME types case-insensitively", () => {
  assert.equal(getMimeType(".TTL"), mimeTypes[".ttl"]);
});

test("getMimeType falls back to application/octet-stream for unknown extensions", () => {
  assert.equal(getMimeType(".unknown-ext"), "application/octet-stream");
});

test("alreadyExistsCheck only returns true for the explicit marker string", () => {
  assert.equal(alreadyExistsCheck("already exists"), true);
  assert.equal(alreadyExistsCheck("uploaded"), false);
});

test("uploadSuccess returns true only when every upload item is successful", () => {
  assert.equal(uploadSuccess(["https://pod.example/file1.ttl"]), true);
  assert.equal(uploadSuccess(["https://pod.example/file1.ttl", "error"]), false);
  assert.equal(uploadSuccess([]), false);
});

test("derefrenceFile returns file name, size, and source IRI", () => {
  const inputFile = {
    name: "example.ttl",
    size: 128,
    internal_resourceInfo: {
      sourceIri: "https://pod.example/example.ttl",
    },
  } as any;

  assert.deepEqual(derefrenceFile(inputFile), [
    "example.ttl",
    "128",
    "https://pod.example/example.ttl",
  ]);
});

test("derefrenceFile returns an error sentinel when file metadata is malformed", () => {
  const oldError = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(derefrenceFile({} as any), ["error"]);
  } finally {
    console.error = oldError;
  }
});

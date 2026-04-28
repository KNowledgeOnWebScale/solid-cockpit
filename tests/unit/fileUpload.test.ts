import assert from "node:assert/strict";
import test from "node:test";
import {
  alreadyExistsCheck,
  derefrenceFile,
  getDownloadFileName,
  getMimeType,
  isDownloadableResourceUrl,
  preparePodResourceDownload,
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

test("getDownloadFileName resolves readable names from resource URLs", () => {
  assert.equal(
    getDownloadFileName("https://pod.example/docs/report%20final.ttl"),
    "report final.ttl"
  );
  assert.equal(getDownloadFileName("not a url", "fallback.ttl"), "fallback.ttl");
});

test("isDownloadableResourceUrl rejects containers and malformed URLs", () => {
  assert.equal(isDownloadableResourceUrl("https://pod.example/docs/report.ttl"), true);
  assert.equal(isDownloadableResourceUrl("https://pod.example/docs/"), false);
  assert.equal(isDownloadableResourceUrl("not a url"), false);
});

test("preparePodResourceDownload fetches a single file and derives the download name", async () => {
  const inputFile = new File(["hello"], "server-name.ttl", {
    type: "text/turtle",
  });
  const requestedUrls: string[] = [];

  const prepared = await preparePodResourceDownload(
    "https://pod.example/docs/local-name.ttl",
    async (url) => {
      requestedUrls.push(url);
      return inputFile;
    }
  );

  assert.equal(prepared.file, inputFile);
  assert.equal(prepared.fileName, "local-name.ttl");
  assert.deepEqual(requestedUrls, ["https://pod.example/docs/local-name.ttl"]);
});

test("preparePodResourceDownload rejects container URLs before fetching", async () => {
  await assert.rejects(
    () => preparePodResourceDownload("https://pod.example/docs/", async () => {
      throw new Error("fetch should not be called");
    }),
    /Only single pod resources/
  );
});

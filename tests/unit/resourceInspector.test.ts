import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeResourceStructure,
  buildCsvPreviewTable,
  detectResourceFormat,
  fetchResourcePreview,
  saveResourceContent,
  validateResourceContent,
} from "../../src/services/solid/resourceInspector.ts";

test("detectResourceFormat resolves supported formats from extension and content type", () => {
  const turtleInfo = detectResourceFormat(
    "https://pod.example/data/report.ttl",
    "text/turtle; charset=utf-8"
  );
  assert.equal(turtleInfo.format, "ttl");
  assert.equal(turtleInfo.supported, true);

  const csvInfo = detectResourceFormat(
    "https://pod.example/data/report.unknown",
    "text/csv"
  );
  assert.equal(csvInfo.format, "csv");
});

test("fetchResourcePreview truncates large responses without requiring a full file load", async () => {
  const fetchFn = async () =>
    new Response("abcdefghi", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

  const preview = await fetchResourcePreview("https://pod.example/note.txt", {
    fetchFn: fetchFn as typeof fetch,
    maxBytes: 5,
  });

  assert.equal(preview.text, "abcde");
  assert.equal(preview.truncated, true);
  assert.equal(preview.formatInfo.format, "txt");
});

test("validateResourceContent reports JSON and RDF syntax errors", async () => {
  const jsonValidation = await validateResourceContent(
    detectResourceFormat("https://pod.example/data.json", "application/json"),
    '{"broken": }'
  );
  assert.equal(jsonValidation.valid, false);

  const rdfValidation = await validateResourceContent(
    detectResourceFormat("https://pod.example/data.ttl", "text/turtle"),
    '@prefix ex: <http://example.com/> . ex:s ex:p "missing-dot"'
  );
  assert.equal(rdfValidation.valid, false);
});

test("buildCsvPreviewTable returns headers, rows, and parse warnings", () => {
  const preview = buildCsvPreviewTable("name,age\nAlice,42\nBob");
  assert.ok(preview);
  assert.deepEqual(preview?.headers, ["name", "age"]);
  assert.equal(preview?.rows.length, 2);
});

test("analyzeResourceStructure summarizes csv, json, text, and rdf resources", () => {
  assert.deepEqual(
    analyzeResourceStructure(
      detectResourceFormat("https://pod.example/data.csv", "text/csv"),
      "name,age\nAlice,42\nBob,20"
    ),
    {
      title: "CSV dimensions",
      value: "3 rows / 2 columns",
    }
  );

  assert.deepEqual(
    analyzeResourceStructure(
      detectResourceFormat("https://pod.example/data.txt", "text/plain"),
      "alpha\nbeta"
    ),
    {
      title: "Text dimensions",
      value: "2 rows / 5 columns",
    }
  );

  assert.deepEqual(
    analyzeResourceStructure(
      detectResourceFormat("https://pod.example/data.json", "application/json"),
      '{"root":{"child":1},"list":[{"leaf":true}]}'
    ),
    {
      title: "JSON object count",
      value: "3 objects",
    }
  );

  assert.deepEqual(
    analyzeResourceStructure(
      detectResourceFormat("https://pod.example/data.ttl", "text/turtle"),
      '@prefix ex: <http://example.com/> . ex:s ex:p ex:o .'
    ),
    {
      title: "RDF triple count",
      value: "1 triple",
    }
  );
});

test("saveResourceContent writes edited content with the inferred content type", async () => {
  const calls: Array<{
    url: string;
    contentType: string;
    payload: string;
  }> = [];

  await saveResourceContent(
    "https://pod.example/data.json",
    '{"ok":true}',
    detectResourceFormat("https://pod.example/data.json", "application/json"),
    (async () => new Response(null, { status: 200 })) as typeof fetch,
    (async (url, data, options) => {
      calls.push({
        url: String(url),
        contentType: String(options?.contentType),
        payload: await (data as Blob).text(),
      });
      return {
        internal_resourceInfo: {
          sourceIri: String(url),
        },
      } as never;
    }) as never
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://pod.example/data.json");
  assert.equal(calls[0].contentType, "application/json");
  assert.equal(calls[0].payload, '{"ok":true}');
});

import { overwriteFile } from "@inrupt/solid-client";
import { fetch as solidFetch } from "@inrupt/solid-client-authn-browser";
import Papa from "papaparse";
import jsonld from "jsonld";
import { Parser as N3Parser } from "n3";

export type SupportedInspectorFormat =
  | "txt"
  | "csv"
  | "json"
  | "jsonld"
  | "ttl"
  | "nt"
  | "nq"
  | "trig"
  | "n3";

export interface ResourceFormatInfo {
  format: SupportedInspectorFormat | null;
  label: string;
  contentType: string | null;
  editable: boolean;
  supported: boolean;
}

export interface ResourcePreviewResult {
  text: string;
  formatInfo: ResourceFormatInfo;
  truncated: boolean;
  byteLength: number;
}

export interface ResourceValidationResult {
  valid: boolean;
  summary: string;
  details: string[];
}

export interface ResourceInspectorOptions {
  maxBytes?: number;
  fetchFn?: typeof fetch;
}

export interface CsvPreviewTable {
  headers: string[];
  rows: string[][];
  parseErrors: string[];
}

export interface ResourceStructureSummary {
  title: string;
  value: string;
}

const DEFAULT_PREVIEW_BYTES = 256 * 1024;

const CONTENT_TYPE_BY_FORMAT: Record<SupportedInspectorFormat, string> = {
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  jsonld: "application/ld+json",
  ttl: "text/turtle",
  nt: "application/n-triples",
  nq: "application/n-quads",
  trig: "application/trig",
  n3: "text/n3",
};

const FORMAT_LABELS: Record<SupportedInspectorFormat, string> = {
  txt: "Plain text",
  csv: "CSV",
  json: "JSON",
  jsonld: "JSON-LD",
  ttl: "Turtle",
  nt: "N-Triples",
  nq: "N-Quads",
  trig: "TriG",
  n3: "Notation3",
};

const FORMAT_BY_EXTENSION: Record<string, SupportedInspectorFormat> = {
  txt: "txt",
  csv: "csv",
  json: "json",
  jsonld: "jsonld",
  ttl: "ttl",
  turtle: "ttl",
  nt: "nt",
  nq: "nq",
  trig: "trig",
  n3: "n3",
};

const FORMAT_BY_CONTENT_TYPE: Array<[string, SupportedInspectorFormat]> = [
  ["text/plain", "txt"],
  ["text/csv", "csv"],
  ["application/json", "json"],
  ["application/ld+json", "jsonld"],
  ["text/turtle", "ttl"],
  ["application/n-triples", "nt"],
  ["application/n-quads", "nq"],
  ["application/trig", "trig"],
  ["text/n3", "n3"],
];

function stripContentTypeParameters(contentType: string | null): string | null {
  return contentType ? contentType.split(";")[0].trim().toLowerCase() : null;
}

function inferFormatFromUrl(resourceUrl: string): SupportedInspectorFormat | null {
  const cleanUrl = resourceUrl.split(/[?#]/)[0];
  const extension = cleanUrl.split(".").pop()?.toLowerCase();
  return extension ? FORMAT_BY_EXTENSION[extension] || null : null;
}

export function detectResourceFormat(
  resourceUrl: string,
  contentType: string | null
): ResourceFormatInfo {
  const normalizedType = stripContentTypeParameters(contentType);
  const contentTypeMatch = FORMAT_BY_CONTENT_TYPE.find(
    ([candidate]) => candidate === normalizedType
  )?.[1];
  const format = contentTypeMatch || inferFormatFromUrl(resourceUrl);

  if (!format) {
    return {
      format: null,
      label: "Unsupported preview format",
      contentType: normalizedType,
      editable: false,
      supported: false,
    };
  }

  return {
    format,
    label: FORMAT_LABELS[format],
    contentType: normalizedType || CONTENT_TYPE_BY_FORMAT[format],
    editable: true,
    supported: true,
  };
}

async function readStreamWithLimit(
  response: Response,
  maxBytes: number
): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (!response.body) {
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    return {
      bytes: bytes.slice(0, maxBytes),
      truncated: bytes.length > maxBytes,
    };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;

  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) {
      break;
    }

    const remaining = maxBytes - received;
    if (value.byteLength > remaining) {
      chunks.push(value.slice(0, remaining));
      received += remaining;
      truncated = true;
      await reader.cancel();
      break;
    }

    chunks.push(value);
    received += value.byteLength;
  }

  if (!truncated && received >= maxBytes) {
    truncated = true;
    await reader.cancel();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { bytes, truncated };
}

function ensureSuccessfulResponse(response: Response, resourceUrl: string): Response {
  if (!response.ok) {
    throw new Error(
      `Could not load file preview (${response.status} ${response.statusText}) for ${resourceUrl}.`
    );
  }
  return response;
}

/**
 * Fetches a bounded preview of a pod resource so large files do not have to be
 * loaded fully just to show a preview inside the browser.
 */
export async function fetchResourcePreview(
  resourceUrl: string,
  options: ResourceInspectorOptions = {}
): Promise<ResourcePreviewResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_PREVIEW_BYTES;
  const fetchFn = options.fetchFn ?? solidFetch;

  const response = ensureSuccessfulResponse(
    await fetchFn(resourceUrl, {
      headers: {
        Range: `bytes=0-${maxBytes - 1}`,
      },
    }),
    resourceUrl
  );

  const { bytes, truncated } = await readStreamWithLimit(response, maxBytes);
  const previewText = new TextDecoder().decode(bytes);
  const formatInfo = detectResourceFormat(
    resourceUrl,
    response.headers.get("content-type")
  );

  return {
    text: previewText,
    formatInfo,
    truncated,
    byteLength: bytes.byteLength,
  };
}

/**
 * Loads full text only when the user explicitly enters edit mode.
 */
export async function fetchResourceFullText(
  resourceUrl: string,
  fetchFn: typeof fetch = solidFetch
): Promise<ResourcePreviewResult> {
  const response = ensureSuccessfulResponse(await fetchFn(resourceUrl), resourceUrl);
  const text = await response.text();
  const formatInfo = detectResourceFormat(
    resourceUrl,
    response.headers.get("content-type")
  );

  return {
    text,
    formatInfo,
    truncated: false,
    byteLength: new TextEncoder().encode(text).byteLength,
  };
}

function toValidationResult(
  valid: boolean,
  summary: string,
  details: string[] = []
): ResourceValidationResult {
  return { valid, summary, details };
}

async function validateRdfContent(
  text: string,
  format: SupportedInspectorFormat
): Promise<ResourceValidationResult> {
  try {
    const parser = new N3Parser({ format: CONTENT_TYPE_BY_FORMAT[format] });
    parser.parse(text);
    return toValidationResult(true, `${FORMAT_LABELS[format]} syntax is valid.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RDF parse error.";
    return toValidationResult(false, `${FORMAT_LABELS[format]} syntax is invalid.`, [message]);
  }
}

export async function validateResourceContent(
  formatInfo: ResourceFormatInfo,
  text: string
): Promise<ResourceValidationResult> {
  if (!formatInfo.format) {
    return toValidationResult(false, "This file format is not supported for inline inspection.");
  }

  switch (formatInfo.format) {
    case "txt":
      return toValidationResult(true, "Plain text does not require structural validation.");
    case "json":
      try {
        JSON.parse(text);
        return toValidationResult(true, "JSON syntax is valid.");
      } catch (error) {
        return toValidationResult(false, "JSON syntax is invalid.", [
          error instanceof Error ? error.message : "Unknown JSON parse error.",
        ]);
      }
    case "jsonld":
      try {
        const parsed = JSON.parse(text);
        await jsonld.expand(parsed);
        return toValidationResult(true, "JSON-LD structure is valid.");
      } catch (error) {
        return toValidationResult(false, "JSON-LD structure is invalid.", [
          error instanceof Error ? error.message : "Unknown JSON-LD validation error.",
        ]);
      }
    case "csv": {
      const result = Papa.parse<string[]>(text, {
        skipEmptyLines: false,
      });
      if (result.errors.length > 0) {
        return toValidationResult(
          false,
          "CSV contains parse warnings.",
          result.errors.map(
            (entry) =>
              `${entry.message}${typeof entry.row === "number" ? ` (row ${entry.row + 1})` : ""}`
          )
        );
      }
      return toValidationResult(true, "CSV parsed successfully.");
    }
    case "ttl":
    case "nt":
    case "nq":
    case "trig":
    case "n3":
      return validateRdfContent(text, formatInfo.format);
    default:
      return toValidationResult(false, "Unsupported file format.");
  }
}

export function buildCsvPreviewTable(
  text: string,
  maxRows = 20
): CsvPreviewTable | null {
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: false,
    preview: maxRows,
  });

  if (!Array.isArray(result.data)) {
    return null;
  }

  const normalizedRows = result.data.map((row) =>
    Array.isArray(row) ? row.map((value) => String(value)) : [String(row)]
  );
  const [headerRow, ...bodyRows] = normalizedRows;

  return {
    headers: headerRow || [],
    rows: bodyRows,
    parseErrors: result.errors.map((entry) => entry.message),
  };
}

function countJsonObjects(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((count, entry) => count + countJsonObjects(entry), 0);
  }

  if (value && typeof value === "object") {
    return (
      1 +
      Object.values(value as Record<string, unknown>).reduce(
        (count, entry) => count + countJsonObjects(entry),
        0
      )
    );
  }

  return 0;
}

/**
 * Produces a compact structural summary so the UI can surface file shape at a glance.
 */
export function analyzeResourceStructure(
  formatInfo: ResourceFormatInfo,
  text: string
): ResourceStructureSummary | null {
  if (!formatInfo.format) {
    return null;
  }

  switch (formatInfo.format) {
    case "csv": {
      const result = Papa.parse<string[]>(text, { skipEmptyLines: false });
      const rows = Array.isArray(result.data) ? result.data.length : 0;
      const columns = Array.isArray(result.data)
        ? result.data.reduce((max, row) => {
            const width = Array.isArray(row) ? row.length : 1;
            return Math.max(max, width);
          }, 0)
        : 0;
      return {
        title: "CSV dimensions",
        value: `${rows} rows / ${columns} columns`,
      };
    }
    case "txt": {
      const rows = text.length === 0 ? 0 : text.split(/\r?\n/).length;
      const columns = text.split(/\r?\n/).reduce((max, line) => Math.max(max, line.length), 0);
      return {
        title: "Text dimensions",
        value: `${rows} rows / ${columns} columns`,
      };
    }
    case "json":
    case "jsonld": {
      try {
        const parsed = JSON.parse(text);
        const objectCount = countJsonObjects(parsed);
        return {
          title: "JSON object count",
          value: `${objectCount} ${objectCount === 1 ? "object" : "objects"}`,
        };
      } catch {
        return null;
      }
    }
    case "ttl":
    case "nt":
    case "nq":
    case "trig":
    case "n3": {
      try {
        const parser = new N3Parser({ format: CONTENT_TYPE_BY_FORMAT[formatInfo.format] });
        const statements = parser.parse(text).length;
        return {
          title: "RDF triple count",
          value: `${statements} ${statements === 1 ? "triple" : "triples"}`,
        };
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}

/**
 * Saves edited text back into the pod using the same resource URL.
 */
export async function saveResourceContent(
  resourceUrl: string,
  text: string,
  formatInfo: ResourceFormatInfo,
  fetchFn: typeof fetch = solidFetch,
  overwriteFn: typeof overwriteFile = overwriteFile
): Promise<void> {
  const contentType =
    formatInfo.contentType ||
    (formatInfo.format ? CONTENT_TYPE_BY_FORMAT[formatInfo.format] : "text/plain");

  await overwriteFn(resourceUrl, new Blob([text], { type: contentType }), {
    contentType,
    fetch: fetchFn,
  });
}

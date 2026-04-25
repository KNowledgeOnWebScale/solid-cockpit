import assert from "node:assert/strict";
import test from "node:test";
import { createCoiFetch } from "../../src/services/query/z3-headers.ts";

test("createCoiFetch injects isolation and CORS headers by default", async () => {
  const baseFetch = async () =>
    new Response("ok", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  const wrappedFetch = createCoiFetch(baseFetch as typeof fetch);
  const response = await wrappedFetch("https://example.org/resource");

  assert.equal(response.headers.get("Cross-Origin-Embedder-Policy"), "require-corp");
  assert.equal(response.headers.get("Cross-Origin-Resource-Policy"), "cross-origin");
  assert.equal(response.headers.get("Cross-Origin-Opener-Policy"), "same-origin");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
});

test("createCoiFetch enforces credentialless mode for no-cors requests", async () => {
  let receivedRequest: Request | undefined;
  const baseFetch = async (input: RequestInfo | URL) => {
    receivedRequest = input as Request;
    return new Response("ok", { status: 200 });
  };

  const wrappedFetch = createCoiFetch(baseFetch as typeof fetch, {
    coepCredentialless: true,
  });

  const request = new Request("https://example.org/resource", {
    mode: "no-cors",
    credentials: "include",
  });
  const response = await wrappedFetch(request);

  assert.equal(receivedRequest?.credentials, "omit");
  assert.equal(response.headers.get("Cross-Origin-Embedder-Policy"), "credentialless");
  assert.equal(response.headers.get("Cross-Origin-Resource-Policy"), null);
});

test("createCoiFetch skips ACAO header when noCors option is enabled", async () => {
  const baseFetch = async () => new Response("ok", { status: 200 });
  const wrappedFetch = createCoiFetch(baseFetch as typeof fetch, { noCors: true });
  const response = await wrappedFetch("https://example.org/resource");

  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("createCoiFetch returns opaque responses unchanged when passthroughOpaque is enabled", async () => {
  const opaqueResponse = { status: 0 } as Response;
  const baseFetch = async () => opaqueResponse;
  const wrappedFetch = createCoiFetch(baseFetch as typeof fetch, {
    passthroughOpaque: true,
  });

  const response = await wrappedFetch("https://example.org/resource");
  assert.equal(response, opaqueResponse);
});

test("createCoiFetch surfaces invalid request combinations from Request construction", async () => {
  const baseFetch = async () => new Response("ok", { status: 200 });
  const wrappedFetch = createCoiFetch(baseFetch as typeof fetch);

  await assert.rejects(
    () =>
      wrappedFetch("https://example.org/resource", {
        mode: "cors",
        cache: "only-if-cached",
      }),
    /only-if-cached/
  );
});

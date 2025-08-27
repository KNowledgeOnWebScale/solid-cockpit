/**
 * A fetch wrapper that clones the response and injects COOP/COEP/CORP headers,
 * similar to coi-serviceworker but only for requests routed through this fetch.
 *
 * Note: This cannot change top-level document isolation; it only adjusts the
 * Response objects returned to the caller (e.g., Comunica). That’s usually
 * enough when you just need these headers present on fetched resources.
 */
export type CoiFetchOptions = {
  /** Match SW behavior: if true and the request mode is "no-cors", omit credentials. */
  coepCredentialless?: boolean;
  /**
   * If true and the underlying response has status 0 (opaque), just return it
   * without trying to rewrite headers (mirrors SW behavior).
   */
  passthroughOpaque?: boolean;
};

export function createCoiFetch(
  baseFetch: typeof fetch = fetch,
  opts: CoiFetchOptions = {}
): typeof fetch {
  const {
    coepCredentialless = true,
    passthroughOpaque = true,
  } = opts;

  const coiFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Normalize to a Request so we can inspect mode/cache/etc.
    const originalRequest = input instanceof Request ? input : new Request(input as RequestInfo, init);

    // Avoid the "only-if-cached" cross-origin pitfall (like the SW does).
    if (originalRequest.cache === "only-if-cached" && originalRequest.mode !== "same-origin") {
      // Let the platform error naturally.
      return baseFetch(originalRequest);
    }

    // If credentialless is set and this is a no-cors request, drop credentials.
    const requestToSend =
      coepCredentialless && originalRequest.mode === "no-cors"
        ? new Request(originalRequest, { credentials: "omit" })
        : originalRequest;

    const response = await baseFetch(requestToSend);

    // Opaque responses (status 0) can’t be inspected; return as-is unless you
    // want to force a rewrap (which would still be opaque and useless).
    if (passthroughOpaque && (response as any).status === 0) {
      return response;
    }

    // Clone and add the headers we care about.
    const newHeaders = new Headers(response.headers);

    // Cross-Origin-Embedder-Policy: credentialless or require-corp
    newHeaders.set(
      "Cross-Origin-Embedder-Policy",
      coepCredentialless ? "credentialless" : "require-corp"
    );

    // Cross-Origin-Resource-Policy: only set when not credentialless (matches the SW)
    if (!coepCredentialless) {
      newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
    }

    // Cross-Origin-Opener-Policy: same-origin
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

    // Important: we must stream the body through; Response.body is a ReadableStream.
    // If the body has been used elsewhere, this will throw—callers should not consume
    // the original response before passing it on.
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };

  return coiFetch;
}
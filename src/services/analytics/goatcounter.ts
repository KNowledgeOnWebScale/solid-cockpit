/**
 * Minimal GoatCounter integration for this single-page application.
 *
 * The endpoint is intentionally configuration-driven because GoatCounter site
 * codes belong to the site's account and are not application secrets.
 */

interface GoatCounterConfig {
  no_onload?: boolean;
}

interface GoatCounterClient extends GoatCounterConfig {
  count?: (data: { path: string; title?: string }) => void;
}

const GOATCOUNTER_SCRIPT_SRC = "https://gc.zgo.at/count.js";
let loadPromise: Promise<void> | null = null;
let loaded = false;
let queuedPath: string | null = null;

function configuredEndpoint(): string {
  const environment = (import.meta as unknown as {
    env?: { VITE_GOATCOUNTER_ENDPOINT?: string };
  }).env;
  return (
    environment?.VITE_GOATCOUNTER_ENDPOINT?.trim() || ""
  );
}

function goatCounterClient(): GoatCounterClient | undefined {
  return (globalThis as typeof globalThis & { goatcounter?: GoatCounterClient })
    .goatcounter;
}

/**
 * Loads count.js once. `no_onload` keeps route tracking under our control so
 * the initial page and later Vue Router navigations use the same path format.
 */
export function initializeGoatCounter(): Promise<void> {
  if (!configuredEndpoint() || typeof document === "undefined") {
    return Promise.resolve();
  }

  if (loaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  const client = goatCounterClient() || {};
  client.no_onload = true;
  (globalThis as typeof globalThis & { goatcounter: GoatCounterClient })
    .goatcounter = client;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = GOATCOUNTER_SCRIPT_SRC;
    script.dataset.goatcounter = configuredEndpoint();
    script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
    script.onload = () => {
      loaded = true;
      if (queuedPath) {
        sendPageView(queuedPath);
        queuedPath = null;
      }
      resolve();
    };
    script.onerror = () => {
      // Analytics must never affect application startup or navigation.
      loadPromise = null;
      resolve();
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function sendPageView(path: string): void {
  const client = goatCounterClient();
  if (client?.count) {
    client.count({ path, title: document.title });
  }
}

/**
 * Records a route path without exposing query contents or Solid resource URLs.
 * The route path is enough to measure app activity and avoids sending query
 * text, WebIDs, pod URLs, or other user-entered data to the analytics service.
 */
export function trackGoatCounterPage(path: string): void {
  if (!configuredEndpoint()) {
    return;
  }

  if (!loaded || !goatCounterClient()?.count) {
    queuedPath = path;
    return;
  }

  sendPageView(path);
}

export function goatCounterIsConfigured(): boolean {
  return Boolean(configuredEndpoint());
}

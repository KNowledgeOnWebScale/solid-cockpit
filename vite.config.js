import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);
const appVersion = packageJson.version ?? "0.0.0";
const appReleaseTag = `web-app-v${appVersion}`;

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === "serve";
  const diagnosticsChannelShim = fileURLToPath(
    new URL("./src/shims/diagnostics_channel.ts", import.meta.url),
  );
  return {
    plugins: [vue()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_RELEASE_TAG__: JSON.stringify(appReleaseTag),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        // Comunica v5 pulls in lru-cache, which references Node diagnostics channels.
        // Route both module specifiers to a browser-safe shim.
        "node:diagnostics_channel": diagnosticsChannelShim,
        diagnostics_channel: diagnosticsChannelShim,
      },
    },
    base: isDev ? "./" : "/solid-cockpit/",
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("@triply/yasqe") || id.includes("@triply/yasr")) {
              return "query-editors";
            }
            if (
              id.includes("@comunica/") ||
              id.includes("query-sparql-remote-cache") ||
              id.includes("actor-query-process-remote-cache")
            ) {
              return "query-engine";
            }
            if (id.includes("@inrupt/solid-client")) {
              return "solid-client";
            }
            return undefined;
          },
        },
      },
    },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
  };
});

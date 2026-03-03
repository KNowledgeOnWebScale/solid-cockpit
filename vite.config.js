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
  return {
    plugins: [vue()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_RELEASE_TAG__: JSON.stringify(appReleaseTag),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    base: isDev ? "./" : "/solid-cockpit/",
    build: {
      outDir: "dist",
    },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
  };
});

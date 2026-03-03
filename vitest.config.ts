import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);
const appVersion = packageJson.version ?? "0.0.0";
const appReleaseTag = `web-app-v${appVersion}`;

export default defineConfig({
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
  test: {
    environment: "jsdom",
    include: ["tests/components/**/*.test.ts"],
    setupFiles: ["./tests/components/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/components/Styling/ThemeSwitch.vue",
        "src/components/Styling/TheFooter.vue",
        "src/components/Styling/useTheme.ts",
      ],
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 85,
      },
    },
  },
});

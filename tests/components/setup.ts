import { afterEach, vi } from "vitest";

const originalWarn = console.warn.bind(console);

// Filter only the noisy unresolved Vuetify tag warnings in test output.
console.warn = (...args: unknown[]) => {
  const joined = args
    .map((arg) => (typeof arg === "string" ? arg : ""))
    .join(" ");

  if (
    joined.includes("[Vue warn]: Failed to resolve component: v-") ||
    joined.includes(
      "If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement."
    )
  ) {
    return;
  }

  originalWarn(...(args as Parameters<typeof console.warn>));
};

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
  vi.restoreAllMocks();
});

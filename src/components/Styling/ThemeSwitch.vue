<template>
  <button
    class="theme-switch"
    role="switch"
    :aria-checked="isDark"
    :aria-label="`Theme: ${isDark ? 'dark' : 'light'}`"
    @click="toggleTheme()"
    @keydown.space.prevent="toggleTheme()"
    @keydown.enter.prevent="toggleTheme()"
    :data-mode="isDark ? 'dark' : 'light'"
    :title="`Click to toggle theme (${
      isDark ? 'dark → light' : 'light → dark'
    })`"
  >
    <span class="icon moon" aria-hidden="true">🌙</span>
    <span class="icon sun" aria-hidden="true">☀️</span>
    <span class="thumb" />
  </button>
</template>

<script setup lang="ts">
import { useTheme } from "./useTheme";
const { isDark, toggleTheme } = useTheme();
</script>

<style scoped>
.theme-switch {
  --w: 62px; /* control width */
  --h: 34px; /* control height */
  --pad: 3px; /* track padding */
  --thumb: 26px; /* thumb size */

  position: relative;
  width: var(--w);
  height: var(--h);
  padding: 0;
  border: 1px solid var(--border);
  border-radius: calc(var(--h));
  background: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  outline: none;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.theme-switch:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--focus-ring), transparent 55%);
}

.icon {
  font-size: 0.85rem;
  line-height: 1;
  opacity: 0.7;
  user-select: none;
  pointer-events: none;
}

.sun {
  margin-right: 6px;
}
.moon {
  margin-left: 6px;
}

.thumb {
  position: absolute;
  top: var(--pad);
  left: var(--pad);
  width: var(--thumb);
  height: var(--thumb);
  border-radius: 999px;
  background: var(--bg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
  transition: transform 0.18s ease, background-color 0.18s ease,
    border-color 0.18s ease;
}

.theme-switch[data-mode="light"] .thumb {
  transform: translateX(0);
}
.theme-switch[data-mode="dark"] .thumb {
  transform: translateX(calc(var(--w) - var(--thumb) - 2 * var(--pad)));
}

/* Optional: subtle tint when explicit dark is active */
.theme-switch[data-mode="dark"] {
  background: color-mix(in oklab, var(--primary-100), var(--primary) 8%);
}
</style>

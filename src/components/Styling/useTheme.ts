import { ref, readonly, onMounted, computed } from "vue";

type Theme = "light" | "dark";

const THEME_KEY = "app-theme";

const current = ref<Theme>("dark"); // default to dark

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  localStorage.setItem(THEME_KEY, theme);
}

export function useTheme() {
  const isDark = computed(() => current.value === "dark");

  function setTheme(theme: Theme) {
    current.value = theme;
    applyTheme(theme);
  }

  function toggleTheme() {
    setTheme(current.value === "dark" ? "light" : "dark");
  }

  onMounted(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) || "dark";
    current.value = saved;
    applyTheme(saved);
  });

  return {
    theme: readonly(current),
    isDark,
    setTheme,
    toggleTheme,
  };
}

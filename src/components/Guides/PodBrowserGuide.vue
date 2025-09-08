<template>
  <div class="guide-wrapper">
    <div class="item">
      <button class="dropdown-toggle" @click="toggleGuideDropdown">
        <h2 class="guide" style="display: inline">Pod Browser Guide</h2>
        <i class="material-icons dropdown-arrow">
          {{ guideDropdownOpen ? "keyboard_arrow_down" : "chevron_right" }}</i
        >
      </button>
      <div v-show="guideDropdownOpen">
        <ol class="list-container">
          <li class="req"><span>Select the Pod you want to Browse.</span></li>
          <li class="req">
            <span>Navigate to the directory you want to browse.</span>
          </li>
          <li class="req">
            <span
              >Click the
              <i class="material-icons not-colored">chevron_right</i> to see
              resource information.</span
            >
          </li>
          <li class="req">
            Future work: Graphical browser (as an interactive knowledge graph) /
            RDF data + Metadata editing (with syntax checking) /
            View filtering / Search bar (for quick searching)
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "PodBrowserGuide",
  data: () => ({
    guideDropdownOpen: false as boolean,
  }),
  methods: {
    toggleGuideDropdown() {
      this.guideDropdownOpen = !this.guideDropdownOpen;
    },
  },
};
</script>

<style scoped>
.guide-wrapper {
  font-family: "Oxanium", monospace;
  max-width: 100%;
  margin: 0.5rem 0.5rem;
  padding: 0.5rem;
  background: var(--panel);
  border-radius: 10px;
}
button:focus {
  background-color: transparent;
  box-shadow: none;
}
.item {
  background-color: var(--panel);
  border: 3px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  margin: 0.5rem 0;
  color: var(--text-secondary);
}
.guide {
  text-align: Left;
  color: var(--text-primary);
  font-size: 18pt;
  font-weight: 600;
  margin: 0;
}
.req {
  margin: 1rem 0.5rem;
  font-size: 14pt;
  list-style-type: upper-roman;
  align-items: Left;
}

/* Dropdown style */
.dropdown-toggle {
  color: var(--text-primary);
  font-family: "Oxanium", monospace;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 0;
}
.item:hover {
  background: var(--muted);
}
.dropdown-arrow {
  font-size: 1.5em;
  color: var(--text-primary);
}
.dropdown-content {
  margin-top: 0.5rem;
  border-radius: 8px;
  padding: 0.2rem 0.5rem;
  color: var(--text-secondary);
}
.list-container {
  margin: 0 1.5rem;
  padding: 0;
}
.not-colored {
  color: var(--text-muted);
}
</style>

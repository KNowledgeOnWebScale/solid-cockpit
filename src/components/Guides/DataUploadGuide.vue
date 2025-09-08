<template>
  <div class="container-guide">
    <div class="item">
      <button class="dropdown-toggle" @click="toggleGuideDropdown">
        <h2 class="guide" style="display: inline">Data Upload Guide</h2>
        <i class="material-icons dropdown-arrow">
          {{ guideDropdownOpen ? "keyboard_arrow_down" : "chevron_right" }}</i
        >
      </button>
      <div v-if="guideDropdownOpen" class="dropdown-content">
        <ol class="list-container">
          <li class="req">
            Select the pod you want to upload your file(s) to
          </li>
          <li class="req">
            Select or input the directory you want to upload the file(s) to
          </li>
          <li class="req">
            Click the <b>"File Input"</b> bar or drag and drop a file from your
            local machine
          </li>
          <li class="req">Click the <b>"Upload"</b> button</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "DataUploadGuide",
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
.container-guide {
  font-family: "Oxanium", monospace;
  max-width: 100%;
  margin: auto;
  padding: 0.5rem;
  background: var(--panel);
  border-radius: 10px;
}

.item {
  border: 3px solid var(--border);
  border-radius: 6px;
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
  padding: 1rem;
}
.item:hover {
  background: var(--muted);
}
.dropdown-arrow {
  font-size: 1.5em;
  color: var(--text-primary);
}
.dropdown-content {
  border-radius: 8px;
  margin-left: 1rem 0;
  padding: 0.2rem 0.5rem;
  color: var(--text-secondary);
}
.list-container {
  margin: 0 1.5rem;
  padding: 0;
}
</style>

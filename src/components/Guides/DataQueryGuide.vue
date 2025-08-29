<template>
  <div class="container">
    <div class="item">
      <button class="dropdown-toggle" @click="toggleGuideDropdown">
        <h2 class="guide" style="display:inline;">Data Query Guide</h2>
        <i class="material-icons dropdown-arrow">
          {{ guideDropdownOpen ? "keyboard_arrow_down" : "chevron_right" }}</i>
      </button>
      <div v-if="guideDropdownOpen" class="dropdown-content">
        <ol class="list-container">
          <li class="req">
            <b>OPTIONAL:</b> Select a pod (if you want to save/share queries and
            results)
          </li>
          <li class="req">
            Select or input the URL(s) of the SPARQL Endpoint(s) and/or Solid
            Pod(s) to query in <b>"Datasources"</b> (Solid pod querying not
            available yet)
          </li>
          <li class="req">Enter a SPARQL query in the input box</li>
          <li class="req">
            Click the <b>"Save Query"</b> button if you wish to save the query and
            results
          </li>
          <li class="req">
            Click the <b>"Execute Query"</b> button to execute the query
          </li>
          <li class="req">
            Results will be displayed below once the query has finished
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data: () => ({
    guideDropdownOpen: true as boolean,
  }),
  methods: {
    toggleGuideDropdown() {
      this.guideDropdownOpen = !this.guideDropdownOpen;
    },
  },
};
</script>

<style scoped>
.item {
  background-color: #37474f;
  border: 3px solid #1e1e1e;
  border-radius: 6px;
  padding: 1rem;
  margin: 0.5rem 0;
}
.guide {
  text-align: Left;
}
.req {
  margin: 1rem 0.5rem;
  font-size: 14pt;
  list-style-type: upper-roman;
  align-items: Left;
}
.container {
  font-family: "Oxanium", monospace;
  max-width: 100%;
  margin: 0 0.5rem;
  padding: 0.5rem;
  background: #28353e;
  border-radius: 10px;
}

/* Dropdown style */
.dropdown-toggle {
  color: #ede7f6;
  font-family: "Oxanium", monospace;
  font-size: 12pt;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.item:hover {
  background: #37474f;
  color: #fff;
}
.dropdown-arrow {
  font-size: 1.5em;
  margin-left: 0.5em;
  color: #ede7f6;
}
.dropdown-content {
  margin-top: 0.5rem;
  border-radius: 8px;
  padding: 0.2rem 0.5rem;
  color: #ede7f6;
}
.list-container {
  margin: 0 1.5rem;
  padding: 0;
}
</style>

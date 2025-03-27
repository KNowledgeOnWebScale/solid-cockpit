<template>
  <div class="title-container">
    <span>Data Query</span>
  </div>
  <div class="pod-chooseContainer">
    <PodRegistration @pod-selected="handlePodSelected" />
  </div>
  <div class="general-container">
    <!-- Left Navigation Bar -->
    <div class="nav-container">
      <ul>
        <li><span>Query Views</span></li>

        <li>
          <button
            id="top-button"
            :class="{ highlight: currentView === 'newQuery' }"
            @click="currentView = 'newQuery'"
          >
            New Query
          </button>
        </li>
        <li>
          <button
            :class="{ highlight: currentView === 'previousQueries' }"
            @click="loadCache"
          >
            Past Queries
          </button>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="query-container">
      <div v-if="currentView === 'newQuery'">
        <ul>
          <div class="top-container">
            <span class="top-label">Input a New Query</span>
            <!-- TODO: Add more example queries here -->
            <v-select
              class="example-queries"
              :item-props="itemPropsExampleQueries"
              :items="exampleQueries"
              v-model="currentQuery"
              density="compact"
              rounded
              flat
              label="Sample Queries"
            ></v-select>
          </div>
          <!-- SPARQL Query input box -->
          <!-- Source Designation -->
          <!-- TODO: offer a way to specify your own URL (Solid pod or SPARQL endpoint) + integrate YASGUI -->
          <div id="yasgui-container"></div>

          <div class="source-selection">
            <span>Datasources: </span>
            <v-combobox
              class="autocomplete"
              v-model="currentQuery.sources"
              :items="possibleSources"
              label="Source(s)"
              variant="plain"
              chips
              closable-chips
              hide-details
              hide-no-data
              hide-selected
              multiple
              single-line
              clearable
            ></v-combobox>
          </div>

          <!-- Actual query -->
          <li>
            <textarea
              ref="codeEditor"
              v-model="currentQuery.query"
              placeholder="Enter your SPARQL query here..."
              class="input-box"
            ></textarea>
          </li>
          <li>
            <p
              class="valid-text"
              :class="
                isValidSPARQL(currentQuery.query)
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{
                isValidSPARQL(currentQuery.query)
                  ? "Looks like a valid SPARQL query."
                  : "Invalid SPARQL query. Please check syntax."
              }}
            </p>
          </li>
          <!-- execute query -->
          <div class="bottom-container">
            <button
              class="execute-button"
              @click="runExecuteQuery"
              :disabled="loading"
            >
              Execute Query
            </button>
            <div class="save-query" v-if="currentPod !== ''">
              <v-checkbox
                class="save-checkbox"
                v-model="saveQuery"
                color="#EDE7F6"
                label="Save Query?"
                hide-details
              ></v-checkbox>
              <div class="save-info">
                <v-icon>mdi-information</v-icon>
                <v-tooltip activator="parent" location="right"
                  >Check this box if you would like to save the query and any
                  results to your pod</v-tooltip
                >
              </div>
            </div>
          </div>
          <!-- TODO: an alert or something here if there is a [syntax] error -->
        </ul>
      </div>

      <div v-if="currentView === 'previousQueries'">
        <span class="no-pod" v-if="currentPod == ''"
          >Please connect your pod if you wish to look at your Query
          Cache...</span
        >
        <ul>
          <div class="cached-container" v-if="currentPod != ''">
            <span class="cached-title">Cached Queries</span>

            <!-- Iterates over list queries in Query Cache -->
            <!-- TODO: Fix awitching between queries without closing drop-downs (right now it has weird activity...) -->
            <!-- TODO: Fix the arrow changing for all div when only one query is exanded (also apply fix to PrivacyEditing component) -->
            <li v-for="(query, index) in cachedQueries" :key="index">
              <div class="card-panel folder">
                <div class="folder-header">
                  <button
                    @click="toggleQuery(index)"
                    class="icon-button full-width"
                  >
                    <div class="icon-hash">
                      <i class="material-icons not-colored left">{{
                        "search"
                      }}</i>
                      <span class="query-hash">{{ query.hash }}</span>
                    </div>
                    <i class="material-icons not-colored info-icon">
                      {{
                        showQueryIndex === null
                          ? "chevron_right info"
                          : "keyboard_arrow_down info"
                      }}</i
                    >
                  </button>
                </div>
                <!-- Shows individual query details -->
                <div class="specific-query" v-if="showQueryIndex === index">
                  <!-- When query was executed -->
                  <div class="query-time">
                    <span class="user-tag">Date: <br /></span>
                    <span class="the-user"
                      ><i>{{ query.created }}</i></span
                    >
                  </div>

                  <!-- The SPARQL query that was executed -->
                  <div class="query-file-container">
                    <span class="user-tag">Query File: <br /></span>
                    <div class="query-file">
                      <span class="the-user"
                        ><i>{{ query.queryFile }}</i></span
                      >
                      <button
                        @click="fetchQuery(cachedQueries[index].hash)"
                        class="drop-down"
                      >
                        <i class="material-icons not-colored right"
                          >{{ showRetrievedQuery
                            ? "keyboard_arrow_down"
                            : "chevron_right"
                          }}</i
                        >
                      </button>
                    </div>

                    <div class="sparql-box" v-if="showRetrievedQuery && retrievedQuery != null">
                      <pre><code>{{ retrievedQuery }}</code></pre>
                    </div>
                  </div>

                  <!-- The results of the Query -->
                  <div class="query-results-container">
                    <span class="user-tag">Results File: <br /></span>
                    <div class="query-results">
                      <span class="the-user"
                        ><i>{{ query.resultsFile }}</i></span
                      >
                      <button
                        @click="fetchResults(cachedQueries[index].hash)"
                        class="drop-down"
                      >
                        <i class="material-icons not-colored right">{{
                          showRetrievedResults
                            ? "keyboard_arrow_down"
                            : "chevron_right"
                        }}</i>
                      </button>
                    </div>
                    <!-- Table for Displaying Results -->
                    <div
                      class="table-container"
                      v-if="showRetrievedResults && retrievedResults != null"
                    >
                      <div class="scroll-wrapper">
                        <table class="result-table">
                          <thead>
                            <tr>
                              <th
                                v-for="(varName, index) in retrievedResults.head
                                  .vars"
                                :key="index"
                              >
                                {{ varName }}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(binding, rowIndex) in retrievedResults
                                .results.bindings"
                              :key="rowIndex"
                            >
                              <td
                                v-for="(varName, colIndex) in retrievedResults
                                  .head.vars"
                                :key="colIndex"
                              >
                                {{ binding[varName]?.value || "0" }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div class="null-results" v-if="showRetrievedResults && retrievedResults == null">
                      <span>This query had no results 🙃</span>
                    </div>
                  </div>

                  <!-- The query sources -->
                  <div class="query-sources">
                    <span class="user-tag">Sources: <br /></span>
                    <ul>
                      <li v-for="(source, i) in query.sourceUrls" :key="i">
                        <a>{{ source }}</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </ul>
      </div>
    </div>
  </div>

  <div class="results-container" v-if="loading || currentQuery.results != null">
    <!-- Loading Spinner -->
    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
      <p>Loading query results...</p>
    </div>

    <!-- <div class="init-yasgui" id="yasgui"></div>
    <div ref="yasrContainer" class="yasr-container"></div> -->

    <!-- Display Result Count -->
    <div class="results-header" v-if="!loading && currentQuery.results != null">
      <span>Query Results</span>
      <p class="result-count">
        (n = {{ resolvedQueryResults.results.bindings.length }})
      </p>
    </div>

    <!-- Table for Displaying Results -->
    <div
      class="table-container"
      v-if="!loading && resolvedQueryResults.results != null"
    >
      <div class="scroll-wrapper">
        <table class="result-table">
          <thead>
            <tr>
              <th
                v-for="(varName, index) in resolvedQueryResults.head.vars"
                :key="index"
              >
                {{ varName }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(binding, rowIndex) in resolvedQueryResults.results
                .bindings"
              :key="rowIndex"
            >
              <td
                v-for="(varName, colIndex) in resolvedQueryResults.head.vars"
                :key="colIndex"
              >
                {{ binding[varName]?.value || "0" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Guide for file uploading -->
  <div class="use-guide">
    <div class="guide-container">
      <h2 class="guide">Data Query Guide</h2>

      <hr class="line" />

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
</template>

<script>
// import YASGUI from '@triply/yasgui/build/yasgui.min.js'
import { currentWebId, getPodURLs } from "./login";
import {
  ensureCacheContainer,
  createQueriesTTL,
  uploadQueryFile,
  uploadResults,
  getQueriesTtl,
  fetchQueryFileData,
  getCachedQueries,
  executeQuery,
  fetchSparqlJsonFileData,
} from "./queryPod";
import PodRegistration from "./PodRegistration.vue";
import { toRaw } from "vue";
// import { yasgui, yasr } from "@triply/yasgui";

export default {
  components: {
    PodRegistration,
  },
  data() {
    return {
      currentPod: "",
      currentView: "newQuery", // Tracks the active view: 'newQuery' or 'previousQueries'
      exampleQueries: [
        {
          name: "Example 1",
          sources: ["<https://sparql.rhea-db.org/sparql/>"],
          query: "SELECT DISTINCT ?p WHERE {\n\t?s ?p ?o .\n}LIMIT 10",
        },
        {
          name: "Rhea 13",
          sources: ["<https://sparql.rhea-db.org/sparql/>"],
          query: "PREFIX rh: <http://rdf.rhea-db.org/>\nPREFIX taxon: <http://purl.uniprot.org/taxonomy/>\nPREFIX up: <http://purl.uniprot.org/core/>\nSELECT ?uniprot ?mnemo ?rhea ?accession ?equation \nWHERE {\n\tSERVICE <https://sparql.uniprot.org/sparql> {\n\t\tVALUES (?taxid) { (taxon:83333) }\n\t\tGRAPH <http://sparql.uniprot.org/uniprot> {\n\t\t\t?uniprot up:reviewed true .\n\t\t\t?uniprot up:mnemonic ?mnemo .\n\t\t\t?uniprot up:organism ?taxid .\n\t\t\t?uniprot up:annotation/up:catalyticActivity/up:catalyzedReaction ?rhea .\n\t\t}\n\t}\n\t?rhea rh:accession ?accession .\n\t?rhea rh:equation ?equation .\n}",
        },

      ],
      possibleSources: [
        "<https://www.bgee.org/sparql/>",
        "<https://glyconnect.expasy.org/sparql>",
        "<https://hamap.expasy.org/sparql/>",
        "<https://rdf.metanetx.org/sparql/>",
        "<https://sparql.omabrowser.org/sparql>",
        "<https://sparql.orthodb.org/sparql/>",
        "<https://sparql.rhea-db.org/sparql>",
        "<https://sparql.swisslipids.org/sparql/>",
        "<https://biosoda.unil.ch/emi/sparql/>",
        "<https://sparql.uniprot.org/sparql>",
        "<https://query.wikidata.org/sparql>",
      ],
      currentQuery: {
        name: "",
        sources: [],
        query: "", // The current SPARQL query input
        results: null,
      },
      resolvedQueryResults: Object,
      saveQuery: false,
      cachePath: "",
      currHash: "",
      queryFile: "",
      resultsFile: "",
      retrievedQuery: null,
      retrievedResults: null,
      showRetrievedQuery: false,
      showRetrievedResults: false,
      showQueryIndex: null,
      queriesCacheExists: false,
      inputType: "",
      cachedQueries: Object,
      queries: [],
      loading: false,
    };
  },
  methods: {
    // details about a specific query
    toggleQuery(index) {
      this.showQueryIndex = this.showQueryIndex === index ? null : index;
    },
    // for the sources autocomplete list
    itemPropsSources(item) {
      return {
        title: item.url,
      };
    },
    itemPropsExampleQueries(item2) {
      return {
        title: item2.name,
      };
    },
    isValidSPARQL(query) {
      // Check if the query starts with a valid SPARQL keyword
      const sparqlRegex = /^(SELECT|ASK|CONSTRUCT|DESCRIBE|PREFIX|BASE)\s+/i;
      if (!sparqlRegex.test(query.trim())) {
        return false;
      }

      // Check if the query contains a WHERE clause
      if (!/WHERE\s*\{/.test(query)) {
        return false;
      }

      // Check for balanced braces {}
      const braces =
        (query.match(/\{/g) || []).length === (query.match(/\}/g) || []).length;
      if (!braces) {
        return false;
      }

      // Check for balanced angle brackets <>
      const angleBrackets =
        (query.match(/</g) || []).length === (query.match(/>/g) || []).length;
      if (!angleBrackets) {
        return false;
      }
      return true;
    },
    clearQueryInput() {
      this.currentQuery.query = "";
    },

    // method to obtain the current WebID and PodURL
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podURLs = await getPodURLs(); // calls async function to get Pod URLs
    },
    /* Takes in the emitted value from PodRegistration.vue */
    handlePodSelected(selectedPod) {
      this.currentPod = selectedPod;
      this.possibleSources.unshift(`<${this.currentPod}>`);
    },

    // Executes user provided query and saves it to querycache if specified
    async runExecuteQuery() {
      this.loading = true;
      if (this.currentQuery.query.trim() === "") {
        alert("Please enter a valid SPARQL query before executing.");
        return;
      }

      // Here, the app will save the query and results using a hash
      if (this.saveQuery) {
        this.cachePath = await ensureCacheContainer(this.currentPod);

        // adds query to queries.ttl
        this.currHash = await createQueriesTTL(
          this.cachePath,
          this.currentQuery.query,
          this.currentQuery.sources
        );
        // creates #hash.rq file containing the executed query
        this.queryFile = await uploadQueryFile(
          this.cachePath,
          this.currentQuery.query,
          this.currHash
        );
        // execute the query
        this.currentQuery.results = await executeQuery(
          this.currentQuery.query,
          this.currentQuery.sources
        );

        // Handle empty results
        if (!this.currentQuery.results || !this.currentQuery.results.results) {
          this.currentQuery.results = {
            head: { vars: [] },
            results: { bindings: [] },
          };
        }

        // create #hash.sparqljson file with query results
        this.resultsFile = await uploadResults(
          this.cachePath,
          JSON.stringify(this.currentQuery.results, null, 2),
          this.currHash
        );
      } else {
        this.currentQuery.results = await executeQuery(
          this.currentQuery.query,
          this.currentQuery.sources
        );

        // Handle empty results
        if (!this.currentQuery.results || !this.currentQuery.results.results) {
          this.currentQuery.results = {
            head: { vars: [] },
            results: { bindings: [] },
          };
        }

        this.resolvedQueryResults = toRaw(this.currentQuery.results);
        // this.initializeYasr();
        // this.yasr.setResponse({ data: this.resolvedQueryResults, contentType: "application/sparql-results+json" });
      }
      this.loading = false;
    },

    // initializeYasr() {
    //   const yasgui = new yasgui(document.getElementById("yasgui"));
    //   this.yasr = new yasgui.yasr(this.$refs.yasrContainer, {
    //     persistency: false,
    //     plugins: ["table", "response", "rawResponse"],
    //   });
    // },

    async loadCache() {
      this.currentView = "previousQueries";
      this.queriesCacheExists = await getQueriesTtl(
        this.currentPod + "querycache/"
      );
      if (this.queriesCacheExists) {
        try {
          const cachedQueriesThing = await getCachedQueries(
            this.currentPod + "querycache/queries.ttl"
          );
          this.cachedQueries = await toRaw(cachedQueriesThing);
        } catch (err) {
          console.error("Error fetching queries:", err);
        }
      }
    },

    togglRetrievedResults() {
      this.showRetrievedResults = !this.showRetrievedResults;
    },
    togglRetrievedQuery() {
      this.showRetrievedQuery = !this.showRetrievedQuery;
    },
    // retrieves cached results for display
    async fetchResults(hash) {
      const retrievedQuery = await fetchSparqlJsonFileData(
        `${this.currentPod}querycache/${hash}.json`
      );
      this.retrievedResults = toRaw(retrievedQuery);
      this.togglRetrievedResults();
    },
    // retrieves cached query for display
    async fetchQuery(hash) {
      this.retrievedQuery = await fetchQueryFileData(
        `${this.currentPod}querycache/${hash}.rq`
      );
      this.togglRetrievedQuery();
    },
  },
  mounted() {
    const textarea = this.$refs.codeEditor;

    /* Small function that allows tab characters in the SPARQL query input box */
    textarea.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        // Insert tab (4 spaces in this case)
        this.value =
          this.value.substring(0, start) + "    " + this.value.substring(end);
        // Place cursor after the tab
        this.selectionStart = this.selectionEnd = start + 4;
      }
    });
    /* Small function that allows input box to grow for longer queries */
    textarea.addEventListener("input", function () {
      // Reset height to auto to calculate new height
      this.style.height = "auto";
      // Set the height to match the scrollHeight
      this.style.height = this.scrollHeight + "px";
    });

    //TODO: integrate yasgui
    // const container = document.getElementById('yasgui-container');
    // const yasguiInstance = new YASGUI(container, {
    //   requestConfig: { endpoint: "http://example.com/sparql" },
    //   copyEndpointOnNewTab: false,
    // });
    // Optionally, you can store or configure `yasguiInstance` further here.
  },
};
</script>

<style scoped>
@import url("https://unpkg.com/@triply/yasgui/build/yasgui.min.css");
body {
  line-height: 1.6;
  margin: 15px;
  font-family: "Oxanium", monospace;
  font-size: 13px;
  max-width: 80%;
  margin: auto;
  margin-top: 20px;
  padding: 20px;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Title bar */
.title-container {
  background-color: #445560;
  border-radius: 8px;
  margin: 0.5rem;
}
.title-container span {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  padding-left: 20px;
  padding-right: 20px;
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  background: #445560;
  border-radius: 8px;
  margin: 0.5rem;
}

/* Whole nav and query container */
.general-container {
  background-color: #445560;
  border-radius: 8px;
  margin: 0.5rem;
  display: flex;
}

/* Left nav bar */
.nav-container {
  display: flex;
  background-color: #28353e;
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  min-width: fit-content;
}
.nav-container ul {
  list-style-type: none;
  padding: 10px;
  height: 100%;
  overflow: auto;
}
.nav-container li span {
  font-size: 18pt;
  font-weight: bold;
  padding: 10px 8px 4px 8px;
  text-decoration: none;
  border-bottom: 1px solid #ccc;
}
#top-button {
  margin-top: 10px;
}
.nav-container li button {
  display: block;
  color: #ede7f6;
  width: 100%;
  border-radius: 4px;
  padding: 0.8rem 1.2rem;
  text-decoration: none;
}
.nav-container li button.active {
  background-color: #04aa6d;
  color: white;
}
.nav-container li button:hover:not(.active) {
  background-color: #555;
  color: white;
  width: 100%;
}
.nav-container .highlight {
  background-color: #754ff6;
  color: #ede7f6;
}

/* Query elements */
.query-container {
  padding: 10px 16px;
  height: fit-content;
  width: 100%;
  font-family: "Oxanium", monospace;
}
#sample-queries {
  align-items: right;
}
.query-container ul {
  list-style-type: none;
  height: 100%;
  overflow: auto;
}
.query-container .top-container {
  display: flex;
}
.example-queries {
  margin-left: auto;
  max-width: 20dvw;
}
.top-container {
  display: flex;
  align-items: center;
}
.top-container .top-label span {
  padding: 0;
}
.query-container .top-container span {
  font-size: 18pt;
  font-weight: bold;
  padding: 0px 0.5rem 1rem 0.5rem;
  text-decoration: none;
}
/* source designation */
.source-selection {
  display: flex;
  align-items: center;
  border-radius: 4px;
  margin: 0.2rem 0.2rem 0.4rem 0.2rem;
  outline: #28353e 3px solid;
}
.source-selection span {
  font-size: 16pt;
  font-weight: 600;
  padding: 10px 8px 8px 4px;
}
.source-selection .autocomplete {
  padding: 0px 4px 12px 6px;
}
/* Actual Query input */
.input-box {
  font-family: "Courier New", Courier, monospace;
  font-size: 14pt;
  font-weight: 700;
  color: #ede7f6;
  padding: 5px;
  width: 100%;
  border: 3px solid #28353e;
  border-radius: 8px;
  min-height: 200px;
}
.valid-text {
  display: flex;
  justify-content: flex-end;
}
.text-green-600 {
  color: #3dcc9f;
}
.text-red-600 {
  color: #ea7272;
}

/* bottom row of query container */
.bottom-container {
  display: flex;
  align-items: center;
}
/* execute */
.execute-button {
  padding: 8px 14px;
  border: 2px solid #28353e;
  border-radius: 8px;
}
.query-container .execute-button:hover {
  background-color: #754ff6;
}
.query-container .execute-button:disabled {
  background-color: #888;
  cursor: not-allowed;
}
.save-query {
  display: flex;
  align-items: center;
  margin-left: 1rem;
  gap: 1rem;
}
.save-checkbox {
  padding: 0px 0px 0px 20px;
}
.save-info {
  padding: 0px 0px 0px 10px;
  color: #a9aeb1;
}

/* Past Queries Display */
.query-catalog {
  background-color: #445560;
  border-radius: 8px;
  margin-top: 10px;
  display: flex;
}
/* Container for Queries */
.queries-container {
  width: 90%;
  margin: 20px auto;
  text-align: center;
}
/* General Layout */
.top-container {
  max-width: 100%;
  padding: 20px;
  text-align: center;
}
.cached-container {
  width: 100%;
}
.cached-title {
  font-size: 24px;
  font-weight: bold;
  color: #ede7f6;
  margin-bottom: 20px;
}
/* Query List Items */
ul {
  list-style: none;
  padding: 0;
}
/* Query Card */
.folder {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #28353e;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  transition: all 0.3s ease-in-out;
}
.folder:hover {
  background-color: #37474f;
  cursor: pointer;
}
/* Folder Header */
.folder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: large;
  font-family: "Oxanium", monospace;
}
/* Icon Button */
.icon-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%; /* Make button cover full width */
  padding: 12px 16px; /* Add padding for better click area */
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: "Oxanium", monospace;
  font-size: large;
  font-weight: 600;
  color: white;
  transition: background 0.3s ease-in-out;
}
/* Ensure full-width coverage */
.full-width {
  width: 100%;
  height: 100%;
  display: flex;
}
/* Icon & Query Text Layout */
.icon-hash {
  display: flex;
  align-items: center;
  gap: 10px;
}
/* Ensures icons align correctly */
.material-icons {
  font-size: 24px;
}
/* Ensures the info icon is at the right */
.info-icon {
  margin-left: auto;
}
/* Query Title */
.query-title {
  flex-grow: 1;
  text-align: left;
  padding-left: 10px;
  color: #ede7f6;
}
.card-panel .not-colored {
  color: #ede7f6;
}
/* Query Details (Hidden by Default) */
.specific-query {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  color: white;
}
/* Query Details Spacing */
.specific-query div {
  padding: 8px;
  border-bottom: 1px solid #444;
}
.specific-query div:last-child {
  border-bottom: none;
}
/* Query Labels */
.user-tag {
  font-weight: bold;
  color: #ede7f6;
}
/* Query Data */
.the-user {
  color: #90caf9;
  font-style: italic;
}
/* Query Sources */
.query-sources ul {
  padding-left: 20px;
}
.query-sources li {
  list-style-type: disc;
}
.query-sources a {
  color: #ffab40;
  text-decoration: none;
}
.query-sources a:hover {
  text-decoration: underline;
}

/* Displayed SPARQL query from .rq file */
.query-file {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
/* SPARQL Code Box */
.sparql-box {
  background-color: #1e1e1e;
  color: #dcdcdc;
  padding: 15px;
  border-radius: 6px;
  font-family: "Courier New", monospace;
  font-size: 14px;
  overflow-x: auto;
  max-height: 250px;
  border-left: 4px solid #754ff6;
}
/* Syntax Formatting */
.sparql-box pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
.sparql-box code {
  display: block;
  padding: 5px;
  color: #EDE7F6;
}
/* Displayed query results from .json file */
.query-results {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

/* Container for the Table */
.results-container {
  max-height: 40rem;
  min-height: 20rem;
  overflow-y: auto;
  border-radius: 5px;
  margin: 0.5rem;
  padding: 1rem;
  background-color: #28353e;
  color: #ede7f6;
}
/* Loading Spinner */
.spinner-container {
  display: flex;
  margin: 0.5rem;
  flex-direction: column;
  align-items: center;
  font-size: 16px;
  color: #754ff6;
}
.spinner {
  border: 4px solid rgba(63, 1, 117, 0.3);
  border-top: 4px solid #754ff6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Results */
/* .init-yasgui {
  display: none;
}
.yasr-container {
  width: 100%;
  min-height: 300px;
  border: 1px solid #ddd;
  background-color: #28353e;
} */

.results-header {
  font-family: "Oxanium", monospace;
  display: flex;
  align-items: center;
  font-size: 18pt;
  font-weight: 600;
  margin: 1rem;
}
.result-count {
  font-size: 16px;
  margin-left: 3rem;
}
.scroll-wrapper {
  overflow-x: auto; /* Enables horizontal scrolling if content overflows */
  width: 100%;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto; /* Ensures columns adjust dynamically */
  min-width: 100%; /* Prevents columns from shrinking too much */
  border-radius: 5px;
}
/* Header & Data Cell Styling */
.result-table th,
.result-table td {
  font-family: "Oxanium", monospace;
  padding: 12px 15px; /* More padding for better spacing */
  border: 1px solid #ede7f6;
  text-align: left;
  white-space: nowrap; /* Prevents text from wrapping */
  overflow: hidden;
  text-overflow: ellipsis; /* Adds "..." if text is too long */
  border-radius: 5px;
}
/* Header Styling */
.result-table th {
  background-color: #754ff6;
  color: EDE7F6;
  font-weight: bold;
}
/* Alternate Header colors */
.result-table th:nth-child(even) {
  background-color: #5423f6;
}
/* Alternating Row Colors */
.result-table tr:nth-child(even) {
  background-color: #445560; /* Slightly lighter shade */
}
/* Hover Effect */
.result-table tr:hover {
  background-color: #201054; /* Light blue highlight */
  cursor: pointer;
}

/* The how to use guide */
.use-guide {
  margin: 0;
}
.guide-container {
  font-family: "Oxanium", monospace;
  font-size: 16pt;
  margin: 0 0.5rem;
  padding: 0.5rem 0rem 0.5rem 0.5rem;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.guide {
  text-align: Left;
  font-size: 18pt;
  margin: 0.5rem;
}
.line {
  margin-right: 0.5rem;
}
.list-container {
  margin: 0 1.5rem;
}
.req {
  margin: 1rem 0.5rem;
  font-size: 14pt;
  list-style-type: upper-roman;
  align-items: Left;
}
</style>

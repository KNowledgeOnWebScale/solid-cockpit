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
          <button id="top-button" @click="currentView = 'newQuery'">
            New Query
          </button>
        </li>
        <li>
          <button @click="currentView = 'previousQueries', loadCache">Past Queries</button>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="query-container">
      <div v-if="currentView === 'newQuery'">
        <ul>
          <div class="top-container">
            <span>Input a New Query</span>
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
            <button class="execute-button" @click="runExecuteQuery">
              Execute Query
            </button>
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
          <!-- TODO: an alert or something here if there is a [syntax] error -->
        </ul>
      </div>

      <div v-if="currentView === 'previousQueries'">
        <ul>
          <div class="top-container">
            <span>Past Queries</span>
            <section>
              <h2>Query File</h2>
              <pre>{{ queries }}</pre>
            </section>
            <!-- <section>
              <h2>SPARQL JSON Results</h2>
              <pre>{{ formattedJsonResults }}</pre>
            </section> -->
          </div>
        </ul>
      </div>
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
  uploadSparqlJson,
  getQueriesTtl,
  QueryEntry,
  fetchQueryFileData,
  fetchSparqlJsonFileData,
  getCachedQueries,
  executeQuery,
} from "./queryPod";
import PodRegistration from "./PodRegistration.vue";
import { ThingExpectedError } from "@inrupt/solid-client";
import { ref, onMounted, computed } from "vue";

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
      ],
      possibleSources: [
        "<https://www.bgee.org/sparql/>",
        "<https://glyconnect.expasy.org/sparql>",
        "<https://hamap.expasy.org/sparql/>",
        "<https://rdf.metanetx.org/sparql/>",
        "<https://sparql.omabrowser.org/sparql>",
        "<https://sparql.orthodb.org/sparql/>",
        "<https://sparql.rhea-db.org/sparql/>",
        "<https://sparql.swisslipids.org/sparql/>",
        "<https://biosoda.unil.ch/emi/sparql/>",
        "<https://sparql.uniprot.org/sparql/>",
        "<https://query.wikidata.org/sparql>",
      ],
      currentQuery: {
        name: "",
        sources: [],
        query: "", // The current SPARQL query input
        results: "",
      },
      saveQuery: false,
      cachePath: "",
      currHash: "",
      queryFile: "",
      resultsFile: "",
      queriesCacheExists: false,
      cachedQueries: [],
      queries: [],
    };
  },
  methods: {
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
    },

    async runExecuteQuery() {
      if (this.currentQuery.query.trim() === "") {
        alert("Please enter a SPARQL query before executing.");
        return;
      }

      // Here, the app will save the query and results using a hash
      if (this.saveQuery) {
        this.cachePath = await ensureCacheContainer(this.currentPod);

        // adds query to queries.ttl
        this.currHash = await createQueriesTTL(
          this.cachePath,
          this.currentQuery.sources
        );
        // creates #hash.rq file containing the executed query
        this.queryFile = await uploadQueryFile(
          this.cachePath,
          this.currentQuery.query,
          this.currHash
        );
        // execute the query
        this.currentQuery.results = await executeQuery(this.currentQuery.query, this.currentQuery.sources)
        
        // create #hash.sparqljson file with query results
        this.resultsFile = await uploadSparqlJson(this.cachePath, this.currentQuery.results, this.currHash);
      }
    },

    // TODO: load past queries for display from connected Pod -- broken currently but not far off
    async loadCache() {
      this.queriesCacheExists = await getQueriesTtl(
        this.currentPod + "querycache/"
      );
      if (this.queriesCacheExists) {
        this.cachedQueries = await getCachedQueries(
          this.currentPod + "querycache/queries.ttl"
        );

        this.cachedQueries.forEach((query, index) => {
          this.queries.push(fetchQueryFileData(this.currentPod + "querycache/" + query.queryFile));
        });
        console.log(this.queries);

        // jsonResults.value = await fetchSparqlJsonFileData(resultsFileUrl);
        // const formattedJsonResults = computed(() => {
        //   return jsonResults.value
        //     ? JSON.stringify(jsonResults.value, null, 2)
        //     : "Loading...";
        // });
      }
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

    setTimeout(() => {
      this.getPodURL();
      // console.log(this.podURLs)
    }, 200);

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
  margin-top: 10px;
  margin-bottom: 5px;
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
}

/* Whole nav and query container */
.general-container {
  background-color: #445560;
  border-radius: 8px;
  margin-top: 10px;
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
  border-radius: 4px;
  padding: 14px 16px;
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
.query-container .top-container span {
  font-size: 18pt;
  font-weight: bold;
  padding: 0px 8px 12px 4px;
  text-decoration: none;
}
/* source designation */
.source-selection {
  display: flex;
  align-items: center;
}
.source-selection span {
  font-size: 16pt;
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

/* Past queries data */
pre {
  background-color: #f9f9f9;
  padding: 1em;
  border: 1px solid #ddd;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
section {
  margin-bottom: 1.5em;
}
</style>

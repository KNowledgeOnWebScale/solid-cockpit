<template>
  <div class="title-container">
    <span>Data Query</span>
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
          <button @click="currentView = 'previousQueries'">Past Queries</button>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="query-container">
      <div v-if="currentView === 'newQuery'">
        <ul>
          <div class="top-container">
            <span>Input a New Query</span>
            <!-- TODO: Make a dropdown of example queries here -->
            <span id="sample-queries">sample queries</span>
            <v-dropdown>

            </v-dropdown>
          </div>
          <!-- SPARQL Query input box -->
          <!-- Source Designation -->
          <!-- TODO: offer a way to specify your own URL (Solid pod or SPARQL endpoint) -->
          <div class="source-selection">
            <span>Datasources: </span>
            <v-autocomplete
              class="autocomplete"
              v-model="sources"
              :items="possibleSources"
              label="choose >=1 source(s)"
              variant="plain"
              chips
              closable-chips="true"
              hide-details
              hide-no-data
              hide-selected
              multiple
              single-line
              clearable="true"
            ></v-autocomplete>
          </div>

          <!-- Actual query -->
          <li>
            <textarea
              ref="codeEditor"
              v-model="queryInput"
              placeholder="Enter your SPARQL query here..."
              class="input-box"
            ></textarea>
          </li>
          <li>
            <p
              class="valid-text"
              :class="
                isValidSPARQL(queryInput) ? 'text-green-600' : 'text-red-600'
              "
            >
              {{
                isValidSPARQL(queryInput)
                  ? "Looks like a valid SPARQL query."
                  : "Invalid SPARQL query. Please check syntax."
              }}
            </p>
          </li>
          <!-- execute query -->
          <div class="bottom-container">
            <button class="execute-button" @click="executeQuery">
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
              <v-tooltip
                activator="parent"
                location="right"
              >Check this box if you would like to save the query and any results to your pod</v-tooltip>
            </div>
          </div>
          <!-- TODO: an alert or something here if there is a [syntax] error -->
        </ul>
      </div>

      <div v-if="currentView === 'previousQueries'">
        <ul>
          <div class="top-container">
            <span>Past Queries</span>
            <!-- TODO: Display past queries here -->
          </div>
          <li
            v-for="(query, index) in previousQueries"
            :key="index"
            class="mb-2 border-b pb-2"
          >
            <p>{{ query }}</p>
            <button
              class="py-1 px-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              @click="loadQuery(query)"
            >
              Load Query
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentPod: "",
      currentView: "newQuery", // Tracks the active view: 'newQuery' or 'previousQueries'
      possibleSources: [
        "This Solid Pod", "Bgee", "GlyConnect", "HAMAP","MetaNetX", "OMA", "OrthoDB", "Rhea", 
        "SwissLipids", "UniProt", "dbgi", "neXtProt", "WikiData"
      ],
      possibleSourcesURL: {
        Bgee: "<https://www.bgee.org/sparql/>",
        GlyConnect: "<https://glyconnect.expasy.org/sparql>",
        HAMAP: "<https://hamap.expasy.org/sparql/>",
        MetaNetX: "<https://rdf.metanetx.org/sparql/>",
        OMA: "<https://sparql.omabrowser.org/sparql>",
        OrthoDB: "<https://sparql.orthodb.org/sparql/>",
        Rhea: "<https://sparql.rhea-db.org/sparql>",
        SwissLipids: "<https://sparql.swisslipids.org/sparql/>",
        UniProt: "<https://sparql.uniprot.org/sparql/>",
        dbgi: "<https://biosoda.unil.ch/emi/sparql/>",
        neXtProt: "<https://sparql.nextprot.org/sparql>",
        WikiData: "<https://query.wikidata.org/sparql>"
      },
      sources: [],
      queryInput: "", // The current SPARQL query input
      saveQuery: false,
      previousQueries: [],
    };
  },
  methods: {
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
      this.queryInput = "";
    },
    executeQuery() {
      if (this.queryInput.trim() === "") {
        alert("Please enter a SPARQL query before executing.");
        return;
      }
      alert(`Executing query: \n${this.queryInput}`);
      // Save the query to the list of previous queries
      this.previousQueries.unshift(this.queryInput);
      this.queryInput = "";
    },
    loadQuery(query) {
      this.queryInput = query;
      this.currentView = "newQuery";
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
  },
};
</script>

<style scoped>
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


</style>

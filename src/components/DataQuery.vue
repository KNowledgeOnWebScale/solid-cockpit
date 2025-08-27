<template>
  <div class="title-container">
    <span>Data Query</span>
  </div>

  <!-- delay div prevents flashing of login and pod selection box -->
  <div class="loading-spinner-container" v-if="delay">
    <div class="spinner"></div>
    <span class="loading-text">Checking login status ...</span>
  </div>

  <div class="delay-placeholder" v-if="!delay">
    <div v-if="!successfulLogin" class="login-container">
      <pod-login @login-success="handleLoginStatus" />
    </div>

    <div v-if="successfulLogin" class="pod-chooseContainer">
      <PodRegistration @pod-selected="handlePodSelected" />
    </div>
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
            @click="previousQueriesView"
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
          <div id="yasgui-container">
            <!-- <sparql-editor
              endpoint="https://www.bgee.org/sparql/,https://sparql.uniprot.org/sparql/"
              examples-repo-add-url="https://github.com/sib-swiss/sparql-examples/new/master/examples/Bgee"
              examples-on-main-page="10"
              style="--btn-color: white; --btn-bg-color: #00709b"
            ></sparql-editor> -->
          </div>

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
              v-if="!loading"
              class="execute-button"
              @click="runExecuteQuery"
              :disabled="loading"
            >
              Execute Query
            </button>
            <button
              v-if="loading"
              class="execute-button"
              @click="cancelQuery"
              :disabled="!loading"
            >
              Cancel Query
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
                <v-tooltip class="tool-tip" activator="parent" location="bottom"
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
          Cache... <br />(simply click the "select pod" button above.)</span
        >
        <ul>
          <div class="cached-container" v-if="currentPod != ''">
            <span class="cached-title">Cached Queries</span>

            <!-- Iterates over list queries in Query Cache -->
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
                      <span>{{ query.hash }}</span>
                    </div>
                    <i class="material-icons not-colored info-icon">
                      {{
                        showQueryIndex === index
                          ? "keyboard_arrow_down info"
                          : "chevron_right info"
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
                    <button
                      @click="fetchQuery(cachedQueries[index].hash)"
                      class="drop-down"
                    >
                      <div class="query-file-info">
                        <span class="the-user"
                          ><i>{{ query.queryFile }}</i></span
                        >
                        <i class="material-icons not-colored">{{
                          showRetrievedQuery
                            ? "keyboard_arrow_down"
                            : "chevron_right"
                        }}</i>
                      </div>
                    </button>

                    <div
                      class="sparql-box"
                      v-if="showRetrievedQuery && retrievedQuery != null"
                    >
                      <pre><code>{{ retrievedQuery }}</code></pre>
                    </div>
                  </div>

                  <!-- The results of the Query -->
                  <div class="query-results-container">
                    <span class="user-tag">Results File: <br /></span>
                    <div class="query-results">
                      <button
                        @click="fetchResults(cachedQueries[index].hash)"
                        class="drop-down"
                      >
                        <span class="the-user"
                          ><i>{{ query.resultsFile }}</i></span
                        >
                        <i class="material-icons not-colored">{{
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
                    <div
                      class="null-results"
                      v-if="showRetrievedResults && retrievedResults == null"
                    >
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

                  <!-- TODO: Need top level for the whole query cache -->
                  <!-- TODO: Then a lower level for each query hash -->
                  <!-- For sharing cached query data -->
                  <div class="sharing-prompt">
                    <button
                      @click="toggleShared(), getSpecificCacheAclData(url)"
                      class="sharing-button full-width"
                    >
                      <span>Resource Sharing Information</span>
                      <i class="material-icons not-colored info-icon">
                        {{
                          showSharing
                            ? "keyboard_arrow_down share"
                            : "chevron_right share"
                        }}</i
                      >
                    </button>
                    <div
                      id="permissionsBox"
                      class="form-container"
                      v-if="showSharing"
                    >
                      <!-- For the case that a container/resource has an existing .acl -->
                      <div id="aclExists" v-if="hasAcl !== null">
                        <div>
                          <!-- <span id="permissionsInstructions"
                            >Current Access Rights
                            <button
                              @click="getSpecificAclData(url)"
                              class="icon-button right"
                            >
                              <i class="material-icons not-colored right"
                                >refresh</i
                              >
                              <v-tooltip
                                class="tool-tip"
                                activator="parent"
                                location="end"
                                >Refresh access rights
                              </v-tooltip>
                            </button></span
                          > -->
                        </div>
                        <div id="currentPermissions">
                          <li
                            class="access-item"
                            v-for="(agent, inde) in hasAccess"
                            :key="inde"
                          >
                            <div class="user-id">
                              <div class="left-content">
                                <span class="user-tag">Agent:<br /></span>
                                <span class="the-user"
                                  ><i>{{ inde }}</i>
                                </span>
                              </div>
                              <!-- <button
                                @click="copyText(inde.toString())"
                                class="icon-button right"
                              > -->
                              <i class="material-icons not-colored right"
                                >content_copy</i
                              >
                              <v-tooltip
                                class="tool-tip"
                                activator="parent"
                                location="left"
                                >Copy WebID to clipboard
                              </v-tooltip>
                              <!-- </button> -->
                            </div>
                            <span class="permissions-tag"
                              >Permissions:<br
                            /></span>
                            <ul
                              v-for="(permission, ind) in hasAccess[inde]"
                              :key="ind"
                            >
                              <div
                                class="permission-item"
                                :class="{
                                  'true-color': permission,
                                  'false-color': !permission,
                                }"
                              >
                                <span class="permission-label">{{ ind }}</span>
                                <span class="permission-value">
                                  <i>({{ permission }})</i>
                                  <i class="material-icons right">
                                    {{ permission ? "check" : "dangerous" }}
                                  </i>
                                </span>
                              </div>
                            </ul>
                          </li>
                          <span id="withPermissions"> </span>
                        </div>
                      </div>

                      <!-- For the case the query cache does not have an existing .acl -->
                      <div
                        id="noAclExists"
                        v-if="hasAcl === null && !cannotMakeAcl"
                      >
                        <v-alert
                          type="warning"
                          title="There is no .acl (permissions file) for the query cache"
                          >Click the button below to create and initalize
                          one.</v-alert
                        >
                        <button @click="makeNewAcl(url)" class="new-acl">
                          <span>Generate .acl</span>
                        </button>
                      </div>

                      <!-- For the case that an .acl connot be initialized (e.g. for a file) -->
                      <div
                        id="noAclMade"
                        v-if="hasAcl === null && cannotMakeAcl"
                      >
                        <v-alert
                          type="error"
                          title="Cannot initialize an .acl for this item"
                          closable
                          >The .acl of the container this file is located within
                          will be used for access controls.</v-alert
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </ul>
      </div>
    </div>
  </div>

  <div class="results-container" v-if="loading || (currentQuery.output != null && typeof currentQuery.output !== 'string')">
    <!-- Loading Spinner -->
    <div v-if="loading" class="spinner-container">
      <div class="spinner"></div>
      <p>Loading query results...</p>
    </div>

    <!-- Display Query Cache Informaton -->
    <div
      class="cache-header"
      v-if="
        !loading &&
        currentQuery.output != null &&
        currentQuery.output.provenanceOutput != null
      "
    >
      <div class="cached-container">
        <div class="folder-header">
          <button
            @click="toggleResultsQuery(currentCachedQueryHash)"
            class="icon-button full-width"
          >
            <span
              >Executed query is <i>
              {{ provType(currentQuery.output.provenanceOutput.algorithm) }} </i>
              cached query:</span
            >
            <div class="query-hash">
              <span>{{ currentCachedQueryHash }}</span>
            </div>
            <i class="querycache-icon material-icons not-colored info-icon">
              {{
                showResultQuery
                  ? "keyboard_arrow_down info"
                  : "chevron_right info"
              }}</i
            >
          </button>
        </div>
        <div class="specific-query" v-if="showResultQuery">
          <!-- When query was executed -->
          <div class="query-time">
            <span class="user-tag">Date Executed: <br /></span>
            <span class="the-user"
              ><i>{{ cachedQueries[cachedQueryIndex].created }}</i></span
            >
          </div>

          <!-- The SPARQL query that was executed -->
          <div class="query-file-container">
            <span class="user-tag">Query File: <br /></span>
            <button
              @click="fetchQuery(currentCachedQueryHash)"
              class="drop-down"
            >
              <div class="query-file-info">
                <span class="the-user"
                  ><i>{{ cachedQueries[cachedQueryIndex].queryFile }}</i></span
                >
                <i class="material-icons not-colored">{{
                  showRetrievedQuery ? "keyboard_arrow_down" : "chevron_right"
                }}</i>
              </div>
            </button>

            <!-- Query text -->
            <div
              class="sparql-box"
              v-if="showRetrievedQuery && retrievedQuery != null"
            >
              <pre><code>{{ retrievedQuery }}</code></pre>
            </div>
          </div>

          <!-- Query sources -->
          <div class="query-sources">
            <span class="user-tag">Sources: <br /></span>
            <ul>
              <li
                v-for="(source, i) in cachedQueries[cachedQueryIndex]
                  .sourceUrls"
                :key="i"
              >
                <a>{{ source }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Display Result Count -->
    <div class="results-header" v-if="!loading && (currentQuery.output != null && typeof currentQuery.output !== 'string')">
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

<script lang="ts">
// import YASGUI from '@triply/yasgui/build/yasgui.min.js'
import { isLoggedin } from "./login";
import {
  ensureCacheContainer,
  createQueriesTTL,
  uploadQueryFile,
  uploadResults,
  getStoredTtl,
  fetchQueryFileData,
  getCachedQueries,
  executeQueryWithPodConnected,
  fetchSparqlJsonFileData,
  stopQuery,
  CachedQuery,
  CacheOutput,
  cleanSourcesUrls,
} from "./queryPod";
import {
  fetchPermissionsData,
  fetchAclAgents,
  fetchPublicAccess,
} from "./getData";
import {
  changeAclAgent,
  changeAclPublic,
  checkUrl,
  generateAcl,
  createInboxWithACL,
  updateSharedWithMe,
  updateSharedWithOthers,
} from "./privacyEdit";
import PodLogin from "./PodLogin.vue";
import PodRegistration from "./PodRegistration.vue";
import { toRaw } from "vue";

export default {
  components: {
    PodLogin,
    PodRegistration,
  },
  // TODO: Integrate demonstrators + example queries
  data() {
    return {
      successfulLogin: false as boolean,
      currentPod: "" as string,
      currentView: "newQuery" as "newQuery" | "previousQueries",
      exampleQueries: [
        {
          name: "Example 1" as string,
          sources: ["<https://sparql.rhea-db.org/sparql/>"] as string[],
          query:
            "SELECT DISTINCT ?p WHERE {\n\t?s ?p ?o .\n}LIMIT 10" as string,
        },
        {
          name: "TRIPLE Demonstrator (WikiData)" as string,
          sources: ["<https://query.wikidata.org/sparql>"] as string[],
          query:
            'PREFIX bd: <http://www.bigdata.com/rdf#>\nPREFIX p: <http://www.wikidata.org/prop/>\nPREFIX pq: <http://www.wikidata.org/prop/qualifier/>\nPREFIX wdt: <http://www.wikidata.org/prop/direct/>\nPREFIX wd: <http://www.wikidata.org/entity/>\nPREFIX wikibase: <http://wikiba.se/ontology#>\n\nSELECT DISTINCT ?use_type ?use_typeLabel ?compound ?compoundLabel ?ec_number  ?cas_number (AVG(?ld50) AS ?avg_ld50) WHERE {\n  ?compound  wdt:P31 wd:Q113145171 ;\n    wdt:P232 ?ec_number ;\n    wdt:P231 ?cas_number ;\n    wdt:P2240 ?ld50 ; # toxicity level - NOTE: not many data points have this info (only 9 results in total)\n    wdt:P366 ?use_type .\n  ?use_type  wdt:P279* wd:Q131656 .\n  ?compound p:P2240 ?ref.\n  ?ref pq:P636 wd:Q285166 .\n  ?rats wdt:P279 wd:Q184224 .\n  ?ref  pq:P689|pq:P2352 ?rats .\n\n  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en". } # Helps get the label in your language, if not, then default for all languages, then en language\n} GROUP BY ?use_type ?use_typeLabel ?compound ?compoundLabel ?ec_number ?cas_number ORDER BY ?avg_ld50 # rank by toxicity' as string,
        },
        {
          name: "TRIPLE Demonstrator (Rhea)" as string,
          sources: ["<https://sparql.rhea-db.org/sparql>"] as string[],
          query:
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX rh: <http://rdf.rhea-db.org/>\n\nSELECT DISTINCT ?chebi ?rhea ?equation ?uniprot WHERE {\n  VALUES ?chebi { <http://purl.obolibrary.org/obo/CHEBI_15930> } # from IDSM\n  ?rhea rdfs:subClassOf rh:Reaction .\n  ?rhea rh:equation ?equation .\n  ?rhea rh:side/rh:contains/rh:compound ?compound .\n  #\n  # the ChEBI can be used either as a small molecule, the reactive part of a macromolecule or as a polymer.\n  #\n  ?compound (rh:chebi|(rh:reactivePart/rh:chebi)|(rh:underlyingChebi/rh:chebi)) ?chebi . # ?chebi comes from IDSM higher\n}" as string,
        },
        {
          name: "Rhea 13" as string,
          sources: ["<https://sparql.rhea-db.org/sparql>"] as string[],
          query:
            "PREFIX rh: <http://rdf.rhea-db.org/>\nPREFIX taxon: <http://purl.uniprot.org/taxonomy/>\nPREFIX up: <http://purl.uniprot.org/core/>\nSELECT ?uniprot ?mnemo ?rhea ?accession ?equation \nWHERE {\n\tSERVICE <https://sparql.uniprot.org/sparql> {\n\t\tVALUES (?taxid) { (taxon:83333) }\n\t\tGRAPH <http://sparql.uniprot.org/uniprot> {\n\t\t\t?uniprot up:reviewed true .\n\t\t\t?uniprot up:mnemonic ?mnemo .\n\t\t\t?uniprot up:organism ?taxid .\n\t\t\t?uniprot up:annotation/up:catalyticActivity/up:catalyzedReaction ?rhea .\n\t\t}\n\t}\n\t?rhea rh:accession ?accession .\n\t?rhea rh:equation ?equation .\n}" as string,
        },
      ] as Array<{ name: string; sources: string[]; query: string }>,
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
      ] as string[],
      currentQuery: {
        name: "" as string,
        sources: [] as string[],
        query: "" as string,
        output: null as any,
      },
      resolvedQueryResults: {} as any,
      saveQuery: false as boolean,
      cancelRequested: false as boolean,
      abortController: null as AbortController | null,
      cachePath: "" as string,
      currHash: "" as string,
      queryFile: "" as string,
      resultsFile: "" as string,
      retrievedQuery: null as string | null,
      retrievedResults: null as any,
      showRetrievedQuery: false as boolean,
      showRetrievedResults: false as boolean,
      showQueryIndex: null as number | null,
      queriesCacheExists: false as boolean,
      inputType: "" as string,
      cachedQueries: [] as CachedQuery[],
      queries: [] as Array<any>,
      loading: false as boolean,
      delay: true as boolean,
      showSharing: false as boolean,
      hasAcl: null as any,
      cannotMakeAcl: false as boolean,
      hasAccess: {} as Record<string, any>,
      publicAccess: {} as Record<string, any>,
      currentCachedQueryHash: null as string | null,
      cacheType: "" as string,
      showResultQuery: false as boolean,
      cachedQueryIndex: null as number | null,
      worker: null as Worker | null,
    };
  },
  methods: {
    handleDelay() {
      this.delay = false;
    },
    provType(p: string) {
      return p === "equality" ? "equivalent to" : "a specialization of";
    },
    async toggleResultsQuery(hash: string) {
      if (!this.showResultQuery) {
        await this.loadCache();
        this.showResultQuery = true;
      } else {
        this.showResultQuery = false;
      }
      // keep track of current cached query's index for data fetching
      for (let i = 0; i < this.cachedQueries.length; i++) {
        if (this.cachedQueries[i].hash === hash) {
          this.cachedQueryIndex = i;
          break;
        }
      }
    },
    // details about a specific query
    toggleQuery(index: number) {
      // Reset expanded states when switching queries
      if (this.showQueryIndex !== index) {
        this.showRetrievedQuery = false;
        this.showRetrievedResults = false;
      }
      this.showQueryIndex = this.showQueryIndex === index ? null : index;
    },
    toggleShared() {
      this.showSharing = !this.showSharing;
    },
    // for the sources autocomplete list
    itemPropsSources(item: string) {
      return {
        title: item,
      };
    },
    itemPropsExampleQueries(item2: { name: string }) {
      return {
        title: item2.name,
      };
    },
    isValidSPARQL(query: string) {
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

    /* Takes in the emitted value from PodLogin.vue */
    handleLoginStatus(loginSuccess) {
      this.successfulLogin = loginSuccess;
    },
    /* Checks if user is already logged in */
    loginCheck() {
      this.successfulLogin = isLoggedin();
    },
    /* Takes in the emitted value from PodRegistration.vue */
    handlePodSelected(selectedPod) {
      this.currentPod = selectedPod;
      this.possibleSources.unshift(`<${this.currentPod}>`);
    },

    // Executes user provided query and saves it to querycache if specified
    async runExecuteQuery() {
      this.loading = true;
      this.cancelRequested = false;
      if (this.currentQuery.query.trim() === "") {
        alert("Please enter a valid SPARQL query before executing.");
        this.loading = false;
        return;
      }

      try {
        // if Save Query box is selected (pod must be connected)
        if (this.saveQuery) {
          this.cachePath = await ensureCacheContainer(this.currentPod);
          this.currentQuery.output = await executeQueryWithPodConnected(
            this.currentQuery.query,
            this.currentQuery.sources,
            this.cachePath
          );

          // If the output is a string, it means there was no matching entry in the cache
          if (typeof this.currentQuery.output === "string") {
            this.currentQuery.output = await this.executeQuery(
              this.currentQuery.query,
              this.currentQuery.sources
            );
          }

          // obtaining query cache hash if the cache contains a similar query
          if (
            this.currentQuery.output &&
            this.currentQuery.output.provenanceOutput != null
          ) {
            this.cacheType =
              this.currentQuery.output.provenanceOutput.algorithm;
            this.currentCachedQueryHash = this.getCacheEntryHash(
              this.currentQuery.output.provenanceOutput.id.value
            );
          }

          // if the result of the query was null
          if (
            !this.currentQuery.output.resultsOutput ||
            !this.currentQuery.output.resultsOutput.results
          ) {
            this.currentQuery.output.resultsOutput = {
              head: { vars: [] },
              results: { bindings: [] },
            };
          }

          // If there is not an equivalent query in cache, then add it to cache
          if (
            this.currentQuery.output.provenanceOutput.algorithm != "equivalence"
          ) {
            this.currHash = await createQueriesTTL(
              this.cachePath,
              this.currentQuery.query,
              this.currentQuery.sources
            );
            this.queryFile = await uploadQueryFile(
              this.cachePath,
              this.currentQuery.query,
              this.currHash
            );
            this.resultsFile = await uploadResults(
              this.cachePath,
              JSON.stringify(this.currentQuery.output.resultsOutput, null, 2),
              this.currHash
            );
          }
        } else {
          // If the Save Query button was not selected
          if (this.currentPod !== "") {
            // if there is a pod connected, try to use cache
            this.cachePath = await ensureCacheContainer(this.currentPod);
            this.currentQuery.output = await executeQueryWithPodConnected(
              this.currentQuery.query,
              this.currentQuery.sources,
              this.cachePath
            );

            // If the output is a string, it means there was no matching entry in the cache
            if (typeof this.currentQuery.output === "string") {
              this.currentQuery.output = await this.executeQuery(
                this.currentQuery.query,
                this.currentQuery.sources
              );
            }

          } else {
            // if there is no pod connected, use the default query execution
            this.currentQuery.output = await this.executeQuery(
              this.currentQuery.query,
              this.currentQuery.sources
            );
          }

          // try to obtain cache hash if the cache contains a similar query
          if (
            this.currentQuery.output &&
            this.currentQuery.output.provenanceOutput != null
          ) {
            this.cacheType =
              this.currentQuery.output.provenanceOutput.algorithm;
            this.currentCachedQueryHash = this.getCacheEntryHash(
              this.currentQuery.output.provenanceOutput.id.value
            );
          }

          if (
            !this.currentQuery.output.resultsOutput ||
            !this.currentQuery.output.resultsOutput.results
          ) {
            this.currentQuery.output.resultsOutput = {
              head: { vars: [] },
              results: { bindings: [] },
            };
          }

          this.resolvedQueryResults = toRaw(
            this.currentQuery.output.resultsOutput
          );
        }
      } catch (err) {
        if (this.cancelRequested) {
          console.log("Query canceled by user.");
        } else {
          console.log("Error executing query:", err);
        }
      }
      this.loading = false;
    },

    /**
     * Executes a SPARQL query over one or many SPARQL endpoints and/or Solid Pods.
     *
     * @param query The string representation of a SPARQL query to be executed.
     * @param providedSources a string[] that provides the sources for executing the specified query
     * @returns A Promise that resolves to a string of JSON results if results were found, or `null` if there were no results or an error.
     */
    async executeQuery(
      query: string,
      providedSources: string[]
    ): Promise<CacheOutput | null> {
      this.cancelRequested = false;
      const cleanedSources = cleanSourcesUrls(providedSources);

      this.worker = new Worker(new URL("./queryWorker.js", import.meta.url), {
        type: "module",
      });

      return new Promise<CacheOutput | null>((resolve, reject) => {
        this.worker!.onmessage = (e: MessageEvent) => {
          const { data } = e as { data: any };
          switch (data?.type) {
            case "result":
              this.cleanupWorker();
              resolve({
                provenanceOutput: null,
                resultsOutput: data.payload,
              });
              break;
            case "error":
              console.log("Worker error:", data.error);
              this.cleanupWorker();
              resolve(null); // or reject(data.error) if you prefer
              break;
            case "cancelled":
              this.cleanupWorker();
              resolve(null);
              break;
            default:
              // ignore unknown
              break;
          }
        };
        // for an error or cancellation
        this.worker!.onerror = (err) => {
          console.log("Worker error:", err);
          this.cancelQuery();
          reject(err);
        };
        // starts a run
        this.worker.postMessage({
          type: "run",
          query,
          sources: cleanedSources,
        });
      });
    },

    // cleans up worker after it is done or if the query is cancelled
    cleanupWorker() {
      if (this.worker) {
        this.worker.onmessage = null as any;
        this.worker.onerror = null as any;
        this.worker = null;
        this.loading = false;
      } else {
        this.loading = false;
      }
    },

    // test to see if worker is running
    isWorkerRunning(): boolean {
      return !!this.worker; // true if we haven't cleaned it up yet
    },

    // cancels the currently running query
    cancelQuery() {
      this.cancelRequested = true;
      // to cancel a query being run in a worker thread
      if (this.worker) {
        try {
          const w = this.worker;
          // 1) ask the worker to stop cooperatively
          this.worker.postMessage({ type: "cancel" });
          // 2) fallback: if the same worker is still around after 1500ms, hard terminate
          if (this.worker === w) {
            w.terminate();
            this.cleanupWorker();
          }
        } catch {
          // if posting failed, just hard kill
          this.worker.terminate();
          this.cleanupWorker();
        }
      }

      // TODO: cancellation of cache query process (in future)
      // if (
      //   this.activeBindingStream &&
      //   typeof this.activeBindingStream.destroy === "function"
      // ) {
      //   this.activeBindingStream.destroy();
      //   this.activeBindingStream = null;
      // }
      // if (this.abortController) {
      //   this.abortController.abort();
      // }
    },


    // TODO: Sharing of query results (maybe just the whole container?)

    async previousQueriesView() {
      this.currentView = "previousQueries";
      await this.loadCache();
    },
    async loadCache() {
      this.queriesCacheExists = await getStoredTtl(
        this.currentPod + "querycache/queries.ttl"
      );
      if (this.queriesCacheExists) {
        try {
          this.cachedQueries = await getCachedQueries(
            this.currentPod + "querycache/queries.ttl"
          );
        } catch (err) {
          console.log("Error fetching queries:", err);
        }
      }
    },
    getCacheEntryHash(prov: string) {
      return prov.split("#")[1];
    },
    togglRetrievedResults() {
      this.showRetrievedResults = !this.showRetrievedResults;
    },
    togglRetrievedQuery() {
      this.showRetrievedQuery = !this.showRetrievedQuery;
    },
    // retrieves cached results for display
    async fetchResults(hash: string) {
      const retrievedQuery = await fetchSparqlJsonFileData(
        `${this.currentPod}querycache/${hash}.json`
      );
      this.retrievedResults = toRaw(retrievedQuery);
      this.togglRetrievedResults();
    },
    // retrieves cached query for display
    async fetchQuery(hash: string) {
      this.retrievedQuery = await fetchQueryFileData(
        `${this.currentPod}querycache/${hash}.rq`
      );
      this.togglRetrievedQuery();
    },

    /**
     * Obtains a list of agents that have access to the designated resource or container
     *
     * @param path the URL of the resource or container for which access rights are to be displayed
     */
    async getSpecificCacheAclData() {
      const cacheUrl = this.currentPod + "querycache/";
      this.hasAcl = await fetchPermissionsData(cacheUrl); // value is either .acl obj OR null (if .acl does not exist)
      if (this.hasAcl !== null) {
        this.hasAccess = await fetchAclAgents(cacheUrl);
        this.publicAccess = await fetchPublicAccess(cacheUrl);
        this.hasAccess = {
          Public: this.publicAccess,
          ...this.hasAccess,
        };
        this.cannotMakeAcl = false;
      }
    },
    /**
     * Obtains a list of agents that have access to the designated resource or container
     *
     * @param path the URL of the resource or container for which access rights are to be displayed
     */
    async getSpecificQueryAclData(queryHash: string) {
      const queryUrl = this.currentPod + "querycache/" + queryHash;
      this.hasAcl = await fetchPermissionsData(queryUrl); // value is either .acl obj OR null (if .acl does not exist)
      if (this.hasAcl !== null) {
        this.hasAccess = await fetchAclAgents(queryUrl);
        this.publicAccess = await fetchPublicAccess(queryUrl);
        this.hasAccess = {
          Public: this.publicAccess,
          ...this.hasAccess,
        };
        this.cannotMakeAcl = false;
      }
    },
    /**
     * Makes a new .acl file for containers or resources that do not have a vaild .acl
     *
     * @param path the URL of the resource or container for which an .acl is to be made
     */
    async makeNewAcl() {
      const cacheUrl = this.currentPod + "querycache/";
      try {
        await generateAcl(cacheUrl, this.webId);
        await this.getSpecificCacheAclData();
      } catch (err) {
        console.error(err);
        this.cannotMakeAcl = true;
      }
    },
  },
  beforeUnmount() {
    if (this.worker) this.worker.terminate();
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
      this.loginCheck();
    }, 500); // Delay of 2 seconds
    setTimeout(() => {
      this.handleDelay();
    }, 520); // Delay of 2 seconds

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
.tool-tip {
  font-family: "Oxanium", monospace;
}

/* Title bar */
.title-container {
  background-color: #445560;
  border-radius: 8px;
  margin: 0.5rem 0.5rem 0 0.5rem;
}
.title-container span {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  padding-left: 20px;
  padding-right: 20px;
}
.login-container {
  margin: 0 0.25rem 0.25rem 0.25rem;
}

/* loading spinner for login-check */
.loading-spinner-container {
  display: flex;
  background-color: #445560;
  border-radius: 6px;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  margin: 0.5rem 0.5rem 0 0.5rem;
  padding: 1rem;
  margin-left: 8px;
}
.loading-text {
  font-family: "Oxanium", monospace;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  background: #445560;
  border-radius: 8px;
  padding: 0 0 0 1rem;
  margin: 0.5rem 0.5rem 0 0.5rem;
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
.cancel-query {
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
/* message in past queries when no pod is connected */
.no-pod {
  display: block;
  text-align: center;
  font-size: 1.2rem;
  padding: 2rem;
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
  justify-content: space-between;
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
.query-file-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.drop-down {
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
  color: #ede7f6;
}
/* Displayed query results from .json file */
.query-results {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

/* Container for the Table */
.results-container {
  max-height: 60rem;
  min-height: 20rem;
  overflow-y: auto;
  border-radius: 6px;
  margin: 0 0.5rem 0.5rem 0.5rem;
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
.cache-header {
  font-family: "Oxanium", monospace;
  display: flex;
  align-items: center;
  background-color: #444;
  border-radius: 6px;
}
.query-hash {
  display: flex;
  margin-right: auto;
  margin-left: 2rem;
  color: #90caf9;
  font-style: italic;
  font-size: 16pt;
}
.querycache-icon {
  margin-left: 2rem;
}
.results-header {
  font-family: "Oxanium", monospace;
  display: flex;
  align-items: center;
  font-size: 18pt;
  font-weight: 600;
  margin: 1rem;
}
.result-count {
  font-size: 14px;
  margin-left: 3rem;
}
.scroll-wrapper {
  overflow-x: auto; /* Enables horizontal scrolling if content overflows */
  width: 100%;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: auto; /* Ensures columns adjust dynamically */
  border-radius: 5px;
}
/* Header & Data Cell Styling */
.result-table th,
.result-table td {
  font-family: "Oxanium", monospace;
  padding: 12px 15px; /* More padding for better spacing */
  border-radius: 5px;
  text-align: left;
  white-space: nowrap; /* Prevents text from wrapping */
  overflow: hidden;
  text-overflow: ellipsis; /* Adds "..." if text is too long */
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
.result-table tr:nth-child(odd) {
  background-color: #2c363d; /* Slightly lighter shade */
}
/* Hover Effect */
.result-table tr:hover {
  background-color: #201054; /* Light blue highlight */
  cursor: pointer;
}

/* Sharing of a cached query */
.sharing-prompt {
  background-color: #0d1115;
  border-radius: 8px;
  margin-top: 0.25rem;
}
.sharing-prompt:hover {
  background-color: #764ff633;
  transition: background-color 0.2s ease;
}
.sharing-button {
  padding: 0.25rem 0.25rem 0.25rem 0;
  font-weight: 600;
}

/* button that generates a new acl (if one does not already exist) */
.new-acl {
  padding: 0.25rem;
  margin-top: 5px;
  background-color: #ede7f6;
  color: #445560;
  border: none;
  cursor: pointer;
  font-family: "Oxanium", monospace;
  font-size: large;
  border-radius: 6px;
}
.new-acl:hover {
  background-color: #a9a7ad;
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

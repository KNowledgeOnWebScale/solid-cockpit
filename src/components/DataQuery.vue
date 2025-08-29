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
      <div v-show="currentView === 'newQuery'">
        <ul>
          <div class="top-container">
            <span class="top-label">Input a New Query</span>

            <!-- Example Queries -->
            <!-- TODO: Add more example queries here -->
            <div class="example-dropdown">
              <v-select
                class="example-queries"
                :item-props="itemPropsExampleQueries"
                :items="exampleQueries"
                v-model="selectedExample"
                @update:modelValue="onSelectExample"
                density="compact"
                rounded
                flat
                label="Sample Queries"
              ></v-select>
            </div>
          </div>

          <!-- Source Designation -->
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
          <div id="yasqe-container"></div>

          <!-- execute query -->
          <div class="bottom-container">
            <button
              v-show="!loading"
              class="execute-button"
              @click="runExecuteQuery"
              :disabled="loading"
            >
              Execute Query
            </button>
            <button
              v-show="loading"
              class="execute-button"
              @click="cancelQuery"
              :disabled="!loading"
            >
              Cancel Query
            </button>

            <div class="save-query" v-show="currentPod !== ''">
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

            <div class="sparql-guide">
              <button
                v-show="currentQuery.query != ''"
                class="clear-button"
                @click="clearQuery"
                :disabled="loading"
              >
                Clear Query
              </button>

              <v-tooltip text="SPARQL query writing guide" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    aria-label="Open SPARQL query writing guide"
                    href="https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial"
                    target="_blank"
                    rel="noopener"
                  >
                    <v-icon>mdi-help-circle</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </div>
          </div>
          <!-- TODO: an alert or something here if there is a [syntax] error -->
        </ul>
      </div>

      <div v-if="currentView === 'previousQueries'">
        <span class="no-pod" v-if="currentPod == ''"
          >Please connect your pod if you wish to look at your Query Cache...
          <br />(simply click the "select pod" button above.)</span
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
                <div class="specific-query" v-show="showQueryIndex === index">
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
                      @click="toggleShared(), getSpecificCacheAclData()"
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
                        <button @click="makeNewAcl()" class="new-acl">
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

  <div v-show="currentView != 'previousQueries'">
    <div
      class="results-container"
      v-if="
        loading ||
        (currentQuery.output != null && typeof currentQuery.output !== 'string')
      "
    >
      <!-- Loading Spinner -->
      <div v-if="loading" class="spinner-container">
        <div class="spinner"></div>
        <p>Loading query results...</p>
      </div>

      <div class="results-text">
        <span class="top-label" v-show="!loading">Query results</span>
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
                >Executed query is
                <i>
                  {{ provType(currentQuery.output.provenanceOutput.algorithm) }}
                </i>
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
                    ><i>{{
                      cachedQueries[cachedQueryIndex].queryFile
                    }}</i></span
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

      <div class="table-container" v-show="!loading && resultsForYasr != null">
        <div id="yasr-container"></div>
      </div>
    </div>
  </div>
  <!-- Guide for file uploading -->
  <div class="use-guide">
    <DataQueryGuide />
  </div>
</template>

<script lang="ts">
import Yasqe from "@triply/yasqe";
import "@triply/yasqe/build/yasqe.min.css";
import Yasr from "@triply/yasr";
import "@triply/yasr/build/yasr.min.css";
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
  QueryResultJson,
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
import DataQueryGuide from "./Guides/DataQueryGuide.vue";
import { toRaw, shallowRef } from "vue";

export default {
  components: {
    PodLogin,
    PodRegistration,
    DataQueryGuide,
  },
  // TODO: Integrate demonstrators + example queries
  data() {
    return {
      yasqe: shallowRef<Yasqe | null>(null),
      yasr: shallowRef<Yasr | null>(null),
      resultsForYasr: null as QueryResultJson | null,
      successfulLogin: false as boolean,
      currentPod: "" as string,
      currentView: "newQuery" as "newQuery" | "previousQueries",
      selectedExample: null as any,
      loadExampleQuery: false as boolean,
      exampleQueries: [] as Array<{
        name: string;
        sources: string[];
        query: string;
      }>,
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
    // For selecting an example query
    itemPropsExampleQueries(item2: { name: string }) {
      return {
        title: item2.name,
      };
    },
    // loads example queries from the demonstrator folder
    async loadExampleQueries() {
      const demonstratorFiles = import.meta.glob("../../demonstrator/*.rq", {
        query: "?raw",
        import: "default",
      });
      const queries = [];

      for (const path in demonstratorFiles) {
        const content = await demonstratorFiles[path]();
        const lines = content.split("\n");
        const name = path.split("/").pop()?.replace(".rq", "") || "";

        let sources: string[] = [];
        const sourceLine = lines.find((line) =>
          line.startsWith("# Datasources:")
        );
        if (sourceLine) {
          sources = sourceLine
            .replace("# Datasources:", "")
            .trim()
            .split(",")
            .map((s) => `<${s.trim()}>`);
        }

        const query = lines
          .filter((line) => !line.startsWith("# Datasources:"))
          .join("\n")
          .trim();

        queries.push({ name, sources, query });
      }
      this.exampleQueries = queries;
    },
    // displays example query in YASQUE
    onSelectExample(ex: any) {
      if (!this.selectedExample || !this.yasqe) return;

      if (ex && Array.isArray(ex.sources)) {
        this.currentQuery.sources = ex.sources;
      }

      const y = this.yasqe;
      y.setValue(ex.query || "");
      this.currentQuery.query = y.getValue();
      y.setCursor({ line: 0, ch: 0 });
      y.focus();
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

          // pass found results to YASR (with save query selected)
          this.resultsForYasr = this.currentQuery.output.resultsOutput;

          // If there is NOT an equivalent query in cache, then add it to cache
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
          // pass found results to YASR (if save query was not selected)
          this.resultsForYasr = this.currentQuery.output.resultsOutput;
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
    // Resets the currentQuery object to its initial state
    clearQuery() {
      this.currentQuery = {
        name: "",
        sources: [],
        query: "",
        output: null,
      };
      if (this.yasqe) {
        this.yasqe.setValue("");
      }
      this.selectedExample = null;
      this.resultsForYasr = null;
    },

    // TODO: FIX THIS MESS -- Display Result using YASR
    // initializes the YASR instance
    initYasr() {
      const parent = document.getElementById("yasr-container");
      if (this.yasr) parent.replaceChildren();
      this.yasr = new Yasr(parent, {
        pluginOrder: ["table", "response"],
        defaultPlugin: "table",
      });
    },
    /**
     * Render any SPARQL JSON result (SELECT/ASK) into YASR
     * `json` must follow the SPARQL Results JSON spec (head/results/boolean).
     */
    renderYasrFromJson(json: QueryResultJson) {
      this.initYasr();
      if (!this.yasr) return;

      const prefixes = this.extractPrefixesFromQuery(this.currentQuery.query);
      this.yasr.setResponse(
        {
          data: json,
          contentType: "application/sparql-results+json",
        },
        prefixes
      );
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
      const retrievedQueryResults = await fetchSparqlJsonFileData(
        `${this.currentPod}querycache/${hash}.json`
      );
      this.retrievedResults = toRaw(retrievedQueryResults);
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
    extractPrefixesFromQuery(query: string): { [key: string]: string } {
      const prefixes: { [key: string]: string } = {};
      const regex = /PREFIX\s+([a-zA-Z0-9_-]+):\s*<([^>]+)>/gi;
      let match;
      while ((match = regex.exec(query)) !== null) {
        if (match[1] && match[2]) {
          prefixes[match[1]] = match[2];
        }
      }
      return prefixes;
    },
  },
  watch: {
    currentQuery: {
      handler(newQuery) {
        this.$nextTick(() => {
          if (this.yasqe && this.yasqe.getValue() !== newQuery.query) {
            this.yasqe.setValue(newQuery.query);
          }
        });
      },
      deep: true,
    },
    resultsForYasr: {
      handler(newResults) {
        if (newResults && newResults.results && !this.loading) {
          this.$nextTick(() => {
            this.renderYasrFromJson(newResults);
          });
        }
      },
      deep: true,
    },
  },
  beforeUnmount() {
    if (this.worker) this.worker.terminate();
    if (this.yasqe) this.yasqe.destroy();
    if (this.yasr && (this.yasr as any).destroy) (this.yasr as any).destroy();
  },
  mounted() {
    this.loadExampleQueries();
    this.yasqe = new Yasqe(document.getElementById("yasqe-container")!, {
      showQueryButton: false,
    });
    this.yasqe.setValue(this.currentQuery.query);

    this.yasqe.on("change", (instance) => {
      this.currentQuery.query = instance.getValue();
    });

    setTimeout(() => {
      this.loginCheck();
    }, 500);
    setTimeout(() => {
      this.handleDelay();
    }, 520);
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
  margin: 0.5rem 0.25rem 0 0.25rem;
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
  padding: 0.5rem 1rem;
  height: fit-content;
  width: 100%;
  font-family: "Oxanium", monospace;
}

.example-dropdown {
  min-width: 20dvw;
}
.query-container ul {
  list-style-type: none;
  height: 100%;
  overflow: auto;
}
.query-container .top-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.example-queries {
  margin-left: auto;
  max-width: 40dvw;
  margin: 0.5rem 0 1rem 0;
}
.example-queries :deep(.v-input__details) {
  display: none;
}
.top-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.top-container .top-label span {
  display: flex;
  align-items: center;
  padding: 0;
}
.query-container .top-container span {
  font-size: 18pt;
  font-weight: bold;
  padding: 0px 0.5rem 0rem 0.5rem;
  text-decoration: none;
}
/* Query Container Customizations */
#yasqe-container {
  border: 3px solid #1e1e1e;
  border-radius: 8px;
  margin-bottom: 1rem;
}
#yasqe-container :deep(.CodeMirror-gutters) {
  background-color: #1e1e1e;
}
#yasqe-container :deep(.resizeWrapper) {
  background-color: #1e1e1e;
}
#yasqe-container :deep(.CodeMirror) {
  background-color: #28353e;
  border: 1px solid #1e1e1e;
  color: #ede7f6;
}
#yasqe-container :deep(.CodeMirror-linenumber) {
  padding: 0;
}
#yasqe-container :deep(.notification.notif_property) {
  background-color: #28353e;
  padding: 0;
  color: #a9a7ad;
}
#yasqe-container :deep(.notification.active) {
  background-color: #28353e;
  padding: 0;
  color: #a9a7ad;
}
#yasqe-container :deep(.yasqe_buttons) {
  display: none;
}
/* TODO: Change colors to look nicer */
#yasqe-container :deep(.cm-keyword) {
  color: #c792ea; /* Example: purple for keywords like SELECT, WHERE */
}
#yasqe-container :deep(.cm-atom) {
  color: #f78c6c; /* Example: orange for atoms like 'a' */
}
#yasqe-container :deep(.cm-variable-2) {
  color: #82aaff; /* Example: blue for variables like ?s */
}
#yasqe-container :deep(.cm-string) {
  color: #c3e88d; /* Example: green for string literals */
}
#yasqe-container :deep(.cm-string-2) {
  color: #ff5370; /* Example: red for IRI's like <http://...> */
}
#yasqe-container :deep(.cm-variable-3) {
  color: #a0fa87; /* Example: red for IRI's like <http://...> */
}
#yasqe-container :deep(.cm-number) {
  color: #ede7f6; /* Example: red for IRI's like <http://...> */
}
#yasqe-container :deep(.cm-comment) {
  color: #a9a7ad; /* Example: grey for comments */
}
#yasqe-container :deep(.cm-operator) {
  color: #89ddff; /* Example: light blue for operators */
}
#yasqe-container :deep(.cm-meta) {
  color: #ffcb6b; /* Example: yellow for PREFIX */
}
#yasqe-container :deep(.cm-matchhighlight) {
  background-color: #5f5f5f; /* Example: yellow for PREFIX */
}
#yasqe-container :deep(.CodeMirror-cursor) {
  border-left: 1px solid #ffcc00; /* Example: yellow cursor */
}
#yasqe-container :deep(.CodeMirror-selected) {
  background: #545454; /* Example: dark grey for selection */
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
  padding: 4px 8px 4px 8px;
}
.source-selection .autocomplete {
  padding: 0;
}
.source-selection :deep(.v-field__input) {
  padding: 0 !important;
}
.source-selection :deep(.v-field__clearable) {
  padding: 0 !important;
  margin: auto;
}
.source-selection :deep(.v-field__append-inner) {
  padding: 0 !important;
  margin: auto;
}
.source-selection :deep(.v-field__field label) {
  display: none;
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
.sparql-guide {
  padding-left: 0.5rem;
  margin-left: auto;
}
.clear-button {
  padding: 8px 14px;
  margin-right: 1rem;
  border: 2px solid #28353e;
  border-radius: 8px;
}
.query-container .clear-button:hover {
  background-color: #ff7f7fbb;
}
.query-container .clear-button:disabled {
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
  display: flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
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
  min-height: 10rem;
  overflow-y: auto;
  border-radius: 6px;
  margin: 0 0.5rem 0.5rem 0.5rem;
  padding: 1rem;
  background-color: #28353e;
  color: #ede7f6;
  scrollbar-color: #a9a7ad #1e1e1e;
  scrollbar-width: thin;
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
.results-container .results-text {
  font-size: 18pt;
  font-weight: bold;
  font-family: "Oxanium", monospace;
  padding: 0 0 0.5rem 0.5rem;
}

/* YASR Results Display Customizations */
#yasr-container :deep(.yasr) {
  font-family: "Oxanium", monospace;
  background-color: #1e1e1e;
  color: #ede7f6 !important;
  border-radius: 8px;
  padding: 0;
  margin-top: 0.5rem;
  border: 2px solid #1e1e1e;
}
#yasr-container :deep(.grip-container) {
  padding-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
}
/* TODO: Fix wrapping behavior here */
#yasr-container :deep(.dataTable) {
  border-radius: 6px;
  flex-wrap: wrap;
}
/* Header with plugin tabs */
#yasr-container :deep(.yasr_header) {
  padding: 0 0.5rem;
  border-bottom: none;
}
#yasr-container :deep(.yasr_header) {
  padding: 0 0.5rem;
  border-bottom: none;
}
#yasr-container :deep(.yasr_btn) {
  color: #a9a7ad;
}
#yasr-container :deep(.yasr_btn.select_table.selected) {
  color: #ede7f6 !important;
  border-bottom: 3px solid #5728d9;
}
#yasr-container :deep(.yasr_btn.select_response.selected) {
  color: #ede7f6 !important;
  border-bottom: 3px solid #5728d9;
}
#yasr-container :deep(.yasr_btnGroup) {
  color: #ede7f6 !important;
}
#yasr-container :deep(.yasr_download_control) {
  margin-left: auto;
}
#yasr-container :deep(.tableControls div) {
  padding: 0 1rem 0 1.5rem;
  border-left: 1px solid #f8f8f8;
}
#yasr-container :deep(.yasr_plugin_control label span) {
  margin: 0 0.5rem 0 0;
}
#yasr-container :deep(.tableFilter) {
  padding: 0 0.5rem 0 0.5rem;
  margin-right: 0;
  color: #ede7f6;
  border-left: 1px solid #f8f8f8;
  text-align: center !important;
}
#yasr-container :deep(.pageSizeWrapper) {
  padding: 0 1rem 0 1.5rem !important;
  text-align: center !important;
  border-right: 1px solid #f8f8f8;
}
#yasr-container :deep(.pageSizeWrapper select) {
  padding: 0;
  text-align: center !important;
  color: #ede7f6;
  background-color: #1e1e1e;
}
#yasr-container :deep(.yasr_external_ref_btn) {
  display: none;
}
#yasr-container :deep(.yasr_btn) {
  color: #a9a7ad;
}
#yasr-container :deep(.yasr_btnGroup) {
  color: #ede7f6 !important;
}
#yasr-container :deep(.yasr_response_chip) {
  display: none;
}
#yasr-container :deep(.space_element) {
  display: none;
}
#yasr-container :deep(.yasr_downloadIcon) {
  margin-left: auto;
}

#yasr-container :deep(ul.yasr_tabs) {
  margin-bottom: 1rem;
}
#yasr-container :deep(ul.yasr_tabs li) {
  background-color: #445560;
  border: 1px solid #1e1e1e !important;
  border-radius: 4px !important;
  margin-right: 0.5rem;
}
#yasr-container :deep(ul.yasr_tabs li.active) {
  background-color: #754ff6;
}
#yasr-container :deep(ul.yasr_tabs li span) {
  color: #ede7f6 !important;
}
/* Table results */
#yasr-container :deep(.yasr_results) {
  border-radius: 6px;
  overflow-x: auto;
  scrollbar-color: #a9a7ad #1e1e1e;
  scrollbar-width: thin;
}
#yasr-container :deep(.dataTable) {
  max-width: fit-content;
  min-width: 100%;
}
#yasr-container :deep(thead tr th) {
  background-color: #5728d9;
  color: #ede7f6;
  font-weight: bold;
  font-size: 13pt;
  padding: 12px 15px;
  text-align: left;
  border: none;
  white-space: normal;
}
#yasr-container :deep(tbody tr:nth-child(even)) {
  background-color: #445560;
}
#yasr-container :deep(tbody tr:nth-child(odd)) {
  background-color: #2c363d;
}
#yasr-container :deep(tbody tr:hover) {
  background-color: #201054;
  cursor: pointer;
}
#yasr-container :deep(tbody tr td) {
  padding: 12px 15px;
  border: none;
  border-top: 1px solid #4a4a4a;
  white-space: normal; /* Allow cell content to wrap */
  overflow-wrap: break-word; /* Break long words to prevent overflow */
}
#yasr-container :deep(tbody tr:first-child td) {
  border-top: none;
}
#yasr-container :deep(tbody tr td .nonIri) {
  color: #ede7f6;
}
#yasr-container :deep(tbody tr td .iri) {
  color: #ffab40;
}
#yasr-container :deep(.CodeMirror-lines) {
  background-color: #28353e;
  text-decoration: none;
}
#yasr-container :deep(.CodeMirror-gutters) {
  background-color: #1e1e1e;
}
#yasr-container :deep(.resizeWrapper) {
  background-color: #1e1e1e;
}
#yasr-container :deep(.CodeMirror) {
  background-color: #28353e;
  border: 1px solid #1e1e1e;
  color: #ede7f6;
}
#yasr-container :deep(.CodeMirror-linenumber) {
  padding: 0;
}
#yasr-container :deep(.cm-string) {
  color: #baa6fc; /* Example: green for string literals */
}
#yasr-container :deep(.cm-property) {
  color: #ff5370; /* Example: red for IRI's like <http://...> */
}
#yasr-container :deep(.overlay_content) {
  border-radius: 6px;
}
#yasr-container :deep(.overlay_content button) {
  border-radius: 6px;
}
#yasr-container ::selection {
  background: #5f5f5f; /* highlight background */
  color: #ede7f6; /* highlighted text color */
}

#yasr-container :deep(.dataTables_info) {
  padding-left: 0.5rem;
  color: #a9a7ad;
}
#yasr-container :deep(.paginate_button) {
  color: #a9a7ad !important;
}

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
  overflow-x: auto;
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

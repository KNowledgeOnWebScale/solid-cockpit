<template>
  <section class="query-page">
    <div class="title-container">
      <div>
        <span>Data Query</span>
        <p class="page-summary">
          Run SPARQL queries, review saved query history, and inspect cached
          results inside your pod.
        </p>
      </div>
    </div>

    <!-- Delay div prevents flashing of login and pod selection box. -->
    <div class="loading-spinner-container" v-if="delay">
      <div class="spinner"></div>
      <span class="loading-text">Checking login status ...</span>
    </div>

    <div class="delay-placeholder" v-if="!delay">
      <!-- Query setup card keeps session, pod selection, and cache destination together. -->
      <div class="query-access-shell">
        <div v-if="!loggedIn" class="login-background">
          <pod-login />
        </div>

        <div v-if="loggedIn" class="pod-chooseContainer">
          <PodRegistration />
        </div>

        <div class="custom-cache-container">
          <div class="custom-cache-header">
            <div>
              <p class="section-kicker">Query cache</p>
              <h3>Saved query location</h3>
            </div>
            <div class="custom-cache-actions">
              <div class="custom-cache-guide">
                <v-icon>mdi-help-circle</v-icon>
                <v-tooltip class="tool-tip" activator="parent" location="top"
                  >Provide a custom query cache URL to use (defaults to the
                  connected pod)
                </v-tooltip>
              </div>
              <!-- Cache settings stay hidden by default to keep the setup area compact. -->
              <button
                class="cache-toggle-button"
                @click="showCustomCache = !showCustomCache"
                :aria-expanded="showCustomCache"
                type="button"
              >
                <span>{{
                  showCustomCache ? "Hide cache options" : "Custom cache"
                }}</span>
                <i class="material-icons">
                  {{ showCustomCache ? "expand_less" : "expand_more" }}
                </i>
              </button>
            </div>
          </div>

          <div v-if="showCustomCache" class="custom-cache-body">
            <div class="custom-cache-path">
              <div class="custom-cache-checkbox">
                <v-checkbox
                  v-model="useCustomCachePath"
                  label="Use Custom Cache Path"
                  hide-details
                ></v-checkbox>
              </div>
              <div class="custom-cache-input">
                <v-text-field
                  id="cachePathInput"
                  v-show="useCustomCachePath"
                  v-model="customCachePath"
                  label="Cache URL"
                  placeholder="Enter custom cache location (optional)"
                  :disabled="!useCustomCachePath"
                  variant="outlined"
                  dense
                  hide-details
                  @blur="validateCustomCachePath"
                ></v-text-field>
              </div>
            </div>
            <div v-if="cacheError != null" class="custom-cache-error">
              <span>{{ cacheError }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="general-container"
      :class="{
        'nav-collapsed': effectiveQueryNavCollapsed,
        'nav-compact-layout': isCompactQueryLayout,
      }"
    >
      <!-- Query mode navigation stays compact and matches the newer page side rails. -->
      <aside class="nav-container">
        <ul>
          <li class="nav-header-row">
            <span v-if="!effectiveQueryNavCollapsed">Query Views</span>
            <div
              v-if="effectiveQueryNavCollapsed && isCompactQueryLayout"
              class="nav-header-spacer"
            ></div>
            <button
              class="nav-toggle-button"
              type="button"
              :aria-expanded="!effectiveQueryNavCollapsed"
              @click="queryNavCollapsed = !queryNavCollapsed"
            >
              <i class="material-icons">
                {{
                  isCompactQueryLayout
                    ? effectiveQueryNavCollapsed
                      ? "chevron_left"
                      : "expand_less"
                    : effectiveQueryNavCollapsed
                    ? "chevron_right"
                    : "chevron_left"
                }}
              </i>
            </button>
          </li>
          <li class="nav-copy">
            Switch between writing a query and reviewing saved cache entries.
          </li>

          <li>
            <button
              id="top-button"
              :class="{ highlight: currentView === 'newQuery' }"
              @click="currentView = 'newQuery'"
              :title="effectiveQueryNavCollapsed ? 'New Query' : undefined"
            >
              <i class="material-icons nav-button-icon">edit_note</i>
              <span v-show="!effectiveQueryNavCollapsed">New Query</span>
            </button>
          </li>
          <li>
            <button
              :class="{ highlight: currentView === 'previousQueries' }"
              @click="previousQueriesView"
              :title="effectiveQueryNavCollapsed ? 'Past Queries' : undefined"
            >
              <i class="material-icons nav-button-icon">history</i>
              <span v-show="!effectiveQueryNavCollapsed">Past Queries</span>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Main content card mirrors the polished PodUpload and PodBrowser layout. -->
      <section class="query-container">
        <div v-show="currentView === 'newQuery'">
          <ul>
            <div class="top-container">
              <div>
                <p class="section-kicker">Query editor</p>
                <span class="top-label">Input a new query</span>
              </div>

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

            <!-- Source designation stays above the editor, but now reads as part of the same setup card. -->
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

            <!-- Query input styling intentionally remains unchanged. -->
            <div id="yasqe-container"></div>

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

              <div class="save-query" v-show="selectedPodUrl !== ''">
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
                    class="tool-tip"
                    activator="parent"
                    location="bottom"
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
          </ul>
        </div>

        <div v-if="deletionSuccess" class="success-popup">
          <span
            >Cached record: {{ deletedQuery }} was deleted successfully!</span
          >
          <button @click="deletionSuccess = false" class="close-popup-button">
            <i class="material-icons">close</i>
          </button>
        </div>

        <div v-if="currentView === 'previousQueries'">
          <div class="no-pod" v-if="selectedPodUrl == ''">
            <span
              >Please connect your pod if you wish to look at your query cache.
              <br />(Simply click the "select pod" button above.)</span
            >
          </div>
          <div
            class="no-pod"
            v-if="selectedPodUrl !== '' && !queriesCacheExists"
          >
            <span
              >No query cache found in your pod. To create a query cache, simply
              execute a query with the <b>"Save Query?"</b> checkbox
              checked.</span
            >
          </div>
          <ul>
            <div
              class="cached-container"
              v-if="selectedPodUrl != '' && queriesCacheExists"
              :key="renderKey"
            >
              <div class="cached-header">
                <div>
                  <p class="section-kicker">Saved queries</p>
                  <span class="cached-title">Query cache inside your pod</span>
                </div>
                <div class="cached-header-actions">
                  <button
                    class="filter-toggle"
                    @click="cachedFiltersOpen = !cachedFiltersOpen"
                  >
                    <i class="material-icons">filter_alt</i>
                    <span>Filters</span>
                  </button>
                  <span class="cached-meta"
                    >{{ filteredCachedQueries.length }} of
                    {{ cachedQueries.length }} entries</span
                  >
                </div>
              </div>

              <!-- Filters stay hidden by default so the cache browser remains compact. -->
              <div
                v-if="cachedFiltersOpen"
                class="filters-panel cached-filters-panel"
              >
                <div class="filter-group">
                  <span class="filter-label">Status</span>
                  <div class="filter-chip-row">
                    <button
                      class="filter-chip"
                      :class="{ active: cachedStatusFilter === 'all' }"
                      @click="cachedStatusFilter = 'all'"
                    >
                      All
                    </button>
                    <button
                      class="filter-chip"
                      :class="{ active: cachedStatusFilter === 'current' }"
                      @click="cachedStatusFilter = 'current'"
                    >
                      Current
                    </button>
                    <button
                      class="filter-chip"
                      :class="{ active: cachedStatusFilter === 'other' }"
                      @click="cachedStatusFilter = 'other'"
                    >
                      Other
                    </button>
                  </div>
                </div>

                <div class="filter-group">
                  <span class="filter-label">Sources</span>
                  <div class="filter-chip-row">
                    <button
                      class="filter-chip"
                      :class="{ active: cachedSourceFilter === 'all' }"
                      @click="cachedSourceFilter = 'all'"
                    >
                      All
                    </button>
                    <button
                      class="filter-chip"
                      :class="{ active: cachedSourceFilter === 'single' }"
                      @click="cachedSourceFilter = 'single'"
                    >
                      Single source
                    </button>
                    <button
                      class="filter-chip"
                      :class="{ active: cachedSourceFilter === 'federated' }"
                      @click="cachedSourceFilter = 'federated'"
                    >
                      Federated
                    </button>
                  </div>
                </div>

                <div class="filter-group">
                  <label class="filter-label" for="cachedQuerySearch"
                    >Search cached queries</label
                  >
                  <input
                    id="cachedQuerySearch"
                    v-model="cachedQuerySearch"
                    class="filter-input"
                    type="text"
                    placeholder="Search by title, hash, file, source, or date"
                  />
                </div>

                <div class="filter-group">
                  <label class="filter-label" for="cachedQuerySort"
                    >Sort by</label
                  >
                  <select
                    id="cachedQuerySort"
                    v-model="cachedSort"
                    class="filter-select"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="sources-desc">Most sources</option>
                    <option value="sources-asc">Fewest sources</option>
                  </select>
                </div>

                <div class="filter-actions">
                  <button class="filter-reset" @click="resetCachedQueryFilters">
                    Reset filters
                  </button>
                </div>
              </div>

              <div class="no-cached-queries" v-if="cachedQueries.length === 0">
                <span>
                  There are no saved queries in your cache...
                  <br />
                  To create a query cache, simply execute a query with the
                  <b>"Save Query?"</b> checkbox checked.
                </span>
              </div>
              <div
                class="no-cached-queries"
                v-else-if="filteredCachedQueries.length === 0"
              >
                <span
                  >No cached queries match the current search or filters.</span
                >
              </div>
              <li
                v-for="query in filteredCachedQueries"
                :key="query.hash"
                v-else
              >
                <div class="card-panel folder">
                  <div class="folder-header">
                    <button
                      @click="toggleQuery(query.hash)"
                      class="icon-button full-width"
                    >
                      <div class="icon-hash">
                        <i class="material-icons not-colored left">{{
                          "search"
                        }}</i>
                        <div class="cached-query-summary">
                          <span class="cached-query-name">{{
                            query.title || query.hash
                          }}</span>
                          <span class="cached-query-hash">{{
                            query.hash
                          }}</span>
                        </div>
                      </div>
                      <i class="material-icons not-colored info-icon">
                        {{
                          showQueryHash === query.hash
                            ? "keyboard_arrow_down info"
                            : "chevron_right info"
                        }}</i
                      >
                    </button>
                  </div>
                  <div
                    class="specific-query"
                    v-show="showQueryHash === query.hash"
                  >
                    <div class="query-time">
                      <span class="user-tag">Date: <br /></span>
                      <span class="the-user"
                        ><i>{{ query.created }}</i></span
                      >
                    </div>

                    <!-- Compact cache metadata makes it easier to scan what kind of entry this is. -->
                    <div class="query-metadata-row">
                      <span class="user-tag">Metadata:</span>
                      <span class="metadata-chip status-chip">{{
                        query.status || "current"
                      }}</span>
                      <span class="metadata-chip">
                        {{ query.sourceUrls.length }}
                        {{
                          query.sourceUrls.length === 1 ? "source" : "sources"
                        }}
                      </span>
                      <span class="metadata-chip" v-if="query.modified">
                        Updated: {{ query.modified }}
                      </span>
                    </div>

                    <div class="query-file-container">
                      <span class="user-tag">Query File: <br /></span>
                      <button
                        @click="
                          fetchQuery(query.hash, selectedPodUrl + 'querycache/')
                        "
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

                    <div class="query-results-container">
                      <span class="user-tag">Results File: <br /></span>
                      <div class="query-results">
                        <button
                          @click="
                            fetchResults(
                              query.hash,
                              selectedPodUrl + 'querycache/',
                            )
                          "
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
                      <div
                        class="cached-results-preview loading-state"
                        v-if="
                          showRetrievedResults &&
                          retrievedResultsHash === query.hash &&
                          cachedResultsState === 'loading'
                        "
                      >
                        <span class="cached-results-title"
                          >Loading cached results...</span
                        >
                        <span class="panel-hint"
                          >Preparing a compact preview for this entry.</span
                        >
                      </div>
                      <div
                        class="cached-results-preview"
                        v-else-if="
                          showRetrievedResults &&
                          retrievedResultsHash === query.hash &&
                          cachedResultsState === 'ready' &&
                          retrievedResults != null
                        "
                      >
                        <div
                          class="cached-results-preview-header"
                          v-if="cachedResultsPreviewMeta"
                        >
                          <span class="cached-results-title"
                            >Preview of cached results</span
                          >
                          <div class="cached-results-meta">
                            <span class="metadata-chip">
                              {{ cachedResultsPreviewMeta.shownRows }} of
                              {{ cachedResultsPreviewMeta.totalRows }} rows
                            </span>
                            <span class="metadata-chip">
                              {{ cachedResultsPreviewMeta.columns }} columns
                            </span>
                          </div>
                        </div>
                        <div id="cached-yasr-container"></div>
                      </div>
                      <div
                        class="cached-results-preview empty-state"
                        v-if="
                          showRetrievedResults &&
                          retrievedResultsHash === query.hash &&
                          cachedResultsState === 'empty'
                        "
                      >
                        <span class="cached-results-title"
                          >No cached results</span
                        >
                        <span class="panel-hint"
                          >This results file exists, but it contains no result
                          rows.</span
                        >
                      </div>
                      <div
                        class="cached-results-preview missing-state"
                        v-if="
                          showRetrievedResults &&
                          retrievedResultsHash === query.hash &&
                          cachedResultsState === 'missing'
                        "
                      >
                        <span class="cached-results-title"
                          >Results file not found</span
                        >
                        <span class="panel-hint"
                          >The cache entry still exists, but its stored results
                          file could not be found in the pod.</span
                        >
                      </div>
                      <div
                        class="cached-results-preview error-state"
                        v-if="
                          showRetrievedResults &&
                          retrievedResultsHash === query.hash &&
                          cachedResultsState === 'error'
                        "
                      >
                        <span class="cached-results-title"
                          >Could not load cached results</span
                        >
                        <span class="panel-hint">{{
                          cachedResultsMessage ||
                          "The results file could not be opened or parsed."
                        }}</span>
                      </div>
                    </div>

                    <div class="query-sources">
                      <span class="user-tag">Sources: <br /></span>
                      <ul>
                        <li v-for="(source, i) in query.sourceUrls" :key="i">
                          <a>{{ source }}</a>
                        </li>
                      </ul>
                    </div>

                    <div class="edit-delete">
                      <div class="query-entry-actions">
                        <button
                          class="secondary-action-button"
                          @click="toggleQueryActionPanel('rename', query)"
                        >
                          <i class="material-icons">edit</i>
                          <span>Rename query</span>
                        </button>
                        <button
                          class="secondary-action-button"
                          @click="toggleQueryActionPanel('share', query)"
                        >
                          <i class="material-icons">share</i>
                          <span>Share</span>
                        </button>
                        <button
                          @click="confirmAndDelete(query.hash)"
                          class="secondary-action-button delete-button"
                        >
                          <i class="material-icons">delete</i>
                          <span>Delete</span>
                        </button>
                      </div>

                      <div
                        v-if="renamePanelHash === query.hash"
                        class="query-entry-panel"
                      >
                        <div class="query-entry-panel-header">
                          <span>Rename cached query</span>
                          <span class="panel-hint"
                            >Changes the display name only.</span
                          >
                        </div>
                        <div class="query-entry-panel-body">
                          <v-text-field
                            v-model="renameQueryLabel"
                            label="Display name"
                            variant="outlined"
                            hide-details
                            density="compact"
                          />
                          <button
                            class="panel-submit-button"
                            @click="renameCachedQuery(query)"
                            :disabled="renamingQueryHash === query.hash"
                          >
                            Save Name
                          </button>
                        </div>
                        <span v-if="renameFeedback" class="panel-feedback">
                          {{ renameFeedback }}
                        </span>
                      </div>

                      <div
                        v-if="sharePanelHash === query.hash"
                        class="query-entry-panel"
                      >
                        <div class="query-entry-panel-header">
                          <span>Share cached query entry</span>
                          <span class="panel-hint"
                            >Grants read access to the stored query and result
                            files.</span
                          >
                        </div>
                        <div class="query-entry-panel-body">
                          <v-text-field
                            v-model="shareTargetWebId"
                            label="Recipient WebID"
                            variant="outlined"
                            hide-details
                            density="compact"
                          />
                          <button
                            class="panel-submit-button"
                            @click="shareCachedQueryEntry(query)"
                            :disabled="sharingQueryHash === query.hash"
                          >
                            Share Entry
                          </button>
                        </div>
                        <span
                          v-if="shareFeedback"
                          class="panel-feedback"
                          :class="{ success: shareSuccess }"
                        >
                          {{ shareFeedback }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </div>
          </ul>
        </div>
      </section>
    </div>

    <div v-show="currentView != 'previousQueries'">
      <div
        class="results-container"
        v-if="
          loading ||
          (currentQuery.output != null &&
            typeof currentQuery.output !== 'string')
        "
      >
        <div class="results-header">
          <div>
            <p class="section-kicker">Results</p>
            <span class="results-title">Query results</span>
          </div>
          <span v-if="loading" class="results-status">Running query</span>
        </div>

        <div v-if="loading" class="spinner-container">
          <div class="spinner"></div>
          <p>Loading query results...</p>
        </div>

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
                    {{
                      provType(currentQuery.output.provenanceOutput.algorithm)
                    }}
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
              <div class="query-time">
                <span class="user-tag">Date Executed: <br /></span>
                <span class="the-user"
                  ><i>{{ cachedQueries[cachedQueryIndex].created }}</i></span
                >
              </div>

              <div class="query-file-container">
                <span class="user-tag">Query File: <br /></span>
                <button
                  @click="fetchQuery(currentCachedQueryHash, cachePath)"
                  class="drop-down"
                >
                  <div class="query-file-info">
                    <span class="the-user"
                      ><i>{{
                        cachedQueries[cachedQueryIndex].queryFile
                      }}</i></span
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

        <div
          class="table-container"
          v-show="
            !loading &&
            resultsForYasr != null &&
            resultsForYasr.results.bindings.length > 0
          "
        >
          <div id="yasr-container"></div>
        </div>
        <div
          class="null-results"
          v-show="
            !loading &&
            resultsForYasr != null &&
            resultsForYasr.results.bindings.length === 0
          "
        >
          <span>This query produced no results 🙃</span>
        </div>

        <div class="null-results" v-show="!loading && queryError != null">
          <span
            >There was a(n)
            <b
              ><i>{{ queryError }}</i></b
            >
            error when executing this query <br />(open the browser console to
            see more details.)</span
          >
        </div>
      </div>
    </div>

    <div class="use-guide">
      <DataQueryGuide />
    </div>
  </section>
</template>

<script lang="ts">
import Yasqe from "@triply/yasqe";
import "@triply/yasqe/build/yasqe.min.css";
import Yasr from "@triply/yasr";
import "@triply/yasr/build/yasr.min.css";
import {
  ensureCacheContainer,
  buildCacheEntryHash,
  upsertQueryCacheEntry,
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
  ComunicaSources,
  executeQueryInMainThread,
  renameCachedQueryEntry,
} from "./queryPod";
import {
  fetchPermissionsData,
  fetchAclAgents,
  fetchPublicAccess,
} from "./getData";
import { deleteFromPod, deleteThing } from "./fileUpload";
import {
  changeAclAgent,
  generateAcl,
  updateSharedWithMe,
  updateSharedWithOthers,
  Permissions,
  checkUrl,
} from "./privacyEdit";
import PodLogin from "./PodLogin.vue";
import PodRegistration from "./PodRegistration.vue";
import DataQueryGuide from "./Guides/DataQueryGuide.vue";
import { toRaw, shallowRef, nextTick } from "vue";
import { useAuthStore } from "../stores/auth";

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
      cachedYasr: shallowRef<Yasr | null>(null),
      resultsForYasr: null as QueryResultJson | null,
      queryError: null as Error | null,
      successfulLogin: false as boolean,
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
      retrievedResultsHash: null as string | null,
      cachedResultsState: "idle" as
        | "idle"
        | "loading"
        | "ready"
        | "empty"
        | "missing"
        | "error",
      cachedResultsMessage: null as string | null,
      cachedResultsRequestId: 0 as number,
      cachedResultsPreviewMeta: null as {
        shownRows: number;
        totalRows: number;
        columns: number;
      } | null,
      showRetrievedQuery: false as boolean,
      showRetrievedResults: false as boolean,
      showQueryHash: null as string | null,
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
      containsSolidSources: false as boolean,
      customCachePath: "" as string,
      useCustomCachePath: false as boolean,
      showCustomCache: false as boolean,
      cacheError: null as string | null,
      invalidUrl: false as boolean,
      authenticationFailed: false as boolean,
      deletedQuery: null as string | null,
      deletionSuccess: null as boolean | null,
      sharePanelHash: null as string | null,
      shareTargetWebId: "" as string,
      shareFeedback: null as string | null,
      shareSuccess: false as boolean,
      sharingQueryHash: null as string | null,
      renamePanelHash: null as string | null,
      renameQueryLabel: "" as string,
      renameFeedback: null as string | null,
      renamingQueryHash: null as string | null,
      renderKey: 0 as number,
      isCompactQueryLayout: false as boolean,
      queryNavCollapsed: false as boolean,
      cachedFiltersOpen: false as boolean,
      cachedQuerySearch: "" as string,
      cachedStatusFilter: "all" as "all" | "current" | "other",
      cachedSourceFilter: "all" as "all" | "single" | "federated",
      cachedSort: "newest" as
        | "newest"
        | "oldest"
        | "name-asc"
        | "name-desc"
        | "sources-asc"
        | "sources-desc",
    };
  },
  computed: {
    authStore() {
      return useAuthStore(); // Access the store
    },
    loggedIn() {
      return this.authStore.loggedIn; // Access loggedIn state
    },
    webId() {
      return this.authStore.webId; // Access webId state
    },
    selectedPodUrl() {
      return this.authStore.selectedPodUrl; // Access selected Pod URL
    },
    effectiveQueryNavCollapsed() {
      return this.queryNavCollapsed;
    },
    /**
     * Applies live search, filter, and sorting controls to the cached query list
     * while preserving the original order/data loaded from the pod.
     */
    filteredCachedQueries() {
      const normalizedSearch = this.cachedQuerySearch.trim().toLowerCase();

      return [...this.cachedQueries]
        .filter((query) => {
          const normalizedStatus = (query.status || "unknown").toLowerCase();
          const statusMatches =
            this.cachedStatusFilter === "all" ||
            (this.cachedStatusFilter === "current" &&
              normalizedStatus === "current") ||
            (this.cachedStatusFilter === "other" &&
              normalizedStatus !== "current");

          const sourceMatches =
            this.cachedSourceFilter === "all" ||
            (this.cachedSourceFilter === "single" &&
              query.sourceUrls.length <= 1) ||
            (this.cachedSourceFilter === "federated" &&
              query.sourceUrls.length > 1);

          if (!normalizedSearch) {
            return statusMatches && sourceMatches;
          }

          // Search across the fields already surfaced in the cache entry UI.
          const searchableValues = [
            query.title || "",
            query.hash,
            query.created,
            query.queryFile,
            query.resultsFile,
            query.status || "",
            ...query.sourceUrls,
          ]
            .join(" ")
            .toLowerCase();

          return (
            statusMatches &&
            sourceMatches &&
            searchableValues.includes(normalizedSearch)
          );
        })
        .sort((left, right) => this.sortCachedQueries(left, right));
    },
  },
  methods: {
    handleDelay() {
      this.delay = false;
    },
    updateQueryLayoutMode() {
      if (typeof window === "undefined") return;
      this.isCompactQueryLayout = window.innerWidth <= 1080;
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
    /**
     * Keeps the expanded cache entry stable even when the displayed list is
     * filtered or sorted, since hashes do not change across those views.
     */
    toggleQuery(hash: string) {
      // Reset expanded states when switching queries
      if (this.showQueryHash !== hash) {
        this.showRetrievedQuery = false;
        this.clearRetrievedResults();
        this.sharePanelHash = null;
        this.renamePanelHash = null;
        this.shareFeedback = null;
        this.renameFeedback = null;
      }
      this.showQueryHash = this.showQueryHash === hash ? null : hash;
    },
    /**
     * Sorts cached queries based on the active user-selected mode.
     */
    sortCachedQueries(left: CachedQuery, right: CachedQuery) {
      const leftLabel = (left.title || left.hash).toLowerCase();
      const rightLabel = (right.title || right.hash).toLowerCase();
      const leftCreated = new Date(left.created).getTime() || 0;
      const rightCreated = new Date(right.created).getTime() || 0;

      switch (this.cachedSort) {
        case "oldest":
          return leftCreated - rightCreated;
        case "name-asc":
          return leftLabel.localeCompare(rightLabel);
        case "name-desc":
          return rightLabel.localeCompare(leftLabel);
        case "sources-asc":
          return left.sourceUrls.length - right.sourceUrls.length;
        case "sources-desc":
          return right.sourceUrls.length - left.sourceUrls.length;
        case "newest":
        default:
          return rightCreated - leftCreated;
      }
    },
    /**
     * Restores the default cached-query browser controls.
     */
    resetCachedQueryFilters() {
      this.cachedQuerySearch = "";
      this.cachedStatusFilter = "all";
      this.cachedSourceFilter = "all";
      this.cachedSort = "newest";
    },
    /**
     * Keeps the rename and share panels scoped to the currently expanded query.
     */
    toggleQueryActionPanel(panel: "share" | "rename", query: CachedQuery) {
      if (panel === "share") {
        this.sharePanelHash =
          this.sharePanelHash === query.hash ? null : query.hash;
        this.renamePanelHash = null;
        this.shareFeedback = null;
        this.shareSuccess = false;
        this.shareTargetWebId = "";
      } else {
        this.renamePanelHash =
          this.renamePanelHash === query.hash ? null : query.hash;
        this.sharePanelHash = null;
        this.renameFeedback = null;
        this.renameQueryLabel = query.title || query.hash;
      }
    },
    async grantQueryEntryReadAccess(resourceUrl: string, targetWebId: string) {
      const readOnlyAccess: Permissions = {
        read: true,
        append: false,
        write: false,
        control: false,
      };

      try {
        await changeAclAgent(resourceUrl, targetWebId, readOnlyAccess);
      } catch (error) {
        // Create a dedicated ACL first when the resource does not yet expose one.
        await generateAcl(resourceUrl, this.webId);
        await changeAclAgent(resourceUrl, targetWebId, readOnlyAccess);
      }

      // Record the sharing event in the existing inbox-based ledgers.
      await updateSharedWithMe(
        targetWebId,
        this.webId,
        resourceUrl,
        readOnlyAccess,
      );
      await updateSharedWithOthers(
        this.selectedPodUrl,
        resourceUrl,
        targetWebId,
        readOnlyAccess,
      );
    },
    async shareCachedQueryEntry(query: CachedQuery) {
      this.shareFeedback = null;
      this.shareSuccess = false;

      if (checkUrl(this.shareTargetWebId, this.webId)) {
        this.shareFeedback =
          "Enter a valid recipient WebID different from your own.";
        return;
      }

      this.sharingQueryHash = query.hash;
      try {
        // Share both the stored SPARQL query and its serialized results as a single entry.
        await this.grantQueryEntryReadAccess(
          query.queryFile,
          this.shareTargetWebId,
        );
        await this.grantQueryEntryReadAccess(
          query.resultsFile,
          this.shareTargetWebId,
        );
        this.shareSuccess = true;
        this.shareFeedback = `Shared this cached query entry with ${this.shareTargetWebId}.`;
      } catch (error) {
        console.error("Error sharing cached query entry:", error);
        this.shareSuccess = false;
        this.shareFeedback =
          "Could not share this cached query entry. Check inbox/ACL support and try again.";
      } finally {
        this.sharingQueryHash = null;
      }
    },
    async renameCachedQuery(query: CachedQuery) {
      const trimmedLabel = this.renameQueryLabel.trim();
      if (!trimmedLabel) {
        this.renameFeedback = "Enter a display name for the cached query.";
        return;
      }

      this.renamingQueryHash = query.hash;
      this.renameFeedback = null;
      try {
        const renamed = await renameCachedQueryEntry(
          `${this.selectedPodUrl}querycache/queries.ttl`,
          query.hash,
          trimmedLabel,
        );

        if (!renamed) {
          this.renameFeedback = "Could not rename this cached query.";
          return;
        }

        await this.loadCache();
        this.showQueryHash = query.hash;
        this.renameFeedback = "Cached query renamed.";
      } catch (error) {
        console.error("Error renaming cached query:", error);
        this.renameFeedback = "Could not rename this cached query.";
      } finally {
        this.renamingQueryHash = null;
      }
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
        const lines = (content as string).split("\n");
        const name = path.split("/").pop()?.replace(".rq", "") || "";

        let sources: string[] = [];
        const sourceLine = lines.find((line) =>
          line.startsWith("# Datasources:"),
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

    /* Determines whether sources contain a Solid source and reflects this in boolean */
    checkSolidSources(querySources: ComunicaSources[]) {
      this.containsSolidSources = querySources.some(
        (source) => source.context != null,
      );
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

      // make sources into a ComunicaSources[]
      const cleanedSources = cleanSourcesUrls(this.currentQuery.sources);
      this.checkSolidSources(cleanedSources);

      try {
        // reset query error
        this.queryError = null;

        // if Save Query box is selected (pod must be connected)
        if (this.saveQuery) {
          // Spec-aligned cache entries require at least one concrete source URI.
          if (this.currentQuery.sources.length === 0) {
            this.cacheError =
              "Saved query cache entries require at least one selected data source.";
            this.loading = false;
            return;
          }

          // if the user provided a custom cache path, use that
          if (this.useCustomCachePath && this.customCachePath) {
            this.cachePath = await ensureCacheContainer(
              this.selectedPodUrl,
              this.webId,
              this.customCachePath,
            );
          } else {
            // otherwise use default (connected pod)
            this.cachePath = await ensureCacheContainer(
              this.selectedPodUrl,
              this.webId,
              this.selectedPodUrl,
            );
          }

          // Catch error with accessing custom query cache location
          if (this.cachePath.includes("Error")) {
            this.cacheError =
              "Could not access or create query cache container. Please check the cache path and your pod permissions.";
            this.loading = false;
            return;
          }

          this.currentQuery.output = await executeQueryWithPodConnected(
            this.currentQuery.query,
            cleanedSources,
            this.cachePath,
          );

          // If the output is a string, it means there was no matching entry in the cache
          if (this.currentQuery.output === "no-cache") {
            // if there are NOT solid sources use the Worker
            if (!this.containsSolidSources) {
              this.currentQuery.output = await this.executeQuery(
                this.currentQuery.query,
                cleanedSources,
              );
            } else {
              // if there are Solid sources, use custom execution in main thread
              this.currentQuery.output = await executeQueryInMainThread(
                this.currentQuery.query,
                cleanedSources,
              );
            }
          }

          // obtaining query cache hash if the cache contains a similar query
          // TODO: Fix getCacheEntryHash
          if (
            this.currentQuery.output &&
            this.currentQuery.output.provenanceOutput != null
          ) {
            this.cacheType =
              this.currentQuery.output.provenanceOutput.algorithm;
            this.currentCachedQueryHash = this.getCacheEntryHash(
              this.currentQuery.output.provenanceOutput.id.value,
            );
          }

          // pass found results to YASR (with save query selected)
          this.resultsForYasr = this.currentQuery.output.resultsOutput;

          this.currentQuery.output = toRaw(this.currentQuery.output);
          // If there is NOT an equivalent query in cache, then add it to cache
          if (
            this.currentQuery.output.provenanceOutput === null ||
            this.currentQuery.output.provenanceOutput.algorithm != "equivalence"
          ) {
            // Use a stable cache identifier so the index remains predictable.
            this.currHash = buildCacheEntryHash(
              this.currentQuery.query,
              this.currentQuery.sources,
            );

            // Persist the concrete cache members first, then register the entry in queries.ttl.
            this.queryFile = await uploadQueryFile(
              this.cachePath,
              this.currentQuery.query,
              this.currHash,
            );
            this.resultsFile = await uploadResults(
              this.cachePath,
              JSON.stringify(this.currentQuery.output.resultsOutput, null, 2),
              this.currHash,
            );

            await upsertQueryCacheEntry(this.cachePath, {
              hash: this.currHash,
              query: this.currentQuery.query,
              queryFileUrl: this.queryFile,
              resultsFileUrl: this.resultsFile,
              sources: this.currentQuery.sources,
              status: "current",
            });
          }
        } else {
          // If the Save Query button was not selected (pod is connected)
          if (this.selectedPodUrl !== "" || this.customCachePath !== "") {
            // if the user provided a custom cache path, use that
            if (this.useCustomCachePath && this.customCachePath) {
              this.cachePath = await ensureCacheContainer(
                this.selectedPodUrl,
                this.webId,
                this.customCachePath,
              );
            } else {
              // otherwise use default (connected pod)
              this.cachePath = await ensureCacheContainer(
                this.selectedPodUrl,
                this.webId,
                this.selectedPodUrl,
              );
            }

            // Catch error with accessing custom query cache location
            if (this.cachePath.includes("Error")) {
              this.cacheError =
                "Could not access or create query cache container. Please check the cache path and your pod permissions.";
              this.loading = false;
              return;
            }

            // Execute Query
            this.currentQuery.output = await executeQueryWithPodConnected(
              this.currentQuery.query,
              cleanedSources,
              this.cachePath,
            );

            // If the output is a string, it means there was no matching entry in the cache
            if (this.currentQuery.output === "no-cache") {
              // if there are NOT solid sources use the Worker
              if (!this.containsSolidSources) {
                this.currentQuery.output = await this.executeQuery(
                  this.currentQuery.query,
                  cleanedSources,
                );
              } else {
                // if there are Solid sources, use custom execution in main thread
                this.currentQuery.output = await executeQueryInMainThread(
                  this.currentQuery.query,
                  cleanedSources,
                );
              }
            }
          } else {
            // if there is NO pod connected, use the default query execution
            this.cacheError = this.currentQuery.output;

            // if there are NOT solid sources --> use the Worker
            if (!this.containsSolidSources) {
              this.currentQuery.output = await this.executeQuery(
                this.currentQuery.query,
                cleanedSources,
              );
            } else {
              // if there are Solid sources, use custom execution in main thread
              this.currentQuery.output = await executeQueryInMainThread(
                this.currentQuery.query,
                cleanedSources,
              );
            }
          }

          // try to obtain cache hash if the cache contains a similar query
          // TODO: Fix getCacheEntryHash
          if (
            this.currentQuery.output &&
            this.currentQuery.output.provenanceOutput != null
          ) {
            this.cacheType =
              this.currentQuery.output.provenanceOutput.algorithm;
            this.currentCachedQueryHash = this.getCacheEntryHash(
              this.currentQuery.output.provenanceOutput.id.value,
            );
          }
        }
        // if there was an error report it here
        if (this.currentQuery.output instanceof Error) {
          this.queryError = this.currentQuery.output.message;
        } else {
          // if the query was empty assign it empty bindings
          if (
            !this.currentQuery.output.resultsOutput ||
            !this.currentQuery.output.resultsOutput.results
          ) {
            this.currentQuery.output.resultsOutput = {
              head: { vars: [] },
              results: { bindings: [] },
            };
          }
        }
        // pass found results to YASR (if save query was not selected)
        this.resultsForYasr = this.currentQuery.output.resultsOutput;
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
      providedSources: ComunicaSources[],
    ): Promise<CacheOutput | null | Error> {
      this.cancelRequested = false;

      this.worker = new Worker(new URL("./queryWorker.js", import.meta.url), {
        type: "module",
      });

      return new Promise<CacheOutput | null | Error>((resolve, reject) => {
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
              this.cleanupWorker();
              resolve(new Error(data.error.message)); // or reject(data.error) if you prefer
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
          this.cancelQuery();
          resolve(err as any);
        };
        // starts a run
        this.worker.postMessage({
          type: "run",
          query,
          sources: providedSources,
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
        prefixes,
      );
    },
    /**
     * Creates a compact YASR instance dedicated to cached-results previews so
     * the expanded cache entry shows a scannable sample instead of the full
     * exhaustive result table.
     */
    initCachedYasr() {
      const parent = document.getElementById("cached-yasr-container");
      if (!parent) return;
      if (this.cachedYasr) {
        parent.replaceChildren();
      }
      this.cachedYasr = new Yasr(parent, {
        pluginOrder: ["table"],
        defaultPlugin: "table",
      });
    },
    destroyCachedYasr() {
      const parent = document.getElementById("cached-yasr-container");
      if (this.cachedYasr && (this.cachedYasr as any).destroy) {
        (this.cachedYasr as any).destroy();
      }
      if (parent) {
        parent.replaceChildren();
      }
      this.cachedYasr = null;
    },
    /**
     * Limits the cached preview to the first rows only, which keeps the cache
     * entry compact while still showing a representative sample of the result.
     */
    buildCachedResultsPreview(json: QueryResultJson, limit = 8) {
      const previewRows = json.results.bindings.slice(0, limit);
      return {
        preview: {
          head: { vars: [...json.head.vars] },
          results: { bindings: previewRows },
        } as QueryResultJson,
        meta: {
          shownRows: previewRows.length,
          totalRows: json.results.bindings.length,
          columns: json.head.vars.length,
        },
      };
    },
    async renderCachedResultsPreview(json: QueryResultJson, requestId: number) {
      const { preview, meta } = this.buildCachedResultsPreview(json);
      this.cachedResultsPreviewMeta = meta;
      await nextTick();
      if (requestId !== this.cachedResultsRequestId) return;
      this.initCachedYasr();
      if (!this.cachedYasr) return;
      this.cachedYasr.setResponse({
        data: preview,
        contentType: "application/sparql-results+json",
      });
    },
    /**
     * Distinguishes a missing results file from other fetch/parsing problems so
     * the cache UI can present a more useful message to the user.
     */
    isMissingCachedResultsFile(error: unknown) {
      if (!(error instanceof Error)) return false;
      const message = error.message.toLowerCase();
      return (
        message.includes("404") ||
        message.includes("not found") ||
        message.includes("could not fetch file")
      );
    },

    // Methods for the deletion of a query cache entry
    async confirmAndDelete(queryHash: string) {
      const queryFile = `${this.selectedPodUrl}querycache/${queryHash}.rq`;
      const resultsFile = `${this.selectedPodUrl}querycache/${queryHash}.json`;

      const message =
        "Are you sure you want to delete this cache entry? This action cannot be undone.";
      const userConfirmed = window.confirm(message);

      if (userConfirmed) {
        const removedCacheRecord = await this.removeCachedRecord(queryHash);
        const removedQuery = await this.deleteResource(queryFile);
        const removedResults = await this.deleteResource(resultsFile);

        if (removedCacheRecord && removedQuery && removedResults) {
          this.deletionSuccess = true;
          await this.loadCache(); // Refresh the cache view
          this.deletedQuery = queryHash;
          this.renderKey += 1; // Force re-render
        } else {
          this.deletionSuccess = false;
          console.log(
            "Failed to delete one or more components of the cache entry.",
          );
        }
      } else {
        console.log("Deletion canceled by the user.");
      }
    },

    /*
    Deleted the resource at the given URL.
    */
    async deleteResource(fileUrl: string): Promise<boolean> {
      try {
        return await deleteFromPod(fileUrl);
      } catch (err) {
        console.error(`Error deleting resource: ${fileUrl}`, err);
        alert(`An error occurred while deleting resource: ${fileUrl}`);
        return false;
      }
    },

    async removeCachedRecord(queryHash: string) {
      // remove the record from queries.ttl
      const queriesttlUpdate = await deleteThing(
        this.selectedPodUrl + "querycache/queries.ttl",
        queryHash,
      );
      return queriesttlUpdate;
    },

    // TODO: Sharing of query results (maybe just the whole container?)

    async previousQueriesView() {
      this.currentView = "previousQueries";
      await this.loadCache();
    },
    async loadCache() {
      this.clearRetrievedResults();
      this.queriesCacheExists = await getStoredTtl(
        this.selectedPodUrl + "querycache/queries.ttl",
      );
      if (this.queriesCacheExists) {
        try {
          this.cachedQueries = await getCachedQueries(
            this.selectedPodUrl + "querycache/queries.ttl",
          );
        } catch (err) {
          console.log("Error fetching queries:", err);
        }
      }
    },
    getCacheEntryHash(prov: string) {
      return prov.split("#")[1];
    },
    clearRetrievedResults() {
      this.showRetrievedResults = false;
      this.retrievedResults = null;
      this.retrievedResultsHash = null;
      this.cachedResultsState = "idle";
      this.cachedResultsMessage = null;
      this.cachedResultsPreviewMeta = null;
      this.destroyCachedYasr();
    },
    togglRetrievedQuery() {
      this.showRetrievedQuery = !this.showRetrievedQuery;
    },
    // retrieves cached results for display
    async fetchResults(hash: string, cacheLoc: string) {
      if (this.showRetrievedResults && this.retrievedResultsHash === hash) {
        this.clearRetrievedResults();
        return;
      }

      const requestId = this.cachedResultsRequestId + 1;
      this.cachedResultsRequestId = requestId;
      this.destroyCachedYasr();
      this.retrievedResults = null;
      this.retrievedResultsHash = hash;
      this.showRetrievedResults = true;
      this.cachedResultsState = "loading";
      this.cachedResultsMessage = null;
      this.cachedResultsPreviewMeta = null;

      try {
        const retrievedQueryResults = await fetchSparqlJsonFileData(
          `${cacheLoc}/${hash}.json`,
        );
        if (requestId !== this.cachedResultsRequestId) return;

        this.retrievedResults = toRaw(retrievedQueryResults);

        if (this.retrievedResults === null) {
          this.cachedResultsState = "error";
          this.cachedResultsMessage =
            "The results file could not be parsed as SPARQL JSON.";
          return;
        }

        if (this.retrievedResults.results.bindings.length === 0) {
          this.cachedResultsState = "empty";
          return;
        }

        this.cachedResultsState = "ready";
        await this.renderCachedResultsPreview(this.retrievedResults, requestId);
      } catch (error) {
        if (requestId !== this.cachedResultsRequestId) return;
        console.error("Error loading cached results:", error);
        this.retrievedResults = null;
        if (this.isMissingCachedResultsFile(error)) {
          this.cachedResultsState = "missing";
          this.cachedResultsMessage = null;
        } else {
          this.cachedResultsState = "error";
          this.cachedResultsMessage =
            "The cached results file could not be loaded right now.";
        }
      }
    },
    // retrieves cached query for display
    async fetchQuery(hash: string, cacheLoc: string) {
      this.retrievedQuery = await fetchQueryFileData(`${cacheLoc}/${hash}.rq`);
      this.togglRetrievedQuery();
    },

    /**
     * Obtains a list of agents that have access to the designated resource or container
     *
     * @param path the URL of the resource or container for which access rights are to be displayed
     */
    async getSpecificCacheAclData() {
      const cacheUrl = this.selectedPodUrl + "querycache/";
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
      const queryUrl = this.selectedPodUrl + "querycache/" + queryHash;
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
      const cacheUrl = this.selectedPodUrl + "querycache/";
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
    validateCustomCachePath() {
      if (this.useCustomCachePath && this.customCachePath) {
        try {
          new URL(this.customCachePath);
          this.cacheError = null; // Clear error if valid
        } catch {
          this.cacheError = "Invalid URL. Please enter a valid URL.";
        }
      } else {
        this.cacheError = null; // Clear error if not using custom path
      }
    },
  },
  watch: {
    useCustomCachePath(newValue) {
      if (newValue) {
        this.showCustomCache = true;
      }
    },
    cacheError(newValue) {
      if (newValue) {
        this.showCustomCache = true;
      }
    },
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
    window.removeEventListener("resize", this.updateQueryLayoutMode);
    if (this.worker) this.worker.terminate();
    if (this.yasqe) this.yasqe.destroy();
    if (this.yasr && (this.yasr as any).destroy) (this.yasr as any).destroy();
    if (this.cachedYasr && (this.cachedYasr as any).destroy) {
      (this.cachedYasr as any).destroy();
    }
  },
  async mounted() {
    await this.authStore.initializeAuth();
    this.loadExampleQueries();
    this.yasqe = new Yasqe(document.getElementById("yasqe-container")!, {
      showQueryButton: false,
    });
    this.yasqe.setValue(this.currentQuery.query);
    this.yasqe.on("change", (instance) => {
      this.currentQuery.query = instance.getValue();
    });
    this.updateQueryLayoutMode();
    window.addEventListener("resize", this.updateQueryLayoutMode);
    this.handleDelay();
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
  box-shadow: var(--shadow-1);
}
.tool-tip {
  font-family: "Oxanium", monospace;
}

.query-page {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* Title bar */
.title-container {
  margin: 0.4rem 0.5rem 0 0.5rem;
  padding: 1.15rem 1.35rem;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 9%, var(--bg-secondary)) 0%,
    var(--bg-secondary) 58%
  );
  box-shadow: var(--shadow-1);
}
.title-container span {
  display: block;
  font-size: clamp(1.8rem, 3vw, 2.2rem);
  font-family: "Oxanium", monospace;
  font-weight: 600;
  color: var(--text-primary);
}
.page-summary {
  margin: 0.35rem 0 0;
  max-width: 48rem;
  font-family: "Oxanium", monospace;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-muted);
}
.delay-placeholder {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.query-access-shell {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.login-background {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
  margin: 0 0.5rem;
}

/* loading spinner for login-check */
.loading-spinner-container {
  display: flex;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 18px;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  margin: 0.4rem 0.5rem 0 0.5rem;
  padding: 0.9rem 1.1rem;
  box-shadow: var(--shadow-1);
}
.loading-text {
  font-family: "Oxanium", monospace;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  margin: 0 0.5rem;
}
.custom-cache-container {
  background-color: var(--bg-secondary);
  margin: 0 0.5rem;
  padding: 1rem 1.15rem;
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
}
.custom-cache-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.custom-cache-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.section-kicker {
  margin: 0 0 0.35rem;
  font-family: "Oxanium", monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.custom-cache-header h3 {
  margin: 0;
  font-family: "Oxanium", monospace;
  font-size: clamp(0.95rem, 1.55vw, 1.1rem);
  font-weight: 600;
  color: var(--text-primary);
}
.cache-toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-family: "Oxanium", monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  background-color: color-mix(in srgb, var(--panel) 78%, transparent);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.cache-toggle-button:hover {
  background-color: color-mix(in srgb, var(--primary) 12%, var(--panel));
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
}
.custom-cache-body {
  margin-top: 0.7rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--border);
}
.custom-cache-path {
  display: flex;
  flex-wrap: wrap;
  font-family: "Oxanium", monospace;
  align-items: center;
  justify-content: flex-start;
  gap: 0.85rem;
}
.custom-cache-guide {
  color: var(--text-muted);
}
.custom-cache-checkbox {
  min-width: fit-content;
  padding: 0;
  color: var(--text-secondary);
}
.custom-cache-input {
  flex: 1 1 22rem;
  min-width: 16rem;
  padding: 0;
  color: var(--text-secondary);
}
.custom-cache-error {
  display: flex;
  font-family: "Oxanium", monospace;
  padding-top: 0.6rem;
  justify-content: flex-start;
}
.custom-cache-error span {
  padding: 0.65rem 0.85rem;
  border-radius: 999px;
  background-color: var(--danger);
  color: var(--main-white);
}
/* Whole nav and query container */
.general-container {
  margin: 0.4rem 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 26px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 6%, var(--bg-secondary)) 0%,
    var(--bg-secondary) 32%,
    color-mix(in srgb, var(--panel) 84%, transparent) 100%
  );
  box-shadow: var(--shadow-1);
}
.general-container.nav-collapsed {
  gap: 0.6rem;
}

/* Left nav bar */
.general-container :deep(.v-input__details) {
  display: none !important;
}
.nav-container {
  display: flex;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--primary) 8%, var(--panel)) 0%,
    color-mix(in srgb, var(--panel) 92%, transparent) 100%
  );
  border: 1px solid var(--border);
  border-radius: 24px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  width: 14rem;
  min-width: 14rem;
  box-shadow: none;
  transition: width 0.22s ease, min-width 0.22s ease;
}
.general-container.nav-collapsed .nav-container {
  width: 4.5rem;
  min-width: 4.5rem;
}
.nav-container ul {
  list-style-type: none;
  padding: 1rem 1.05rem;
  height: 100%;
  overflow: auto;
  color: var(--text-secondary);
}
.nav-container li span {
  display: block;
  font-size: 1.3rem;
  font-weight: 600;
  text-decoration: none;
}
.nav-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--border);
}
.nav-header-row span {
  flex: 1;
  align-items: center;
  margin-bottom: 0;
  border-bottom: none;
  padding: 0;
}
.nav-header-spacer {
  flex: 1;
}
.nav-toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--panel) 90%, transparent) 0%,
    color-mix(in srgb, var(--primary) 8%, var(--panel)) 100%
  );
  color: var(--text-secondary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: background-color 0.2s ease, border-color 0.2s ease,
    transform 0.2s ease;
}
.nav-toggle-button:hover {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--primary) 12%, var(--panel)) 0%,
    color-mix(in srgb, var(--primary) 18%, var(--panel)) 100%
  );
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
}
.nav-toggle-button .material-icons {
  font-size: 1.1rem;
  line-height: 1;
}
.general-container.nav-collapsed .nav-header-row {
  justify-content: center;
}
.nav-copy {
  margin: 0 0 0.8rem;
  font-family: "Oxanium", monospace;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--text-muted);
}
.general-container.nav-collapsed .nav-copy {
  display: none;
}
#top-button {
  margin-top: 0;
}
.nav-container li button {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--text-secondary);
  border-radius: 16px;
  padding: 0.8rem 0.95rem;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.nav-button-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
.general-container.nav-collapsed .nav-container ul {
  padding-left: 0.65rem;
  padding-right: 0.65rem;
}
.general-container.nav-collapsed .nav-container li button {
  justify-content: center;
  padding-left: 0.6rem;
  padding-right: 0.6rem;
}
.nav-container li button.active {
  background-color: var(--success);
  color: var(--main-white);
}
.nav-container li button:hover:not(.active) {
  background-color: var(--hover);
  color: var(--text-muted);
}
.nav-container .highlight {
  background-color: var(--primary);
  color: var(--main-white);
}

/* Query elements */
.query-container {
  padding: 1.1rem 1.2rem;
  width: 100%;
  flex: 1 1 auto;
  min-width: 0;
  font-family: "Oxanium", monospace;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--bg-secondary) 94%, var(--panel)) 0%,
    var(--bg-secondary) 100%
  );
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: none;
  position: relative;
}

.example-dropdown {
  min-width: min(22rem, 100%);
}
.query-container ul {
  list-style-type: none;
  height: 100%;
  overflow: auto;
  padding: 0;
  margin: 0;
}
.query-container .top-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}
.example-queries {
  margin-left: auto;
  max-width: 24rem;
  margin: 0;
}
.example-queries :deep(.v-input__details) {
  display: none;
}
.top-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
}
.top-label {
  display: block;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  font-weight: 600;
  color: var(--text-primary);
}
/* Query Container Customizations */
#yasqe-container {
  border: 3px solid var(--yasqe-bg);
  border-radius: 8px;
  margin-bottom: 1rem;
}
#yasqe-container :deep(.CodeMirror-gutters) {
  background-color: var(--yasqe-bg);
}
#yasqe-container :deep(.resizeWrapper) {
  background-color: var(--yasqe-bg);
}
#yasqe-container :deep(.CodeMirror) {
  background-color: var(--yasqe-bg-2);
  border: 1px solid var(--yasqe-bg);
  color: #ede7f6;
}
#yasqe-container :deep(.CodeMirror-linenumber) {
  padding: 0;
}
#yasqe-container :deep(.notification.notif_property) {
  background-color: var(--yasqe-bg);
  padding: 0;
  color: #a9a7ad;
}
#yasqe-container :deep(.notification.active) {
  background-color: var(--yasqe-bg);
  padding: 0;
  color: var(--text-muted);
}
#yasqe-container :deep(.yasqe_buttons) {
  display: none;
}
/* TODO: Change colors to look nicer */
#yasqe-container :deep(.cm-keyword) {
  color: var(
    --yasqe-keyword
  ); /* Example: purple for keywords like SELECT, WHERE */
}
#yasqe-container :deep(.cm-atom) {
  color: var(--yasqe-atom); /* Example: orange for atoms like 'a' */
}
#yasqe-container :deep(.cm-variable-2) {
  color: var(--yasqe-variable-2); /* Example: blue for variables like ?s */
}
#yasqe-container :deep(.cm-string) {
  color: var(--yasqe-string); /* Example: green for string literals */
}
#yasqe-container :deep(.cm-string-2) {
  color: var(--yasqe-string-2); /* Example: red for IRI's like <http://...> */
}
#yasqe-container :deep(.cm-variable-3) {
  color: var(--yasqe-variable-3); /* Example: red for IRI's like <http://...> */
}
#yasqe-container :deep(.cm-number) {
  color: var(--yasqe-number); /* Example: red for IRI's like <http://...> */
}
#yasqe-container :deep(.cm-comment) {
  color: var(--yasqe-comment); /* Example: grey for comments */
}
#yasqe-container :deep(.cm-operator) {
  color: var(--yasqe-operator); /* Example: light blue for operators */
}
#yasqe-container :deep(.cm-meta) {
  color: var(--yasqe-meta); /* Example: yellow for PREFIX */
}
#yasqe-container :deep(.cm-punc) {
  color: var(--text-primary); /* Example: yellow for PREFIX */
}
#yasqe-container :deep(.cm-matchhighlight) {
  background-color: var(
    --yasqe-matchhighlight
  ); /* Example: yellow for PREFIX */
}
#yasqe-container :deep(.CodeMirror-cursor) {
  border-left: 1px solid var(--yasqe-cursor); /* Example: yellow cursor */
}
#yasqe-container :deep(.CodeMirror-selected) {
  background: var(--yasqe-selected); /* Example: dark grey for selection */
}

/* source designation */
.source-selection {
  display: flex;
  align-items: center;
  border-radius: 16px;
  margin: 0 0 0.85rem;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
  color: var(--text-secondary);
  overflow: hidden;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--primary) 8%, var(--panel)) 0%,
    color-mix(in srgb, var(--panel) 86%, transparent) 100%
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
.source-selection span {
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.7rem 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  border-right: 1px solid color-mix(in srgb, var(--primary) 14%, var(--border));
}
.source-selection .autocomplete {
  padding: 0.15rem 0.5rem 0.15rem 0.15rem;
  width: 100%;
}
.source-selection :deep(.v-field__input) {
  padding: 0.35rem 0 !important;
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
  flex-wrap: wrap;
  gap: 0.7rem;
}
/* execute */
.execute-button {
  padding: 0.65rem 0.9rem;
  border: 2px solid var(--yasqe-bg);
  border-radius: 14px;
  color: var(--text-secondary);
}
.cancel-query {
  padding: 8px 14px;
  border: 2px solid var(--yasqe-bg);
  border-radius: 8px;
  color: var(--text-secondary);
}
.query-container .execute-button:hover {
  background-color: var(--primary);
  color: var(--main-white);
}
.query-container .execute-button:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}
.sparql-guide {
  margin-left: auto;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}
.clear-button {
  padding: 0.65rem 0.9rem;
  margin-right: 0.5rem;
  border: 2px solid var(--yasqe-bg);
  border-radius: 14px;
  color: var(--text-secondary);
}
.query-container .clear-button:hover {
  background-color: var(--danger);
}
.query-container .clear-button:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}
.save-query {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  padding: 0.1rem 0.25rem;
}
.save-checkbox {
  padding: 0 0 0 0.5rem;
}
.save-info {
  padding: 0;
  color: var(--text-muted);
}
/* message in past queries when no pod is connected */
.no-pod {
  color: var(--text-secondary);
  display: block;
  text-align: center;
  font-size: 0.98rem;
  line-height: 1.7;
  padding: 1.4rem 1rem;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background-color: color-mix(in srgb, var(--panel) 72%, transparent);
}

/* Past Queries Display */
.query-catalog {
  background-color: var(--panel);
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
  justify-content: space-between;
}
.cached-container {
  width: 100%;
}
.cached-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.cached-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.cached-title {
  display: block;
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  font-weight: 600;
  color: var(--text-secondary);
}
.cached-meta {
  font-size: 0.88rem;
  color: var(--text-muted);
}
.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.58rem 0.82rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 0.9rem;
  font-weight: 600;
}
.cached-filters-panel {
  margin-bottom: 0.95rem;
}
.filters-panel {
  display: grid;
  gap: 0.8rem;
  padding: 1rem 1rem 1.05rem 1rem;
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--panel-elev) 95%, var(--panel) 5%),
    color-mix(in srgb, var(--panel) 98%, var(--panel-elev) 2%)
  );
  box-shadow: var(--shadow-1);
}
.filter-group {
  display: grid;
  gap: 0.4rem;
}
.filter-label {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.filter-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.filter-chip {
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--panel);
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 0.88rem;
  font-weight: 600;
}
.filter-chip.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  border-color: transparent;
  color: var(--main-white);
}
.filter-input,
.filter-select {
  width: 100%;
  min-width: 0;
  padding: 0.9rem 1rem;
  border: 1px solid color-mix(in srgb, var(--border) 72%, var(--primary) 28%);
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--panel) 88%, white 12%),
    var(--panel)
  );
  color: var(--text-primary);
  font-family: "Oxanium", monospace;
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.14);
}
.filter-input::placeholder {
  color: var(--text-muted);
}
.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--primary) 62%, var(--border) 38%);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent),
    inset 0 1px 0 hsl(0 0% 100% / 0.14);
}
.filter-actions {
  display: flex;
  justify-content: flex-end;
}
.filter-reset {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-family: "Oxanium", monospace;
  font-size: 0.9rem;
  font-weight: 600;
}
.no-cached-queries {
  color: var(--text-secondary);
  font-size: 0.98rem;
  padding: 1.4rem 1rem;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background-color: color-mix(in srgb, var(--panel) 72%, transparent);
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
  background-color: color-mix(in srgb, var(--panel) 74%, transparent);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 0.85rem;
  margin: 0.65rem 0;
  transition: all 0.3s ease-in-out;
}
.folder:hover {
  background-color: color-mix(in srgb, var(--panel) 92%, transparent);
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
  color: var(--text-secondary);
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
.cached-query-summary {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.cached-query-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.cached-query-hash {
  font-size: 0.8rem;
  color: var(--text-muted);
}
/* Ensures icons align correctly */
.material-icons {
  font-size: 24px;
}
/* Ensures the info icon is at the right */
.info-icon {
  margin-left: auto;
}

@media (max-width: 780px) {
  .cached-header {
    align-items: stretch;
    flex-direction: column;
  }

  .cached-header-actions {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .filter-toggle {
    width: 100%;
    justify-content: center;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-reset {
    width: 100%;
    text-align: center;
  }

  .cached-results-preview-header {
    align-items: stretch;
    flex-direction: column;
  }
}
/* Query Title */
.query-title {
  flex-grow: 1;
  text-align: left;
  padding-left: 10px;
  color: var(--text-secondary);
}
.card-panel .not-colored {
  color: var(--text-secondary);
}
/* Query Details (Hidden by Default) */
.specific-query {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: color-mix(in srgb, var(--bg-secondary) 84%, transparent);
  padding: 0.75rem;
  margin-top: 0.7rem;
  border-radius: 14px;
  color: var(--text-secondary);
}
/* Query Details Spacing */
.specific-query div {
  padding: 8px;
  border-bottom: 1px solid var(--border);
}
.specific-query div:last-child {
  border-bottom: none;
}
/* Query Labels */
.user-tag {
  font-weight: bold;
  color: var(--text-secondary);
}
/* Query Data */
.the-user {
  color: var(--yasqe-variable-2);
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
  color: var(--yasqe-keyword);
  text-decoration: none;
}
.query-sources a:hover {
  text-decoration: underline;
}
.query-metadata-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}
.metadata-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  background: color-mix(in srgb, var(--panel-elev) 76%, transparent);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: "Oxanium", monospace;
}
.status-chip {
  color: var(--primary-700);
  border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
  background: color-mix(in srgb, var(--primary) 10%, var(--panel));
}
.cached-results-preview {
  display: grid;
  gap: 0.7rem;
  margin-top: 0.2rem;
  padding: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--border) 82%, var(--primary) 18%);
  border-radius: 16px;
  background: color-mix(in srgb, var(--panel) 88%, var(--panel-elev) 12%);
}
.cached-results-preview.loading-state,
.cached-results-preview.empty-state,
.cached-results-preview.missing-state,
.cached-results-preview.error-state {
  justify-items: start;
}
.cached-results-preview.empty-state {
  border-color: color-mix(in srgb, var(--warning) 30%, var(--border));
  background: color-mix(in srgb, var(--warning) 8%, var(--panel));
}
.cached-results-preview.missing-state,
.cached-results-preview.error-state {
  border-color: color-mix(in srgb, var(--danger) 30%, var(--border));
  background: color-mix(in srgb, var(--danger) 8%, var(--panel));
}
.cached-results-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}
.cached-results-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
}
.cached-results-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.edit-delete {
  padding: 0;
  margin: 0;
}
.query-entry-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}
/* Keep cached-query actions as one compact toolbar, including delete. */
.secondary-action-button,
.panel-submit-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
  background-color: color-mix(in srgb, var(--panel) 82%, transparent);
}
.secondary-action-button:hover,
.panel-submit-button:hover {
  background-color: color-mix(in srgb, var(--primary) 14%, var(--panel));
}
.delete-button {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 28%, var(--border));
  background-color: color-mix(in srgb, var(--danger) 10%, var(--panel));
}
.delete-button:hover {
  background-color: color-mix(in srgb, var(--danger) 18%, var(--panel));
}
.query-entry-panel {
  margin-bottom: 0.85rem;
  padding: 0.85rem;
  border: 1px solid var(--border);
  border-radius: 16px;
  background-color: color-mix(in srgb, var(--bg-secondary) 88%, transparent);
}
.query-entry-panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
}
.panel-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.query-entry-panel-body {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}
.query-entry-panel-body :deep(.v-input) {
  flex: 1 1 18rem;
}
.panel-feedback {
  display: block;
  margin-top: 0.65rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.panel-feedback.success {
  color: var(--success);
}

#cached-yasr-container :deep(.yasr) {
  font-family: "Oxanium", monospace;
  background-color: var(--panel-elev);
  color: var(--text-secondary) !important;
  border-radius: 12px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  overflow: hidden;
}
#cached-yasr-container :deep(.yasr_header),
#cached-yasr-container :deep(.tableControls),
#cached-yasr-container :deep(.dataTables_info),
#cached-yasr-container :deep(.dataTables_paginate),
#cached-yasr-container :deep(.yasr_download_control),
#cached-yasr-container :deep(.yasr_response_chip),
#cached-yasr-container :deep(.space_element) {
  display: none !important;
}
#cached-yasr-container :deep(.yasr_results) {
  overflow-x: auto;
}
#cached-yasr-container :deep(.dataTable) {
  min-width: 100%;
  margin: 0 !important;
}
#cached-yasr-container :deep(thead tr th) {
  background: color-mix(in srgb, var(--primary) 18%, var(--panel-elev));
  color: var(--text-primary);
  font-size: 0.86rem;
  font-weight: 700;
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--border);
}
#cached-yasr-container :deep(tbody tr td) {
  padding: 0.7rem 0.8rem;
  border-top: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
  white-space: normal;
  overflow-wrap: break-word;
  color: var(--text-secondary);
}
#cached-yasr-container :deep(tbody tr:nth-child(even)) {
  background: color-mix(in srgb, var(--panel) 92%, var(--panel-elev) 8%);
}
#cached-yasr-container :deep(tbody tr:nth-child(odd)) {
  background: color-mix(in srgb, var(--panel-elev) 86%, transparent);
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
  background-color: var(--bg);
  color: var(--text-secondary);
  padding: 15px;
  border-radius: 6px;
  font-family: "Courier New", monospace;
  font-size: 14px;
  overflow-x: auto;
  max-height: 250px;
  border-left: 4px solid var(--primary);
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
  color: var(--text-secondary);
}
/* Displayed query results from .json file */
.query-results {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
/* Deletion success pop-up */
.success-popup {
  font-family: "Oxanium", monospace;
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: var(--success);
  color: var(--main-white);
  padding: 1rem;
  border-radius: 8px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-1);
}
.close-popup-button {
  background: none;
  border: none;
  color: var(--main-white);
  cursor: pointer;
  margin-left: 1rem;
}

/* Container for the Table */
.results-container {
  max-height: 60rem;
  min-height: 10rem;
  overflow-y: auto;
  border-radius: 24px;
  margin: 0 0.5rem 0.4rem 0.5rem;
  padding: 1rem 1.15rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
  color: var(--text-secondary);
  scrollbar-color: dark;
  scrollbar-width: thin;
}
.results-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.results-title {
  display: block;
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  font-weight: 600;
  color: var(--text-primary);
}
.results-status {
  font-size: 0.88rem;
  color: var(--text-muted);
}

@media (max-width: 1080px) {
  .general-container {
    flex-direction: column;
    padding: 0.65rem;
  }

  .nav-container {
    width: 100%;
    min-width: 0;
  }

  .general-container.nav-collapsed .nav-container {
    width: 100%;
    min-width: 0;
  }

  .nav-container ul {
    width: 100%;
  }

  .general-container.nav-collapsed {
    gap: 0.45rem;
  }

  .general-container.nav-collapsed .nav-container ul {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.65rem 0.8rem;
  }

  .general-container.nav-collapsed .nav-header-row {
    width: auto;
    margin: 0;
    padding: 0;
    border-bottom: none;
    margin-left: auto;
    order: 10;
  }

  .general-container.nav-collapsed .nav-header-spacer {
    display: none;
  }

  .general-container.nav-collapsed .nav-copy {
    display: none;
  }

  .general-container.nav-collapsed .nav-container li {
    margin: 0;
  }

  .general-container.nav-collapsed .nav-container li button {
    justify-content: center;
    padding: 0.65rem 0.85rem;
  }

  .general-container.nav-collapsed .nav-container li button span {
    display: none;
  }

  .general-container.nav-collapsed .nav-button-icon {
    margin: 0;
  }

  .query-container {
    width: 100%;
  }
}

@media (max-width: 760px) {
  .title-container,
  .custom-cache-container,
  .query-container,
  .results-container,
  .nav-container {
    border-radius: 20px;
  }

  .title-container,
  .custom-cache-container,
  .query-container,
  .results-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .custom-cache-header,
  .top-container,
  .cached-header,
  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .custom-cache-actions {
    width: 100%;
    justify-content: space-between;
  }

  .example-dropdown,
  .example-queries,
  .custom-cache-input {
    width: 100%;
    max-width: none;
  }

  .nav-header-row {
    margin-bottom: 0.5rem;
  }

  .nav-container li span {
    font-size: 1.15rem;
  }

  .nav-copy {
    font-size: 0.8rem;
  }

  .source-selection {
    flex-direction: column;
    align-items: stretch;
  }

  .source-selection span {
    padding-bottom: 0;
  }

  .bottom-container {
    align-items: stretch;
  }

  .save-query,
  .sparql-guide {
    margin-left: 0;
  }

  .sparql-guide {
    width: 100%;
    justify-content: space-between;
  }

  .nav-container li button {
    font-size: 0.95rem;
  }

  .query-entry-panel-header,
  .query-entry-panel-body {
    flex-direction: column;
    align-items: flex-start;
  }
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

/* No results */
.null-results {
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
  font-size: 14pt;
  padding: 0.25rem;
  text-align: center;
}
.null-results b {
  color: var(--error);
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
  background-color: var(--yasqe-bg);
  color: var(--text-secondary) !important;
  border-radius: 8px;
  padding: 0;
  margin-top: 0.5rem;
  border: 2px solid var(--border);
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
  color: var(--text-secondary);
}
#yasr-container :deep(.yasr_btn.select_table.selected) {
  color: var(--text-secondary) !important;
  border-bottom: 3px solid var(--primary);
}
#yasr-container :deep(.yasr_btn.select_response.selected) {
  color: var(--text-secondary) !important;
  border-bottom: 3px solid var(--primary);
}
#yasr-container :deep(.yasr_btnGroup) {
  color: var(--text-secondary) !important;
}
#yasr-container :deep(.yasr_download_control) {
  margin-left: auto;
}
#yasr-container :deep(.tableControls div) {
  padding: 0 1rem 0 1.5rem;
  border-left: 1px solid var(--bg-secondary);
}
#yasr-container :deep(.yasr_plugin_control label span) {
  margin: 0 0.5rem 0 0;
}
#yasr-container :deep(.tableFilter) {
  padding: 0 0.5rem 0 0.5rem;
  margin-right: 0;
  color: var(--text-secondary);
  border-left: 1px solid var(--bg-secondary);
  text-align: center !important;
}
#yasr-container :deep(.pageSizeWrapper) {
  padding: 0 1rem 0 1.5rem !important;
  text-align: center !important;
  border-right: 1px solid var(--bg-secondary);
}
#yasr-container :deep(.pageSizeWrapper select) {
  padding: 0;
  text-align: center !important;
  color: var(--text-secondary);
  background-color: var(--yasqe-bg);
}
#yasr-container :deep(.yasr_external_ref_btn) {
  display: none;
}
#yasr-container :deep(.yasr_btn) {
  color: var(--text-secondary);
}
#yasr-container :deep(.yasr_btnGroup) {
  color: var(--text-secondary) !important;
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
  background-color: var(--bg);
  border: 1px solid var(--border) !important;
  border-radius: 4px !important;
  margin-right: 0.5rem;
}
#yasr-container :deep(ul.yasr_tabs li.active) {
  background-color: var(--muted);
}
#yasr-container :deep(ul.yasr_tabs li span) {
  color: var(--text-secondary) !important;
}
/* Table results */
#yasr-container :deep(.yasr_results) {
  border-radius: 6px;
  overflow-x: auto;
  scrollbar-color: dark;
  scrollbar-width: thin;
}
#yasr-container :deep(.dataTable) {
  max-width: fit-content;
  min-width: 100%;
}
#yasr-container :deep(thead tr th) {
  background-color: var(--primary);
  color: var(--main-white);
  font-weight: bold;
  font-size: 13pt;
  padding: 12px 15px;
  text-align: left;
  border: none;
  white-space: normal;
}
#yasr-container :deep(tbody tr:nth-child(even)) {
  background-color: var(--bg);
}
#yasr-container :deep(tbody tr:nth-child(odd)) {
  background-color: var(--panel);
}
#yasr-container :deep(tbody tr:hover) {
  background-color: var(--border);
  cursor: pointer;
}
#yasr-container :deep(tbody tr td) {
  padding: 12px 15px;
  border: none;
  border-top: 1px solid var(--border);
  white-space: normal; /* Allow cell content to wrap */
  overflow-wrap: break-word; /* Break long words to prevent overflow */
}
#yasr-container :deep(tbody tr:first-child td) {
  border-top: none;
}
#yasr-container :deep(tbody tr td .nonIri) {
  color: var(--text-secondary);
}
#yasr-container :deep(tbody tr td .iri) {
  color: var(--yasqe-keyword);
}
#yasr-container :deep(.CodeMirror-lines) {
  background-color: var(--panel);
  text-decoration: none;
}
#yasr-container :deep(.CodeMirror-gutters) {
  background-color: var(--yasqe-bg);
}
#yasr-container :deep(.resizeWrapper) {
  background-color: var(--yasqe-bg);
}
#yasr-container :deep(.CodeMirror) {
  background-color: var(--panel);
  border: 1px solid var(--yasqe-bg);
  color: var(--text-secondary);
}
#yasr-container :deep(.CodeMirror-linenumber) {
  padding: 0;
}
#yasr-container :deep(.cm-string) {
  color: var(--yasqe-string); /* Example: green for string literals */
}
#yasr-container :deep(.cm-property) {
  color: var(--yasqe-keyword); /* Example: red for IRI's like <http://...> */
}
#yasr-container :deep(.overlay_content) {
  border-radius: 6px;
}
#yasr-container :deep(.overlay_content button) {
  border-radius: 6px;
}
#yasr-container ::selection {
  background: var(--yasqe-selected); /* highlight background */
  color: var(--yasqe-number); /* highlighted text color */
}

#yasr-container :deep(.dataTables_info) {
  padding-left: 0.5rem;
  color: var(--text-muted);
}
#yasr-container :deep(.paginate_button) {
  color: var(--text-muted) !important;
}

.cache-header {
  font-family: "Oxanium", monospace;
  display: flex;
  align-items: center;
  background-color: var(--panel);
  border-radius: 6px;
}
.query-hash {
  display: flex;
  margin-right: auto;
  margin-left: 2rem;
  color: var(--yasqe-keyword);
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
  background-color: var(--primary);
  font-weight: bold;
  color: var(--main-white);
}
/* Alternate Header colors */
.result-table th:nth-child(even) {
  background-color: var(--primary-600);
}
/* Alternating Row Colors */
.result-table tr:nth-child(even) {
  background-color: var(--bg);
}
.result-table tr:nth-child(odd) {
  background-color: var(--panel-elev);
}
/* Hover Effect */
.result-table tr:hover {
  background-color: var(--hover); /* Light blue highlight */
  cursor: pointer;
}

/* Sharing of a cached query */
.sharing-prompt {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  margin-top: 0.5rem;
}
.sharing-prompt:hover {
  background-color: var(--hover);
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
  background-color: var(--bg-secondary);
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

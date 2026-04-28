<template>
  <section class="browser-page">
    <!-- Page header mirrors the upload page structure and visual hierarchy. -->
    <div class="title-container">
      <div>
        <span>Pod Data Browser</span>
        <p class="page-summary">
          Browse containers and resources in your pod, inspect item details, and
          manage content from one place.
        </p>
      </div>
    </div>

    <div v-if="deletionSuccess" class="success-popup">
      <span>{{ deletedItemType }} deleted successfully!</span>
      <button @click="deletionSuccess = false" class="close-popup-button">
        <i class="material-icons">close</i>
      </button>
    </div>

    <div class="pod-chooseContainer">
      <PodRegistration />
    </div>

    <div class="browser-shell" v-if="selectedPodUrl !== ''">
      <div class="container-location">
        <!-- Container selection mirrors the upload destination card for consistency. -->
        <div class="path-card">
          <div class="path-card-header">
            <div>
              <p class="section-kicker">Browse containers</p>
              <h3>Choose container to inspect</h3>
            </div>
            <div class="path-origin">
              <span class="path-origin-value" :title="currentLocation">
                {{ currentLocation }}
              </span>
            </div>
          </div>

          <div class="browser-layout">

            <container-nav
              :currentPod="selectedPodUrl"
              @path-selected="handleSelectedContainer"
            />
          </div>
        </div>
      </div>

      <div class="pod-directories">
        <div class="items-card" :key="renderKey">
          <div class="items-header">
            <div>
              <p class="section-kicker">Selected container contents</p>
              <p class="items-summary">
                You are browsing the contents of
                <span class="items-location">{{ currentLocation }}</span>
              </p>
            </div>
            <div class="items-header-actions">
              <button class="filter-toggle" @click="filtersOpen = !filtersOpen">
                <i class="material-icons">filter_alt</i>
                <span>Filters</span>
              </button>
              <span class="items-count">{{ filteredUrls.length }} of {{ urls.length }} items</span>
            </div>
          </div>

          <!-- Filters stay hidden until requested so the browser remains compact by default. -->
          <div v-if="filtersOpen" class="filters-panel">
            <div class="filter-group">
              <span class="filter-label">Item type</span>
              <div class="filter-chip-row">
                <button
                  class="filter-chip"
                  :class="{ active: itemTypeFilter === 'all' }"
                  @click="itemTypeFilter = 'all'"
                >
                  All
                </button>
                <button
                  class="filter-chip"
                  :class="{ active: itemTypeFilter === 'container' }"
                  @click="itemTypeFilter = 'container'"
                >
                  Containers
                </button>
                <button
                  class="filter-chip"
                  :class="{ active: itemTypeFilter === 'resource' }"
                  @click="itemTypeFilter = 'resource'"
                >
                  Resources
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label" for="itemSearch">Search items</label>
              <input
                id="itemSearch"
                v-model="itemSearch"
                class="filter-input"
                type="text"
                placeholder="Filter by item name or URL"
              />
            </div>

            <div class="filter-actions">
              <button class="filter-reset" @click="resetFilters">Reset filters</button>
            </div>
          </div>

          <ul class="items-list">
            <!-- Iterates over list of containers and resources in the current location. -->
            <li v-for="(url, index) in filteredUrls" :key="url">
              <div v-if="loadingIndex === index" class="loading-spinner-container">
                <div class="spinner"></div>
                <span class="loading-text">Loading item details...</span>
              </div>
              <div v-else class="item-card shared-style-card" :class="{ expanded: showInfoIndex === index }">
                <button @click="toggleInfo(index, url)" class="item-toggle">
                  <div class="item-main">
                    <i class="material-icons not-colored item-icon">{{
                      containerCheck(url) ? "folder" : "description"
                    }}</i>
                    <div class="item-copy item-copy-equalized">
                      <span class="item-name" :title="url">{{ url }}</span>
                    </div>
                  </div>
                  <div class="info-icon">
                    <i class="material-icons not-colored info-icon">
                      {{
                        showInfoIndex === index
                          ? "keyboard_arrow_down info"
                          : "chevron_right info"
                      }}</i>
                  </div>
                </button>

                <div v-if="showInfoIndex === index" class="item-info-container shared-style-details">
                  <div v-if="itemDetails === null" class="info-row">
                    <strong class="info-label">No info to display</strong>
                  </div>
                  <template v-else>
                    <div class="detail-grid">
                      <div v-if="itemDetails.parseWarning" class="info-warning">
                        <div class="info-warning-header">
                          <i class="material-icons">warning_amber</i>
                          <strong>{{ itemDetails.parseWarning.title }}</strong>
                        </div>
                        <p class="info-warning-summary">{{ itemDetails.parseWarning.summary }}</p>
                        <ul class="info-warning-list">
                          <li>
                            <strong>Fix hint:</strong>
                            {{ itemDetails.parseWarning.fixHint }}
                          </li>
                          <li v-if="itemDetails.parseWarning.lineNumber !== null">
                            <strong>Line:</strong>
                            {{ itemDetails.parseWarning.lineNumber }}
                          </li>
                          <li v-if="itemDetails.parseWarning.tokenPreview">
                            <strong>Problematic token:</strong>
                            <span class="info-warning-token">{{ itemDetails.parseWarning.tokenPreview }}</span>
                          </li>
                          <li v-if="itemDetails.parseWarning.contentType">
                            <strong>Content type:</strong>
                            {{ itemDetails.parseWarning.contentType }}
                          </li>
                        </ul>
                        <details class="info-warning-raw">
                          <summary>Technical parser details</summary>
                          <pre>{{ itemDetails.parseWarning.rawMessage }}</pre>
                        </details>
                      </div>

                      <!-- Summary row mirrors SharedWithMe's compact, scan-friendly metadata chips. -->
                      <div class="browser-summary-grid">
                        <div class="summary-cell">
                          <i class="material-icons tiny not-colored">label</i>
                          <div>
                            <span class="field-label">Name</span>
                            <span class="field-value" :title="itemDetails.itemName">{{
                              itemDetails.itemName
                            }}</span>
                          </div>
                        </div>
                        <div class="summary-cell">
                          <i class="material-icons tiny not-colored">category</i>
                          <div>
                            <span class="field-label">Type</span>
                            <span class="field-value">{{ itemDetails.itemType }}</span>
                          </div>
                        </div>
                        <div class="summary-cell">
                          <i class="material-icons tiny not-colored">schedule</i>
                          <div>
                            <span class="field-label">Date modified</span>
                            <span class="field-value">{{
                              itemDetails.lastModified || "Not available"
                            }}</span>
                          </div>
                        </div>
                        <div class="summary-cell">
                          <i class="material-icons tiny not-colored">{{
                            itemDetails.itemType === "Container" ? "folder_copy" : "save"
                          }}</i>
                          <div>
                            <span class="field-label">{{
                              itemDetails.itemType === "Container" ? "Direct items" : "File size"
                            }}</span>
                            <span class="field-value">{{
                              itemDetails.itemType === "Container"
                                ? (itemDetails.directChildren ?? "Not available")
                                : (itemDetails.sizeLabel || "Not available")
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="shared-me-resource-card browser-resource-card">
                        <div class="resource-main">
                          <i class="material-icons tiny not-colored">link</i>
                          <div class="resource-copy">
                            <span class="field-label">Resource URL</span>
                            <span class="field-value mono resource-url-value" :title="itemDetails.sourceIri">{{
                              itemDetails.sourceIri
                            }}</span>
                          </div>
                          <div class="resource-actions">
                            <button
                              class="field-copy-button"
                              type="button"
                              :aria-label="`Copy resource URL ${itemDetails.sourceIri}`"
                              @click="copyToClipboard(itemDetails.sourceIri)"
                              title="Copy resource URL"
                            >
                              <i class="material-icons tiny not-colored">content_copy</i>
                            </button>
                            <button
                              v-if="itemDetails.itemType === 'Resource'"
                              class="download-icon-button"
                              type="button"
                              :disabled="downloadingItem"
                              @click="downloadResource(itemDetails.sourceIri)"
                              :aria-label="`Download ${itemDetails.itemName}`"
                              title="Download file"
                            >
                              <i class="material-icons tiny not-colored">download</i>
                            </button>
                          </div>
                        </div>

                        <div class="resource-secondary-grid browser-resource-grid">
                          <div class="entry-field parent-container-field">
                            <span class="field-label">
                              <i class="material-icons tiny not-colored">subdirectory_arrow_right</i>
                              Parent container
                            </span>
                            <span class="field-value mono" :title="itemDetails.parentContainer">
                              {{ itemDetails.parentContainer }}
                            </span>
                          </div>
                          <div class="entry-field content-type-field">
                            <span class="field-label">
                              <i class="material-icons tiny not-colored">description</i>
                              Content type
                            </span>
                            <span class="field-value">{{ itemDetails.contentType || "Unknown" }}</span>
                          </div>
                          <div class="entry-field browser-metadata-field" v-if="itemDetails.metadataUrl">
                            <span class="field-label">
                              <i class="material-icons tiny not-colored">link</i>
                              Metadata
                            </span>
                            <div class="metadata-list">
                              <div
                                v-for="metadataEntry in normalizeMetadataEntries(itemDetails.metadataUrl)"
                                :key="metadataEntry"
                                class="info-value-container"
                              >
                                <a
                                  v-if="metadataEntryHref(metadataEntry)"
                                  :href="metadataEntryHref(metadataEntry) || undefined"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="field-value link mono"
                                  :title="metadataEntry"
                                  >{{ metadataEntry }}</a
                                >
                                <span v-else class="field-value mono" :title="metadataEntry">
                                  {{ metadataEntry }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p class="download-feedback" v-if="downloadFeedback">
                      {{ downloadFeedback }}
                    </p>

                    <div class="action-panel move-panel">
                      <button
                        class="action-toggle"
                        :class="{ expanded: movePanelOpen }"
                        @click="movePanelOpen = !movePanelOpen"
                      >
                        <span class="action-copy">
                          <span class="action-title">Move item</span>
                          <span class="action-helper">Choose another container for this item.</span>
                        </span>
                        <i class="material-icons action-chevron">
                          {{ movePanelOpen ? "keyboard_arrow_up" : "keyboard_arrow_down" }}
                        </i>
                      </button>

                      <div v-if="movePanelOpen" class="move-card">
                        <div class="move-header">
                          <span class="move-title">Move destination</span>
                          <span class="move-helper">Choose a destination container inside this pod or enter one directly.</span>
                        </div>
                        <div class="move-mode-switch">
                          <button
                            :class="{ active: moveInputType === 'customPath' }"
                            @click="moveInputType = 'customPath'"
                          >
                            Enter Path
                          </button>
                          <button
                            :class="{ active: moveInputType === 'browsePath' }"
                            @click="moveInputType = 'browsePath'"
                          >
                            Browse Containers
                          </button>
                        </div>
                        <div v-if="moveInputType === 'customPath'" class="move-manual">
                          <input
                            v-model="moveTargetPath"
                            class="move-input"
                            type="text"
                            :placeholder="`${selectedPodUrl}target-container/`"
                          />
                          <p class="move-path-hint">
                            Enter a full container URL inside the selected pod.
                          </p>
                        </div>
                        <div v-else class="move-browser">
                          <container-nav
                            :currentPod="selectedPodUrl"
                            @path-selected="handleMoveTargetSelected"
                          />
                        </div>
                        <div class="move-controls">
                          <v-btn
                            class="move-btn"
                            variant="outlined"
                            rounded="lg"
                            :disabled="movingItem || !canMoveItem(url)"
                            @click="moveItem(url)"
                          >
                            Move Item
                          </v-btn>
                        </div>
                        <p class="move-feedback" v-if="moveFeedback">
                          {{ moveFeedback }}
                        </p>
                      </div>
                    </div>

                    <div class="action-panel rename-panel">
                      <button
                        class="action-toggle"
                        :class="{ expanded: renamePanelOpen }"
                        @click="renamePanelOpen = !renamePanelOpen"
                      >
                        <span class="action-copy">
                          <span class="action-title">Rename item</span>
                          <span class="action-helper">Give this item a new name inside the current container.</span>
                        </span>
                        <i class="material-icons action-chevron">
                          {{ renamePanelOpen ? "keyboard_arrow_up" : "keyboard_arrow_down" }}
                        </i>
                      </button>

                      <div v-if="renamePanelOpen" class="rename-card">
                        <div class="rename-header">
                          <span class="rename-title">New name</span>
                          <span class="rename-helper">
                            Enter the new name only, without any path.
                          </span>
                        </div>
                        <div class="rename-controls">
                          <input
                            v-model="renameName"
                            class="rename-input"
                            type="text"
                            :placeholder="getItemName(url)"
                          />
                          <v-btn
                            class="rename-btn"
                            variant="outlined"
                            rounded="lg"
                            :disabled="renamingItem || !canRenameItem(url)"
                            @click="renameItem(url)"
                          >
                            Rename Item
                          </v-btn>
                        </div>
                        <p class="rename-feedback" v-if="renameFeedback">
                          {{ renameFeedback }}
                        </p>
                      </div>
                    </div>

                    <div class="action-panel delete-panel">
                      <div class="delete-copy">
                        <span class="action-title danger">Delete item</span>
                        <span class="action-helper">
                          Permanently remove this item from the pod.
                        </span>
                      </div>
                      <div class="edit-delete">
                        <button
                          @click="confirmAndDelete(itemDetails.sourceIri)"
                          class="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <div class="use-guide">
    <PodBrowserGuide />
  </div>
</template>

<script lang="ts">
import { fetchData, WorkingData } from "../services/solid/getData";
import {
  deleteFromPod,
  deleteContainer,
  getPodResourceDownload,
  movePodItem,
  renamePodItem,
} from "../services/solid/fileUpload";
import {
  getFile,
  getSolidDataset,
  getContainedResourceUrlAll,
  getDatetime,
  getDecimal,
  getInteger,
  getStringNoLocale,
  getThingAll,
} from "@inrupt/solid-client";
import { fetch as solidFetch } from "@inrupt/solid-client-authn-browser";
import ContainerNav from "./ContainerNav.vue";
import PodRegistration from "./PodRegistration.vue";
import PodBrowserGuide from "./Guides/PodBrowserGuide.vue";
import { useAuthStore } from "../stores/auth";
import { checkUrl } from "../services/solid/privacyEdit";

interface BrowserItemDetail {
  itemName: string;
  itemType: "Container" | "Resource";
  sourceIri: string;
  parentContainer: string;
  metadataUrl: string | string[] | null;
  contentType: string | null;
  sizeLabel: string | null;
  lastModified: string | null;
  directChildren: number | null;
  parseWarning: ItemParseWarning | null;
}

interface ItemParseWarning {
  title: string;
  summary: string;
  fixHint: string;
  lineNumber: number | null;
  tokenPreview: string | null;
  contentType: string | null;
  rawMessage: string;
}

const DCT_MODIFIED = "http://purl.org/dc/terms/modified";
const POSIX_MTIME = "http://www.w3.org/ns/posix/stat#mtime";

export default {
  components: {
    ContainerNav,
    PodRegistration,
    PodBrowserGuide,
  },
  data() {
    return {
      displayPath: "" as string,
      currentLocation: "" as string,
      showInfoIndex: null as number | null,
      showEditIndex: null as number | null,
      podData: null,
      urls: [] as string[],
      dirContents: null as WorkingData | null,
      containerContents: null as WorkingData | null,
      itemDetails: null as BrowserItemDetail | null,
      containerUrls: [] as string[],
      resourceUrls: [] as string[],
      container: [] as string[],
      queryItems: null as WorkingData | null,
      newName: "" as string,
      renderKey: 0 as number,
      deletionSuccess: false,
      deletedItemType: "" as "Resource" | "Container" | "",
      loadingIndex: null as number | null,
      filtersOpen: false,
      itemTypeFilter: "all" as "all" | "container" | "resource",
      itemSearch: "" as string,
      movePanelOpen: false,
      renamePanelOpen: false,
      moveInputType: "browsePath" as "customPath" | "browsePath",
      moveTargetPath: "" as string,
      moveFeedback: "" as string,
      movingItem: false,
      renameName: "" as string,
      renameFeedback: "" as string,
      renamingItem: false,
      downloadingItem: false,
      downloadFeedback: "" as string,
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
    // Filters are applied client-side so browsing remains responsive while the user refines results.
    filteredUrls(): string[] {
      const searchTerm = this.itemSearch.trim().toLowerCase();

      return this.urls.filter((url) => {
        const isContainer = this.containerCheck(url);
        const matchesType =
          this.itemTypeFilter === "all" ||
          (this.itemTypeFilter === "container" && isContainer) ||
          (this.itemTypeFilter === "resource" && !isContainer);

        if (!matchesType) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        const itemName = this.getItemName(url).toLowerCase();
        return itemName.includes(searchTerm) || url.toLowerCase().includes(searchTerm);
      });
    },
  },
  methods: {
    /*
    Calls executeQuery from queryPod.ts to obtain all data from logged-in user's Pod.
    Obtains items variable (IRIs of all Pod data).
    */
    // COOL IDEA --> << Interactable Knowledge graph (with tabular display toggle) >>
    async podContentsQuery() {
      this.queryItems = null;
    },
    /*
    TODO: Filters the binding stream to show only useful stuff...
    */
    filteredItems() {
      // not sure
    },

    /**
     * Displays a confirmation pop-up before deleting a resource.
     * If the user confirms, calls deleteResource.
     * If the user cancels, does nothing.
     *
     * @param fileUrl The URL of the resource to delete.
     */
    confirmAndDelete(fileUrl: string) {
      const isContainer = fileUrl.endsWith("/");
      const message = isContainer
        ? "Are you sure you want to delete this container and all its contents? This action cannot be undone."
        : "Are you sure you want to delete this resource? This action cannot be undone.";

      const userConfirmed = window.confirm(message);

      if (userConfirmed) {
        this.deleteResource(fileUrl);
      } else {
        console.log("Deletion canceled by the user.");
      }
    },

    /*
    Deleted the resource at the given URL.
    TODO: Add capability to delete containers that contain containers ...

    */
    async deleteResource(fileUrl: string) {
      try {
        const success = fileUrl.endsWith("/")
          ? await deleteContainer(fileUrl)
          : await deleteFromPod(fileUrl);

        // 2) Refetch with cache-busting to avoid stale SolidDataset
        if (success) {
          this.deletedItemType = fileUrl.endsWith("/")
            ? "Container"
            : "Resource";
          this.deletionSuccess = true;
          this.showInfoIndex = null;
          await this.getItems(this.displayPath);
          // this.urls = [...this.urls.filter((url) => url !== fileUrl)];
          // this.separateUrls();
          // this.renderKey += 1; // Force re-render
        } else {
          this.deletionSuccess = false;
        }
      } catch (err) {
        console.error(`Error deleting resource: ${fileUrl}`, err);
        alert(`An error occurred while deleting resource: ${fileUrl}`);
      }
    },

    async getItems(path: string) {
      try {
        this.displayPath = path;
        this.currentLocation = path;
        this.dirContents = await fetchData(path); // value is SolidDataset
        const urls = getContainedResourceUrlAll(this.dirContents);
        this.urls = [...urls];
        this.separateUrls();
      } catch (e) {
        console.error("Could not fetch data info from the URL provided...");
      }
    },

    formatFileSize(bytes: number): string {
      if (!bytes && bytes !== 0) {
        return "";
      }
      if (bytes < 1024) {
        return `${bytes} B`;
      }
      if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
    formatDate(dateValue: number | Date | string | null): string | null {
      if (!dateValue) {
        return null;
      }
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return date.toLocaleString();
    },
    formatMetadataTimestamp(timestamp: number): string | null {
      if (!Number.isFinite(timestamp)) {
        return null;
      }

      // POSIX stat mtime is usually seconds, while some APIs expose milliseconds.
      const milliseconds = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
      return this.formatDate(milliseconds);
    },
    validUrlCheck(u: string): boolean {
      try {
        new URL(u);
        return true;
      } catch (e) {
        return false;
      }
    },
    getItemName(path: string): string {
      return path.split("/").filter(Boolean).pop() || path;
    },
    /**
     * Metadata links may come back as a string, array, or serialized list-like
     * string. Normalize them into individual entries for display and link checks.
     */
    normalizeMetadataEntries(
      metadataValue: string | string[] | null,
    ): string[] {
      if (!metadataValue) {
        return [];
      }

      if (Array.isArray(metadataValue)) {
        return metadataValue
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);
      }

      const trimmedValue = metadataValue.trim();
      if (!trimmedValue) {
        return [];
      }

      // Handle serialized JSON arrays like ["a","b"].
      if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
        try {
          const parsedEntries = JSON.parse(trimmedValue);
          if (Array.isArray(parsedEntries)) {
            return parsedEntries
              .map((entry) => String(entry).trim())
              .filter((entry) => entry.length > 0);
          }
        } catch {
          // Fall through to lightweight list parsing below.
        }
      }

      // Handle simple list strings like "a, b" or "<a> <b>" without breaking
      // normal single-URL values.
      const splitEntries = trimmedValue
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      return splitEntries.length > 1 ? splitEntries : [trimmedValue];
    },
    /**
     * Returns a safe href for metadata entries when they are valid URLs. This
     * supports both plain URLs and RDF-style angle-bracket-wrapped IRIs.
     */
    metadataEntryHref(metadataEntry: string): string | null {
      const trimmedEntry = metadataEntry.trim();
      const normalizedEntry =
        trimmedEntry.startsWith("<") &&
        trimmedEntry.endsWith(">") &&
        trimmedEntry.length > 2
          ? trimmedEntry.slice(1, -1).trim()
          : trimmedEntry;

      if (!normalizedEntry) {
        return null;
      }

      return this.validUrlCheck(normalizedEntry) ? normalizedEntry : null;
    },
    async getMetadataModifiedDate(
      metadataValue: string | string[] | null,
    ): Promise<string | null> {
      const metadataUrls = this.normalizeMetadataEntries(metadataValue)
        .map((entry) => this.metadataEntryHref(entry))
        .filter((entry): entry is string => Boolean(entry));

      for (const metadataUrl of metadataUrls) {
        try {
          const metadataDataset = await fetchData(metadataUrl);
          if ("blob" in metadataDataset) {
            continue;
          }

          // Solid metadata commonly stores modified timestamps in dcterms or POSIX stat predicates.
          for (const thing of getThingAll(metadataDataset)) {
            const modifiedDate = getDatetime(thing, DCT_MODIFIED);
            if (modifiedDate) {
              return this.formatDate(modifiedDate);
            }

            const posixModified =
              getInteger(thing, POSIX_MTIME) ?? getDecimal(thing, POSIX_MTIME);
            const formattedTimestamp =
              posixModified !== null ? this.formatMetadataTimestamp(posixModified) : null;
            if (formattedTimestamp) {
              return formattedTimestamp;
            }

            const modifiedString = getStringNoLocale(thing, DCT_MODIFIED);
            const formattedStringDate = modifiedString
              ? this.formatDate(modifiedString)
              : null;
            if (formattedStringDate) {
              return formattedStringDate;
            }
          }
        } catch (error) {
          console.warn(`Could not read metadata date from ${metadataUrl}`, error);
        }
      }

      return null;
    },
    // Resetting filters returns the browser to the full selected-container contents view.
    resetFilters() {
      this.itemTypeFilter = "all";
      this.itemSearch = "";
    },
    // Renaming only accepts a plain item name so users cannot accidentally alter the container path.
    canRenameItem(itemUrl: string): boolean {
      const trimmedName = this.renameName.trim();
      return (
        trimmedName.length > 0 &&
        !trimmedName.includes("/") &&
        trimmedName !== this.getItemName(itemUrl)
      );
    },
    getParentContainer(path: string): string {
      if (path.endsWith("/")) {
        const segments = path.split("/").filter(Boolean);
        const containerName = segments.pop();
        return containerName ? path.replace(`${containerName}/`, "") : path;
      }
      return path.slice(0, path.lastIndexOf("/") + 1);
    },
    // Converts parser/runtime errors into actionable user-facing diagnostics.
    buildItemParseWarning(error: unknown, resourceUrl: string): ItemParseWarning {
      const rawMessage =
        error instanceof Error ? error.message : "Unknown error while reading resource.";
      const parserSignature = "Encountered an error parsing the Resource";
      const isParserError = rawMessage.includes(parserSignature);
      const lineMatch = rawMessage.match(/on line (\d+)/i);
      const tokenMatch = rawMessage.match(/Expected punctuation to follow \"([^\"]+)\"/i);
      const contentTypeMatch = rawMessage.match(/content type \[([^\]]+)\]/i);
      const parsedLine = lineMatch ? Number(lineMatch[1]) : null;

      if (isParserError) {
        return {
          title: "Invalid Turtle syntax detected",
          summary: parsedLine
            ? `This resource could not be parsed as Turtle (line ${parsedLine}).`
            : "This resource could not be parsed as Turtle.",
          fixHint: tokenMatch
            ? `Check punctuation or quoting near: ${tokenMatch[1]}`
            : "Check punctuation, quoting, and terminating characters in this Turtle file.",
          lineNumber: parsedLine,
          tokenPreview: tokenMatch ? tokenMatch[1] : null,
          contentType: contentTypeMatch ? contentTypeMatch[1] : "text/turtle",
          rawMessage,
        };
      }

      return {
        title: "Resource metadata could not be parsed",
        summary: "This resource loaded with limited metadata because parsing failed.",
        fixHint: "Verify file syntax and content type, then refresh this item.",
        lineNumber: parsedLine,
        tokenPreview: null,
        contentType: contentTypeMatch ? contentTypeMatch[1] : null,
        rawMessage: `${rawMessage}${rawMessage.includes(resourceUrl) ? "" : ` (${resourceUrl})`}`,
      };
    },
    async getItemInfo(path: string): Promise<BrowserItemDetail> {
      const itemType = this.containerCheck(path) ? "Container" : "Resource";
      let parseWarning: ItemParseWarning | null = null;
      let metadataUrl: string | string[] | null = null;
      let metadataModifiedDate: string | null = null;

      try {
        const dataset = await fetchData(path);
        metadataUrl = dataset.internal_resourceInfo?.linkedResources?.describedby || null;
        metadataModifiedDate = await this.getMetadataModifiedDate(metadataUrl);
      } catch (error) {
        parseWarning = this.buildItemParseWarning(error, path);
      }

      if (itemType === "Container") {
        let directChildren: number | null = null;
        try {
          const containerDataset = await getSolidDataset(path, { fetch: solidFetch });
          directChildren = getContainedResourceUrlAll(containerDataset).length;
        } catch (error) {
          parseWarning = parseWarning || this.buildItemParseWarning(error, path);
        }

        return {
          itemName: this.getItemName(path),
          itemType,
          sourceIri: path,
          parentContainer: this.getParentContainer(path),
          metadataUrl,
          contentType: "Container",
          sizeLabel: null,
          lastModified: metadataModifiedDate,
          directChildren,
          parseWarning,
        };
      }

      const file = await getFile(path, { fetch: solidFetch });
      return {
        itemName: this.getItemName(path),
        itemType,
        sourceIri: path,
        parentContainer: this.getParentContainer(path),
        metadataUrl,
        contentType: file.type || "Unknown",
        sizeLabel: this.formatFileSize(file.size),
        lastModified: metadataModifiedDate || this.formatDate(file.lastModified),
        directChildren: null,
        parseWarning,
      };
    },

    /*
    Checks if the input item url is a container
    */
    containerCheck(itemUrl: string) {
      return itemUrl.endsWith("/");
    },
    /**
     * Sorts container URLs and resource URLs into different lists
     */
    separateUrls() {
      this.containerUrls = [...this.urls.filter((url: string) => url.endsWith("/"))];
      this.resourceUrls = [...this.urls.filter((url: string) => !url.endsWith("/"))];
      if (
        this.currentLocation === this.selectedPodUrl &&
        !this.urls.includes(this.selectedPodUrl)
      ) {
        this.urls.push(this.selectedPodUrl);
        this.containerUrls.push(this.selectedPodUrl);
      }
      this.urls = [...this.urls.sort((a: string, b: string) => a.length - b.length)];
      this.container = [...this.urls.sort((a: string, b: string) => a.length - b.length)];
      this.resourceUrls = [...this.urls.sort((a: string, b: string) => a.length - b.length)];
    },

    /*
    Copies text to the clipboard
    */
    copyToClipboard(text: string) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy: ", err);
      });
    },

    /*
    Two methods for controlling the UI
    */
    toggleForm(index: number, url: string) {
      if (this.showEditIndex === index) {
        this.showEditIndex = null; // Hide the form if it's already shown
      } else {
        this.showEditIndex = index; // Show the form for the clicked item
        const name = url.split("/").filter(Boolean).pop() || "";
        this.newName = name;
      }
    },
    async toggleInfo(index: number, url: string) {
      if (this.showInfoIndex === index) {
        this.showInfoIndex = null; // Hide the form if it's already shown
        this.itemDetails = null;
        this.movePanelOpen = false;
        this.renamePanelOpen = false;
        this.moveFeedback = "";
        this.renameFeedback = "";
        this.downloadFeedback = "";
      } else {
        try {
          this.showInfoIndex = index;
          this.loadingIndex = index;
          this.itemDetails = await this.getItemInfo(url);
          this.movePanelOpen = false;
          this.renamePanelOpen = false;
          this.moveTargetPath = this.currentLocation;
          this.renameName = this.getItemName(url);
          this.moveFeedback = "";
          this.renameFeedback = "";
          this.downloadFeedback = "";
        } catch (error) {
          this.dirContents = null;
          this.itemDetails = {
            itemName: "error fetching info",
            itemType: this.containerCheck(url) ? "Container" : "Resource",
            sourceIri: "error fetching info",
            parentContainer: "error fetching info",
            metadataUrl: null,
            contentType: "error fetching info",
            sizeLabel: null,
            lastModified: null,
            directChildren: null,
            parseWarning: this.buildItemParseWarning(error, url),
          };
          console.error("Error fetching item info:", error);
        } finally {
          this.loadingIndex = null;
        }
        this.showInfoIndex = index; // Show the form for the clicked item
      }
    },
    /**
     * Downloads a single pod resource through the authenticated Solid session.
     * Containers are intentionally excluded by the service helper and UI guard.
     */
    async downloadResource(fileUrl: string) {
      this.downloadingItem = true;
      this.downloadFeedback = "";
      try {
        const { file, fileName } = await getPodResourceDownload(fileUrl);
        const objectUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        this.downloadFeedback = `Download started for ${fileName}.`;
      } catch (error) {
        console.error("Error downloading resource:", error);
        this.downloadFeedback = "Could not download this file. Check your read access and try again.";
      } finally {
        this.downloadingItem = false;
      }
    },
    /* Takes in the emitted value from ContainerNav.vue */
    async handleSelectedContainer(selectedContainer: string) {
      this.displayPath = selectedContainer;
      this.currentLocation = selectedContainer;
      this.moveTargetPath = selectedContainer;
      this.movePanelOpen = false;
      this.renamePanelOpen = false;
      this.renameFeedback = "";
      this.resetFilters();
      await this.getItems(this.displayPath);
    },
    handleMoveTargetSelected(selectedContainer: string) {
      this.moveTargetPath = selectedContainer;
      this.moveFeedback = "";
    },
    canMoveItem(itemUrl: string): boolean {
      if (!this.moveTargetPath) {
        return false;
      }
      try {
        if (!this.validUrlCheck(this.moveTargetPath)) {
          return false;
        }
        const normalizedTarget = this.moveTargetPath.endsWith("/")
          ? this.moveTargetPath
          : `${this.moveTargetPath}/`;
        const normalizedParent = this.getParentContainer(itemUrl);

        return (
          normalizedTarget.startsWith(this.selectedPodUrl) &&
          normalizedTarget !== normalizedParent &&
          normalizedTarget !== itemUrl &&
          !(this.containerCheck(itemUrl) && normalizedTarget.startsWith(itemUrl))
        );
      } catch (error) {
        return false;
      }
    },
    async moveItem(itemUrl: string) {
      if (!this.canMoveItem(itemUrl)) {
        this.moveFeedback = "Enter a different destination container inside the selected pod.";
        return;
      }

      this.movingItem = true;
      this.moveFeedback = "";
      try {
        const normalizedTarget = this.moveTargetPath.endsWith("/")
          ? this.moveTargetPath
          : `${this.moveTargetPath}/`;
        const result = await movePodItem(itemUrl, normalizedTarget, this.selectedPodUrl);

        if (result === "error") {
          this.moveFeedback = "The item could not be moved. Check the destination path and try again.";
          return;
        }

        this.moveFeedback = `Moved to ${result}`;
        this.showInfoIndex = null;
        this.itemDetails = null;
        await this.getItems(this.displayPath);
      } catch (error) {
        console.error("Error moving item:", error);
        this.moveFeedback = "The item could not be moved. Check the destination path and try again.";
      } finally {
        this.movingItem = false;
      }
    },
    async renameItem(itemUrl: string) {
      if (!this.canRenameItem(itemUrl)) {
        this.renameFeedback = "Enter a different item name without any path separators.";
        return;
      }

      this.renamingItem = true;
      this.renameFeedback = "";
      try {
        const result = await renamePodItem(itemUrl, this.renameName, this.selectedPodUrl);
        if (result === "error") {
          this.renameFeedback = "The item could not be renamed. Try a different name.";
          return;
        }

        this.renameFeedback = `Renamed to ${this.renameName}`;
        this.showInfoIndex = null;
        this.itemDetails = null;
        this.renamePanelOpen = false;
        await this.getItems(this.displayPath);
      } catch (error) {
        console.error("Error renaming item:", error);
        this.renameFeedback = "The item could not be renamed. Try a different name.";
      } finally {
        this.renamingItem = false;
      }
    },
    checkUrl(url: string) {
      return checkUrl(url, this.currentLocation);
    },
  },
  async mounted() {
    if (this.selectedPodUrl) {
      this.displayPath = this.selectedPodUrl; // Assign podUrl to displayPath
      this.currentLocation = this.selectedPodUrl;
      await this.getItems(this.displayPath); // Fetch items for the initial path
    }
  },
  watch: {
    selectedPodUrl(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.displayPath = this.selectedPodUrl;
        this.currentLocation = this.selectedPodUrl;
        this.getItems(this.selectedPodUrl); // Fetch items for the initial path
      }
    },
  },
};
</script>

<style scoped>
button:focus {
  background-color: transparent !important;
}

.browser-page {
  display: grid;
  gap: 0.5rem;
}

/* Page header follows the same polished workspace style as the other main pages. */
.title-container {
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 11%, transparent) 0, transparent 32%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--panel) 94%, var(--primary-100) 6%),
      var(--panel)
    );
  border: 1px solid var(--border);
  border-radius: 18px;
  margin: 0.5rem 0.5rem 0 0.5rem;
  padding: 1.35rem 1.5rem;
  box-shadow: var(--shadow-1);
}
.page-kicker {
  margin: 0 0 0.35rem 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-muted);
}
.title-container span {
  display: block;
  font-size: var(--font-size-page-title);
  font-family: "Oxanium", monospace;
  font-weight: var(--font-weight-page-title);
  line-height: var(--line-height-page-title);
  color: var(--text-primary);
}
.page-summary {
  margin: 0.65rem 0 0 0;
  max-width: 48rem;
  line-height: 1.5;
  color: var(--text-muted);
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
}

.success-popup {
  margin: 0 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--success) 35%, var(--border) 65%);
  background: color-mix(in srgb, var(--success) 10%, var(--panel) 90%);
  color: var(--text-primary);
  box-shadow: var(--shadow-1);
}
.close-popup-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.2rem;
}
.pod-chooseContainer {
  margin: 0rem 0.5rem;
}
.browser-shell {
  display: grid;
  gap: 0.5rem;
}
.container-location {
  margin: 0 0.5rem 0.5rem 0.5rem;
}
.path-card,
.items-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
  font-family: "Oxanium", monospace;
}
.path-card {
  padding: 1rem 1.05rem;
}
.path-card-header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.85rem;
}
.section-kicker {
  margin: 0 0 0.3rem 0;
  font-size: var(--font-size-section-kicker);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.path-card-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-family: "Oxanium", monospace;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
}
.path-origin {
  display: grid;
  gap: 0.2rem;
  max-width: 22rem;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  background: var(--panel-elev);
  font-family: "Oxanium", monospace;
}
.path-origin-label {
  font-size: 0.76rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.path-origin-value {
  font-size: 0.98rem;
  line-height: 1.45;
  color: var(--text-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.browser-layout {
  display: grid;
  gap: 0.85rem;
}
.browser-toolbar {
  display: block;
}
.browser-toolbar-copy {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.pod-directories {
  flex: 1 1 auto;
  overflow: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  min-height: 22em;
  resize: vertical;
  margin: 0 0.5rem;
}
.items-card {
  padding: 1rem 1.1rem;
}
.items-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 0.9rem;
}
.items-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
.items-summary {
  margin: 0.4rem 0 0 0;
  color: var(--text-muted);
  line-height: 1.5;
}
.items-location {
  color: var(--text-primary);
  font-weight: 700;
}
.items-count {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.filters-panel {
  display: grid;
  gap: 0.8rem;
  margin: 0 0 0.95rem 0;
  padding: 1rem 1rem 1.05rem 1rem;
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  border-radius: 16px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--panel-elev) 94%, var(--main-darker) 36%),
      color-mix(in srgb, var(--panel) 97%, var(--panel-elev) 3%)
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
.filter-input {
  width: 100%;
  min-width: 0;
  padding: 0.9rem 1rem;
  border: 1px solid color-mix(in srgb, var(--border) 72%, var(--primary) 28%);
  border-radius: 14px;
  background:
    linear-gradient(
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
.filter-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--primary) 62%, var(--border) 38%);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent),
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
.items-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}
/* Item cards intentionally mirror SharedWithMe entry cards for visual consistency. */
.item-card {
  border: 1px solid color-mix(in srgb, var(--border) 84%, var(--primary) 16%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel-elev) 94%, transparent);
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}
.item-card:hover {
  border-color: color-mix(in srgb, var(--primary) 26%, var(--border));
  background: color-mix(in srgb, var(--hover) 86%, var(--panel-elev) 14%);
}
.item-card.expanded {
  border-color: color-mix(in srgb, var(--primary) 34%, var(--border));
}
.delete-button {
  padding: 0.5rem 0.75rem !important;
}
.delete-button:hover {
  background-color: #555;
  color: white;
}
.item-card .not-colored {
  color: var(--text-muted);
}
.item-toggle {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  width: 100%;
  padding: 0.62rem 0.78rem;
  cursor: pointer;
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
}
.item-toggle:hover {
  background: transparent;
}
.item-main {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  flex: 1;
}
.item-icon {
  flex: 0 0 auto;
}
.item-copy {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}
.item-copy-equalized {
  min-height: 2.8rem;
  align-content: center;
}
.item-name {
  display: block;
  color: var(--text-primary);
  font-weight: 700;
  font-size: var(--font-size-section-title);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.info-icon {
  color: var(--text-muted);
  flex: 0 0 auto;
}
.highlightable-text {
  user-select: text;
  cursor: text;
}

.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  margin: 20px 0;
}
.spinner {
  border: 4px solid var(--border);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
.loading-text {
  margin-top: 10px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  color: var(--text-secondary);
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.item-info-container {
  position: relative;
  border-top: 1px solid color-mix(in srgb, var(--primary) 12%, var(--border));
  padding: 0.68rem 0.78rem 0.76rem;
  display: grid;
  gap: 0.64rem;
}
.detail-grid {
  display: grid;
  gap: 0.58rem;
}
.browser-summary-grid,
.resource-secondary-grid {
  display: grid;
  gap: 0.58rem;
}
.browser-summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.resource-secondary-grid {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}
.summary-cell,
.browser-resource-card {
  border: 1px solid color-mix(in srgb, var(--border) 80%, var(--primary) 20%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel) 92%, var(--panel-elev) 8%);
}
.summary-cell {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  min-height: 4.5rem;
  padding: 0.62rem 0.72rem;
}
.summary-cell .field-value {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.browser-resource-card {
  display: grid;
  gap: 0.72rem;
  padding: 0.72rem 0.82rem;
}
.resource-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.58rem;
  min-width: 0;
  padding-bottom: 0.62rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 74%, transparent);
}
.resource-copy {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}
.browser-resource-grid {
  align-items: start;
}
.entry-field {
  display: grid;
  align-content: start;
  gap: 0.28rem;
  min-width: 0;
}
.parent-container-field {
  grid-column: span 7;
}
.content-type-field {
  grid-column: span 5;
}
.browser-metadata-field {
  grid-column: 1 / -1;
}
.info-warning {
  border: 1px solid color-mix(in srgb, var(--warning) 45%, var(--border) 55%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--warning) 10%, var(--panel) 90%);
  padding: 0.75rem 0.85rem;
  margin-bottom: 0.4rem;
}
.info-warning-header {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-primary);
  font-size: 0.96rem;
  font-family: "Oxanium", monospace;
}
.info-warning-header .material-icons {
  font-size: 1.05rem;
  color: color-mix(in srgb, var(--warning) 72%, var(--text-primary) 28%);
}
.info-warning-summary {
  margin: 0.38rem 0 0.4rem;
  color: var(--text-secondary);
  line-height: 1.4;
  font-size: 0.9rem;
}
.info-warning-list {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.2rem;
  color: var(--text-secondary);
  font-size: 0.88rem;
}
.info-warning-token {
  font-family: "Oxanium", monospace;
  color: var(--text-primary);
}
.info-warning-raw {
  margin-top: 0.45rem;
  color: var(--text-muted);
  font-size: 0.84rem;
}
.info-warning-raw summary {
  cursor: pointer;
}
.info-warning-raw pre {
  margin: 0.35rem 0 0;
  padding: 0.55rem;
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel-elev) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 84%, transparent);
  color: var(--text-secondary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: "Oxanium", monospace;
}
.info-row {
  display: block;
  color: var(--text-muted);
  margin: 0;
  font-size: var(--font-size-page-summary);
}

.info-label {
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.info-value-container {
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  min-width: 0;
}
.metadata-list {
  display: grid;
  gap: 0.34rem;
  min-width: 0;
}
.field-label {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: var(--font-size-section-kicker);
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}
.field-value {
  font-size: var(--font-size-page-summary);
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}
.mono {
  font-family: "Oxanium", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.resource-url-value {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.resource-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  align-self: center;
}
.field-value.link {
  color: var(--primary);
  text-decoration: none;
}

.field-value.link:hover {
  text-decoration: underline;
}

.field-copy-button {
  width: 1.72rem;
  height: 1.72rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  background: color-mix(in srgb, var(--panel-elev) 90%, transparent);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.field-copy-button:hover {
  background: color-mix(in srgb, var(--primary) 10%, var(--panel-elev));
  border-color: color-mix(in srgb, var(--primary) 36%, var(--border));
  color: var(--text-primary);
}

.download-icon-button {
  width: 1.72rem;
  height: 1.72rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary) 42%, var(--border) 58%);
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: var(--main-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex: 0 0 auto;
  box-shadow: var(--shadow-1);
}
.download-icon-button:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}
.download-icon-button:disabled {
  cursor: wait;
  opacity: 0.72;
}
.download-icon-button .material-icons {
  color: var(--main-white);
}

.material-icons.not-colored {
  color: var(--text-secondary);
}
.material-icons.tiny {
  font-size: 1rem;
}

.action-panel {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--border);
}
.move-panel {
  gap: 0;
}
.rename-panel {
  gap: 0;
}
.action-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel) 90%, var(--panel-elev) 10%);
  text-align: left;
}
.move-panel .action-toggle {
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
}
.rename-panel .action-toggle {
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
}
.move-panel .action-toggle.expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 0;
}
.rename-panel .action-toggle.expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 0;
}
.action-copy {
  display: grid;
  gap: 0.12rem;
}
.action-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--text-primary);
}
.action-title.danger {
  color: color-mix(in srgb, var(--error) 75%, var(--text-primary) 25%);
}
.action-helper {
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.4;
}
.action-chevron {
  color: var(--text-muted);
}
.delete-panel {
  border-top-style: dashed;
}
.delete-copy {
  display: grid;
  gap: 0.12rem;
}
.download-feedback {
  margin: 0.2rem 0 0;
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.4;
}

.move-card {
  display: grid;
  gap: 0.75rem;
  padding: 0.9rem 0.95rem 0.95rem 0.95rem;
  border: 1px solid var(--border);
  border-top: 0;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  background: color-mix(in srgb, var(--panel) 92%, var(--panel-elev) 8%);
}
.rename-card {
  display: grid;
  gap: 0.75rem;
  padding: 0.9rem 0.95rem 0.95rem 0.95rem;
  border: 1px solid var(--border);
  border-top: 0;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  background: color-mix(in srgb, var(--panel) 92%, var(--panel-elev) 8%);
}
.move-header {
  display: grid;
  gap: 0.15rem;
}
.rename-header {
  display: grid;
  gap: 0.15rem;
}
.move-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--text-primary);
}
.rename-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--text-primary);
}
.move-helper {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}
.rename-helper {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}
.move-mode-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.move-mode-switch button {
  padding: 0.58rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 0.92rem;
  font-weight: 600;
}
.move-mode-switch .active {
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  border-color: transparent;
  color: var(--main-white);
}
.move-destination {
  display: grid;
  gap: 0.2rem;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  background: var(--panel-elev);
}
.move-destination-label {
  font-size: 0.76rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.move-destination-value {
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.move-browser {
  padding: 0.2rem 0 0;
}
.move-manual {
  display: grid;
  gap: 0.4rem;
}
.move-input {
  width: 100%;
  min-width: 0;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text-primary);
  font-family: "Oxanium", monospace;
}
.move-path-hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.4;
}
.move-browser :deep(.browser-card) {
  gap: 0.45rem;
}
.move-browser :deep(.current-folder-bar) {
  background: var(--panel);
  padding: 0.55rem 0.7rem;
  gap: 0.3rem;
}
.move-browser :deep(.current-folder-label) {
  font-size: 0.88rem;
}
.move-browser :deep(.crumb) {
  padding: 0.28rem 0.58rem;
  font-size: 0.82rem;
}
.move-browser :deep(.full-path) {
  font-size: 0.72rem;
}
.move-browser :deep(.folder-grid) {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.4rem;
}
.move-browser :deep(.folder-section) {
  gap: 0.4rem;
}
.move-browser :deep(.section-title) {
  font-size: var(--font-size-subsection-title);
}
.move-browser :deep(.section-count) {
  font-size: 0.82rem;
}
.move-browser :deep(.folder-card) {
  padding: 0.5rem 0.65rem;
  border-radius: 12px;
}
.move-browser :deep(.folder-icon-wrap) {
  width: 30px;
  height: 30px;
}
.move-browser :deep(.folder-name) {
  font-size: 0.86rem;
}
.move-browser :deep(.up-btn) {
  min-width: 72px;
  padding-inline: 0.6rem;
}
.move-controls {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.rename-controls {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.move-btn {
  color: var(--text-secondary);
  border-color: var(--border);
}
.rename-btn {
  color: var(--text-secondary);
  border-color: var(--border);
}
.move-feedback {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.4;
}
.rename-input {
  flex: 1;
  min-width: 0;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text-primary);
  font-family: "Oxanium", monospace;
}
.rename-feedback {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.4;
}

.delete-button {
  font-family: "Oxanium", monospace;
  padding: 0.75rem;
  color: var(--main-white);
  background: color-mix(in srgb, var(--error) 78%, #111 22%);
  border-radius: 10px;
}
.edit-delete {
  display: flex;
  justify-content: flex-start;
}

.use-guide {
  margin: 1rem 0 0 0;
}
@media (max-width: 900px) {
  .path-card-header,
  .items-header,
  .items-header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  .path-origin {
    width: 100%;
    max-width: 100%;
  }
  .path-origin-value {
    white-space: normal;
    word-break: break-word;
  }
  .browser-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .parent-container-field,
  .content-type-field {
    grid-column: 1 / -1;
  }
}
@media (max-width: 760px) {
  .title-container,
  .pod-chooseContainer,
  .container-location,
  .pod-directories,
  .success-popup {
    margin-left: 0.35rem;
    margin-right: 0.35rem;
  }
  .title-container {
    padding: 1rem;
  }
  .title-container span {
    font-size: var(--font-size-page-title-mobile);
  }
  .path-card,
  .items-card,
  .success-popup {
    padding: 0.9rem;
    border-radius: 16px;
  }
  .item-toggle {
    padding: 0.6rem;
  }
  .filter-toggle,
  .filter-reset {
    width: 100%;
    justify-content: center;
  }
  .filter-actions {
    justify-content: stretch;
  }
  .item-main {
    align-items: flex-start;
  }
  .move-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .rename-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .action-toggle {
    align-items: flex-start;
  }
  .move-mode-switch {
    flex-direction: column;
  }
  .move-mode-switch button {
    width: 100%;
  }
  .move-btn {
    width: 100%;
  }
  .rename-btn {
    width: 100%;
  }
  .move-destination-value {
    white-space: normal;
    word-break: break-word;
  }
  .item-name {
    white-space: normal;
    word-break: break-word;
  }
  .browser-summary-grid,
  .browser-resource-grid {
    grid-template-columns: 1fr;
  }
  .resource-main {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
  }
  .resource-actions {
    grid-column: 2;
    justify-content: flex-start;
  }
  .resource-url-value {
    white-space: normal;
  }
}
</style>

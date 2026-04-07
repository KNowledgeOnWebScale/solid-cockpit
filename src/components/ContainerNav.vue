<template>
  <div class="dir-nav">
    <div class="browser-card">
      <!-- Toolbar-style current-container display keeps orientation visible in a small footprint. -->
      <div class="current-folder-bar">
        <div class="current-folder-copy">
          <div class="label-pill">
            <span class="current-folder-label">Current container: </span>
            <div class="breadcrumb-trail" aria-label="Current container breadcrumb">
              <button
                class="crumb"
                :class="{ active: currentLocation === currentPod }"
                @click="navigateTo(currentPod)"
              >
                My Pod
              </button>
              <template v-for="segment in breadcrumbSegments" :key="segment.url">
                <v-icon class="crumb-separator" size="16">mdi-chevron-right</v-icon>
                <button
                  class="crumb"
                  :class="{ active: currentLocation === segment.url }"
                  @click="navigateTo(segment.url)"
                >
                  {{ segment.label }}
                </button>
              </template>
            </div>
          </div>
          <v-btn
            class="up-btn"
            variant="outlined"
            :disabled="!canGoUp"
            @click="goUp"
          >
            <v-icon start>mdi-arrow-up</v-icon>
            Up
          </v-btn>
          
        </div>
        <p class="full-path" :title="currentLocation">{{ currentLocation }}</p>
      </div>

      <!-- Dense container cards mirror familiar drive-style navigation while staying touch friendly. -->
      <div class="folder-section">
        <div class="section-title-row">
          <span class="section-title">Subcontainers</span>
          <span class="section-count">
            {{ childFolderOptions.length }} available
          </span>
        </div>

        <div v-if="childFolderOptions.length > 0" class="folder-grid">
          <button
            v-for="folder in childFolderOptions"
            :key="folder.url"
            class="folder-card"
            @click="navigateTo(folder.url)"
          >
            <div class="folder-icon-wrap">
              <v-icon size="24" color="var(--primary)">mdi-folder</v-icon>
            </div>
            <div class="folder-copy">
              <span class="folder-name">{{ folder.label }}</span>
            </div>
            <v-icon size="20" color="var(--text-muted)">mdi-chevron-right</v-icon>
          </button>
        </div>

        <div v-else class="empty-state">
          <v-icon size="22" color="var(--text-muted)">mdi-folder-open-outline</v-icon>
          <span>No subcontainers are available here.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getContainedResourceUrlAll } from "@inrupt/solid-client";
import { currentWebId } from "./login";
import { fetchData, WorkingData } from "./getData";

interface ContainerNavProps {
  currentPod: string;
}

export default defineComponent({
  name: "ContainerNav",
  props: {
    currentPod: String,
  },
  data() {
    return {
      webId: "" as string,
      dirContents: null as WorkingData | null,
      currentLocation: "" as string,
      urls: [] as string[],
      containerUrls: [] as string[],
      resourceUrls: [] as string[],
    };
  },
  computed: {
    canGoUp(): boolean {
      return this.currentLocation !== this.currentPod;
    },
    childFolderOptions(): { label: string; url: string }[] {
      return this.containerUrls
        .filter((url) => url !== this.currentLocation)
        .map((url) => ({
          url,
          label: this.formatContainerName(url),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    breadcrumbSegments(): { label: string; url: string }[] {
      if (!this.currentPod || !this.currentLocation.startsWith(this.currentPod)) {
        return [];
      }

      const relativePath = this.currentLocation.slice(this.currentPod.length);
      const segments = relativePath.split("/").filter((segment) => segment.length > 0);
      let accumulated = this.currentPod;

      return segments.map((segment) => {
        accumulated = `${accumulated}${segment}/`;
        return {
          label: this.humanizeSegment(segment),
          url: accumulated,
        };
      });
    },
  },
  methods: {
    humanizeSegment(segment: string): string {
      return decodeURIComponent(segment)
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    },
    formatContainerName(url: string): string {
      if (url === this.currentPod) {
        return "My Pod";
      }
      const segments = url.split("/").filter((segment) => segment.length > 0);
      return this.humanizeSegment(segments[segments.length - 1]);
    },
    parentUrl(url: string): string {
      if (!url || url === this.currentPod) {
        return this.currentPod;
      }
      const relativePath = url.slice(this.currentPod.length);
      const segments = relativePath.split("/").filter((segment) => segment.length > 0);
      segments.pop();
      return segments.length > 0
        ? `${this.currentPod}${segments.join("/")}/`
        : this.currentPod;
    },
    async navigateTo(newLocation: string): Promise<void> {
      if (!newLocation || newLocation === this.currentLocation) {
        this.selectPath();
        return;
      }
      this.currentLocation = newLocation;
      await this.getSpecificData(newLocation);
      this.selectPath();
    },
    async goUp(): Promise<void> {
      if (!this.canGoUp) {
        return;
      }
      await this.navigateTo(this.parentUrl(this.currentLocation));
    },
    /**
     * Obtains the containers within the root directory of a user's pod.
     */
    async getGeneralData(): Promise<void> {
      if (!this.currentPod) {
        return;
      }
      try {
        this.dirContents = await fetchData(this.currentPod);
        this.urls = getContainedResourceUrlAll(this.dirContents);
        this.separateUrls();
      } catch (err) {
        console.log(err);
      }
    },
    /**
     * Obtains a list of containers and/or resources located in the provided container.
     */
    async getSpecificData(path: string): Promise<void> {
      this.dirContents = await fetchData(path);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
    },
    /**
     * Calls getPodURLs() to obtain a list of pods from the logged-in user's webID.
     */
    async podURL(): Promise<void> {
      this.webId = currentWebId();
      this.currentLocation = this.currentPod;
      this.selectPath();
    },
    /**
     * Sorts container URLs and resource URLs into different lists.
     */
    separateUrls(): void {
      this.containerUrls = this.urls.filter((url) => url.endsWith("/"));
      this.resourceUrls = this.urls.filter((url) => !url.endsWith("/"));
      if (this.currentLocation === this.currentPod && !this.urls.includes(this.currentPod)) {
        this.urls.push(this.currentPod);
        this.containerUrls.push(this.currentPod);
      }
      this.urls = this.urls.sort((a, b) => a.length - b.length);
      this.containerUrls = this.containerUrls.sort((a, b) => a.length - b.length);
      this.resourceUrls = this.resourceUrls.sort((a, b) => a.length - b.length);
    },
    /**
     * Emits the current URL path.
     */
    selectPath(): void {
      const selectedPath = this.currentLocation;
      this.$emit("path-selected", selectedPath);
    },
  },
  async mounted() {
    this.podURL();
    try {
      await this.getGeneralData();
    } catch (err) {
      console.log(err);
    }
  },
  watch: {
    async currentPod(newValue: string, oldValue: string) {
      if (!newValue || newValue === oldValue) {
        return;
      }
      this.currentLocation = newValue;
      this.selectPath();
      await this.getGeneralData();
    },
  },
});
</script>

<style scoped>
/* Layout: keep the navigation browser compact and easy to scan. */
.dir-nav {
  width: 100%;
}
.browser-card {
  display: grid;
  gap: 0.65rem;
}
.up-btn {
  flex-shrink: 0;
  color: var(--text-secondary);
  border-color: var(--border);
  min-width: 84px;
}
.current-folder-bar {
  display: grid;
  gap: 0.45rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel) 94%, white 6%), var(--panel));
  box-shadow: var(--shadow-1);
}
.current-folder-copy {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}
.label-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.current-folder-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted);
}
.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  padding-bottom: 0.1rem;
}
.crumb {
  border: 0;
  border-radius: 999px;
  padding: 0.38rem 0.72rem;
  background: var(--panel-elev);
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
}
.crumb:hover {
  background: var(--hover);
}
.crumb.active {
  background: var(--primary);
  color: var(--main-white);
}
.crumb-separator {
  color: var(--text-muted);
}
.full-path {
  margin: 0;
  font-size: 0.76rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.folder-section {
  display: grid;
  gap: 0.5rem;
}
.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
.section-title {
  font-size: var(--font-size-subsection-title);
  font-weight: 600;
  color: var(--text-primary);
}
.section-count {
  color: var(--text-muted);
  font-size: 0.88rem;
}
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.5rem;
}
.folder-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
  text-align: left;
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
}
.folder-card:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--panel) 85%, var(--primary-100) 15%);
  border-color: color-mix(in srgb, var(--border) 55%, var(--primary) 45%);
}
.folder-icon-wrap {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.folder-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.folder-name {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border: 1px dashed var(--border);
  border-radius: 14px;
  color: var(--text-muted);
  font-size: 0.86rem;
}
/* Responsive: collapse utility actions and keep breadcrumbs easy to tap on mobile. */
@media (max-width: 760px) {
  .current-folder-copy {
    flex-direction: column;
    align-items: stretch;
  }
  .up-btn {
    width: 100%;
  }
  .breadcrumb-trail {
    width: 100%;
  }
  .full-path {
    white-space: normal;
    word-break: break-word;
  }
  .folder-grid {
    grid-template-columns: 1fr;
  }
}
:deep(.v-input__details) {
  display:none;
}
:deep(.v-field__loader) {
  display:none;
}
</style>

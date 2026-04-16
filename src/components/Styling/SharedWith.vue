<template>
  <div class="shared-container">
    <div class="shared-section" v-if="currentOperation === 'sharedWithMe'">
      <span class="shared-title">Shared With Me</span>

      <div class="no-items" v-if="sharedMeItems.length === 0">
        <p>No resources have been shared with you.</p>
      </div>

      <!-- Compact cards mirror the My Pod card style while showing full metadata on expand. -->
      <ul v-else class="shared-list" role="list">
        <li v-for="(item, index) in sharedMeItems" :key="`${item.resourceHash}-${index}`">
          <article class="shared-entry" :class="{ expanded: showItemIndex === index }">
            <button @click="toggleItem(index)" class="entry-toggle">
              <div class="entry-main">
                <i class="material-icons not-colored">{{
                  containerCheck(getPrimaryResourceUrl(item)) ? "folder" : "description"
                }}</i>
                <div class="entry-copy">
                  <span class="entry-title" :title="getPrimaryResourceUrl(item)">
                    {{ normalizeTargetLabel(getPrimaryResourceUrl(item)) }}
                  </span>
                  <span class="entry-subtitle">
                    Shared by {{ normalizeTargetLabel(item.owner) }}
                  </span>
                </div>
              </div>
              <i class="material-icons not-colored info-icon">
                {{ showItemIndex === index ? "keyboard_arrow_down" : "chevron_right" }}
              </i>
            </button>

            <div class="entry-details" v-if="showItemIndex === index">
              <div class="entry-field-grid">
                <div class="entry-field">
                  <span class="field-label">Resource URL</span>
                  <span class="field-value mono" :title="getPrimaryResourceUrl(item)">
                    {{ getPrimaryResourceUrl(item) }}
                  </span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Resource hash</span>
                  <span class="field-value mono" :title="item.resourceHash">{{
                    item.resourceHash || "N/A"
                  }}</span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Owner</span>
                  <span class="field-value">{{ normalizeTargetLabel(item.owner) }}</span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Target</span>
                  <span class="field-value">{{
                    normalizeTargetLabel(item.usersSharedWith[0]?.sharedWith ?? "N/A")
                  }}</span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Activity type</span>
                  <span class="field-value">{{ formatKind(item.whatKind) }}</span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Created</span>
                  <span class="field-value">{{
                    formatDate(item.usersSharedWith[0]?.created ?? "N/A")
                  }}</span>
                </div>
              </div>

              <div class="mode-row">
                <span class="field-label">Access modes</span>
                <div class="mode-chips">
                  <span
                    v-for="(ac, acIndex) in normalizeModeList(item.usersSharedWith[0]?.accessModes)"
                    :key="`mode-${acIndex}`"
                    class="mode-chip"
                    :title="ac"
                    >{{ formatMode(ac) }}</span
                  >
                </div>
              </div>
            </div>
          </article>
        </li>
      </ul>
    </div>

    <div class="shared-section" v-if="currentOperation === 'sharedWithOthers'">
      <span class="shared-title">Shared With Others</span>

      <div class="no-items" v-if="sharedItems.length === 0">
        <p>You have not shared any resources with others.</p>
      </div>

      <!-- Each expanded card shows resource-level data and all recipient-level metadata. -->
      <ul v-else class="shared-list" role="list">
        <li v-for="(item, index) in sharedItems" :key="`${item.resourceHash}-${index}`">
          <article class="shared-entry" :class="{ expanded: showItemIndex === index }">
            <button @click="toggleItem(index)" class="entry-toggle">
              <div class="entry-main">
                <i class="material-icons not-colored">{{
                  containerCheck(item.resourceHash) ? "folder" : "description"
                }}</i>
                <div class="entry-copy">
                  <span class="entry-title" :title="item.resourceHash">{{ item.resourceHash }}</span>
                  <span class="entry-subtitle">
                    {{ getRecipientSummary(item) }} · {{ formatDate(getLatestEntryDate(item)) }}
                  </span>
                </div>
              </div>
              <i class="material-icons not-colored info-icon">
                {{ showItemIndex === index ? "keyboard_arrow_down" : "chevron_right" }}
              </i>
            </button>

            <div class="entry-details" v-if="showItemIndex === index">
              <div class="entry-field-grid">
                <div class="entry-field">
                  <span class="field-label">Resource hash</span>
                  <span class="field-value mono" :title="item.resourceHash">{{
                    item.resourceHash || "N/A"
                  }}</span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Owner</span>
                  <span class="field-value">{{ normalizeTargetLabel(item.owner) }}</span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Activity type</span>
                  <span class="field-value">{{ formatKind(item.whatKind) }}</span>
                </div>
                <div class="entry-field">
                  <span class="field-label">Recipients</span>
                  <span class="field-value">{{ getRecipientSummary(item) }}</span>
                </div>
              </div>

              <div class="recipient-list">
                <article
                  class="recipient-card"
                  v-for="(mode, userIndex) in item.usersSharedWith"
                  :key="`${mode.sharedWith}-${mode.created}-${userIndex}`"
                >
                  <div class="recipient-header">
                    <span class="recipient-target" :title="mode.sharedWith">
                      <i class="material-icons tiny not-colored">person</i>
                      {{ normalizeTargetLabel(mode.sharedWith) }}
                    </span>
                    <span class="recipient-date">
                      <i class="material-icons tiny not-colored">schedule</i>
                      {{ formatDate(mode.created) }}
                    </span>
                  </div>
                  <div class="recipient-body">
                    <div class="entry-field compact">
                      <span class="field-label">Resource URL</span>
                      <span class="field-value mono" :title="mode.resourceUrl">
                        {{ mode.resourceUrl || "N/A" }}
                      </span>
                    </div>
                    <div class="entry-field compact">
                      <span class="field-label">Target URL</span>
                      <span class="field-value mono" :title="mode.sharedWith">
                        {{ mode.sharedWith || "N/A" }}
                      </span>
                    </div>
                    <div class="mode-row">
                      <span class="field-label">Access modes</span>
                      <div class="mode-chips">
                        <span
                          v-for="(ac, acIndex) in normalizeModeList(mode.accessModes)"
                          :key="`${mode.sharedWith}-mode-${acIndex}`"
                          class="mode-chip"
                          :title="ac"
                          >{{ formatMode(ac) }}</span
                        >
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </article>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { toRaw } from "vue";
import { sharedSomething, getSharedWithMe, getSharedWithOthers } from "../privacyEdit";
import { getStoredTtl } from "../queryPod";

export default {
  props: {
    currentOperation: {
      type: String,
      required: true,
    },
    currentPod: {
      type: String,
      required: true,
    },
    currentWebId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      sharedItems: [] as sharedSomething[],
      sharedMeItems: [] as sharedSomething[],
      showItemIndex: null as number | null,
      foundDoc: false as boolean,
    };
  },
  methods: {
    // Expand/collapse one shared entry at a time for a compact, readable list.
    toggleItem(index: number) {
      this.showItemIndex = this.showItemIndex === index ? null : index;
    },
    /*
    Checks if the input item url is a container
    */
    containerCheck(itemUrl: string) {
      return itemUrl.endsWith("/");
    },
    // Convert FOAF public-agent values to user-facing labels.
    normalizeTargetLabel(target: string) {
      return target === "http://xmlns.com/foaf/0.1/Agent" ? "Public" : target;
    },
    // Render compact labels for ACL mode IRIs.
    formatMode(modeIri: string): string {
      if (!modeIri || modeIri === "N/A") {
        return "N/A";
      }
      const hashLabel = modeIri.split("#").pop();
      if (hashLabel && hashLabel !== modeIri) {
        return hashLabel;
      }
      const pathSegments = modeIri.split("/").filter(Boolean);
      return pathSegments[pathSegments.length - 1] || modeIri;
    },
    // Ensure the access-mode field is always explicitly represented in the UI.
    normalizeModeList(modes: string[] | undefined): string[] {
      if (!modes || modes.length === 0) {
        return ["N/A"];
      }
      return modes;
    },
    // Render compact labels for ActivityStreams/RDF type IRIs.
    formatKind(kindIri: string): string {
      if (!kindIri || kindIri === "N/A") {
        return "N/A";
      }
      const hashLabel = kindIri.split("#").pop();
      if (hashLabel && hashLabel !== kindIri) {
        return hashLabel;
      }
      const pathSegments = kindIri.split("/").filter(Boolean);
      return pathSegments[pathSegments.length - 1] || kindIri;
    },
    // Human-readable timestamp while preserving raw values as tooltip text.
    formatDate(dateValue: string): string {
      if (!dateValue || dateValue === "N/A") {
        return "Unknown";
      }
      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) {
        return dateValue;
      }
      return parsed.toLocaleString();
    },
    // SharedWithMe entries derive the resource URL from the first userHash row.
    getPrimaryResourceUrl(item: sharedSomething): string {
      return item.usersSharedWith[0]?.resourceUrl || item.resourceHash || "N/A";
    },
    // Compute an informative recipient summary for collapsed card subtitles.
    getRecipientSummary(item: sharedSomething): string {
      const count = item.usersSharedWith.length;
      return count === 1 ? "1 recipient" : `${count} recipients`;
    },
    // Find the newest created timestamp among all recipients of one resource.
    getLatestEntryDate(item: sharedSomething): string {
      const times = item.usersSharedWith
        .map((entry) => new Date(entry.created).getTime())
        .filter((value) => !Number.isNaN(value));
      if (times.length === 0) {
        return "Unknown";
      }
      return new Date(Math.max(...times)).toISOString();
    },
    // Keep newest shared entries at the top for both list variants.
    sortByNewest(items: sharedSomething[]): sharedSomething[] {
      return [...items].sort((a, b) => {
        const aTime = new Date(this.getLatestEntryDate(a)).getTime();
        const bTime = new Date(this.getLatestEntryDate(b)).getTime();
        return bTime - aTime;
      });
    },
    /*
    Fetches the sharedWith data from the user's inbox/
    */
    async loadFileTtl() {
      this.showItemIndex = null;
      this.sharedItems = [];
      this.sharedMeItems = [];

      // Guard against transient empty props during mount/route transitions.
      if (!this.currentPod || !this.currentOperation) {
        return;
      }

      // Normalize pod root so path joins remain valid even when the selected
      // pod URL is missing a trailing slash.
      const podRoot = this.currentPod.endsWith("/")
        ? this.currentPod
        : `${this.currentPod}/`;
      const ttlUrl = `${podRoot}inbox/${this.currentOperation}.ttl`;

      // Keep this probe as a hint for diagnostics, but do not block direct
      // shared-data loading when it fails.
      this.foundDoc = await getStoredTtl(ttlUrl);

      if (this.currentOperation === "sharedWithOthers") {
        try {
          const sharedItemsThings = await getSharedWithOthers(podRoot, this.currentWebId);
          this.sharedItems = this.sortByNewest(toRaw(sharedItemsThings));
        } catch (err) {
          console.error("Error fetching shared-with-others items:", err);
        }
      } else if (this.currentOperation === "sharedWithMe") {
        try {
          const sharedItemsThings = await getSharedWithMe(podRoot);
          this.sharedMeItems = this.sortByNewest(sharedItemsThings.sharedItems);
        } catch (err) {
          console.error("Error fetching shared-with-me items:", err);
        }
      }
    },
  },
  watch: {
    currentOperation() {
      this.loadFileTtl();
    },
    currentPod() {
      this.loadFileTtl();
    },
    currentWebId() {
      this.loadFileTtl();
    },
  },
  mounted() {
    this.loadFileTtl();
  },
};
</script>

<style scoped>
.shared-container {
  width: 100%;
  font-family: "Oxanium", monospace;
  padding: 0.15rem 0.1rem;
}
.shared-section {
  width: 100%;
}
.shared-title {
  display: block;
  margin: 0 0 0.55rem;
  font-size: var(--font-size-section-title);
  font-weight: 700;
  color: var(--text-primary);
}
.no-items {
  padding: 0.75rem 0.8rem;
  border: 1px dashed color-mix(in srgb, var(--border) 70%, var(--primary) 30%);
  border-radius: 12px;
  font-size: var(--font-size-page-summary);
  color: var(--text-muted);
}
.no-items p {
  margin: 0;
}

.shared-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.58rem;
}
.shared-entry {
  border: 1px solid color-mix(in srgb, var(--border) 84%, var(--primary) 16%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel-elev) 94%, transparent);
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}
.shared-entry:hover {
  border-color: color-mix(in srgb, var(--primary) 26%, var(--border));
  background: color-mix(in srgb, var(--hover) 86%, var(--panel-elev) 14%);
}
.shared-entry.expanded {
  border-color: color-mix(in srgb, var(--primary) 34%, var(--border));
}

.entry-toggle {
  width: 100%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.62rem 0.78rem;
  cursor: pointer;
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
}
.entry-main {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  flex: 1;
}
.entry-copy {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}
.entry-title {
  display: block;
  font-size: var(--font-size-section-title);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entry-subtitle {
  font-size: var(--font-size-page-summary);
  color: var(--text-muted);
  line-height: 1.35;
}
.info-icon {
  color: var(--text-muted);
  flex: 0 0 auto;
}

.entry-details {
  border-top: 1px solid color-mix(in srgb, var(--primary) 12%, var(--border));
  padding: 0.68rem 0.78rem 0.76rem;
  display: grid;
  gap: 0.64rem;
}
.entry-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.52rem;
}
.entry-field {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
}
.entry-field.compact {
  gap: 0.14rem;
}
.field-label {
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

.mode-row {
  display: grid;
  gap: 0.28rem;
}
.mode-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
}
.mode-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary) 30%, var(--border));
  background: color-mix(in srgb, var(--primary) 10%, var(--panel-elev));
  color: var(--yasqe-keyword);
  padding: 0.14rem 0.46rem;
  font-size: 0.76rem;
  font-weight: 700;
}

.recipient-list {
  display: grid;
  gap: 0.5rem;
}
.recipient-card {
  border: 1px solid color-mix(in srgb, var(--border) 80%, var(--primary) 20%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel) 92%, var(--panel-elev) 8%);
  padding: 0.54rem 0.62rem;
  display: grid;
  gap: 0.5rem;
}
.recipient-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.35rem 0.6rem;
}
.recipient-target,
.recipient-date {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  min-width: 0;
  font-size: var(--font-size-page-summary);
}
.recipient-target {
  color: var(--text-primary);
  font-weight: 700;
}
.recipient-date {
  color: var(--text-muted);
}
.recipient-body {
  display: grid;
  gap: 0.5rem;
}

.material-icons.not-colored {
  color: var(--text-secondary);
}
.material-icons.tiny {
  font-size: 1rem;
}

@media (max-width: 860px) {
  .entry-toggle {
    padding: 0.58rem 0.7rem;
  }
  .entry-details {
    padding: 0.6rem 0.7rem 0.68rem;
  }
  .entry-title {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>

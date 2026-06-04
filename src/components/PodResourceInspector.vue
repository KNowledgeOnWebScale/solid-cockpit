<template>
  <section class="resource-inspector">
    <button class="inspector-toggle" @click="handleToggle">
      <span class="inspector-toggle-copy">
        <span class="inspector-title">File contents</span>
        <span class="inspector-helper">
          Preview, validate, and optionally edit supported file formats.
        </span>
      </span>
      <i class="material-icons action-chevron">
        {{ isOpen ? "keyboard_arrow_up" : "keyboard_arrow_down" }}
      </i>
    </button>

    <div v-if="isOpen" class="inspector-card">
      <div v-if="isLoadingPreview" class="inspector-loading">
        <div class="spinner"></div>
        <span>Loading file preview...</span>
      </div>

      <template v-else>
        <div class="inspector-summary-row">
          <span class="inspector-badge">{{ formatInfo.label }}</span>
          <span class="inspector-badge" v-if="previewLoaded">
            {{ formatInfo.contentType || "Unknown content type" }}
          </span>
          <span class="inspector-badge" v-if="previewLoaded">
            {{ previewBytes }} bytes
          </span>
          <span
            class="inspector-badge metric"
            v-if="previewLoaded && structureSummary"
            :title="structureSummary.title"
          >
            {{ structureSummary.value }}
          </span>
          <span class="inspector-badge warning" v-if="previewTruncated">
            Preview truncated
          </span>
        </div>

        <div class="inspector-message error" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        <div class="inspector-message success" v-if="saveMessage">
          {{ saveMessage }}
        </div>

        <div class="inspector-validation" v-if="validation">
          <span
            class="validation-state"
            :class="{ valid: validation.valid, invalid: !validation.valid }"
          >
            {{ validation.valid ? "Valid" : "Invalid" }}
          </span>
          <span class="validation-summary">{{ validation.summary }}</span>
        </div>

        <ul class="validation-details" v-if="validation && validation.details.length > 0">
          <li v-for="detail in validation.details" :key="detail">{{ detail }}</li>
        </ul>

        <div
          class="inspector-permission-note"
          v-if="permissionState === 'unknown' && previewLoaded"
        >
          Write access could not be confirmed from ACL data. Editing is still available and save
          failures will be reported directly.
        </div>
        <div
          class="inspector-permission-note"
          v-if="permissionState === 'blocked' && previewLoaded"
        >
          ACL data suggests this resource is read-only for the current user.
        </div>
        <div
          class="inspector-permission-note"
          v-if="previewLoaded && !formatInfo.supported"
        >
          Inline validation and editing are only available for plain text, CSV, JSON, JSON-LD,
          and common RDF serialization formats.
        </div>

        <div v-if="!previewLoaded && !errorMessage" class="inspector-empty-state">
          Open the panel to load a capped preview.
        </div>

        <div
          v-else-if="csvPreview && !isEditing"
          class="csv-preview"
          :class="{ collapsed: previewCanExpand && !previewExpanded }"
        >
          <div class="csv-table-wrap">
            <table>
              <thead v-if="csvPreview.headers.length > 0">
                <tr>
                  <th v-for="(header, index) in csvPreview.headers" :key="`${header}-${index}`">
                    {{ header || `Column ${index + 1}` }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in csvPreview.rows" :key="rowIndex">
                  <td v-for="(cell, cellIndex) in row" :key="`${rowIndex}-${cellIndex}`">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-else
          class="inspector-text-surface"
          :class="{ collapsed: previewCanExpand && !previewExpanded }"
        >
          <textarea
            v-if="isEditing"
            v-model="editedText"
            class="inspector-editor"
            spellcheck="false"
            @input="scheduleValidation"
          ></textarea>
          <pre v-else class="inspector-preview"><code>{{ displayText }}</code></pre>
        </div>

        <button
          v-if="previewLoaded && !isEditing && previewCanExpand"
          class="preview-expand-toggle"
          type="button"
          @click="togglePreviewExpansion"
        >
          {{ previewExpanded ? "Show less" : "Show more" }}
        </button>

        <div class="inspector-actions" v-if="previewLoaded">
          <v-btn
            v-if="!isEditing"
            class="inspector-btn"
            variant="outlined"
            rounded="lg"
            :disabled="isLoadingFull || permissionState === 'blocked' || !formatInfo.editable"
            @click="enterEditMode"
          >
            {{ permissionState === "blocked" ? "Read only" : "Edit in browser" }}
          </v-btn>
          <v-btn
            v-if="isEditing"
            class="inspector-btn"
            variant="flat"
            rounded="lg"
            :disabled="isSaving"
            :loading="isSaving"
            @click="saveEdits"
          >
            Save changes
          </v-btn>
          <v-btn
            v-if="isEditing"
            class="inspector-btn"
            variant="outlined"
            rounded="lg"
            :disabled="isSaving"
            @click="cancelEdit"
          >
            Cancel
          </v-btn>
          <v-btn
            class="inspector-btn"
            variant="text"
            rounded="lg"
            :disabled="isLoadingPreview || isLoadingFull"
            @click="reloadPreview"
          >
            Refresh preview
          </v-btn>
        </div>
      </template>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRef, watch } from "vue";
import { fetchAclAgents, fetchPublicAccess } from "../services/solid/getData";
import { usePodResourceInspector } from "../composables/usePodResourceInspector";

type PermissionState = "unknown" | "confirmed" | "blocked";
const COLLAPSED_PREVIEW_LINE_LIMIT = 14;
const COLLAPSED_PREVIEW_ROW_LIMIT = 10;
const COLLAPSED_PREVIEW_CHAR_LIMIT = 900;

export default defineComponent({
  name: "PodResourceInspector",
  props: {
    resourceUrl: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      default: null,
    },
    webId: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const permissionState = ref<PermissionState>("unknown");
    const resourceUrlRef = toRef(props, "resourceUrl");
    const contentTypeRef = toRef(props, "contentType");
    const inspector = usePodResourceInspector(resourceUrlRef, contentTypeRef);
    const previewCanExpand = computed(() => {
      if (!inspector.previewLoaded.value || inspector.isEditing.value) {
        return false;
      }

      if (inspector.csvPreview.value) {
        return inspector.csvPreview.value.rows.length > COLLAPSED_PREVIEW_ROW_LIMIT;
      }

      const previewLineCount = inspector.displayText.value.split(/\r?\n/).length;
      return (
        previewLineCount > COLLAPSED_PREVIEW_LINE_LIMIT ||
        inspector.displayText.value.length > COLLAPSED_PREVIEW_CHAR_LIMIT
      );
    });

    function canWriteFromAccess(access: Record<string, boolean> | null | undefined) {
      return Boolean(access?.write || access?.control);
    }

    async function determineWriteAccess() {
      permissionState.value = "unknown";
      try {
        const [agents, publicAccess] = await Promise.all([
          fetchAclAgents(props.resourceUrl),
          fetchPublicAccess(props.resourceUrl),
        ]);

        if (canWriteFromAccess(publicAccess)) {
          permissionState.value = "confirmed";
          return;
        }

        const ownAccess =
          props.webId && agents && props.webId in agents
            ? (agents as Record<string, Record<string, boolean>>)[props.webId]
            : null;
        permissionState.value = canWriteFromAccess(ownAccess) ? "confirmed" : "blocked";
      } catch {
        permissionState.value = "unknown";
      }
    }

    async function handleToggle() {
      await inspector.toggleOpen();
      if (inspector.isOpen.value && inspector.previewLoaded.value) {
        await determineWriteAccess();
      }
    }

    async function reloadPreview() {
      await inspector.loadPreview();
      if (inspector.previewLoaded.value) {
        await determineWriteAccess();
      }
    }

    watch(resourceUrlRef, () => {
      permissionState.value = "unknown";
    });

    return {
      ...inspector,
      permissionState,
      previewCanExpand,
      handleToggle,
      reloadPreview,
    };
  },
});
</script>

<style scoped>
.resource-inspector {
  margin-top: 0.8rem;
  border-top: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  padding-top: 0.8rem;
}
.inspector-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel) 95%, white 5%);
  color: var(--text-primary);
}
.inspector-toggle:hover {
  background: color-mix(in srgb, var(--hover) 84%, var(--panel) 16%);
}
.inspector-toggle-copy {
  display: grid;
  gap: 0.15rem;
  text-align: left;
}
.inspector-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}
.inspector-helper {
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.inspector-card {
  display: grid;
  gap: 0.8rem;
  margin-top: 0.7rem;
  padding: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel) 98%, white 2%);
}
.inspector-summary-row,
.inspector-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.inspector-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
  background: color-mix(in srgb, var(--panel-elev) 92%, white 8%);
  font-size: 0.76rem;
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
}
.inspector-badge.warning {
  color: var(--warning);
}
.inspector-badge.metric {
  color: var(--text-primary);
  border-color: color-mix(in srgb, var(--primary) 24%, var(--border));
  background: color-mix(in srgb, var(--primary) 10%, var(--panel));
}
.inspector-validation {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.validation-state {
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}
.validation-state.valid {
  background: color-mix(in srgb, var(--success) 18%, transparent);
  color: var(--success);
}
.validation-state.invalid {
  background: color-mix(in srgb, var(--danger) 18%, transparent);
  color: var(--danger);
}
.validation-summary,
.inspector-permission-note,
.inspector-empty-state,
.inspector-message {
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--text-secondary);
}
.inspector-message.error {
  color: var(--danger);
}
.inspector-message.success {
  color: var(--success);
}
.validation-details {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
}
.inspector-text-surface,
.csv-preview {
  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel-elev) 96%, white 4%);
  overflow: auto;
  max-height: min(68vh, 36rem);
}
.inspector-text-surface.collapsed,
.csv-preview.collapsed {
  max-height: min(38vh, 20rem);
}
.inspector-preview,
.inspector-editor {
  margin: 0;
  width: 100%;
  min-height: 14rem;
  padding: 0.85rem 0.95rem;
  background: transparent;
  color: var(--text-primary);
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.84rem;
  line-height: 1.5;
  box-sizing: border-box;
  max-height: inherit;
}
.inspector-preview {
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.inspector-editor {
  border: 0;
  resize: vertical;
}
.csv-table-wrap {
  overflow: auto;
  max-height: min(68vh, 36rem);
}
.csv-preview.collapsed .csv-table-wrap {
  max-height: min(38vh, 20rem);
}
.csv-table-wrap table {
  width: 100%;
  border-collapse: collapse;
}
.csv-table-wrap th,
.csv-table-wrap td {
  padding: 0.55rem 0.65rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  text-align: left;
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: nowrap;
}
.csv-table-wrap th {
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--panel) 96%, white 4%);
}
.inspector-btn {
  text-transform: none;
  font-family: "Oxanium", monospace;
}
.preview-expand-toggle {
  justify-self: start;
  border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
  border-radius: 999px;
  padding: 0.38rem 0.78rem;
  background: color-mix(in srgb, var(--panel-elev) 92%, transparent);
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 0.82rem;
  font-weight: 600;
}
.preview-expand-toggle:hover {
  background: color-mix(in srgb, var(--hover) 84%, var(--panel-elev) 16%);
}
.inspector-actions :deep(.v-btn) {
  color: var(--text-secondary);
  border-color: color-mix(in srgb, var(--border) 82%, transparent);
  background: transparent;
}
.inspector-actions :deep(.v-btn:hover) {
  background: color-mix(in srgb, var(--hover) 84%, transparent);
}
.inspector-actions :deep(.v-btn--variant-flat) {
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: var(--main-white);
  border-color: transparent;
}
.inspector-actions :deep(.v-btn--variant-text) {
  color: var(--text-muted);
}
.inspector-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
}
.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-top-color: var(--accent);
  border-radius: 999px;
  animation: inspector-spin 0.8s linear infinite;
}
@keyframes inspector-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 760px) {
  .inspector-toggle,
  .inspector-actions {
    align-items: stretch;
  }
  .inspector-btn {
    width: 100%;
  }
}
</style>

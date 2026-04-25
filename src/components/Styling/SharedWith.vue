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
                <div class="entry-copy entry-copy-equalized">
                  <span class="entry-title" :title="getPrimaryResourceUrl(item)">
                    {{ normalizeTargetLabel(getPrimaryResourceUrl(item)) }}
                  </span>
                </div>
              </div>
              <i class="material-icons not-colored info-icon">
                {{ showItemIndex === index ? "keyboard_arrow_down" : "chevron_right" }}
              </i>
            </button>

            <div class="entry-details shared-me-details" v-if="showItemIndex === index">
              <div class="shared-me-summary-grid">
                <div class="summary-cell">
                  <i class="material-icons tiny not-colored">person</i>
                  <div>
                    <span class="field-label">Shared by</span>
                    <span class="field-value mono" :title="item.owner">
                      {{ normalizeTargetLabel(item.owner) }}
                    </span>
                  </div>
                </div>
                <div class="summary-cell">
                  <i class="material-icons tiny not-colored">schedule</i>
                  <div>
                    <span class="field-label">Created</span>
                    <span class="field-value">
                      {{ formatDate(item.usersSharedWith[0]?.created ?? "N/A") }}
                    </span>
                  </div>
                </div>
                <div class="summary-cell">
                  <i class="material-icons tiny not-colored">category</i>
                  <div>
                    <span class="field-label">Type</span>
                    <span class="field-value">{{ formatKind(item.whatKind) }}</span>
                  </div>
                </div>
              </div>

              <div class="shared-me-resource-card">
                <div class="resource-main">
                  <i class="material-icons tiny not-colored">link</i>
                  <div class="resource-copy">
                    <span class="field-label">Resource URL</span>
                    <span class="field-value mono resource-url-value" :title="getPrimaryResourceUrl(item)">
                      {{ getPrimaryResourceUrl(item) }}
                    </span>
                  </div>
                  <button
                    class="field-copy-button"
                    type="button"
                    :aria-label="`Copy resource URL ${getPrimaryResourceUrl(item)}`"
                    @click.stop="copyText(getPrimaryResourceUrl(item))"
                    title="Copy resource URL"
                  >
                    <i class="material-icons tiny not-colored">content_copy</i>
                  </button>
                </div>

                <div class="resource-secondary-grid">
                  <div class="entry-field">
                    <span class="field-label">
                      <i class="material-icons tiny not-colored">tag</i>
                      Resource hash
                    </span>
                    <span class="field-value mono" :title="item.resourceHash">{{
                      item.resourceHash || "N/A"
                    }}</span>
                  </div>
                  <div class="entry-field">
                    <span class="field-label">
                      <i class="material-icons tiny not-colored">lock</i>
                      Access modes
                    </span>
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
                <div class="entry-copy entry-copy-equalized shared-others-collapsed-copy">
                  <span class="entry-title" :title="item.resourceHash">{{ item.resourceHash }}</span>
                  <span class="entry-inline-summary">
                    <span>
                      <i class="material-icons tiny not-colored">group</i>
                      {{ getRecipientSummary(item) }}
                    </span>
                    <span>
                      <i class="material-icons tiny not-colored">schedule</i>
                      {{ formatDate(getLatestEntryDate(item)) }}
                    </span>
                  </span>
                </div>
              </div>
              <i class="material-icons not-colored info-icon">
                {{ showItemIndex === index ? "keyboard_arrow_down" : "chevron_right" }}
              </i>
            </button>

            <div class="entry-details shared-others-details" v-if="showItemIndex === index">
              <div class="shared-me-summary-grid">
                <div class="summary-cell">
                  <i class="material-icons tiny not-colored">person</i>
                  <div>
                    <span class="field-label">Owner</span>
                    <span class="field-value mono" :title="item.owner">
                      {{ normalizeTargetLabel(item.owner) }}
                    </span>
                  </div>
                </div>
                <div class="summary-cell">
                  <i class="material-icons tiny not-colored">group</i>
                  <div>
                    <span class="field-label">Recipients</span>
                    <span class="field-value">{{ getRecipientSummary(item) }}</span>
                  </div>
                </div>
                <div class="summary-cell">
                  <i class="material-icons tiny not-colored">category</i>
                  <div>
                    <span class="field-label">Type</span>
                    <span class="field-value">{{ formatKind(item.whatKind) }}</span>
                  </div>
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
                    <div class="recipient-actions">
                      <span class="recipient-date">
                        <i class="material-icons tiny not-colored">schedule</i>
                        {{ formatDate(mode.created) }}
                      </span>
                      <button
                        class="permission-edit-button"
                        type="button"
                        @click="startPermissionEdit(mode, userIndex)"
                      >
                        <i class="material-icons tiny not-colored">edit</i>
                        Edit permissions
                      </button>
                    </div>
                  </div>
                  <div class="recipient-body">
                    <div class="resource-main">
                      <i class="material-icons tiny not-colored">link</i>
                      <div class="resource-copy">
                        <span class="field-label">Resource URL</span>
                        <span class="field-value mono resource-url-value" :title="mode.resourceUrl">
                          {{ mode.resourceUrl || "N/A" }}
                        </span>
                      </div>
                      <button
                        class="field-copy-button"
                        type="button"
                        :aria-label="`Copy resource URL ${mode.resourceUrl}`"
                        @click.stop="copyText(mode.resourceUrl)"
                        title="Copy resource URL"
                      >
                        <i class="material-icons tiny not-colored">content_copy</i>
                      </button>
                    </div>

                    <div class="resource-secondary-grid shared-others-recipient-grid">
                      <div class="entry-field">
                        <span class="field-label">
                          <i class="material-icons tiny not-colored">badge</i>
                          Target URL
                        </span>
                        <span class="field-value mono" :title="mode.sharedWith">
                          {{ mode.sharedWith || "N/A" }}
                        </span>
                      </div>
                      <div class="entry-field">
                        <span class="field-label">
                          <i class="material-icons tiny not-colored">event</i>
                          Revoke schedule
                        </span>
                        <span class="field-value" :title="mode.revokeAt || 'None'">
                          {{ formatRevokeAt(mode.revokeAt) }}
                        </span>
                      </div>
                      <div class="entry-field">
                        <span class="field-label">
                          <i class="material-icons tiny not-colored">tag</i>
                          Resource hash
                        </span>
                        <span class="field-value mono" :title="item.resourceHash">{{
                          item.resourceHash || "N/A"
                        }}</span>
                      </div>
                      <div class="entry-field">
                        <span class="field-label">
                          <i class="material-icons tiny not-colored">lock</i>
                          Access modes
                        </span>
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

                    <form
                      v-if="editingPermissionKey === getPermissionEditKey(mode, userIndex)"
                      class="permission-editor"
                      @submit.prevent="savePermissionEdit(mode, userIndex)"
                    >
                      <div class="permission-editor-header">
                        <div class="permission-editor-heading">
                          <i class="material-icons tiny not-colored">admin_panel_settings</i>
                          <div>
                            <span class="field-label">Edit offered permissions</span>
                            <span class="permission-editor-target" :title="mode.sharedWith">
                              {{ normalizeTargetLabel(mode.sharedWith) }}
                            </span>
                          </div>
                        </div>
                        <button
                          class="permission-cancel-button"
                          type="button"
                          @click="cancelPermissionEdit"
                        >
                          Cancel
                        </button>
                      </div>

                      <div class="permission-editor-grid">
                        <section class="permission-editor-panel">
                          <span class="field-label">Access modes</span>
                          <div class="permission-options" role="group" aria-label="Permission modes">
                            <label
                              v-for="option in permissionOptions"
                              :key="option.key"
                              class="permission-option"
                            >
                              <input
                                v-model="editedPermissions[option.key]"
                                type="checkbox"
                                :disabled="permissionEditSavingKey !== null"
                              />
                              <span>{{ option.label }}</span>
                            </label>
                          </div>
                        </section>

                        <section class="permission-editor-panel">
                          <label class="field-label" :for="`revoke-mode-${userIndex}`">
                            Automatic revoke
                          </label>
                          <select
                            :id="`revoke-mode-${userIndex}`"
                            v-model="permissionRevokeMode"
                            class="permission-revoke-input"
                            :disabled="permissionEditSavingKey !== null"
                            @change="permissionEditError = ''"
                          >
                            <option value="none">No automatic revoke</option>
                            <option value="duration">After a duration</option>
                            <option value="datetime">At a date/time</option>
                          </select>

                          <div v-if="permissionRevokeMode === 'duration'" class="permission-revoke-row">
                            <input
                              v-model.number="permissionRevokeDurationValue"
                              class="permission-revoke-input"
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Duration"
                              :disabled="permissionEditSavingKey !== null"
                              @input="permissionEditError = ''"
                            />
                            <select
                              v-model="permissionRevokeDurationUnit"
                              class="permission-revoke-input compact"
                              :disabled="permissionEditSavingKey !== null"
                              @change="permissionEditError = ''"
                            >
                              <option value="minutes">Minutes</option>
                              <option value="hours">Hours</option>
                              <option value="days">Days</option>
                            </select>
                          </div>

                          <input
                            v-if="permissionRevokeMode === 'datetime'"
                            v-model="permissionRevokeDateTimeLocal"
                            class="permission-revoke-input"
                            type="datetime-local"
                            :disabled="permissionEditSavingKey !== null"
                            @input="permissionEditError = ''"
                          />
                        </section>
                      </div>

                      <p v-if="permissionEditError" class="permission-error">
                        {{ permissionEditError }}
                      </p>

                      <div class="permission-editor-actions">
                        <button
                          class="permission-save-button"
                          type="submit"
                          :disabled="permissionEditSavingKey === getPermissionEditKey(mode, userIndex)"
                        >
                          {{
                            permissionEditSavingKey === getPermissionEditKey(mode, userIndex)
                              ? "Saving..."
                              : "Save permissions"
                          }}
                        </button>
                      </div>
                    </form>
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
import {
  sharedSomething,
  userHash,
  Permissions,
  getSharedWithMe,
  getSharedWithOthers,
  changeAclAgent,
  changeAclPublic,
  getEnabledAccessModeIris,
  updateSharedWithMe,
  updateSharedWithOthers,
} from "../../services/solid/privacyEdit";
import { getStoredTtl } from "../../services/query/queryPod";

const PUBLIC_AGENT_WEBID = "http://xmlns.com/foaf/0.1/Agent";

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
      loadTtlTimerId: null as number | null,
      latestLoadToken: 0 as number,
      editingPermissionKey: null as string | null,
      permissionEditSavingKey: null as string | null,
      permissionEditError: "" as string,
      editedPermissions: {
        read: false,
        append: false,
        write: false,
        control: false,
      } as Permissions,
      permissionRevokeMode: "none" as "none" | "duration" | "datetime",
      permissionRevokeDurationValue: null as number | null,
      permissionRevokeDurationUnit: "hours" as "minutes" | "hours" | "days",
      permissionRevokeDateTimeLocal: "" as string,
      permissionOptions: [
        { key: "read", label: "Read" },
        { key: "append", label: "Append" },
        { key: "write", label: "Write" },
        { key: "control", label: "Control" },
      ] as { key: keyof Permissions; label: string }[],
    };
  },
  methods: {
    // Expand/collapse one shared entry at a time for a compact, readable list.
    toggleItem(index: number) {
      this.showItemIndex = this.showItemIndex === index ? null : index;
    },
    // Keep copy interactions simple and local to the row details.
    copyText(text: string) {
      navigator.clipboard.writeText(text);
    },
    /*
    Checks if the input item url is a container
    */
    containerCheck(itemUrl: string) {
      return itemUrl.endsWith("/");
    },
    // Convert FOAF public-agent values to user-facing labels.
    normalizeTargetLabel(target: string) {
      return target === PUBLIC_AGENT_WEBID ? "Public" : target;
    },
    // Convert stored ACL mode IRIs into checkbox state for inline editing.
    permissionsFromModeIris(modes: string[] | undefined): Permissions {
      const normalizedModes = new Set(modes ?? []);
      return {
        read: normalizedModes.has("http://www.w3.org/ns/auth/acl#Read"),
        append: normalizedModes.has("http://www.w3.org/ns/auth/acl#Append"),
        write: normalizedModes.has("http://www.w3.org/ns/auth/acl#Write"),
        control: normalizedModes.has("http://www.w3.org/ns/auth/acl#Control"),
      };
    },
    // Preserve Solid ACL semantics used elsewhere in PrivacyEdit: Write implies Append.
    normalizeEditedPermissions(): Permissions {
      return {
        ...this.editedPermissions,
        append: this.editedPermissions.append || this.editedPermissions.write,
      };
    },
    permissionsEqual(left: Permissions, right: Permissions): boolean {
      return (
        left.read === right.read &&
        left.append === right.append &&
        left.write === right.write &&
        left.control === right.control
      );
    },
    // Convert an ISO timestamp to the local input shape expected by datetime-local.
    toDateTimeLocalInput(dateValue: string): string {
      const parsed = new Date(dateValue);
      if (Number.isNaN(parsed.getTime())) {
        return "";
      }
      const pad = (value: number) => String(value).padStart(2, "0");
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(
        parsed.getHours()
      )}:${pad(parsed.getMinutes())}`;
    },
    // Validate and resolve the optional scheduled revoke fields for permission edits.
    resolvePermissionEditRevokeAtIsoOrThrow(): string | undefined {
      if (this.permissionRevokeMode === "none") {
        return undefined;
      }

      if (this.permissionRevokeMode === "duration") {
        const durationValue = Number(this.permissionRevokeDurationValue);
        if (!Number.isFinite(durationValue) || durationValue <= 0) {
          throw new Error("Provide a duration greater than 0.");
        }
        const unitToMs: Record<"minutes" | "hours" | "days", number> = {
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000,
        };
        const revokeAt = new Date(
          Date.now() + durationValue * unitToMs[this.permissionRevokeDurationUnit]
        );
        return revokeAt.toISOString();
      }

      const revokeDate = new Date(this.permissionRevokeDateTimeLocal);
      if (!this.permissionRevokeDateTimeLocal || Number.isNaN(revokeDate.getTime())) {
        throw new Error("Provide a valid future date/time.");
      }
      if (revokeDate.getTime() <= Date.now()) {
        throw new Error("Revoke date/time must be in the future.");
      }
      return revokeDate.toISOString();
    },
    getPermissionEditKey(mode: userHash, userIndex: number): string {
      return `${mode.sharedWith}-${mode.resourceUrl}-${mode.created}-${userIndex}`;
    },
    startPermissionEdit(mode: userHash, userIndex: number) {
      this.permissionEditError = "";
      this.editedPermissions = this.permissionsFromModeIris(mode.accessModes);
      this.permissionRevokeDurationValue = null;
      this.permissionRevokeDurationUnit = "hours";
      this.permissionRevokeDateTimeLocal = "";
      if (mode.revokeAt) {
        this.permissionRevokeMode = "datetime";
        this.permissionRevokeDateTimeLocal = this.toDateTimeLocalInput(mode.revokeAt);
      } else {
        this.permissionRevokeMode = "none";
      }
      this.editingPermissionKey = this.getPermissionEditKey(mode, userIndex);
    },
    cancelPermissionEdit() {
      this.permissionEditError = "";
      this.editingPermissionKey = null;
      this.permissionEditSavingKey = null;
      this.permissionRevokeMode = "none";
      this.permissionRevokeDurationValue = null;
      this.permissionRevokeDurationUnit = "hours";
      this.permissionRevokeDateTimeLocal = "";
    },
    async savePermissionEdit(mode: userHash, userIndex: number) {
      const editKey = this.getPermissionEditKey(mode, userIndex);
      const previousPermissions = this.permissionsFromModeIris(mode.accessModes);
      const nextPermissions = this.normalizeEditedPermissions();
      let nextRevokeAt: string | undefined;

      try {
        nextRevokeAt = this.resolvePermissionEditRevokeAtIsoOrThrow();
      } catch (error) {
        this.permissionEditError = error instanceof Error ? error.message : "Provide a valid revoke schedule.";
        return;
      }

      const previousRevokeAt = mode.revokeAt || "";
      const revokeScheduleChanged = previousRevokeAt !== (nextRevokeAt || "");

      if (this.permissionsEqual(previousPermissions, nextPermissions) && !revokeScheduleChanged) {
        this.cancelPermissionEdit();
        return;
      }

      this.permissionEditError = "";
      this.permissionEditSavingKey = editKey;
      const podRoot = this.currentPod.endsWith("/") ? this.currentPod : `${this.currentPod}/`;
      const isPublicShare = mode.sharedWith === PUBLIC_AGENT_WEBID;

      try {
        if (isPublicShare) {
          await changeAclPublic(mode.resourceUrl, nextPermissions);
        } else {
          await changeAclAgent(mode.resourceUrl, mode.sharedWith, nextPermissions);
        }

        // Replace the active Offer so permission and revoke-time edits do not leave overlapping records.
        const previousModeIris = getEnabledAccessModeIris(previousPermissions);
        if (previousModeIris.length > 0) {
          await updateSharedWithOthers(podRoot, mode.resourceUrl, mode.sharedWith, nextPermissions, {
            forceUndo: true,
            modeIris: previousModeIris,
            revokedOfferIri: mode.offerIri,
          });
          if (!isPublicShare) {
            await updateSharedWithMe(mode.sharedWith, this.currentWebId, mode.resourceUrl, nextPermissions, {
              forceUndo: true,
              modeIris: previousModeIris,
            });
          }
        }

        // If any access remains enabled, append a fresh Offer without changing the resource hash.
        if (getEnabledAccessModeIris(nextPermissions).length > 0) {
          await updateSharedWithOthers(podRoot, mode.resourceUrl, mode.sharedWith, nextPermissions, {
            revokeAt: nextRevokeAt,
          });
          if (!isPublicShare) {
            await updateSharedWithMe(mode.sharedWith, this.currentWebId, mode.resourceUrl, nextPermissions);
          }
        }

        await this.loadFileTtl();
        this.cancelPermissionEdit();
      } catch (error) {
        console.error("Could not edit shared permission:", error);
        this.permissionEditError =
          "Could not update this permission. Check that the ACL file and notification inbox are writable.";
      } finally {
        if (this.permissionEditSavingKey === editKey) {
          this.permissionEditSavingKey = null;
        }
      }
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
    // Render scheduled revoke timestamp when present.
    formatRevokeAt(revokeValue: string | undefined): string {
      if (!revokeValue || revokeValue === "N/A") {
        return "No automatic revoke";
      }
      const parsed = new Date(revokeValue);
      if (Number.isNaN(parsed.getTime())) {
        return revokeValue;
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
      const loadToken = ++this.latestLoadToken;
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
          if (loadToken !== this.latestLoadToken) {
            return;
          }
          this.sharedItems = this.sortByNewest(toRaw(sharedItemsThings));
        } catch (err) {
          console.error("Error fetching shared-with-others items:", err);
        }
      } else if (this.currentOperation === "sharedWithMe") {
        try {
          const sharedItemsThings = await getSharedWithMe(podRoot);
          if (loadToken !== this.latestLoadToken) {
            return;
          }
          this.sharedMeItems = this.sortByNewest(sharedItemsThings.sharedItems);
        } catch (err) {
          console.error("Error fetching shared-with-me items:", err);
        }
      }
    },
    /**
     * Debounces rapid prop changes to avoid duplicate inbox reads when users
     * switch between tabs/pods quickly.
     */
    scheduleLoadFileTtl() {
      if (this.loadTtlTimerId !== null) {
        window.clearTimeout(this.loadTtlTimerId);
      }
      this.loadTtlTimerId = window.setTimeout(() => {
        this.loadTtlTimerId = null;
        this.loadFileTtl();
      }, 120);
    },
  },
  watch: {
    currentOperation() {
      this.scheduleLoadFileTtl();
    },
    currentPod() {
      this.scheduleLoadFileTtl();
    },
    currentWebId() {
      this.scheduleLoadFileTtl();
    },
  },
  mounted() {
    this.scheduleLoadFileTtl();
  },
  beforeUnmount() {
    if (this.loadTtlTimerId !== null) {
      window.clearTimeout(this.loadTtlTimerId);
      this.loadTtlTimerId = null;
    }
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
.shared-others-collapsed-copy {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
}
.shared-others-collapsed-copy .entry-title {
  flex: 1 1 auto;
  min-width: 0;
}
.entry-inline-summary {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: var(--font-size-page-summary);
  white-space: nowrap;
}
.entry-inline-summary span {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
}
.entry-copy-equalized {
  min-height: 2.8rem;
  align-content: center;
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
.shared-me-details,
.shared-others-details {
  gap: 0.58rem;
}
.shared-me-summary-grid,
.resource-secondary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.48rem;
}
.summary-cell,
.shared-me-resource-card {
  border: 1px solid color-mix(in srgb, var(--border) 80%, var(--primary) 20%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel) 92%, var(--panel-elev) 8%);
}
.summary-cell {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.46rem 0.54rem;
}
.summary-cell .field-value {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shared-me-resource-card {
  display: grid;
  gap: 0.54rem;
  padding: 0.58rem 0.62rem;
}
.resource-main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.48rem;
  min-width: 0;
}
.resource-copy {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}
.resource-secondary-grid {
  grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.55fr);
}
.shared-others-recipient-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.entry-field-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
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
.entry-field.full-span {
  grid-column: 1 / -1;
}
.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
}
.field-label {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
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
.resource-url-value {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel) 92%, var(--panel-elev) 8%);
  padding: 0.62rem;
  display: grid;
  gap: 0.58rem;
}
.recipient-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem 0.7rem;
  padding-bottom: 0.52rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 74%, transparent);
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
.recipient-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-wrap: wrap;
  min-width: 0;
}
.recipient-body {
  display: grid;
  gap: 0.58rem;
}
.permission-edit-button,
.permission-cancel-button,
.permission-save-button {
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-elev) 90%, transparent);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  min-height: 2rem;
  padding: 0.28rem 0.7rem;
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}
.permission-edit-button:hover,
.permission-cancel-button:hover,
.permission-save-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary) 10%, var(--panel-elev));
  border-color: color-mix(in srgb, var(--primary) 36%, var(--border));
  color: var(--text-primary);
}
.permission-save-button {
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  border-color: color-mix(in srgb, var(--primary) 62%, var(--border));
  color: var(--primary-contrast);
}
.permission-save-button:disabled {
  cursor: wait;
  opacity: 0.72;
}
.permission-editor {
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: 12px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--panel-elev) 94%, var(--primary) 6%),
      color-mix(in srgb, var(--panel) 96%, var(--primary) 4%)
    );
  display: grid;
  gap: 0.68rem;
  padding: 0.72rem;
}
.permission-editor-header,
.permission-editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.permission-editor-heading {
  display: inline-grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.44rem;
  min-width: 0;
}
.permission-editor-target {
  display: block;
  margin-top: 0.12rem;
  color: var(--text-primary);
  font-size: var(--font-size-page-summary);
  font-weight: 700;
  overflow-wrap: anywhere;
}
.permission-editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 0.85fr);
  gap: 0.58rem;
  align-items: start;
}
.permission-editor-panel {
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  display: grid;
  gap: 0.46rem;
  padding: 0.58rem;
  min-width: 0;
}
.permission-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.42rem;
}
.permission-option {
  border: 1px solid color-mix(in srgb, var(--border) 80%, var(--primary) 20%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.24rem 0.55rem;
  font-size: var(--font-size-page-summary);
  font-weight: 700;
}
.permission-option input {
  accent-color: var(--primary);
  margin: 0;
}
.permission-revoke-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8rem, 0.78fr);
  gap: 0.42rem;
}
.permission-revoke-input {
  width: 100%;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--border) 82%, var(--primary) 18%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel-elev) 90%, transparent);
  color: var(--text-primary);
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
  font-weight: 700;
  min-height: 2.08rem;
  padding: 0.34rem 0.52rem;
  outline: none;
}
.permission-revoke-input:focus {
  border-color: color-mix(in srgb, var(--primary) 48%, var(--border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 18%, transparent);
}
.permission-revoke-input.compact {
  min-width: 7rem;
}
.permission-error {
  margin: 0;
  color: var(--danger);
  font-size: var(--font-size-page-summary);
  font-weight: 700;
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
  .entry-field-grid {
    grid-template-columns: 1fr;
  }
  .shared-me-summary-grid,
  .resource-secondary-grid,
  .shared-others-recipient-grid {
    grid-template-columns: 1fr;
  }
  .resource-main {
    align-items: start;
  }
  .resource-url-value {
    white-space: normal;
  }
  .entry-title {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .shared-others-collapsed-copy {
    display: grid;
    gap: 0.24rem;
  }
  .entry-inline-summary {
    justify-content: flex-start;
    flex-wrap: wrap;
    white-space: normal;
  }
  .recipient-actions {
    justify-content: flex-start;
    width: 100%;
  }
  .permission-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .permission-editor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .permission-options {
    grid-template-columns: 1fr;
  }
  .permission-revoke-row {
    grid-template-columns: 1fr;
  }
}
</style>

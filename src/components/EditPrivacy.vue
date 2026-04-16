<template>

  <!-- Title bar -->
  <div class="content-container" :key="renderKey">
    <div class="title-container">
      <!-- Page header now matches the modern card styling used elsewhere in the app. -->
      <div class="privacy-header-shell">
        <div class="privacy-header-copy">
          <span class="privacy-page-title">Privacy Editing</span>
          <p class="page-summary">
            Review access controls in your pod, inspect shared items, and manage
            sharing permissions from one workspace.
          </p>
        </div>

        <div class="privacy-header-actions">
          <button class="header-icon-button" type="button" aria-label="Privacy guide">
            <i class="material-icons">info</i>
          </button>

          <div class="notifications-shell">
            <button
              class="notification-button header-icon-button"
              @click="toggleNotifications"
              type="button"
              aria-label="Notifications"
            >
              <i class="material-icons">
                {{ hasNotifications ? "notifications" : "notifications_none" }}
              </i>
              <i v-if="hasNotifications" class="badge"></i>
            </button>

            <!-- Notifications stay attached to the header action area. -->
            <div v-if="showNotifications" class="notifications-dropdown">
              <div class="notifications-content">
                <div class="notifications-header-row">
                  <div class="notifications-header-text">
                    <p class="notification-title">Notifications</p>
                    <p class="notification-hint">
                      See "Shared with me" for more details
                    </p>
                  </div>
                  <button
                    v-if="notifications.length !== 0"
                    class="mark-read"
                    @click="markNotificationsRead"
                  >
                    Mark read
                  </button>
                </div>

                <div class="no-notifications" v-if="notifications.length === 0">
                  <span>No new notifications</span>
                </div>
                <ul class="share-list">
                  <li
                    v-for="(item, index) in notifications"
                    :key="index"
                    class="notification-card"
                  >
                    <div class="notification-card-header">
                      <i class="material-icons not-colored notification-type-icon">
                        {{
                          containerCheck(item.usersSharedWith[0].resourceUrl)
                            ? "folder"
                            : "description"
                        }}
                      </i>
                      <span class="resource-hash mono">{{
                        item.usersSharedWith[0].resourceUrl
                      }}</span>
                    </div>

                    <ul class="user-rows">
                      <li
                        v-for="(mode, i) in item.usersSharedWith"
                        :key="i"
                        class="user-row"
                      >
                        <div class="cell-row">
                          <span class="cell user">
                            <i class="material-icons tiny not-colored">person</i>
                            <span class="truncate">
                              {{
                                item.owner === "http://xmlns.com/foaf/0.1/Agent"
                                  ? "Public"
                                  : item.owner
                              }}
                            </span>
                          </span>
                          <span class="cell date">
                            <i class="material-icons tiny not-colored">schedule</i>
                            <time :datetime="mode.created">{{
                              formatDate(mode.created)
                            }}</time>
                          </span>
                        </div>

                        <span class="cell modes">
                          <i class="material-icons tiny not-colored">lock</i>
                          <span class="notification-mode-chips">
                            <span
                              v-for="(ac, ind) in mode.accessModes"
                              :key="ind"
                              class="notification-mode-chip"
                              >{{ ac.split("#")[1] }}</span
                            >
                          </span>
                        </span>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Choose Pod -->
    <div class="pod-chooseContainer">
      <PodRegistration />
    </div>

    <!-- the side nav -->
    <div class="body-container" v-if="selectedPodUrl !== ''">
      <aside class="privacy-nav-card">
        <ul class="privacy-side-nav" role="list">
          <li>
            <button
              :class="{ highlight: navValue === 0 }"
              @click="toggleNavValue(0)"
            >
              <span class="nav-text"
                ><i class="material-icons">dashboard</i>My Pod</span
              >
            </button>
          </li>
          <li>
            <button
              :class="{ highlight: navValue === 1 }"
              @click="toggleNavValue(1)"
            >
              <span class="nav-text"
                ><i class="material-icons">people</i>Shared with me</span
              >
            </button>
          </li>
          <li>
            <button
              :class="{ highlight: navValue === 2 }"
              @click="toggleNavValue(2)"
              class="nav-button"
            >
              <span class="nav-text"
                ><i class="material-icons">star</i>Shared with others</span
              >
            </button>
          </li>
        </ul>
      </aside>

      <!-- "My Pod" display -->
      <!-- TODO: change the Resource to make the whole item a button -->
      <section class="privacy-main-panel pod-directories" v-if="navValue === 0">
        <div class="container-fluid">
          <div class="browser-shell">
            <div class="container-location">
              <div class="path-card">
              <div class="path-card-header">
                <div>
                  <p class="section-kicker">Browse containers</p>
                  <h3>Choose container to inspect</h3>
                </div>
                <div class="path-origin">
                  <span class="path-origin-label">Selected Container</span>
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

            <div class="items-card">
              <div class="items-header">
                <div>
                  <p class="section-kicker">Selected container contents</p>
                  <p class="items-summary">
                    Choose a container or resource inside
                    <span class="items-location">{{ currentLocation }}</span>
                    to review and update its access rules.
                  </p>
                </div>
                <div class="items-header-actions">
                  <span class="items-count">{{ urls.length }} items</span>
                </div>
              </div>

              <ul class="privacy-items-list">
            <!-- Iterates over list of containers in a pod -->
            <li v-for="(url, index) in urls" :key="index">
              <div
                v-if="loadingIndex === index"
                class="loading-spinner-container"
              >
                <div class="spinner"></div>
                <span class="loading-text">Loading access rights...</span>
              </div>
              <div
                v-else
                class="card-panel folder"
                :class="{ 'is-expanded': showSharedIndex === index }"
              >
                <div class="folder-header">
                  <button
                    @click="toggleShared(index), getSpecificAclData(url, index)"
                    class="icon-button full-width"
                  >
                    <div class="icon-hash">
                      <i class="material-icons not-colored">{{
                        containerCheck(url) ? "folder" : "description"
                      }}</i>
                      <span class="resource-hash">{{ url }}</span>
                    </div>
                    <i class="material-icons not-colored info-icon">
                      {{
                        showSharedIndex === index
                          ? "keyboard_arrow_down lock"
                          : "chevron_right lock"
                      }}</i
                    >
                  </button>
                </div>

                <!-- Current access rights -->
                <div
                  id="permissionsBox"
                  v-if="showSharedIndex === index"
                  class="form-container"
                >
                  <!-- For the case that a container/resource has an existing .acl -->
                  <div id="aclExists" v-if="hasAcl !== null">
                    <div>
                      <span id="permissionsInstructions"
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
                      >
                    </div>
                    <div id="currentPermissions">
                      <li
                        class="access-item"
                        v-for="(agent, inde) in hasAccess"
                        :key="inde"
                      >
                        <div class="user-id">
                          <div class="left-content">
                            <span class="user-tag">Agent:</span>
                            <!-- WebID chip keeps identity values visually distinct from permission fields. -->
                            <span class="the-user" :title="inde.toString()">
                              <i class="material-icons webid-icon">person</i>
                              <span class="webid-value">{{ inde }}</span>
                            </span>
                          </div>
                          <button
                            @click="copyText(inde.toString())"
                            class="icon-button right"
                          >
                            <i class="material-icons not-colored right"
                              >content_copy</i
                            >
                            <v-tooltip
                              class="tool-tip"
                              activator="parent"
                              location="left"
                              >Copy WebID to clipboard
                            </v-tooltip>
                          </button>
                        </div>
                        <span class="permissions-tag">Permissions:<br /></span>
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
                            :key="renderKey"
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

                    <!-- Show add access form -->
                    <div id="addAccess">
                      <button
                        @click="toggleForm(index)"
                        class="icon-button add-access-toggle"
                      >
                        <span>Add access rights </span>
                        <i
                          v-if="showFormIndex === null"
                          class="material-icons not-colored right"
                          >add</i
                        >
                        <i
                          v-if="showFormIndex === index"
                          class="material-icons not-colored right"
                        >
                          remove
                        </i>
                        <v-tooltip
                          v-if="showFormIndex === index"
                          class="tool-tip"
                          activator="parent"
                          location="end"
                          >Click to hide "Add access rights" field
                        </v-tooltip>
                      </button>
                    </div>

                    <!-- Add access form -->
                    <div
                      id="shareBox"
                      v-if="showFormIndex === index"
                      class="form-container"
                    >
                      <form @submit.prevent="submitForm(url)" class="access-form-shell">
                        <div class="check-boxes access-mode-grid" id="checkBoxes">
                          <!-- Designate access to give -->
                          <span id="permissionsInstructions"
                            >Select access rights:</span
                          >
                          <label class="access-mode-option">
                            <input type="checkbox" v-model="permissions.read" />
                            <span>Read</span>
                            <v-tooltip
                              class="tool-tip"
                              activator="parent"
                              location="top"
                              >Observe existing content
                            </v-tooltip>
                          </label>
                          <label class="access-mode-option">
                            <input
                              type="checkbox"
                              v-model="permissions.append"
                            />
                            <span>Append</span>
                            <v-tooltip
                              class="tool-tip"
                              activator="parent"
                              location="top"
                              >Add to to existing content
                            </v-tooltip>
                          </label>
                          <label class="access-mode-option">
                            <input
                              type="checkbox"
                              v-model="permissions.write"
                            />
                            <span>Write</span>
                            <v-tooltip
                              class="tool-tip"
                              activator="parent"
                              location="top"
                              >Change existing content + create new content
                            </v-tooltip>
                          </label>
                          <label class="access-mode-option">
                            <input
                              type="checkbox"
                              v-model="permissions.control"
                            />
                            <span>Control</span>
                            <v-tooltip
                              class="tool-tip"
                              activator="parent"
                              location="top"
                              >Change .acl permissions for the resource
                            </v-tooltip>
                          </label>
                        </div>

                        <div class="access-who">
                          <div class="access-choose">
                            <button
                              id="agent"
                              type="button"
                              @click="changeAccess('Agent')"
                              class="agent-button"
                              :class="{ highlight: accessType === 'Agent' }"
                            >
                              Agent
                              <v-tooltip
                                class="tool-tip"
                                activator="parent"
                                location="top"
                                >Change access for a specific WebId
                              </v-tooltip>
                            </button>
                            <button
                              id="public"
                              type="button"
                              @click="changeAccess('Public')"
                              class="public-button"
                              :class="{ highlight: accessType === 'Public' }"
                            >
                              Public
                              <v-tooltip
                                class="tool-tip"
                                activator="parent"
                                location="top"
                                >Change access for anyone
                              </v-tooltip>
                            </button>
                          </div>

                          <!-- Provide added user's WebID -->
                          <div v-if="accessType === 'Agent'" class="mt-2">
                            <input
                              type="text"
                              v-model="userUrl"
                              placeholder="Enter user's WebID:"
                              class="webid-input border p-2 w-full"
                            />
                          </div>
                        </div>
                        <!-- Provide added user's WebID -->
                        <div id="submitButton">
                          <button
                            @click="clearPermissionString"
                            type="submit"
                            class="primary-action-button"
                          >
                            Submit
                          </button>
                        </div>

                        <!-- If provided WebID is not a valid URL -->
                        <div
                          id="errorIndicator"
                          v-if="
                            userUrlInvalid &&
                            webId === userUrl &&
                            accessType === 'Agent'
                          "
                        >
                          <v-alert
                            v-model="userUrlInvalid"
                            closable
                            title="Not a valid WebID URL"
                            type="error"
                            icon="$error"
                            >Please follow format:
                            <i
                              >http://example.com/something/card#someone</i
                            ></v-alert
                          >
                        </div>
                        <!-- If provided WebID is the Pod Owner's WebId -->
                        <div
                          id="errorIndicator"
                          v-if="
                            userUrlInvalid &&
                            webId === userUrl &&
                            accessType === 'Agent'
                          "
                        >
                          <v-alert
                            v-model="userUrlInvalid"
                            closable
                            title="Caution"
                            type="error"
                            icon="$error"
                            >That is your current user WebID. Please provide a
                            different WebID to proceed.</v-alert
                          >
                        </div>

                        <!-- If added permissions are successful -->
                        <div id="successIndicator" v-if="submissionDone">
                          <v-alert
                            v-if="accessType === 'Agent'"
                            closable
                            title="Success"
                            type="success"
                            icon="$success"
                          >
                            WebId: <i>{{ userUrl }}</i
                            ><br />
                            Was given:
                            <i>{{ permissionsString }}</i> rights<br />
                            To resources in the container: <i>{{ url }}</i
                            ><br />
                            These changes were added to sharedWithOthers.ttl:
                            <i>{{ recordedOthers }}</i>
                            <br />
                            These changes were added to their sharedWithMe.ttl:
                            <i>{{ postedMe }}</i>
                          </v-alert>

                          <v-alert
                            v-if="accessType === 'Public'"
                            closable
                            title="Success"
                            type="success"
                            icon="$success"
                          >
                            <i>{{ accessType }}</i
                            ><br />
                            Was given:
                            <i>{{ permissionsString }}</i> rights<br />
                            To resources in the container: <i>{{ url }}</i>
                          </v-alert>

                          <!-- Button to reset form -->
                          <div id="resetButton">
                            <button @click="clearForm" class="secondary-action-button">
                              Reset Form
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  <!-- For the case that a container/resource does not have an existing .acl -->
                  <div
                    id="noAclExists"
                    v-if="hasAcl === null && !cannotMakeAcl"
                  >
                    <v-alert
                      type="warning"
                      title="There is no .acl (permissions file) for this resource"
                      >Click the button below to create and initalize
                      one.</v-alert
                    >
                    <button @click="makeNewAcl(url)" class="new-acl">
                      <span>Generate .acl</span>
                    </button>
                  </div>

                  <!-- For the case that a an .acl connot be initialized (e.g. for a file) -->
                  <div id="noAclMade" v-if="hasAcl === null && cannotMakeAcl">
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
            </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- "Shared with me" display -->
      <section class="privacy-main-panel shared-with" v-if="navValue === 1">
        <SharedWith
          :currentOperation="currentDisplay"
          :currentPod="selectedPodUrl"
          :currentWebId="webId"
        />
      </section>

      <!-- "Shared with others" display -->
      <section class="privacy-main-panel shared-with" v-if="navValue === 2">
        <SharedWith
          :currentOperation="currentDisplay"
          :currentPod="selectedPodUrl"
          :currentWebId="webId"
        />
      </section>
    </div>
  </div>

  <!-- Use guide -->
  <div class="use-guide">
    <PrivacyEditingGuide />
  </div>
</template>

<script lang="ts">
import PrivacyEditingGuide from "./Guides/PrivacyEditingGuide.vue";
import { getContainedResourceUrlAll } from "@inrupt/solid-client";
import {
  changeAclAgent,
  changeAclPublic,
  checkUrl,
  generateAcl,
  createInboxWithACL,
  updateSharedWithMe,
  updateSharedWithOthers,
  getSharedWithMe,
  sharedSomething,
  SharedWithMeData,
  saveNewAccessTime,
  getEnabledAccessModeIris,
  getRevokedAccessModeIris,
  getUnreadSharedWithMeNotifications,
  sortSharedNotificationsByNewest,
} from "./privacyEdit";
import {
  fetchPermissionsData,
  fetchData,
  fetchAclAgents,
  fetchPublicAccess,
  WorkingData,
} from "./getData";
import PodRegistration from "./PodRegistration.vue";
import ContainerNav from "./ContainerNav.vue";
import SharedWith from "./Styling/SharedWith.vue";
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";

interface Permissions {
  read: boolean;
  append: boolean;
  write: boolean;
  control: boolean;
}

interface AccessData {
  [agent: string]: { [permission: string]: boolean };
}

export default {
  components: {
    PodRegistration,
    ContainerNav,
    SharedWith,
    PrivacyEditingGuide,
  },
  name: "PrivacyComponent",
  data() {
    return {
      filters: ["containers", "resources"] as string[],
      filterValues: [true, true] as boolean[],
      filterMenuOpen: false as boolean,
      showSharedIndex: null as number | null,
      showFormIndex: null as number | null,
      userUrl: "" as string,
      userUrlInvalid: false as boolean,
      submissionDone: false as boolean,
      recordedOthers: false as boolean,
      permissions: {
        read: false,
        append: false,
        write: false,
        control: false,
      } as Permissions,
      navValue: 0 as number,
      permissionsString: "" as string,
      dirContents: null as WorkingData | null,
      containerContents: null as WorkingData | null,
      hasAcl: null as any, // Replace with a more specific type if available
      cannotMakeAcl: false as boolean,
      accessType: "Agent" as string,
      currentLocation: "" as string,
      currentUrl: null as string | null,
      urls: [] as string[],
      containerUrls: [] as string[],
      resourceUrls: [] as string[],
      inContainer: null as WorkingData | null,
      newUrls: [] as string[],
      aclUrl: "" as string,
      postedMe: false as boolean,
      hasAccess: {} as AccessData,
      agentAccess: {} as AccessData,
      publicAccess: {} as { [permission: string]: boolean },
      uploadedSharingDoc: "" as string,
      container: [] as string[],
      currentDisplay: "default" as string,
      loading: false as boolean,
      loadingIndex: null as number | null,
      renderKey: 0 as number,
      notifications: [] as sharedSomething[],
      showNotifications: false as boolean,
      hasNotifications: false as boolean,
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
  },
  methods: {
    /*
    Checks if the input item url is a container
    */
    containerCheck(itemUrl: string) {
      return itemUrl.endsWith("/");
    },
    // Changes the mode of sharing data
    changeAccess(mode: string) {
      this.accessType = mode;
    },

    /**
     * method that returns a list of child container URLs from within a specified parent container
     *
     * @param currentDir the current container from which child containers should be identified
     * @param contUrlList the list of containers in the current directory
     */
    childContainers(currentDir: string, contUrlList: string[]): string[] {
      const newUrlLst = contUrlList
        .filter((url) => url !== currentDir) // Remove the current parent container
        .map((url) => {
          const segments = url
            .split("/")
            .filter((segment) => segment.length > 0);
          return segments[segments.length - 1] + "/";
        });
      // for navigating up a directory path (not possible when in root directory)
      if (currentDir !== this.selectedPodUrl) {
        newUrlLst.push("/..");
      }
      return newUrlLst.sort((a, b) => a.length - b.length);
    },

    /**
     * Similar logic as the childContainers method but for resources
     *
     * @param currentDir the current container from which child resources should be identified
     * @param rescUrlList the current container from which child resources should be identified
     */
    childResources(currentDir: string, rescUrlList: string[]): string[] {
      const newUrlLst = rescUrlList
        .filter((url) => url !== currentDir) // Remove the current parent container
        .map((url) => {
          const segments = url
            .split("/")
            .filter((segment) => segment.length > 0);
          return segments[segments.length - 1];
        });
      return newUrlLst.sort((a, b) => a.length - b.length);
    },

    /**
     * method that allows for the traversal of the container structure in a User's Pod
     *
     * @param aNewLocation the container name that a user will be traversing to
     */
    async changeCurrentLocation(aNewLocation: string) {
      const dismembered = this.currentLocation.split("//");
      const segments = dismembered[1]
        .split("/")
        .filter((segment) => segment.length > 0);

      // for moving 'up' the container levels (toward the root)
      if (aNewLocation === "/..") {
        segments.pop();
        const newUrl = dismembered[0] + "//" + segments.join("/") + "/";
        this.currentLocation = newUrl;
        await this.getSpecificData(newUrl);
        this.currentUrl = null;
      }
      // for moving 'down' the container levels (away from the root)
      else {
        const newUrl =
          dismembered[0] + "//" + segments.join("/") + "/" + aNewLocation;
        this.currentLocation = newUrl;
        await this.getSpecificData(newUrl);
        this.currentUrl = null;
      }
    },
    /**
     * method for copying text to the user's clipboard
     *
     * @param text the text to be coppied
     */
    copyText(text: string) {
      navigator.clipboard.writeText(text);
    },

    /*
    Two methods for controlling the UI
    */
    toggleShared(index: number) {
      if (this.showSharedIndex === index) {
        this.showSharedIndex = null; // Hide the form if it's already shown
      } else {
        this.showSharedIndex = index; // Show the form for the clicked item
      }
      this.showFormIndex = null;
    },
    toggleForm(index: number) {
      if (this.showFormIndex === index) {
        this.showFormIndex = null; // Hide the form if it's already shown
      } else {
        this.showFormIndex = index; // Show the form for the clicked item
      }
    },
    /**
     * Method for changing the view between "My Pod", "Shared with me", and "Shared with others"
     * @param newValue integer that indicates the new display value
     */
    toggleNavValue(newValue: number) {
      this.navValue = newValue;
      if (this.navValue === 1) {
        this.currentDisplay = "sharedWithMe";
      } else if (this.navValue === 2) {
        this.currentDisplay = "sharedWithOthers";
      } else if (this.navValue === 0) {
        this.currentDisplay = "default";
      }
    },

    /**
     * Method for creating an inbox/ container in a Pod if it does not already exist
     */
    createInbox() {
      createInboxWithACL(this.selectedPodUrl, this.webId);
    },

    /**
     * Normalizes permission toggles before ACL + notification writes.
     * WAC semantics require Append when Write is enabled.
     */
    normalizePermissionsInput(): Permissions {
      return {
        ...this.permissions,
        append: this.permissions.append || this.permissions.write,
      };
    },

    /**
     * Resolves the previous ACL state for the currently selected target (Agent/Public).
     * This is used to detect revocations and emit LDPN `as:Undo` entries.
     */
    getPreviousPermissionsForTarget(targetWebId: string): Permissions {
      const previousAccessForTarget =
        this.accessType === "Public"
          ? this.hasAccess.Public
          : this.hasAccess[targetWebId];
      return {
        read: Boolean(previousAccessForTarget?.read),
        append: Boolean(previousAccessForTarget?.append),
        write: Boolean(previousAccessForTarget?.write),
        control: Boolean(previousAccessForTarget?.control),
      };
    },

    /**
     * Creates a compact user-facing summary of the selected permissions.
     */
    formatPermissionsSummary(permissions: Permissions): string {
      if (permissions.control) {
        return "Control";
      }

      const entries: string[] = [];
      if (permissions.read) {
        entries.push("Read");
      }
      if (permissions.write) {
        entries.push("Write");
      } else if (permissions.append) {
        entries.push("Append");
      }
      if (entries.length === 0) {
        entries.push("No");
      }
      return entries.join(" / ");
    },

    /**
     * Persists ACL changes and mirrors those changes into LDPN notification logs.
     *
     * @param url The container/resource URL whose ACL is being updated.
     */
    async submitForm(url: string) {
      // Reset status flags for this submission cycle.
      this.postedMe = false;
      this.recordedOthers = false;

      // Normalize permissions before persisting + logging (Write implies Append in WAC semantics).
      const normalizedPermissions = this.normalizePermissionsInput();
      this.permissions = normalizedPermissions;

      // Capture current access state to derive revocations for LDPN as:Undo entries.
      const previousPermissions = this.getPreviousPermissionsForTarget(
        this.userUrl
      );
      const revokedModeIris = getRevokedAccessModeIris(
        previousPermissions,
        normalizedPermissions
      );
      const hasGrantedModes =
        getEnabledAccessModeIris(normalizedPermissions).length > 0;

      // Derive status label shown after successful submission.
      this.permissionsString = this.formatPermissionsSummary(
        normalizedPermissions
      );

      this.loading = true; // Start loading

      // for Agent ACL changes
      if (this.accessType === "Agent") {
        this.userUrlInvalid = checkUrl(this.userUrl, this.webId);
        if (!this.userUrlInvalid) {
          // Apply ACL changes for the selected agent target.
          await changeAclAgent(url, this.userUrl, normalizedPermissions);

          // If permissions were removed, append explicit revocation notifications first.
          if (revokedModeIris.length > 0) {
            this.postedMe = await updateSharedWithMe(
              this.userUrl,
              this.webId,
              url,
              normalizedPermissions,
              { forceUndo: true, modeIris: revokedModeIris }
            );
            this.recordedOthers = await updateSharedWithOthers(
              this.selectedPodUrl,
              url,
              this.userUrl,
              normalizedPermissions,
              { forceUndo: true, modeIris: revokedModeIris }
            );
          }

          // Append grant/update notifications with resulting access modes.
          if (hasGrantedModes) {
            const postMeOffer = await updateSharedWithMe(
              this.userUrl,
              this.webId,
              url,
              normalizedPermissions
            );
            const postOthersOffer = await updateSharedWithOthers(
              this.selectedPodUrl,
              url,
              this.userUrl,
              normalizedPermissions
            );
            this.postedMe = this.postedMe || postMeOffer;
            this.recordedOthers = this.recordedOthers || postOthersOffer;
          }
        }
      }

      // for Public ACL changes
      if (this.accessType === "Public") {
        await changeAclPublic(url, normalizedPermissions);
        const publicAgent = "http://xmlns.com/foaf/0.1/Agent";

        if (revokedModeIris.length > 0) {
          this.recordedOthers = await updateSharedWithOthers(
            this.selectedPodUrl,
            url,
            publicAgent,
            normalizedPermissions,
            { forceUndo: true, modeIris: revokedModeIris }
          );
        }

        if (hasGrantedModes) {
          const publicOffer = await updateSharedWithOthers(
            this.selectedPodUrl,
            url,
            publicAgent,
            normalizedPermissions
          );
          this.recordedOthers = this.recordedOthers || publicOffer;
        }
      }

      // Message that tells the changes that have been made
      this.submissionDone = true;

      await this.getSpecificAclData(url);

      this.loading = false; // Stop loading
      this.updateRenderKey();
    },

    /**
     * Resets Form variables after a successful submission
     */
    clearForm() {
      this.userUrl = "";
      this.permissionsString = "";
      this.permissions = {
        read: false,
        write: false,
        append: false,
        control: false,
      };
      this.submissionDone = false;
    },
    clearPermissionString() {
      this.permissionsString = "";
      this.submissionDone = false;
    },

    /**
     * Sorts container URLs and resource URLs into different lists
     */
    separateUrls() {
      this.containerUrls = this.urls.filter((url) => url.endsWith("/"));
      this.resourceUrls = this.urls.filter((url) => !url.endsWith("/"));
      if (
        this.currentLocation === this.selectedPodUrl &&
        !this.urls.includes(this.selectedPodUrl)
      ) {
        this.urls.push(this.selectedPodUrl);
        this.containerUrls.push(this.selectedPodUrl);
      }
      this.urls = this.urls.sort((a, b) => a.length - b.length);
      this.container = this.urls.sort((a, b) => a.length - b.length);
      this.resourceUrls = this.urls.sort((a, b) => a.length - b.length);
    },

    /**
     * Obtains the containers within the root directory of a user's pod,
     * puts the URLs for these containers into an array,
     * then sorts the array to reflect heirarchy
     */
    async getGeneralData() {
      this.dirContents = await fetchData(this.selectedPodUrl);
      this.urls = [...getContainedResourceUrlAll(this.dirContents)];
      this.separateUrls();
    },
    /**
     * Obtains a list containers and/or resources located in the provided container
     *
     * @param path the URL of the container for which access rights are being displayed
     */
    async getSpecificData(path: string) {
      this.dirContents = await fetchData(path);
      this.urls = [...getContainedResourceUrlAll(this.dirContents)];
      this.separateUrls();
      this.agentAccess = await fetchAclAgents(path);
      this.publicAccess = await fetchPublicAccess(path);
      this.hasAccess = {
        Public: this.publicAccess,
        ...this.agentAccess,
      };
    },
    /**
     * Obtains a list of agents that have access to the designated resource or container
     *
     * @param path the URL of the resource or container for which access rights are to be displayed
     */
    async getSpecificAclData(url: string, index?: number) {
      if (index !== undefined) {
        this.loadingIndex = index;
      }

      try {
        this.hasAcl = await fetchPermissionsData(url); // value is either .acl obj OR null (if .acl does not exist)
        if (this.hasAcl !== null) {
          this.agentAccess = await fetchAclAgents(url);
          this.publicAccess = await fetchPublicAccess(url);
          this.hasAccess = {
            Public: this.publicAccess,
            ...this.agentAccess,
          };
          this.cannotMakeAcl = false;
        }
      } finally {
        this.loadingIndex = null; // Reset loading index after loading completes
      }
    },

    /**
     * Makes a new .acl file for containers or resources that do not have a vaild .acl
     *
     * @param path the URL of the resource or container for which an .acl is to be made
     */
    async makeNewAcl(path: string) {
      try {
        await generateAcl(path, this.webId);
        await this.getSpecificAclData(path);
      } catch (err) {
        console.error(err);
        this.cannotMakeAcl = true;
      }
    },
    async initialLoad() {
      if (this.selectedPodUrl != "") {
        this.currentLocation = this.selectedPodUrl;
        await this.getGeneralData();
        await this.createStuff();
      }
    },

    /* Compares each of the dates created on items in sharedWithMe */
    async obtainSharedWithMeData(): Promise<SharedWithMeData | null> {
      try {
        const sharedItemsThings = await getSharedWithMe(this.selectedPodUrl);
        return sharedItemsThings;
      } catch (err) {
        console.error("Error fetching shared items:", err);
        return null;
      }
    },

    /* Compares each of the dates created on items in sharedWithMe */
    async compareDates() {
      const sharedData = await this.obtainSharedWithMeData();
      // When there is an error obtaining sharedWithMe data
      if (sharedData === null) {
        this.notifications = [];
        this.hasNotifications = false;
        return;
      }

      // Shared helpers keep unread sorting/filtering aligned with TheHeader.
      this.notifications = sortSharedNotificationsByNewest(
        getUnreadSharedWithMeNotifications(sharedData)
      );
      this.hasNotifications = this.notifications.length > 0;
    },

    // Records the current date and time as the last access time
    async markNotificationsRead() {
      const newAccessSuccess = await saveNewAccessTime(this.selectedPodUrl);
      if (newAccessSuccess) {
        await this.compareDates();
      } else {
        console.log("Failed to update last access time.");
      }
    },

    /* creates files and directories if not already present */
    async createStuff() {
      await createInboxWithACL(this.selectedPodUrl, this.webId);
      await this.getGeneralData();
      this.$forceUpdate(); // Forces a re-render of the component
    },
    /* Takes in the emitted value from ContainerNav.vue */
    handleSelectedContainer(selectedContainer: string) {
      this.currentLocation = selectedContainer;
      this.getSpecificData(this.currentLocation);
    },
    updateRenderKey() {
      this.renderKey += 1;
    },
    /**
     * Maps optional route query hints into the privacy page UI state.
     *
     * Supported query keys:
     * - view=sharedWithMe|sharedWithOthers|myPod
     * - notifications=open
     */
    applyRouteDisplayState() {
      const routeQuery = this.$route?.query ?? {};
      const queryView = routeQuery.view;
      if (queryView === "sharedWithMe") {
        this.toggleNavValue(1);
      } else if (queryView === "sharedWithOthers") {
        this.toggleNavValue(2);
      } else if (queryView === "myPod") {
        this.toggleNavValue(0);
      }

      const notificationsMode = routeQuery.notifications;
      this.showNotifications = notificationsMode === "open";
    },
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },
    formatDate(d: string) {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d; // fallback if not a valid date
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    },
  },
  mounted() {
    try {
      this.applyRouteDisplayState();
      if (this.selectedPodUrl != "") {
        this.currentLocation = this.selectedPodUrl;
        this.getGeneralData();
        this.createStuff();
        this.compareDates();
      }
    } catch (error) {
      console.error("Error during component mount:", error);
    }
  },
  watch: {
    selectedPodUrl(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.getGeneralData();
        this.createStuff();
        this.compareDates();
        this.updateRenderKey();
      }
    },
    "$route.query": {
      handler() {
        this.applyRouteDisplayState();
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/icon?family=Material+Icons");
button:focus {
  background-color: transparent !important;
}

/* general formatting */
.content-container {
  display: flex;
  flex-direction: column;
  border-radius: 6px;
}
.body-container {
  display: flex;
  flex: 1 1 auto;
  box-shadow: var(--v-shadow-2);
  border-radius: 6px;
  background-color: var(--bg-secondary);
  margin: 0.5rem;
  resize: vertical;
  overflow: auto;
}
.pod-directories {
  flex: 1 1 auto;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.dir-nav {
  background-color: var(--panel);
  border-radius: 6px;
  display: flex;
  align-items: center;
  box-shadow: none;
}

/* title bar */
.title-nav {
  background-color: transparent;
  box-shadow: none;
  margin: 0.5rem 0.5rem 0.5rem 0rem;
  border-radius: 6px;
}
.title-container {
  flex: 1;
  background-color: transparent;
  margin: 0;
}
.privacy-page-title {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  color: var(--text-secondary);
}
.dir-nav nav {
  box-shadow: var(--v-shadow-2);
}
.nav-wrapper {
  border-radius: 6px;
  padding: 0 1rem;
  margin: 0 0.5rem 0 0.5rem;
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 11%, transparent) 0, transparent 32%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--panel) 94%, var(--primary-100) 6%),
      var(--panel)
    );
  box-shadow: var(--shadow-1);
}
.nav-wrapper .material-icons {
  color: var(--text-secondary);
}
.tool-tip {
  font-family: "Oxanium", monospace;
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  background: var(--panel);
  border-radius: 8px;
  padding: 0rem 0 0 1rem;
  margin: 0rem 0.5rem;
  font-family: "Oxanium", monospace;
}
.v-messages {
  display: none;
  margin: 0;
}

/* Choose location in MyPod */
.nav-container {
  display: flex;
  border-radius: 4px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  min-width: fit-content;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border);
  align-items: center;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-container ul {
  list-style-type: none;
  padding: 10px;
  height: 100%;
  overflow: auto;
}
.container-fluid {
  overflow-y: auto;
  overflow-x: hidden;
}
.path-selection {
  display: flex;
  align-items: center;
  list-style-type: none;
  width: 100%;
}
.path-selection ul {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0.3rem 0;
  width: 100%;
  align-items: center;
  color: var(--text-secondary);
}
.path-selection li {
  margin: 0 0 0 1rem;
  white-space: nowrap;
  align-items: center;
}
.path-selection span {
  font-size: 18pt;
  font-family: "Oxanium", monospace;
  font-weight: 400;
  margin-left: 0.5rem;
}
.container-choose {
  margin-left: auto;
  box-shadow: none;
}
.dir-nav {
  background-color: var(--bg-secondary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  box-shadow: none;
}

.directory-nav {
  margin: 10px 0 0 0;
  border-radius: 6px;
}
.directory-nav span {
  font-size: 14pt;
  font-family: "Oxanium", monospace;
  font-weight: 800;
  margin-left: 25px;
}

.select-dir {
  font-family: "Oxanium", monospace;
  display: flex;
  align-items: center;
  margin-left: 15px;
  gap: 20px;
}
.select-dir .v-btn {
  font-family: "Oxanium", monospace;
  margin-bottom: 15px;
}
.select-dir .v-select {
  min-width: 150px;
  margin-top: 5px;
  font-family: "Oxanium", monospace;
}

/* folders */
.folder {
  margin: 0;
  font-weight: 600;
  font-size: large;
  font-family: "Oxanium", monospace;
  background-color: var(--panel);
  border-radius: 4px;
  border: 0.5px solid var(--border);
  min-height: max-content;
}
.folder i {
  color: rgba(0, 0, 0, 0.54);
  margin-top: -2px;
}
.card-panel .not-colored {
  color: var(--text-secondary);
}
.full-width {
  width: 100%;
  height: 100%;
  display: flex;
}
.resource-name {
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
  user-select: text;
  cursor: text;
}
.info-icon {
  margin-left: auto;
}
/* Share Drop Downs */
.icon-button {
  background: none;
  border: none;
  cursor: pointer;
}
#addAccess button {
  font-family: "Oxanium", monospace;
  margin-top: 20px;
  margin-bottom: 10px;
}
.form-container {
  margin-top: 10px;
}

/* Current permissions display */
#permissionsInstructions {
  font-weight: bold;
  color: var(--text-secondary);
}
.access-item {
  color: var(--text-secondary);
  border-top: 1px dashed var(--text-secondary);
  padding-top: 10px;
  margin-top: 10px;
}
.access-item:nth-last-child(2) {
  border-bottom: 2px solid var(--text-secondary);
  padding-bottom: 10px;
  margin-bottom: 10px;
}

#currentPermissions {
  margin-left: 10px;
}
.user-id {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.left-content {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  flex: 1;
}
.user-tag,
.permissions-tag {
  color: var(--text-secondary);
  font-size: var(--font-size-section-kicker);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.user-id button {
  padding: 3px;
  cursor: pointer;
}
.user-id button:active {
  opacity: 0.5;
}
.the-user {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  max-width: min(100%, 52rem);
  padding: 0.35rem 0.62rem;
  border: 1px solid color-mix(in srgb, var(--primary) 32%, var(--border) 68%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 10%, var(--panel-elev) 90%);
  color: var(--text-secondary);
  font-size: var(--font-size-page-summary);
  font-weight: 600;
  line-height: 1.25;
}
.the-user i {
  font-size: 1rem;
  color: color-mix(in srgb, var(--primary) 72%, var(--text-secondary) 28%);
}
.webid-value {
  display: inline-block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permission-item {
  display: grid;
  grid-template-columns: auto 1fr; /* Two columns: auto width for label, remaining space for value */
  margin-left: 10px;
}
.permission-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.true-color {
  color: var(--yasqe-string);
}
.true-color i {
  color: var(--yasqe-string);
}
.false-color {
  color: var(--yasqe-string-2);
}
.false-color i {
  color: var(--yasqe-string-2);
}

#checkBoxes {
  margin-bottom: 0.3rem;
}
.access-form-shell {
  display: grid;
  gap: 0.78rem;
}
.access-mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}
.access-mode-option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.42rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--border) 82%, var(--primary) 18%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel-elev) 92%, transparent);
  font-family: "Oxanium", monospace;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease;
}
.access-mode-option:hover {
  background: color-mix(in srgb, var(--primary) 8%, var(--panel-elev));
  border-color: color-mix(in srgb, var(--primary) 32%, var(--border));
}
.access-mode-option span {
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
}
.access-mode-option input[type="checkbox"] {
  appearance: none; /* Hide default checkbox */
  width: 16px;
  height: 16px;
  border: 2px solid var(--border); /* Default border */
  border-radius: 3px;
  background-color: transparent;
  position: relative;
  cursor: pointer;
  outline: none;
  flex: 0 0 auto;
}
.access-mode-option input[type="checkbox"]:checked {
  background-color: var(--success); /* Green color when checked */
  border-color: var(--success); /* Match the border */
}
.access-mode-option input[type="checkbox"]:checked::before {
  content: "✔";
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: bold;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.icon-button span {
  color: var(--text-secondary);
}
.add-access-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.48rem;
  margin-top: 0.15rem;
  padding: 0.32rem 0.62rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  background: color-mix(in srgb, var(--panel) 94%, var(--panel-elev) 6%);
  font-weight: 600;
  font-size: var(--font-size-page-summary);
}
/* Access rights Agent + Public buttons */
.access-choose {
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
  width: 100%;
  margin: 0.2rem 0;
}
.access-choose button {
  flex: 1;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--border) 80%, var(--primary) 20%);
  background: color-mix(in srgb, var(--panel-elev) 95%, var(--panel) 5%);
  min-height: 2.15rem;
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
  font-weight: 600;
  color: var(--text-secondary);
}
.access-choose button.highlight {
  background-color: var(--primary) !important;
  color: var(--main-white);
  border-color: color-mix(in srgb, var(--primary) 62%, var(--border));
}

.mt-2 input {
  width: 100%;
}
.webid-input {
  margin-top: 0.35rem;
  min-height: 2.3rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--border) 76%, var(--primary) 24%) !important;
  border-radius: 10px;
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
  max-width: 100%;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--panel-elev) 92%, transparent);
  box-shadow: none !important;
}
.webid-input::placeholder {
  color: var(--text-muted);
}
.agent-button,
.public-button {
  padding: 0.55rem 0.65rem;
  margin-top: 0;
  cursor: pointer;
}
.primary-action-button {
  font-family: "Oxanium", monospace;
  font-weight: 600;
  border-radius: 10px;
  margin-top: 0.25rem;
  padding: 0.62rem 0.78rem;
  border: 1px solid transparent;
  background-color: var(--primary);
  color: var(--main-white);
}
.primary-action-button:hover {
  background: color-mix(in srgb, var(--primary) 84%, var(--primary-700) 16%);
}
.secondary-action-button {
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
  font-weight: 600;
  background-color: color-mix(in srgb, var(--panel-elev) 92%, var(--panel) 8%);
  color: var(--text-secondary);
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  padding: 0.55rem 0.72rem;
  border-radius: 10px;
  margin-top: 0.22rem;
}
.secondary-action-button:hover {
  background: color-mix(in srgb, var(--primary) 9%, var(--panel-elev));
  border-color: color-mix(in srgb, var(--primary) 34%, var(--border));
}
#errorIndicator {
  margin-top: 10px;
  font-size: small;
}
#successIndicator {
  margin-top: 10px;
  font-size: small;
}
#resetButton {
  margin-top: 5px;
}
#noAclExists {
  margin-top: 10px;
  font-size: small;
}
.new-acl {
  padding: 10px;
  margin-top: 5px;
  background-color: var(--muted);
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  font-family: "Oxanium", monospace;
  font-size: large;
  border-radius: 6px;
}
.new-acl:hover {
  background-color: var(--hover);
}

/* Loading spinner */
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

/* Notifications */
.notification-button {
  padding: 0 0.5rem;
}
.notification-button:hover {
  background-color: var(--hover);
  color: var(--main-white);
  border-radius: 6px;
}
.badge {
  position: absolute;
  top: 17px;
  right: 15px;
  width: 12px;
  height: 12px;
  background: var(--error);
  border-radius: 50%;
}
.notifications-dropdown {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  z-index: 1000;
  background: color-mix(in srgb, var(--panel) 96%, var(--panel-elev) 4%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-2);
  border-radius: 18px;
  width: min(42rem, 88vw);
  max-width: min(42rem, 88vw);
  padding: 0.75rem;
  line-height: normal;
}
.notifications-content {
  display: grid;
  gap: 0.65rem;
  width: 100%;
}
.notifications-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}
.notifications-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  font-family: "Oxanium", monospace;
}
.mark-read {
  font-size: 0.9rem;
  font-family: "Oxanium", monospace;
  border-radius: 10px;
  border: 1px solid transparent;
  color: var(--main-white);
  cursor: pointer;
  background-color: var(--primary);
  padding: 0.42rem 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}
.mark-read:hover {
  background: color-mix(in srgb, var(--primary) 78%, var(--primary-700) 22%);
  border-color: color-mix(in srgb, var(--primary) 55%, var(--border));
}
.notification-title {
  margin: 0;
  font-size: var(--font-size-section-title);
  font-weight: 700;
  color: var(--text-primary);
}
.notification-hint {
  margin: 0;
  font-size: var(--font-size-section-kicker);
  color: var(--text-secondary);
}
.no-notifications {
  margin: 0.2rem 0 0;
  padding: 0.65rem 0.75rem;
  border: 1px dashed color-mix(in srgb, var(--border) 72%, var(--primary) 28%);
  border-radius: 12px;
  font-family: "Oxanium", monospace;
  font-size: 0.92rem;
  color: var(--text-muted);
}

.share-list {
  display: grid;
  gap: 0.55rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.notification-card {
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel-elev) 88%, transparent);
  padding: 0.7rem 0.78rem;
  display: grid;
  gap: 0.55rem;
}
.notification-card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.notification-type-icon {
  font-size: 1.3rem;
  flex: 0 0 auto;
}
.mono {
  font-family: "Oxanium", ui-monospace, SFMono-Regular, Menlo, Consolas,
    monospace;
}
.user-rows {
  display: grid;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.user-row {
  display: grid;
  gap: 0.35rem;
}
.cell-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.45rem 0.8rem;
}
.cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.35;
}
.user .truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(25rem, 62vw);
}
.date {
  color: var(--text-muted);
  white-space: nowrap;
}
.notification-mode-chips {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: 0;
}
.notification-mode-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.45rem;
  border-radius: 999px;
  border: 1px solid
    color-mix(in srgb, var(--accent-700, #6c63ff), transparent 55%);
  background: color-mix(in srgb, var(--accent-700, #6c63ff), transparent 88%);
  font-weight: 700;
  font-size: 0.76rem;
  margin: 0;
  color: var(--yasqe-keyword);
}
.material-icons.tiny {
  font-size: 1rem;
}
.not-colored {
  color: var(--text-secondary);
}
.resource-hash {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Modern page shell overrides align Privacy Editing with the newer workspace pages. */
.content-container {
  display: grid;
  gap: 0.5rem;
}
.title-container {
  margin: 0.5rem 0.5rem 0 0.5rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 11%, transparent) 0, transparent 32%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--panel) 94%, var(--primary-100) 6%),
      var(--panel)
    );
  box-shadow: var(--shadow-1);
}
.privacy-header-shell {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.privacy-header-copy {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
}
.privacy-page-title {
  display: block;
  font-size: var(--font-size-page-title);
  line-height: var(--line-height-page-title);
  font-family: "Oxanium", monospace;
  font-weight: var(--font-weight-page-title);
  color: var(--text-primary);
}
.page-summary {
  margin: 0;
  max-width: 42rem;
  font-family: "Oxanium", monospace;
  font-size: var(--font-size-page-summary);
  line-height: 1.6;
  color: var(--text-muted);
}
.privacy-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
}
.notifications-shell {
  position: relative;
}
.header-icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary) 14%, var(--border));
  background: color-mix(in srgb, var(--panel-elev) 78%, transparent);
  color: var(--text-secondary);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}
.header-icon-button:hover {
  background: color-mix(in srgb, var(--primary) 12%, var(--panel));
  border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
  color: var(--text-primary);
  transform: translateY(-1px);
}
.header-icon-button .material-icons {
  color: inherit;
}
.notification-button {
  padding: 0;
}
.badge {
  top: 6px;
  right: 6px;
}

.pod-chooseContainer {
  margin: 0 0.5rem;
  padding: 0;
  background: transparent;
  border-radius: 0;
}

.body-container {
  display: grid;
  grid-template-columns: minmax(220px, 250px) 1fr;
  align-items: start;
  gap: 0.85rem;
  margin: 0 0.5rem;
  padding: 0;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  overflow: visible;
  resize: none;
}
.privacy-nav-card,
.privacy-main-panel {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
}
.privacy-nav-card {
  position: sticky;
  top: 1rem;
  padding: 0.7rem;
}
.privacy-side-nav {
  display: grid;
  gap: 0.48rem;
  position: static;
  width: auto;
  height: auto;
  max-height: none;
  overflow: visible;
  margin: 0;
  padding: 0;
  list-style: none;
  background: transparent;
  box-shadow: none;
  border: none;
}
.privacy-side-nav ul,
.privacy-side-nav li {
  list-style: none;
  margin: 0;
  padding: 0;
}
.privacy-side-nav li button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}
.privacy-side-nav .nav-text {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0;
  font-size: 0.98rem;
  font-weight: 700;
}
.privacy-side-nav li button.highlight {
  background: linear-gradient(135deg, var(--primary), var(--primary-600)) !important;
  color: var(--main-white);
}
.privacy-side-nav li button.highlight .material-icons {
  color: inherit;
}
.privacy-side-nav li button:hover {
  background: color-mix(in srgb, var(--primary) 12%, var(--panel));
  color: var(--text-primary);
}
.privacy-main-panel {
  padding: 1rem 1.05rem;
  min-width: 0;
}
.pod-directories,
.shared-with {
  width: auto;
}

.browser-shell {
  display: grid;
  gap: 0.85rem;
  width: 100%;
}
.container-location {
  margin: 0;
  width: 100%;
  min-width: 0;
}
.path-card,
.items-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
  font-family: "Oxanium", monospace;
  width: 100%;
  min-width: 0;
}
.path-card {
  padding: 1rem 1.05rem;
}
.path-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
  margin-bottom: 0.85rem;
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
  flex: 1 1 20rem;
  min-width: 0;
  max-width: none;
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
  white-space: normal;
  word-break: break-word;
}
.browser-layout {
  display: grid;
  gap: 0.85rem;
  width: 100%;
}
/* Keep the embedded container browser stretched to the full card width. */
.browser-layout :deep(.browser-card) {
  width: 100%;
  margin: 0;
  background-color: none;
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
.section-kicker {
  margin: 0 0 0.3rem 0;
  font-size: var(--font-size-section-kicker);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.items-title {
  display: block;
  font-size: var(--font-size-section-title);
  font-weight: 700;
  color: var(--text-primary);
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
.privacy-items-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}

.container-fluid {
  overflow: visible;
}

.folder {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
  font-size: 1rem;
}
.folder.compact {
  border-radius: 14px;
}
.full-width {
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
}
.folder-header {
  width: 100%;
}
.icon-hash {
  display: inline-flex;
  align-items: center;
  gap: 0.72rem;
  min-width: 0;
  flex: 1;
}
.resource-name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.privacy-items-list .resource-hash {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.privacy-items-list .folder {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--panel-elev);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 0.5rem;
  margin: 0.15rem 0;
  transition: all 0.25s ease;
}
.privacy-items-list .folder:hover {
  background: color-mix(in srgb, var(--hover) 70%, var(--panel-elev) 30%);
  border-color: color-mix(in srgb, var(--primary) 16%, var(--border));
}
.privacy-items-list .folder.is-expanded:hover {
  background: color-mix(in srgb, var(--panel-elev) 96%, var(--primary) 4%);
  border-color: color-mix(in srgb, var(--primary) 28%, var(--border));
}
.privacy-items-list .full-width:hover {
  background: color-mix(in srgb, var(--primary) 4%, transparent);
  border-radius: 8px;
}
.privacy-items-list .folder.is-expanded .full-width:hover {
  background: transparent;
}
.privacy-items-list .full-width {
  padding: 0.62rem 0.78rem;
}
.privacy-items-list .icon-hash {
  gap: 0.62rem;
}
.privacy-items-list .info-icon {
  color: var(--text-muted);
}

/* Keep embedded container selector surfaces aligned with the lighter page card tone. */
.browser-layout :deep(.dir-nav) {
  background: transparent !important;
}
.browser-layout :deep(.browser-card) {
  background: transparent;
}
.browser-layout :deep(.current-folder-bar) {
  background: color-mix(in srgb, var(--panel) 96%, var(--primary-100) 4%);
  border-color: color-mix(in srgb, var(--border) 86%, var(--primary) 14%);
  box-shadow: none;
}
.browser-layout :deep(.folder-section) {
  background: transparent;
}
.browser-layout :deep(.crumb) {
  /* Higher-contrast breadcrumb chip so labels remain readable in light + dark themes. */
  background: color-mix(in srgb, var(--primary) 14%, var(--panel-elev) 86%) !important;
  border: 1px solid
    color-mix(in srgb, var(--primary) 34%, var(--border) 66%) !important;
  color: color-mix(in srgb, var(--text-primary) 92%, var(--primary) 8%) !important;
}
.browser-layout :deep(.crumb:hover),
.browser-layout :deep(.crumb.active) {
  background: color-mix(in srgb, var(--primary) 22%, var(--panel-elev) 78%) !important;
  border-color: color-mix(in srgb, var(--primary) 52%, var(--border) 48%) !important;
}
.browser-layout :deep(.folder-card) {
  background: color-mix(in srgb, var(--panel) 95%, var(--panel-elev) 5%);
  border-color: color-mix(in srgb, var(--border) 84%, var(--primary) 16%);
}
.form-container {
  margin-top: 0.35rem;
  padding: 0.9rem 0.95rem 0.1rem;
  border-top: 1px solid color-mix(in srgb, var(--primary) 10%, var(--border));
}
#addAccess {
  margin-top: 0.55rem;
  padding-top: 0.4rem;
  border-top: 1px dashed color-mix(in srgb, var(--border) 72%, var(--primary) 28%);
}
#shareBox {
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel-elev) 95%, transparent);
  padding-bottom: 0.55rem;
}

.shared-with :deep(.container) {
  margin: 0;
}
.use-guide {
  margin: 1rem 0 0 0;
}

.notifications-dropdown {
  top: calc(100% + 0.55rem);
  right: 0;
  width: min(42rem, 88vw);
  max-width: min(42rem, 88vw);
  padding: 0.75rem;
  border-radius: 18px;
  background: color-mix(in srgb, var(--panel) 96%, var(--panel-elev) 4%);
  box-shadow: var(--shadow-2);
}

/* Final normalization layer: keeps typography and hover behavior aligned with shared app tokens. */
.content-container {
  --privacy-hover-surface: color-mix(in srgb, var(--primary) 10%, var(--panel));
  --privacy-hover-border: color-mix(in srgb, var(--primary) 24%, var(--border));
}
.privacy-side-nav .nav-text {
  font-size: var(--font-size-subsection-title);
}
.path-origin-value,
.items-count,
.privacy-items-list .resource-hash,
.loading-text {
  font-size: var(--font-size-page-summary);
}
.notification-title {
  font-size: var(--font-size-section-title) !important;
}
.notification-hint {
  font-size: var(--font-size-section-kicker) !important;
}

.header-icon-button:hover,
.privacy-side-nav li button:hover,
.privacy-items-list .folder:hover,
.privacy-items-list .full-width:hover,
.notification-button:hover,
.new-acl:hover,
#resetButton .secondary-action-button:hover,
.add-access-toggle:hover {
  background: var(--privacy-hover-surface) !important;
  border-color: var(--privacy-hover-border) !important;
}

@media (max-width: 980px) {
  .privacy-header-shell,
  .body-container {
    grid-template-columns: 1fr;
  }
  .privacy-header-shell {
    flex-direction: column;
    align-items: stretch;
  }
  .privacy-header-actions {
    justify-content: flex-end;
  }
  .privacy-nav-card {
    position: static;
  }
  .notifications-dropdown {
    left: 0;
    right: auto;
    width: min(42rem, calc(100vw - 2rem));
    max-width: min(42rem, calc(100vw - 2rem));
  }
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
}

@media (max-width: 760px) {
  .title-container,
  .pod-chooseContainer,
  .body-container {
    margin-left: 0.35rem;
    margin-right: 0.35rem;
  }
  .title-container {
    padding: 1rem;
  }
  .privacy-page-title {
    font-size: var(--font-size-page-title-mobile);
  }
  .privacy-main-panel {
    padding: 0.85rem 0.9rem;
  }
  .notifications-dropdown {
    width: min(42rem, calc(100vw - 1.2rem));
    max-width: min(42rem, calc(100vw - 1.2rem));
  }
}
</style>

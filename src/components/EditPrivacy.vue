<template>
  <!-- Materialize CSS -->
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
    rel="stylesheet"
  />

  <!-- Title bar -->
  <div class="content-container">
    <div class="title-container">
      <nav class="title-nav">
        <!-- Title bar and icons -->
        <div class="nav-wrapper">
          <ul>
            <span>Privacy Editing</span>
            <div class="right">
              <li>
                <!-- Make clicking this icon hide/show the Guide below -->
                <a href="#!"><i class="material-icons">info</i></a>
              </li>
              <li>
                <a href="#!"><i class="material-icons">notifications</i></a>
              </li>
            </div>
          </ul>
        </div>
      </nav>
    </div>

    <!-- Choose Pod -->
    <div class="pod-chooseContainer">
      <PodRegistration @pod-selected="handlePodSelected" />
    </div>

    <!-- the side nav -->
    <div class="body-container" v-if="currentPod !== ''">
      <div>
        <ul class="side-nav fixed floating #28353e z-depth-0">
          <li>
            <button
              :class="{ highlight: navValue === 0 }"
              @click="toggleNavValue(0)"
            >
              <a class="nav-text"
                ><i class="material-icons">dashboard</i>My Pod</a
              >
            </button>
          </li>
          <li><div class="divider"></div></li>
          <li>
            <button
              :class="{ highlight: navValue === 1 }"
              @click="toggleNavValue(1)"
            >
              <a class="nav-text"
                ><i class="material-icons">people</i>Shared with me</a
              >
            </button>
          </li>
          <li><div class="divider"></div></li>
          <li>
            <button
              :class="{ highlight: navValue === 2 }"
              @click="toggleNavValue(2)"
              class="nav-button"
            >
              <a class="nav-text"
                ><i class="material-icons">star</i>Shared with others</a
              >
            </button>
          </li>
          <li><div class="divider"></div></li>
        </ul>
      </div>

      <!-- "My Pod" display -->
      <!-- TODO: change the Resource to make the whole item a button -->
      <div class="pod-directories" v-if="navValue === 0">
        <div class="container-fluid">
          <div class="nav-container">
            <div class="path-selection">
              <ul>
                <li>
                  <span><b>Current location:</b> </span>
                </li>
                <!-- Browse existing path -->
                <li class="container-choose">
                  <container-nav
                    :currentPod="currentPod"
                    @path-selected="handleSelectedContainer"
                  />
                </li>
              </ul>
            </div>
          </div>
          <ul>
            <!-- Iterates over list of containers in a pod -->
            <li v-for="(url, index) in urls" :key="index">
              <div class="card-panel folder">
                <button
                  @click="toggleShared(index), getSpecificAclData(url)"
                  class="icon-button full-width"
                >
                  <i class="material-icons not-colored left">{{
                    containerCheck(url) ? "folder" : "description"
                  }}</i>
                  <span class="resource-name">{{ url }}</span>
                  <i class="material-icons not-colored info-icon">
                    {{
                      showSharedIndex === index
                        ? "keyboard_arrow_down lock"
                        : "chevron_right lock"
                    }}</i
                  >
                </button>

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
                          <v-tooltip class="tool-tip" activator="parent" location="end"
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
                            <span class="user-tag">Agent:<br /></span>
                            <span class="the-user"
                              ><i>{{ inde }}</i>
                            </span>
                          </div>
                          <button
                            @click="copyText(inde.toString())"
                            class="icon-button right"
                          >
                            <i class="material-icons not-colored right"
                              >content_copy</i
                            >
                            <v-tooltip class="tool-tip" activator="parent" location="left"
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
                      <button @click="toggleForm(index)" class="icon-button">
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
                      <form @submit.prevent="submitForm(url)">
                        <div class="check-boxes" id="checkBoxes">
                          <!-- Designate access to give -->
                          <span id="permissionsInstructions"
                            >Select access rights:</span
                          >
                          <label>
                            <input type="checkbox" v-model="permissions.read" />
                            <span>Read</span>
                            <v-tooltip class="tool-tip" activator="parent" location="top"
                              >Observe existing content
                            </v-tooltip>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              v-model="permissions.append"
                            />
                            <span>Append</span>
                            <v-tooltip class="tool-tip" activator="parent" location="top"
                              >Add to to existing content
                            </v-tooltip>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              v-model="permissions.write"
                            />
                            <span>Write</span>
                            <v-tooltip class="tool-tip" activator="parent" location="top"
                              >Change existing content + create new content
                            </v-tooltip>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              v-model="permissions.control"
                            />
                            <span>Control</span>
                            <v-tooltip class="tool-tip" activator="parent" location="top"
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
                              <v-tooltip class="tool-tip" activator="parent" location="top"
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
                              <v-tooltip class="tool-tip" activator="parent" location="top"
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
                              class="border p-2 w-full"
                            />
                          </div>
                        </div>
                        <!-- Provide added user's WebID -->
                        <div id="submitButton">
                          <button @click="clearPermissionString" type="submit">
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
                            <button @click="clearForm">Reset Form</button>
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

      <!-- "Shared with me" display -->
      <!-- TODO: Fix this because emitted values are not working properly -->
      <div class="shared-with" v-if="navValue === 1">
        <SharedWith
          :currentOperation="currentDisplay"
          :currentPod="currentPod"
          :currentWebId="webId"
        />
      </div>

      <!-- "Shared with others" display -->
      <div class="shared-with" v-if="navValue === 2">
        <SharedWith
          :currentOperation="currentDisplay"
          :currentPod="currentPod"
          :currentWebId="webId"
        />
      </div>
    </div>
  </div>

  <!-- Use guide -->
  <div class="use-guide">
    <!-- TODO: Make these drop downs (with more in-depth guides for non-experts) -->
    <div class="guide-container">
      <h2 class="guide">Privacy Editing Guide</h2>

      <hr class="line" />
      <ol class="list-container">
        <li class="req">Select the Pod you want to Browse.</li>

        <li class="req">
          Use the nav bar above the container/resource list to navigate between
          containers
        </li>

        <li class="req">
          Click the <i class="material-icons">lock</i> next to a container or
          resource to see current access rights
        </li>
        <li class="req">
          Select the <b>"Add access rights +"</b> section to adjust access for a
          provided WebID
        </li>
        <li class="req">
          Future work: The left nav bar pages, add filter functionality, and
          functionality to the info/notifications icons
        </li>
      </ol>
    </div>
  </div>
</template>

<script lang="ts">
import { getContainedResourceUrlAll } from "@inrupt/solid-client";
import {
  changeAclAgent,
  changeAclPublic,
  checkUrl,
  generateAcl,
  createInboxWithACL,
  updateSharedWithMe,
  updateSharedWithOthers,
} from "./privacyEdit";
import { currentWebId } from "./login";
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
  },
  name: "PrivacyComponent",
  data(): {
    currentPod: string;
    filters: string[];
    filterValues: boolean[];
    filterMenuOpen: boolean;
    showSharedIndex: number | null;
    showFormIndex: number | null;
    userUrl: string;
    userUrlInvalid: boolean;
    submissionDone: boolean;
    recordedOthers: boolean;
    permissions: Permissions;
    navValue: number;
    permissionsString: string;
    webId: string;
    dirContents: WorkingData | null;
    containerContents: WorkingData | null;
    hasAcl: any; // Replace with a more specific type if available
    cannotMakeAcl: boolean;
    accessType: string;
    currentLocation: string;
    currentUrl: string | null;
    urls: string[];
    containerUrls: string[];
    resourceUrls: string[];
    inContainer: WorkingData | null;
    newUrls: string[];
    aclUrl: string;
    postedMe: boolean;
    hasAccess: AccessData;
    publicAccess: { [permission: string]: boolean };
    uploadedSharingDoc: string;
    container: string[];
    currentDisplay: string;
  } {
    return {
      currentPod: "",
      filters: ["containers", "resources"],
      filterValues: [true, true],
      filterMenuOpen: false,
      showSharedIndex: null,
      showFormIndex: null,
      userUrl: "",
      userUrlInvalid: false,
      submissionDone: false,
      recordedOthers: false,
      permissions: {
        read: false,
        append: false,
        write: false,
        control: false,
      },
      navValue: 0,
      permissionsString: "",
      webId: "",
      dirContents: null,
      containerContents: null,
      hasAcl: null,
      cannotMakeAcl: false,
      accessType: "Agent",
      currentLocation: "",
      currentUrl: null,
      urls: [],
      containerUrls: [],
      resourceUrls: [],
      inContainer: null,
      newUrls: [],
      aclUrl: "",
      postedMe: false,
      hasAccess: {},
      publicAccess: {},
      uploadedSharingDoc: "",
      container: [],
      currentDisplay: "default",
    };
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
      if (currentDir !== this.currentPod) {
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
      createInboxWithACL(this.currentPod, this.webId);
    },

    /**
     * method that submits the alterations to the specified .acl permissions file
     *
     * @param url the URL of the container that .acl changes are being made to
     */
    async submitForm(url: string) {
      // Handle permissions specified
      if (this.permissions.read) {
        this.permissionsString += "Read / ";
      }
      if (this.permissions.write) {
        this.permissions.append = true;
        this.permissionsString += "Write / ";
      }
      if (this.permissions.append && !this.permissions.write) {
        this.permissionsString += "Append / ";
      }
      if (this.permissions.control) {
        this.permissions.control = true;
        this.permissionsString = "Control / ";
      }
      if (this.permissionsString === "") {
        this.permissionsString = "No / ";
      }

      // for Agent ACL changes
      if (this.accessType === "Agent") {
        this.userUrlInvalid = checkUrl(this.userUrl, this.webId);
        if (!this.userUrlInvalid) {
          // add condition for different agents here ...
          // actual .acl changing
          await changeAclAgent(url, this.userUrl, this.permissions);
          // write changes to specified user's sharedWithMe.ttl file
          this.postedMe = await updateSharedWithMe(
            this.userUrl,
            this.webId,
            url,
            this.permissions
          );

          // write changes to current user's sharedWithOthers.ttl file
          this.recordedOthers = await updateSharedWithOthers(
            this.currentPod,
            url,
            this.userUrl,
            this.permissions
          );
        }
      }

      // for Public ACL changes
      if (this.accessType === "Public") {
        await changeAclPublic(url, this.permissions);

        // write changes to current user's sharedWithOthers.ttl file
        this.recordedOthers = await updateSharedWithOthers(
          this.currentPod,
          url,
          "http://xmlns.com/foaf/0.1/Agent",
          this.permissions
        );
      }

      // Message that tells the changes that have been made
      const ex = [
        this.permissionsString.length - 3,
        this.permissionsString.length - 2,
        this.permissionsString.length - 1,
      ];
      this.permissionsString = this.permissionsString
        .split("")
        .filter((char, index) => !ex.includes(index))
        .join("");
      this.submissionDone = true;

      await this.getSpecificAclData(this.currentLocation);
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
        this.currentLocation === this.currentPod &&
        !this.urls.includes(this.currentPod)
      ) {
        this.urls.push(this.currentPod);
        this.containerUrls.push(this.currentPod);
      }
      this.urls = this.urls.sort((a, b) => a.length - b.length);
      this.container = this.urls.sort((a, b) => a.length - b.length);
      this.resourceUrls = this.urls.sort((a, b) => a.length - b.length);
    },

    /**
     * Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
     * Obtains 'pod' variable (URL path to user's Pod).
     */
    async podURL() {
      this.webId = currentWebId();
    },

    /**
     * Obtains the containers within the root directory of a user's pod,
     * puts the URLs for these containers into an array,
     * then sorts the array to reflect heirarchy
     */
    async getGeneralData() {
      this.dirContents = await fetchData(this.currentPod);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
    },
    /**
     * Obtains a list containers and/or resources located in the provided container
     *
     * @param path the URL of the container for which access rights are being displayed
     */
    async getSpecificData(path: string) {
      this.dirContents = await fetchData(path);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
      this.hasAccess = await fetchAclAgents(path);
      this.publicAccess = await fetchPublicAccess(path);
      this.hasAccess = {
        Public: this.publicAccess,
        ...this.hasAccess,
      };
    },
    /**
     * Obtains a list of agents that have access to the designated resource or container
     *
     * @param path the URL of the resource or container for which access rights are to be displayed
     */
    async getSpecificAclData(path: string) {
      this.hasAcl = await fetchPermissionsData(path); // value is either .acl obj OR null (if .acl does not exist)
      if (this.hasAcl !== null) {
        this.hasAccess = await fetchAclAgents(path);
        this.publicAccess = await fetchPublicAccess(path);
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
    async makeNewAcl(path: string) {
      try {
        await generateAcl(path, this.webId);
        await this.getSpecificAclData(path);
      } catch (err) {
        console.error(err);
        this.cannotMakeAcl = true;
      }
    },
    /* Takes in the emitted value from PodRegistration.vue */
    handlePodSelected(selectedPod: string) {
      this.currentPod = selectedPod;
      this.currentLocation = this.currentPod;
      this.getGeneralData();
      this.createStuff();
    },
    /* creates files and directories if not already present */
    async createStuff() {
      await createInboxWithACL(this.currentPod, this.webId);
      this.$forceUpdate(); // Forces a re-render of the component
    },
    /* Takes in the emitted value from ContainerNav.vue */
    handleSelectedContainer(selectedContainer: string) {
      this.currentLocation = selectedContainer;
      this.getSpecificData(this.currentLocation);
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    this.podURL();
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/icon?family=Material+Icons");

/* general formatting */
.content-container {
  display: flex;
  flex-direction: column;
  border-radius: 6px;
}
.body-container {
  display: flex;
  flex: 1 1 auto;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  background-color: #445560;
  margin: 0.5rem;
  resize: vertical;
  overflow: auto;
}
.side-nav {
  flex: 1 1 auto;
}
.pod-directories {
  flex: 1 1 auto;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.dir-nav {
  background-color: #445560;
  border-radius: 6px;
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
.title-container span {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  color: #ede7f6;
}
.dir-nav nav {
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}
.nav-wrapper {
  background-color: #445560;
  border-radius: 6px;
  padding: 0 1rem;
  margin: 0 0.5rem 0 0.5rem;
}
.tool-tip {
  font-family: "Oxanium", monospace;
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  background: #445560;
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
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  min-width: fit-content;
  background-color: #445560;
  border: 2px solid #ede7f6;
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
  background-color: #445560;
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

/* sidenav */
.side-nav.floating {
  margin-top: 0;
  padding-top: 2px;
  border-radius: 2px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}
.side-nav .divider {
  margin: 2px 0;
}
.side-nav li a i.material-icons {
  height: 1.5rem;
  line-height: 2rem;
  margin: 0 1.5rem 0.5rem 0;
}
.side-nav .nav-button {
  display: flex;
  align-items: center;
}
.side-nav .nav-text {
  display: flex;
  align-items: center;
  font-size: 14pt;
  font-weight: 700;
  align-items: center;
  padding: 10px 20px 10px 5px;
}
.side-nav li button {
  display: flex;
  font-family: "Oxanium", monospace;
  align-content: center;
  padding: 5px;
  width: 100%;
  text-decoration: none;
}
.highlight {
  background-color: #754ff6;
  color: #ede7f6;
  border-radius: 6px;
}
.side-nav li button:hover {
  background-color: #555;
  color: white;
  width: 100%;
}
.side-nav li a {
  all: unset;
}

/* folders */
.folder {
  margin: 0;
  font-weight: 600;
  font-size: large;
  font-family: "Oxanium", monospace;
  background-color: #28353e;
  border-radius: 4px;
  border: 0.5px solid #ede7f6;
  min-height: max-content;
}
.folder i {
  color: rgba(0, 0, 0, 0.54);
  margin-top: -2px;
}
.card-panel .not-colored {
  color: #ede7f6;
}
.full-width {
  width: 100%;
  height: 100%;
  display: flex;
}
.resource-name {
  font-family: "Oxanium", monospace;
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
}
.access-item {
  color: #ede7f6;
  border-top: 1px dashed #000;
  padding-top: 10px;
  margin-top: 10px;
}
.access-item:nth-last-child(2) {
  border-bottom: 2px solid #000;
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
  gap: 5rem;
}
.user-tag {
  color: #ede7f6;
}
.user-id button {
  padding: 3px;
  cursor: pointer;
}
.user-id button:active {
  opacity: 0.5;
}
.the-user {
  margin-left: 10px;
  font-size: large;
}
.the-user i {
  font-size: large;
  color: #ede7f6;
}
.permissions-tag {
  font-size: large;
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
  color: #77dd76;
}
.true-color i {
  color: #77dd76;
}
.false-color {
  color: #ff6962;
}
.false-color i {
  color: #ff6962;
}

#sharebox {
  display: flex;
}
label {
  margin-left: 20px;
  font-family: "Oxanium", monospace;
}
#checkBoxes {
  margin-bottom: 10px;
}
input[type="checkbox"] {
  appearance: none; /* Hide default checkbox */
  width: 18px;
  height: 18px;
  border: 2px solid #ede7f6; /* Default border */
  border-radius: 3px;
  background-color: transparent;
  position: relative;
  cursor: pointer;
  outline: none;
}
input[type="checkbox"]:checked {
  background-color: #77dd76; /* Green color when checked */
  border-color: #77dd76; /* Match the border */
}
input[type="checkbox"]:checked::before {
  content: "✔";
  color: white;
  font-size: 14px;
  font-weight: bold;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
/* Access rights Agent + Public buttons */
.access-choose {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 1rem 0;
}
.access-choose button {
  width: 100%;
  border-radius: 5px;
}
form input[type="text"] {
  padding: 3px;
  margin-bottom: 5px;
  border: 1px solid #ede7f6 !important;
  font-family: "Courier New", Courier, monospace;
  font-size: large;
  max-width: 100%;
  color: #ede7f6;
}
form input::placeholder {
  color: rgba(255, 255, 255, 0.7); /* Slight transparency */
}
form button {
  padding: 10px;
  margin-top: 5px;
  background-color: #ede7f6;
  color: #445560;
  border: none;
  cursor: pointer;
  font-size: large;
}
#submitButton button {
  font-family: "Oxanium", monospace;
  font-weight: 600;
  border-radius: 6px;
}
form button:hover {
  background-color: #a9a7ad;
}
label span {
  font-family: "Oxanium", monospace;
  font-size: 14px;
  color: #ede7f6;
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

/* Shared with displays */
.shared-with {
  width: 80%;
}

/* The how to use guide */
.use-guide {
  margin: 0.5rem;
}
.guide-container {
  font-family: "Oxanium", monospace;
  font-size: 16pt;
  width: 100%;
  margin: auto;
  padding: 0.5rem 0rem 0.5rem 0.5rem;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.guide {
  text-align: Left;
  font-size: 18pt;
  margin: 0.5rem;
  font-weight: 600;
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

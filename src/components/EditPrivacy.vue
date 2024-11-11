<template>
  <!-- Materialize CSS -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">

  <!-- Title bar -->
  <body class="content-body">
    <div class="title-container">
      <nav class="title-nav">
        <!-- Title bar and icons -->
        <div class="nav-wrapper #445560">
          <ul>
            <span>Privacy Editing</span>
            <div class="right">
              <li>
                <a href="#!"
                  ><i class="material-icons grey-text text-darken-1">info</i></a
                >
              </li>
              <li>
                <a href="#!"
                  ><i class="material-icons grey-text text-darken-1"
                    >notifications</i
                  ></a
                >
              </li>
            </div>
          </ul>
        </div>
      </nav>

      <!-- Directory bar and navigation -->
      <nav class="dir-nav">
        <div class="directory-nav">
          <ul>
            <li>
              <span class="current-location">{{ currentLocation }}</span>
            </li>
            <li>
              <div class="select-dir">
                <v-select
                  clearable
                  variant="outlined"
                  v-model="currentUrl"
                  :items="childContainers(currentLocation, containerUrls)"
                ></v-select>
                <v-btn
                  :disabled="currentUrl === null"
                  @click="changeCurrentLocation(currentUrl)"
                  >Go</v-btn
                >
              </div>
            </li>

            <!-- TODO: filter functionality -- doesn't work and im sick of trying to figure it out -->
            <li class="right">
              <div class="the-filter">
                <v-menu v-model="filterMenuOpen">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-filter"
                      variant="solo"
                      color="#EDE7F6"
                      rounded
                      v-bind="props"
                    >
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="(item, index) in filters"
                      :key="index"
                      :value="index"
                    >
                        <v-switch
                          v-model="filterValues[index]"
                          color="primary"
                          :label="`${filters[index]}`"
                          hide-details
                        ></v-switch>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <!-- the side nav -->
    <div class="body-container">
      <div class="sideNav">
        <ul class="side-nav fixed floating #28353e z-depth-0">
          <li class="active">
            <a href="#"
              ><i class="material-icons purple-text text-darken-1">dashboard</i
              >My Pod</a
            >
          </li>
          <li><div class="divider"></div></li>
          <li>
            <a href="#"><i class="material-icons">people</i>Shared with me</a>
          </li>
          <li><div class="divider"></div></li>
          <li>
            <a href="#"><i class="material-icons">star</i>Shared with others</a>
          </li>
          <li><div class="divider"></div></li>
        </ul>
      </div>

      <!-- Pod Containers display -->
      <div class="podDirectories">
        <div class="container-fluid">
          <ul>
            <!-- Iterates over list of containers in a pod -->
            <li v-for="(url, index) in urls" :key="index">
              <div class="card-panel folder">
                <i class="material-icons left">{{
                  containerCheck(url) ? "folder" : "description"
                }}</i>
                {{ url }}
                <button
                  @click="toggleShared(index), getSpecificAclData(url)"
                  class="icon-button right"
                >
                  <i class="material-icons right">
                    {{
                      showSharedIndex === null
                        ? "chevron_right lock"
                        : "keyboard_arrow_down lock"
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
                          <i class="material-icons right">refresh</i>
                          <v-tooltip activator="parent" location="end"
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
                          <span class="user-tag">User:<br /></span>
                          <span class="the-user"
                            ><i>{{ inde }}</i>
                            <button
                              @click="copyText(inde)"
                              class="icon-button right"
                            >
                              <i class="material-icons right">content_copy</i>
                            </button>
                          </span>
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
                          class="material-icons right"
                          >add</i
                        >
                        <i
                          v-if="showFormIndex === index"
                          class="material-icons right"
                        >
                          remove
                        </i>
                        <v-tooltip
                          v-if="showFormIndex === index"
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
                        <div id="checkBoxes">
                          <!-- Designate access to give -->
                          <span id="permissionsInstructions"
                            >Select the access level:</span
                          >
                          <label>
                            <input type="checkbox" v-model="permissions.read" />
                            <span>Read</span>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              v-model="permissions.append"
                            />
                            <span>Append</span>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              v-model="permissions.write"
                            />
                            <span>Write</span>
                          </label>
                        </div>
                        <!-- Provide added user's WebID -->
                        <input
                          type="text"
                          v-model="userUrl"
                          placeholder="Enter user's WebID:"
                        />
                        <div id="submitButton">
                          <button @click="clearPermissionString" type="submit">
                            Submit
                          </button>
                        </div>

                        <!-- If provided WebID is not a valid URL -->
                        <div
                          id="errorIndicator"
                          v-if="userUrlInvalid && webId !== userUrl"
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
                          v-if="userUrlInvalid && webId === userUrl"
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
                            closable
                            title="Success"
                            type="success"
                            icon="$success"
                          >
                            WebId: <i>{{ userUrl }}</i
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
                  <div id="noAclExists" v-if="(hasAcl === null) && (!cannotMakeAcl)">
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
                  <div id="noAclMade" v-if="(hasAcl === null) && (cannotMakeAcl)">
                    <v-alert
                      type="error"
                      title="Cannot initialize an .acl for this item"
                      closable
                      >The .acl of the container this file is located within will be used for access controls.</v-alert
                    >
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <hr />
    <div class="req">
      <h2>Privacy Editing Guide</h2>
      <ol>
        <li>Click the <b>Lock icon</b> next to a container or resource to see current access rights</li>
        <li>Select the <b>"Add access rights +"</b> section to adjust access for a provided WebID</li>
        <li>Use the nav bar above the container/resource list to navigate between containers</li>
        <li><b>Note:</b> The left nav bar, the filter, and the info/notifications icons are not currently functional</li>
      </ol>
    </div>
  </body>
</template>

<script>
import {
  getContainedResourceUrlAll,
} from "@inrupt/solid-client";
import { changeAcl, checkUrl, generateAcl, WorkingData } from "./privacyEdit";
import { currentWebId, getPodURLs } from "./login";
import {
  fetchPermissionsData,
  fetchData,
  fetchAclAgents,
} from "./getData";

export default {
  name: "PrivacyComponent",
  data() {
    return {
      filters: ["containers", "resources"],
      filterValues: [true, true],
      filterMenuOpen: false,
      showSharedIndex: null,
      showFormIndex: null,
      userUrl: "",
      userUrlInvalid: false,
      submissionDone: false,
      permissions: {
        read: false,
        append: false,
        write: false,
        control: false,
      },
      permissionsString: "",
      webId: "",
      podList: [],
      dirContents: WorkingData,
      containerContents: WorkingData,
      hasAcl: null,
      cannotMakeAcl: false,
      currentLocation: "",
      currentUrl: null,
      urls: [],
      containerUrls: [],
      resourceUrls: [],
      inContainer: WorkingData,
      newUrls: [],
      aclUrl: "",
      hasAccess: [],
    };
  },
  methods: {
    /*
    Keeps the filter menu open while toggling the viewing options
    */
    keepMenuOpen() {
      this.filterMenuClosed = false; // Keep the menu open after clicking an item
    },
    /*
    Checks if the input item url is a container
    */
    containerCheck(itemUrl) {
      return itemUrl.endsWith("/");
    },

    /**
     * method that returns a list of child container URLs from within a specified parent container
     *
     * @param currentDir the current container from which child containers should be identified
     * @param contUrlList the list of containers in the current directory
     */
    childContainers(currentDir, contUrlList) {
      const newUrlLst = contUrlList
        .filter((url) => url !== currentDir) // Remove the current parent container
        .map((url) => {
          const segments = url
            .split("/")
            .filter((segment) => segment.length > 0);
          return segments[segments.length - 1] + "/";
        });
      // for navigating up a directory path (not possible when in root directory)
      if (currentDir !== this.podList[0]) {
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
    childResources(currentDir, rescUrlList) {
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
    async changeCurrentLocation(aNewLocation) {
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
    copyText(text) {
      navigator.clipboard.writeText(text);
    },

    /*
    Two methods for controlling the UI
    */
    toggleShared(index) {
      if (this.showSharedIndex === index) {
        this.showSharedIndex = null; // Hide the form if it's already shown
      } else {
        this.showSharedIndex = index; // Show the form for the clicked item
      }
    },
    toggleForm(index) {
      if (this.showFormIndex === index) {
        this.showFormIndex = null; // Hide the form if it's already shown
      } else {
        this.showFormIndex = index; // Show the form for the clicked item
      }
    },

    /**
     * method that submits the alterations to the specified .acl permissions file
     *
     * @param url the URL of the container that .acl changes are being made to
     */
    async submitForm(url) {
      // Check if entered user WebId is a valid URL
      this.userUrlInvalid = checkUrl(this.userUrl, this.webId);

      // Handle permissions permutation logic
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
      if (this.permissions.read && this.permissions.write) {
        this.permissions.control = true;
        this.permissionsString = "Control (Read & Write) / ";
      }
      if (this.permissionsString === "") {
        this.permissionsString = "No / ";
      }

      // Call function to do the .acl changing (only if the added webID URL is valid)
      if (!this.userUrlInvalid) {
        // actual .acl changing
        await changeAcl(url, this.userUrl, this.permissions);

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
      }
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
        this.currentLocation === this.podList[0] &&
        !this.urls.includes(this.podList[0])
      ) {
        this.urls.push(this.podList[0]);
        this.containerUrls.push(this.podList[0]);
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
      this.podList = await getPodURLs();
      this.currentLocation = this.podList[0]; // assuming that the user only has one pod at the moment...
    },

    /**
     * Obtains the containers within the root directory of a user's pod,
     * puts the URLs for these containers into an array,
     * then sorts the array to reflect heirarchy
     */
    async getGeneralData() {
      this.dirContents = await fetchData(this.podList[0]);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
    },

    /**
     * Obtains a list containers and/or resources located in the provided container
     *
     * @param path the URL of the container for which access rights are being displayed
     */
    async getSpecificData(path) {
      this.dirContents = await fetchData(path);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
      this.hasAccess = await fetchAclAgents(path);
    },

    /**
     * Obtains a list of agents that have access to the designated resource or container
     *
     * @param path the URL of the resource or container for which access rights are to be displayed
     */
    async getSpecificAclData(path) {
      this.hasAcl = await fetchPermissionsData(path); // value is either .acl obj OR null (if .acl does not exist)
      if (this.hasAcl !== null) {
        this.hasAccess = await fetchAclAgents(path);
        this.cannotMakeAcl = false;
      }
    },

    /**
     * Makes a new .acl file for containers or resources that do not have a vaild .acl
     *
     * @param path the URL of the resource or container for which an .acl is to be made
     */
    async makeNewAcl(path) {
      try {
        await generateAcl(path, this.webId);
        await this.getSpecificAclData(path);
      } catch (err) {
        console.error(err);
        this.cannotMakeAcl = true;
      }
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    this.podURL();
    setTimeout(() => {
      this.getGeneralData();
    }, 500);
  },
};
</script>

<style scoped>
/* @import url('https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css'); */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

body {
  background-color: #445560;
  font-size: 13px;
}
.content-body {
  display: flex;
  flex-direction: column;
}
.title-nav {
  background-color: #445560;
}
.title-container {
  flex: 1;
}
.title-container span {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  color: #EDE7F6;
}
.directory-nav {
  background-color: #445560;
}
.directory-nav span {
  font-size: 14pt;
  font-family: "Oxanium", monospace;
  font-weight: 800;
  margin-left: 25px;
}

/* general layout */
.body-container {
  display: flex;
  flex: 1 1 auto;
}
.side-nav {
  flex: 1 1 auto;
}
.podDirectories {
  flex: 1 1 auto;
}
.dir-nav {
  background-color: #445560;
}
/* title bar */
nav {
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}
.nav-wrapper {
  padding-left: 20px;
  padding-right: 20px;
}
.select-dir {
  display: flex;
  align-items: center;
  margin-left: 15px;
  gap: 20px;
}
.select-dir .v-btn {
  margin-bottom: 15px;
}
.select-dir .v-select {
  min-width: 150px;
  margin-top: 5px;
  font-family: "Oxanium", monospace;
}

/* sidenav */
.side-nav.floating {
  padding-top: 2px;
  border-radius: 2px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}
.side-nav .divider {
  margin: 2px 0;
}
.side-nav .active {
  background-color: rgba(41, 35, 35, 0.05);
}
.side-nav .active a {
  color: #212121;
  font-weight: 500;
}
.side-nav li a,
.side-nav li a i.material-icons {
  height: 40px;
  line-height: 40px;
  margin-right: 24px;
}

.side-nav li a {
  padding: 10px 20px;
  font-size: 15px;
  color: #EDE7F6;
}
.side-nav li a:hover {
  border-radius: 2px;
}

/* folders */

.folder {
  margin: 3px 0px 0px 0;
  font-weight: 800;
  font-size: large;
  font-family: "Oxanium", monospace;
  background-color: #28353e;
}
.folder i {
  color: rgba(0, 0, 0, 0.54);
  margin-top: -2px;
}

/* Share Drop Downs */
.icon-button {
  background: none;
  border: none;
  cursor: pointer;
}
#addAccess button {
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
  color: #000000;
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
  font-size: medium;
  color: #EDE7F6;
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
  color: green;
}
.true-color i {
  color: green;
}
.false-color {
  color: red;
}
.false-color i {
  color: red;
}

#sharebox {
  display: flex;
}
label {
  margin-left: 20px;
}
#checkBoxes {
  margin-bottom: 10px;
}
form input[type="text"] {
  padding: 3px;
  margin-bottom: 5px;
  border: 1px solid #ccc;
  font-family: "Courier New", Courier, monospace;
  font-size: large;
  max-width: 90%;
}
form button {
  padding: 15px;
  margin-top: 5px;
  background-color: #EDE7F6;
  color: #445560;
  border: none;
  cursor: pointer;
  font-family: "Oxanium" monospace;
  font-size: large;
}
form button:hover {
  background-color: #a9a7ad;
}
label span {
  font-size: 16px;
  color: #EDE7F6;
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
  padding: 15px;
  margin-top: 5px;
  background-color: #EDE7F6;
  color: #445560;
  border: none;
  cursor: pointer;
  font-family: "Oxanium", monospace;
  font-size: large;
}
.new-acl:hover {
  background-color: #a9a7ad;
}
.req {
  font-family: "Oxanium", monospace;
  padding: 20px;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.req h2 {
  font-size: 30pt;
  margin-top: 5px
  ;
}
.req ol {
  font-size: 16pt;
  margin-left: 40px;
}
</style>

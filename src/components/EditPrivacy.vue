<template>
  <!-- Materialize CSS -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
  />
  <link
    href="https://fonts.googleapis.com/icon?family=Material+Icons"
    rel="stylesheet"
  />

  <!-- Title bar -->
  <body class="contentBody">
    <div class="titleContainer">
      <nav>
        <div class="nav-wrapper indigo lighten-3">
          <ul>
            <span>Privacy Editing</span>
            <div class="right">
              <li>
                <a href="#!"
                  ><i class="material-icons grey-text text-darken-1"
                    >view_list</i
                  ></a
                >
              </li>
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
    </div>

    <!-- the side nav -->
    <div class="bodyContainer">
      <div class="sideNav">
        <ul class="side-nav fixed floating indigo lighten-3 z-depth-0">
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
            <a href="#"><i class="material-icons">star</i>Starred</a>
          </li>
          <li><div class="divider"></div></li>
          <li>
            <a href="#"><i class="material-icons">delete</i>Trash</a>
          </li>
          <li><div class="divider"></div></li>
          <li>
            <a href="#"><i class="material-icons">cloud</i>Backup</a>
          </li>
        </ul>
      </div>

      <!-- Pod Containers display -->
      <div class="podDirectories">
        <div class="container-fluid">
          <ul>
            <!-- Iterates over list of containers in a pod -->
            <li v-for="(url, index) in urls" :key="index">
              <div class="card-panel folder">
                <i class="material-icons left">folder</i>
                {{ url }}
                <button
                  @click="toggleShared(index), getSpecificData(url)"
                  class="icon-button right"
                >
                  <i class="material-icons right">
                    {{ (showSharedIndex === null) ? 'chevron_right lock' : 'keyboard_arrow_down lock' }}</i>
                </button>

                <!-- Current access rights -->
                <div
                  id="permissionsBox"
                  v-if="showSharedIndex === index"
                  class="form-container"
                >
                  <div>
                    <span id="permissionsInstructions"
                      >Current Access Rights</span>
                  </div>
                  <div id="currentPermissions">
                    <li class="access-item" v-for="(agent, inde) in hasAccess" :key="inde">
                      <div class="user-id">
                        <span class="user-tag">User:<br /></span>
                        <span class="the-user"><i>{{ inde }}</i>
                          <button @click="copyText(inde)" class="icon-button right">
                            <i class="material-icons right">content_copy</i>
                          </button>
                        </span>
                      </div>
                      <span class="permissions-tag">Permissions:<br /></span>
                        <ul v-for="(permission, ind) in hasAccess[inde]" :key="ind">
                          <div class="permission-item" :class="{'true-color': permission, 'false-color': !permission}">
                            <span class="permission-label">{{ ind }}</span>
                            <span class="permission-value">
                              <i>({{ permission }})</i>
                              <i class="material-icons right">
                                {{ permission ? 'check' : 'dangerous' }}
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
                          <input type="checkbox" v-model="permissions.append" />
                          <span>Append</span>
                        </label>
                        <label>
                          <input type="checkbox" v-model="permissions.write" />
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
                          Was given: <i>{{ permissionsString }}</i> rights<br />
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
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </body>
</template>

<script>
import {
  getContainedResourceUrlAll,
  getLinkedResourceUrlAll,
} from "@inrupt/solid-client";
import { changeAcl, checkUrl } from "./privacyEdit";
import { currentWebId, getPodURLs } from "./login";
import { fetchPermissionsData, WorkingData, fetchData, fetchAclAgents } from "./getData";
import { UrlString } from "@inrupt/solid-client";

export default {
  name: "PrivacyComponent",
  data() {
    return {
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
      podList: "",
      dirContents: WorkingData,
      containerContents: WorkingData,
      hasAcl: null,
      urls: [],
      containerUrls: [],
      inContainer: WorkingData,
      newUrls:[],
      aclUrl: "",
      hasAccess: [],
    };
  },
  methods: {
    // methods that provide logic for UI interaction
    copyText(text) {
      navigator.clipboard.writeText(text);
    },
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
     * Removes non-Containers from Solid container URL list
     */
    separateUrls() {
      this.containerUrls = this.urls.filter((url) => url.endsWith("/"));
      if (!this.urls.includes(this.podList[0])) {
        this.urls.push(this.podList[0]);
      }
      this.urls = this.urls.sort((a, b) => a.length - b.length);
    },

    /**
     * Working on this to show agents that currently have access to container
     */
    async currentAccess(containerAddress) {
      fetchAclAgents(containerAddress);
    },

    /**
     * Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
     * Obtains 'pod' variable (URL path to user's Pod).
     */
    async podURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podList = await getPodURLs(); // calls async function to get Pod URLs
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

      let i = this.containerUrls.length;
      // iterate over directory structure of pod
      while (i > 0) {
        // start at a container and get all resources within that container
        this.inContainer = fetchData(this.containerUrls[i-1])
        this.newUrls = getContainedResourceUrlAll(this.inContainer);
        // remove the container at the end of the containerUrl array
        console.log(this.newUrls)
        this.containerUrls.pop()
        console.log(this.containerUrls)

        // iterate over all the resources in the container
        for (let n = 0; n < this.inContainer.length; n++) {

          // add new resources to url list
          if (!this.urls.includes(this.inContainer[n])) {
            this.urls.push(this.inContainer[n]);
          }

          // if also a conatiner, add new the container to container list
          if (this.inContainer[n].endsWith("/")) {
            this.containerUrls.push(this.inContainer[n]);
          }
        }
      }
      this.urls = this.urls.sort((a, b) => a.length - b.length);
    },

    /**
     * Obtains a list of agents that have access to the designated container
     *
     * @param path the URL of the container access rights are being displayed
     *
     * ...
     */
    async getSpecificData(path) {
      // this.hasAccess = await fetchAclAgents(path);
      this.hasAcl = await fetchPermissionsData(path);
      
      console.log(this.hasAcl)
      
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    this.podURL();
    setTimeout(() => {
      this.getGeneralData();
      // this.getSpecificData("http://localhost:3000/test/")
    }, 500);
  },
};
</script>

<style scoped>
body {
  background-color: #a1b1d3;
  font-size: 13px;
}
.contentBody {
  display: flex;
  flex-direction: column;
}

.titleContainer {
  display: flex;
  flex: 1;
}
.titleContainer span {
  font-size: 30pt;
  font-family: "Courier New", Courier, monospace;
  font-weight: 500;
  color: #30328e;
}

/* general layout */
.bodyContainer {
  display: flex;
  flex: 1 1 auto;
}
.side-nav {
  flex: 1 1 auto;
}
.podDirectories {
  flex: 1 1 auto;
}

/* title bar */
nav {
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}
.nav-wrapper {
  padding-left: 20px;
  padding-right: 20px;
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
  color: #30328e;
}
.side-nav li a:hover {
  border-radius: 2px;
}

/* folders */
.folder {
  margin: 3px 0px 0px 0;
  font-weight: 800;
  font-size: large;
  font-family: "Courier New", Courier, monospace;
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
  margin-top: 20px; /* Add space above */
  margin-bottom: 10px; /* Add space below */
}
.form-container {
  margin-top: 10px;
}

/* Current permissions display */
#permissionsInstructions {
  font-weight: bold;
}
.access-item {
  border-top: 1px dashed #000; /* Dashed line below each item */
  padding-top: 10px; /* Optional: Add some padding for spacing */
  margin-top: 10px; /* Optional: Add some margin for spacing */
}
.access-item:nth-last-child(2) {
  border-bottom: 2px solid #000; /* Solid line below the last item */
  padding-bottom: 10px; /* Optional: Add some padding for spacing */
  margin-bottom: 10px; /* Optional: Add some margin for spacing */
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
  opacity: 0.5; /* Slightly translucent when clicked */
  
}
.the-user {
  margin-left: 10px;
  font-size: large;
}
.the-user i {
  font-size: medium;
  color: #30328e;
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
  display: flex; /* Use Flexbox for alignment */
  align-items: center; /* Vertically center the content */
  justify-content: flex-end; /* Align items to the left */
}
.true-color {
  color: green;
}.true-color i {
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
  background-color: #333;
  color: #fff;
  border: none;
  cursor: pointer;
  font-family: "Courier New", Courier, monospace;
  font-size: large;
}
form button:hover {
  background-color: #444;
}
label span {
  font-size: 16px; /* Change the font size of the label text */
  color: #000000;
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
</style>

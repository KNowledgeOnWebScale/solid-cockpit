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
                  <i class="material-icons right">lock</i>
                </button>
                <!-- Current access rights -->
                <div
                  id="permissionsBox"
                  v-if="showSharedIndex === index"
                  class="form-container"
                >
                  <div>
                    <span id="permissionsInstructions"
                      >The following users have access: (via {{ aclUrl }})</span
                    >
                  </div>
                  <div>
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
                        <button @click="clearPermissionString" type="submit">Submit</button>
                      </div>

                      <!-- If provided WebID is not a valid URL -->
                      <div id="errorIndicator" v-if="userUrlInvalid">
                        <v-alert
                          v-model="userUrlInvalid"
                          closable
                          title="Not a valid WebID URL"                          
                          type="error"
                          icon="$error"
                        >Please follow format: <i>http://example.com/something/card#someone</i></v-alert>
                      </div>

                      <!-- If added permissions are successful -->
                      <div id="successIndicator" v-if="submissionDone">
                        <v-alert closable title="Success" type="success" icon="$success">
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
import { useResource, WorkingData, fetchData, fetchAclAgents } from "./getData";
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
      urls: [],
      aclUrl: "",
      hasAccess: [],
    };
  },
  methods: {
    // methods that provide logic for UI interaction
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
      this.userUrlInvalid = checkUrl(this.userUrl);

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
    },

    /**
     * Removes non-Containers from Solid container URL list
     */
    removeNonDirectoryUrls() {
      this.urls = this.urls.filter((url) => url.endsWith("/"));
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
      this.removeNonDirectoryUrls();
      if (!this.urls.includes(this.podList[0])) {
        this.urls.push(this.podList[0]);
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
      this.containerContents = await fetchData(path);
      const rawAclUrl = getLinkedResourceUrlAll(this.containerContents);
      this.aclUrl = rawAclUrl["acl"][0];
      this.hasAccess = fetchAclAgents(this.aclUrl);
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
  background-color: #b0c4de;
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
  color: #212121;
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

/*sidenav*/
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
  color: #242424;
}
.side-nav li a:hover {
  border-radius: 2px;
}

/*folders*/
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

/*Share Drop Downs*/
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

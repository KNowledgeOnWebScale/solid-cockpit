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
                  ><i class="material-icons grey-text text-darken-1"
                    >info</i
                  ></a
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
        <ul
          class="side-nav fixed floating indigo lighten-3 z-depth-0"
        >
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
                  <button @click="toggleShared(index), getSpecificData(url)" class="icon-button right">
                    <i class="material-icons right">lock</i>
                  </button>
                  <!-- Current access rights --> 
                  <div id="permissionsBox" v-if="showSharedIndex === index" class="form-container">
                    <div>
                      <span id="permissionsInstructions">The following users have access: (via {{ aclUrl }})</span>
                    </div>
                    <div>
                      <span id="withPermissions"> </span>
                    </div>

                    <!-- Show add access form -->
                    <div>
                      <button @click="toggleForm(index)" class="icon-button left">
                        <span>Add access rights </span>
                        <i v-if="showFormIndex === null" class="material-icons right">add</i>
                        <i v-if="showFormIndex === index" class="material-icons right">remove</i>
                      </button>
                    </div>
                  </div>

                  <!-- Add access form -->
                  <div id="shareBox" v-if="showFormIndex === index" class="form-container">
                    <form @submit.prevent="submitForm(url)">
                      <span id="permissionsInstructions">Select the access level:</span>
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
                      <input type="text" v-model="userString" placeholder="Enter user's WebID:" />
                      <button type="submit">Submit</button>
                    </form>
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
import { inject } from 'vue';
import { getContainedResourceUrlAll, resourceUrl, getLinkedResourceUrlAll } from "@inrupt/solid-client";
import { changeAcl } from "./privacyEdit";
import { currentWebId, getPodURLs } from "./login";
import { useResource, WorkingData, fetchData, fetchAclAgents } from './getData';

export default {
  name: "PrivacyComponent",
  data() {
    return {
      showSharedIndex: null,
      showFormIndex: null,
      userString: '',
      permissions: {
        read: false,
        append: false,
        write: false,
        control: false
      },
      
      webId: "",
      podList: "",
      dirContents: WorkingData,
      containerContents: WorkingData,
      urls: [],
      aclUrl: "",
      hasAccess:[],

    };
  },
  methods: {
    /*
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
    submitForm(url) {
      console.log('Form submitted with data:', this.aclUrl, this.userString, this.permissions);
      
      // Handle permissions permutation logic
      if (this.permissions.read === true && this.permissions.write === true) {
        this.permissions.control = true;
      }
      if (this.permissions.write === true) {
        this.permissions.append = true;
      }

      // Call function to do the .acl changing
      changeAcl(this.webId, url, this.userString, this.permissions);
    },
    removeNonDirectoryUrls() {
      this.urls = this.urls.filter(url => url.endsWith('/'));
    },


    /*
    */
    async currentAccess(containerAddress) {
      fetchAclAgents(containerAddress)
    },

    /*
    */
    async addToAcl(userWebId, whereContainer, user, permissions) {
      changeAcl(userWebId, whereContainer, user, permissions);
    },

    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async podURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podList = await getPodURLs(); // calls async function to get Pod URLs
    },

    /*
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

    /*
    */
    async getSpecificData(path) {
      this.containerContents = await fetchData(path);
      const rawAclUrl = getLinkedResourceUrlAll(this.containerContents)
      this.aclUrl = rawAclUrl['acl'][0]
      this.hasAccess = fetchAclAgents(this.aclUrl)
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
  font-family: 'Courier New', Courier, monospace;
  font-weight: 500;
  color:#212121;
}

/* general layout */
.bodyContainer {
  display: flex;
  flex: 1 1 auto;
}
.side-nav{
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
  font-family: 'Courier New', Courier, monospace;
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
.form-container {
  margin-top: 10px;
}
label {
  margin-left: 20px;
}
form input[type="text"] {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  font-family: 'Courier New', Courier, monospace;
  font-size: larger;
  max-width: 80%;
}
form button {
  padding: 15px;
  margin-left: 5px;
  background-color: #333;
  color: #fff;
  border: none;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: large;
}
form button:hover {
  background-color: #444;
}

label span {
  font-size: 16px; /* Change the font size of the label text */
  color: #000000;
}
</style>

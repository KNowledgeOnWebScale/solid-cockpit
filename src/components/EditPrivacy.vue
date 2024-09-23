<template>
  <!-- Compiled and minified CSS -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
  />
  <link
    href="https://fonts.googleapis.com/icon?family=Material+Icons"
    rel="stylesheet"
  />

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

      <!-- need to figure out how to make container as large as needed for entries, now above determines vert len --> 
      <div class="podDirectories">
        <div class="container-fluid">
          <ul>
            <li v-for="(urls, index) in urls" :key="index">
              <div class="card-panel folder">
                <i class="material-icons left">folder</i>
                  {{ urls }}
                  <button @click="toggleForm(index)" class="icon-button right">
                    <i class="material-icons right">lock</i>
                  </button>
      
                  <!-- Form container -->
                  <div id="shareBox" v-if="showFormIndex === index" class="form-container">
                    <form @submit.prevent="submitForm">
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
                      <input type="text" v-model="formData" placeholder="Enter user's WebID:" />
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
import { getContainedResourceUrlAll, resourceUrl } from "@inrupt/solid-client";
import { obtainSolidDataset } from "./privacyEdit";
import { currentWebId, getPodURLs } from "./login";
import { useResource, WorkingData, fetchData } from './getData';

export default {
  name: "PrivacyComponent",
  data() {
    return {
      showFormIndex: null,
      formData: '',
      permissions: {
        read: false,
        append: false,
        write: false,
      },
      
      webId: "",
      podList: "",
      dirContents: WorkingData,
      urls: [],
    };
  },
  methods: {
    toggleForm(index) {
      if (this.showFormIndex === index) {
        this.showFormIndex = null; // Hide the form if it's already shown
      } else {
        this.showFormIndex = index; // Show the form for the clicked item
      }
    },

    submitForm() {
      console.log('Form submitted with data:', this.formData);
      console.log('Permissions:', this.permissions);
      // Handle form submission logic here
      this.showFormIndex = null; // Optionally hide the form after submission
    },
    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async podURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podList = await getPodURLs(); // calls async function to get Pod URLs
      console.log(this.podList)
    },
    /*
    Calls useResource() from getData.ts to obtain SolidDataset from a resource...
    */
    async testingFun() {
      this.dirContents = await fetchData(this.podList[0]);
      console.log(this.dirContents)
      this.urls = getContainedResourceUrlAll(this.dirContents);
      console.log(this.urls)
    }

  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    this.podURL();
    setTimeout(() => {
      this.testingFun();
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

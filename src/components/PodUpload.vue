<template>
  <!-- The data upload card is only shown after login -->

  <!-- Title bar -->
  <div class="title-container">
    <span>Data Upload</span>
  </div>

  <div class="pod-chooseContainer">
    <PodRegistration @pod-selected="handlePodSelected" />
  </div>

  <!-- Container location bar -->
  <div class="container-location" v-if="currentPod !== ''">
    <!-- Left Navigation Bar -->
    <div class="nav-container">
      <ul>
        <li><span>Location</span></li>
        <li>
          <button
            id="top-button"
            :class="{ highlight: inputType === 'existingPath' }"
            @click="inputType = 'existingPath'"
          >
            Use Existing Path
          </button>
        </li>
        <li>
          <button
            :class="{ highlight: inputType === 'newPath' }"
            @click="inputType = 'newPath'"
          >
            User Input Path
          </button>
        </li>
      </ul>
    </div>

    <!-- User input path -->
     <!-- TODO: create an alert if a directory must be created to conform with the specified file path -->
    <ul class="user-list" v-if="inputType == 'newPath'">
      <li>
        <span><b>Data upload location:</b> </span>
      </li>
      <li>
        <v-text-field
          class="input-path"
          v-model="uploadPath"
          :rules="urlRules"
          label="Pod Path"
          outlined
          clearable
        />
      </li>
      <li>
        <!-- TODO: Fix this because it doesn't work ... (maybe just use a button because it will be easier...) -->
        <div class="sel-pod">
          <v-icon class="check-mark" color="green" v-if="vaildURL">
            mdi-check
          </v-icon>
          <!-- When the URL is invalid -->
          <v-icon class="check-mark" color="red" v-if="!vaildURL">
            mdi-close
          </v-icon>
        </div>
      </li>
    </ul>

    <!-- Browse existing path -->
     <!-- TODO: Fix this ... something wrong with $emit -->
    <ul class="existing-list" v-if="inputType == 'existingPath'">
      <li>
        <span><b>Data upload location:</b> </span>
      </li>
      <li>
        <container-nav :currentPod="currentPod" @path-selected="handleSelectedContainer" />
      </li>
      
    </ul>
  </div>
  {{ uploadPath }}
  <div class="upload-container">
    <div v-if="currentPod !== '' && currentPod !== undefined">
      <!-- Card that contains the data upload field
       TODO: make this use the ContainerNav to designate where a file gets uploaded -->
      <v-card
        class="mx-auto upload-section"
        title="Add Files to Pod"
        variant="tonal"
        justify="center"
        color="#445560"
      >
        <!-- The file input section -->
        <form id="writeForm">
          <v-file-input
            clearable
            label="Click to select file(s) OR drag and drop file(s) here"
            placeholder="Select your files"
            show-size
            type="file"
            @change="uploadFile($event)"
            ref="file"
            counter
            multiple
          >
            <template v-slot:selection="{ fileNames }">
              <template v-for="(fileName, index) in fileNames" :key="fileName">
                <v-chip
                  v-if="index < 2"
                  class="me-2"
                  color="deep-purple-accent-4"
                  size="small"
                  label
                >
                  {{ fileName }}
                </v-chip>

                <span
                  v-else-if="index === 2"
                  class="text-overline text-grey-darken-3 mx-2"
                >
                  +{{ files.length - 2 }} File(s)
                </span>
              </template>
            </template>
          </v-file-input>
          <!-- Button that sends the uploaded file to the connected Pod -->
          <v-btn variant="tonal" rounded="xs" @click="submitUpload">
            Upload
          </v-btn>
        </form>

        <!-- Alert for if session is timed out -->
        <div v-if="this.currentPod === 'Error: probably not logged in'">
          <v-alert
            class="mx-auto"
            title="There was an error with the file(s) upload!"
            type="error"
            icon="$error"
            ><b
              >There is an error here somewhere. Try logging out and logging
              back in?</b
            >(also could try clearing your browser cookies if problem
            reoccurs)</v-alert
          >
        </div>

        <!-- Alert forsuccessful file upload -->
        <div v-else-if="uploadDone">
          <v-alert
            class="mx-auto"
            title="File(s) successfully uploaded!"
            type="success"
            icon="$success"
            >(Your file(s)
            <i>{{
              this.filesUploaded[0].split("/")[
                this.filesUploaded[0].split("/").length - 1
              ]
            }}</i>
            can be found in your pod at <b>{{ this.filesUploaded[0] }}</b
            >)</v-alert
          >
        </div>
      </v-card>
    </div>
  </div>

  <hr />

  <body class="use-guide">
    <h2 class="req">Data Upload Guide</h2>
    <ol>
      <li>
        Select the pod you want to upload your file(s) to
      </li>
      <li>
        Select or input the directory you want to upload the file(s) to
      </li>
      <li>Click the <b>"File Input"</b> bar or drag and drop a file from your local machine</li>
      <li>Click the <b>"Upload"</b> button</li>
    </ol>
  </body>
</template>

<script lang="ts">
import { handleFiles, uploadSuccess } from "./fileUpload";
import { currentWebId, getPodURLs } from "./login";
import ContainerNav from "./ContainerNav.vue";
import PodRegistration from "./PodRegistration.vue";

export default {
  components: {
    ContainerNav,
    PodRegistration,
  },
  data() {
    return {
      webId: "",
      podURLs: [],
      currentPod: "",
      uploadPath: "",
      filesUploaded: [],
      files: FileList,
      uploadDone: false,
      inputType: "existingPath",
      urlRules: [
        // Check that a value exists
        (v) => !!v || "URL is required",
        // Validate if the input is a proper URL using the URL constructor
        (v) => {
          try {
            new URL(v);
            return true;
          } catch (e) {
            return "Enter a valid URL";
          }
        },
      ],
      vaildURL: true,
    };
  },
  methods: {
    isValidUrl() {
      if (this.urlRules == true) {
        this.vaildURL = true;
      } else {
        this.validURL = false;
      }
    },

    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podURLs = await getPodURLs(); // calls async function to get Pod URLs
    },

    /*
    Selects the directory a file is to be uploaded to
    */
    selectPod() {
      this.uploadPath =
        // console.log("Selected pod: " + selectedPod);
        this.successfulSelection();
    },

    /*
    Calls uploadFile() from fileUpload.ts to upload a file to the user's pod.
    obtains 'files' variable (a FileList that contains references to all files selected using the upload UI).
    */
    uploadFile(event: FileList) {
      this.files = event.target.files;
    },

    /*
    Calls handleFiles() from fileUpload.ts parse the files selected for upload + uploads the to the pod using the overwriteFile() method from @inrupt/solid-client.
    'files' variable is a FileList that contains references to all files selected using the upload UI.

    Method also checks if the files uploaded from submitUpload() have .name properties (which proves upload was success).
    Results in update of the uploadSuccess variable if files do have names.
    */
    async submitUpload() {
      this.filesUploaded = await handleFiles(this.files, this.uploadPath);
      this.uploadDone = uploadSuccess(this.filesUploaded);
    },

    /* Takes in the emitted value from PodRegistration.vue */
    handlePodSelected(selectedPod) {
      this.currentPod = selectedPod;
      this.uploadPath = this.currentPod;
    },
    /* Takes in the emitted value from ContainerNav.vue */
    handleSelectedContainer(selectedContainer) {
      this.uploadPath = selectedContainer;
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.getPodURL();
      // console.log(this.podURLs)
    }, 200);
  },
};
</script>

<style scoped>
body {
  line-height: 1.6;
  margin: 15px;
  font-family: "Oxanium", monospace;
  font-size: 13px;
  max-width: 80%;
  margin: auto;
  margin-top: 20px;
  padding: 20px;
  background-color: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Title bar */
.title-container {
  background-color: #445560;
  border-radius: 8px;
  margin: 0.5rem 0.5rem;
}
.title-container span {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  padding-left: 20px;
  padding-right: 20px;
}
.container-location {
  background-color: #445560;
  border-radius: 8px;
  margin: 0rem 0.5rem;
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  background: #445560;
  border-radius: 8px;
  margin: 0rem 0.5rem;
}

/* Upload location nav container */
.container-location {
  display: flex;
  background-color: #445560;
  border-radius: 8px;
  margin-top: 10px;
}
.container-location .nav-container {
  display: flex;
  background-color: #28353e;
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  min-width: fit-content;
}
.nav-container ul {
  list-style-type: none;
  padding: 10px;
  height: 100%;
  overflow: auto;
}
.nav-container li span {
  font-size: 18pt;
  font-weight: bold;
  padding: 0px 8px 5px 8px;
  text-decoration: none;
  border-bottom: 1px solid #ccc;
}
#top-button {
  margin-top: 10px;
}
.nav-container li button {
  display: block;
  color: #ede7f6;
  border-radius: 4px;
  padding: 10px 10px;
  width: 100%;
  text-decoration: none;
}
.nav-container .highlight {
  background-color: #754ff6;
  color: #ede7f6;
}
.nav-container li button:hover {
  background-color: #555;
  color: white;
  width: 100%;
}

/* Existing path upload */
.existing-list {
  display: flex;
  align-items: center;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.existing-list span {
  font-size: 18pt;
  font-family: "Oxanium", monospace;
  font-weight: 400;
  margin-left: 15px;
}

/* User provided path */
.user-list {
  display: flex;
  font-family: "Oxanium", monospace;
  align-items: center;
  list-style-type: none;
  margin: 0;
  font-size: 18pt;
}
.user-list span {
  font-size: 18pt;
  font-family: "Oxanium", monospace;
  font-weight: 400;
  margin-left: 15px;
}
.user-list .input-path {
  margin-left: 20px;
  min-width: 40vw;
  margin-bottom: -15px;
}

/* Select directory button */
.sel-pod {
  display: flex;
  align-items: center;
  margin-left: 15px;
  gap: 20px;
}
.check-mark {
  cursor: pointer;
}
.sel-pod .check-mark {
  margin-bottom: 5px;
}

/* Data upload container */
.upload-container {
  margin: 1rem 0.5rem;
}
.container {
  font-family: "Oxanium", monospace;
  max-width: 95%;
  margin: auto;
  padding: 20px;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.upload-section {
  font-family: "Oxanium", monospace;
  border-radius: 8px;
}
.v-btn {
  margin-left: 15px;
  margin-bottom: 15px;
}

/* User guide */
.use-guide {
  font-size: 16px;
  max-width: 95%;
}
.req {
  margin-top: 10px;
}
.use-guide ul,
ol {
  margin-left: 10px;
  margin-bottom: 15px;
  margin-top: 5px;
  margin-right: 10px;
}
.use-guide ol li {
  margin-bottom: 10px;
  margin-left: 20px;
  list-style-type: upper-roman;
  align-items: Left;
}
.guide {
  text-align: Left;
}
</style>

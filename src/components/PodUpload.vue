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
  <div class="container-location" v-show="currentPod !== ''">
    <!-- Left Navigation Bar -->
    <div class="nav-container">
      <ul>
        <li><span>Location</span></li>
        <li>
          <button
            id="top-button"
            :class="{ highlight: inputType === 'newPath' }"
            @click="inputType = 'newPath'"
          >
            New Input Path
          </button>
        </li>
        <li>
          <button
            :class="{ highlight: inputType === 'existingPath' }"
            @click="inputType = 'existingPath'"
          >
            Use Existing Path
          </button>
        </li>
      </ul>
    </div>

    <!-- User input path -->
    <ul class="path-selection">
      <li>
        <span><b>Upload location:</b> </span>
      </li>

      <!-- User typed input -->
      <li class="user-list" v-if="inputType == 'newPath'">
        <v-text-field
          class="input-path"
          v-model="uploadPath"
          :rules="urlRules"
          label="Pod Path"
          outlined
          clearable
        />
      </li>

      <!-- Browse existing path -->
      <li class="existing-list" v-if="inputType == 'existingPath'">
        <container-nav
          :currentPod="currentPod"
          @path-selected="handleSelectedContainer"
        />
      </li>

      <!-- Select the path and make sure it is a valid URL -->
      <li v-if="inputType == 'newPath'">
        <v-btn
          class="path-registerButton"
          variant="tonal"
          rounded="xs"
          @click="validPathCheck"
        >
          Check Path
          <v-tooltip activator="parent" location="top"
            >Click to check if this path is a valid URL
          </v-tooltip>
        </v-btn>
      </li>
      <li v-if="inputType == 'newPath'">
        <div class="sel-pod">
          <v-icon class="check-mark" color="green" v-if="vaildURL">
            mdi-check
          </v-icon>
          <!-- When the URL is invalid -->
          <v-icon class="check-mark" color="red" v-if="vaildURL == false">
            mdi-close
          </v-icon>
        </div>
      </li>
    </ul>
  </div>
  <div class="displayPath-container" v-if="currentPod !== ''">
    <ul>
      <li>
        <span>Current upload path:</span>
      </li>
      <li>
        <i>{{ uploadPath }}</i>
      </li>
    </ul>
  </div>
  <div class="upload-container">
    <div v-if="currentPod !== '' && currentPod !== undefined">
      <!-- Card that contains the data upload field
       TODO: clear files from upload box once uploaded -->
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
        <div v-if="currentPod === 'Error: probably not logged in'">
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

        <!-- Alert for file upload (without an error) -->
        <div v-else-if="uploadDone">
          <!-- Iterates over list of uploaded files -->
          <li
            class="check-exists"
            v-for="(f, index) in filesUploaded"
            :key="index"
          >
            <template>
              {{ checkExists(f) }}
            </template>
            <!-- if a file attempting to be uploaded is alreay present -->
            <div v-if="alreadyPresent">
              <v-alert
                class="mx-auto"
                title="There was an error with the file(s) upload!"
                type="error"
                icon="$error"
                >The file
                <i><b>
                  {{ files[index].name }}
                </b></i>
                already exists in the container <b>{{ uploadPath }}</b>
              </v-alert>
            </div>
            <!-- if files were uploaded successfully -->
            <div v-else>
              <v-alert
                class="mx-auto"
                title="File(s) successfully uploaded!"
                type="success"
                icon="$success"
                >(Your file(s)
                <i><b>{{ files[index].name }}</b></i>
                can be found in your pod at <b>{{ uploadPath }}</b
                >)</v-alert
              >
            </div>
          </li>
        </div>
      </v-card>
    </div>
  </div>

  <!-- Guide for file uploading -->
  <div class="use-guide">
    <div class="guide-container">
      <h2 class="guide">Data Upload Guide</h2>

      <hr class="line" />
      
      <ol class="list-container">
        <li class="req">Select the pod you want to upload your file(s) to</li>
        <li class="req">
          Select or input the directory you want to upload the file(s) to
        </li>
        <li class="req">
          Click the <b>"File Input"</b> bar or drag and drop a file from your
          local machine
        </li>
        <li class="req">Click the <b>"Upload"</b> button</li>
      </ol>
    </div>
  </div>
</template>

<script lang="ts">
import { handleFiles, uploadSuccess, alreadyExistsCheck } from "./fileUpload";
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
      alreadyPresent: false,
      inputType: "newPath",
      urlRules: [
        // Check that a value exists
        (v) => !!v || "URL is required",
        // Validate if the input is a proper URL using the URL constructor
        (v) => {
          if (this.validUrlCheck(v)) {
            return true;
          } else {
            return "Invalid URL Path";
          }
        },
      ],
      vaildURL: null,
    };
  },
  methods: {
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
      this.uploadPath = this.successfulSelection();
    },

    /*
    checks if the value 'already exists' is present in this.fileUploaded
    */
    checkExists(inString) {
      this.alreadyPresent = alreadyExistsCheck(inString);
    },

    /*
    checks to see if an input URL is valid
    */
    validUrlCheck(u) {
      try {
        new URL(u);
        return true;
      } catch (e) {
        return false;
      }
    },
    /*
    calls the validUrlCheck function and assigns output to the value this.validURL
    */
    validPathCheck() {
      this.vaildURL = this.validUrlCheck(this.uploadPath);
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
      if (!this.uploadPath.endsWith("/")) {
        this.uploadPath = this.uploadPath + "/";
      }
      this.filesUploaded = await handleFiles(
        this.files,
        this.uploadPath,
        this.currentPod
      );
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
  margin: 0rem 0.5rem;
}
.container-location .nav-container {
  display: flex;
  background-color: #28353e;
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  justify-content: left;
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

/* upload path input/selection */
.path-selection {
  display: flex;
  align-items: center;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.path-selection span {
  font-size: 18pt;
  font-family: "Oxanium", monospace;
  font-weight: 400;
  margin-left: 15px;
}

/* User provided path */
.user-list {
  font-family: "Oxanium", monospace;
}
.user-list .input-path {
  margin-left: 20px;
  min-width: 40vw;
  margin-bottom: -15px;
}
.path-registerButton {
  margin-top: 10px;
  font-family: "Oxanium", monospace;
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

/* container that displays current upload path */
.displayPath-container {
  font-family: "Oxanium", monospace;
  margin: 0 0.5rem 0.5rem 0.5rem;
  padding: 20px;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.displayPath-container ul {
  display: flex;
  align-items: center;
  list-style-type: none;
}
.displayPath-container span {
  font-size: 16pt;
  font-weight: 600;
  margin: 0 10px 0 0;
}
.displayPath-container i {
  font-size: 14pt;
  font-weight: 400;
  margin-left: 20px;
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
/* for showing the outcome of file upload */
.check-exists {
  list-style-type: none;
}

/* The how to use guide */
.use-guide {
  margin: 0;
}
.guide-container {
  font-family: "Oxanium", monospace;
  font-size: 16pt;
  margin: 0 0.5rem;
  padding: 0.5rem 0rem 0.5rem 0.5rem;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.guide {
  text-align: Left;
  font-size: 18pt;
  margin: 0.5rem;
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

<template>
  <!-- Title bar -->
  <div class="title-container">
    <span>Data Upload</span>
  </div>

  <div class="pod-chooseContainer">
    <PodRegistration />
  </div>

  <div class="path-container" v-show="selectedPodUrl !== ''">
    <!-- Container location bar -->
    <div class="container-location" v-show="selectedPodUrl !== ''">
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
          <span class="upload-location-label"><b>Upload Location:</b> </span>
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
            :currentPod="selectedPodUrl"
            @path-selected="handleSelectedContainer"
          />
        </li>

        <!-- Select the path and make sure it is a valid URL -->
        <li v-if="inputType == 'newPath'">
          <div class="check-path-row">
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
            <div v-if="inputType == 'newPath'" class="sel-pod">
              <v-icon class="check-mark" color="green" v-if="vaildURL">
                mdi-check
              </v-icon>
              <!-- When the URL is invalid -->
              <v-icon class="check-mark" color="red" v-if="vaildURL == false">
                mdi-close
              </v-icon>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="displayPath-container" v-if="selectedPodUrl !== ''">
      <ul>
        <li>
          <span>Current upload path:</span>
        </li>
        <li>
          <i>{{ uploadPath }}</i>
        </li>
      </ul>
    </div>
  </div>
  <div class="upload-container">
    <div v-if="selectedPodUrl !== '' && selectedPodUrl !== undefined">
      <!-- Card that contains the data upload field -->
      <div class="upload-section">
        <span class="upload-title">Add Files to Pod</span>
        
        <!-- The file input section -->
        <form id="writeForm">
          <v-file-input
            :key="inputKey"
            class="input-box"
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
                  color="#EDE7F6"
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
          <div class="upload-btn-row">
            <div>
              <v-btn
                class="upload-btn"
                variant="tonal"
                rounded="xs"
                @click="submitUpload"
                :disabled="uploading"
              >
                Upload
              </v-btn>
            </div>
            <div v-if="uploading" class="spinner-container">
              <div class="spinner"></div>
            </div>
            <div v-if="!uploading" class="upload-result-row">
              <!-- TODO: Fix this Session timeout error -->
              <div
                v-if="selectedPodUrl === 'Error: probably not logged in'"
                class="result-message error-message"
              >
                <span>
                  There was an error with the file(s) upload!
                  <v-tooltip activator="parent" location="top" open-on-click>
                    There is an error here somewhere. Try logging out and
                    logging back in? (also could try clearing your browser
                    cookies if problem reoccurs)
                  </v-tooltip>
                  <v-icon
                    small
                    color="#754ff6"
                    style="
                      margin-left: 6px;
                      vertical-align: middle;
                      cursor: pointer;
                    "
                    >mdi-information</v-icon
                  >
                </span>
              </div>
              <!-- When item is already uploaded -->
              <div v-else>
                <li
                  class="check-exists"
                  v-for="(f, index) in filesUploaded"
                  :key="index"
                >
                  <template>
                    {{ checkExists(f) }}
                  </template>
                  <div
                    v-if="alreadyPresent"
                    class="result-message duplicate-message"
                  >
                    <span>
                      The file
                      <i
                        ><b>{{ uploadedFiles[index].name }}</b></i
                      >
                      <u> already exists</u> in the container <b>{{ uploadedPath }}</b>
                    </span>
                  </div>
                  <div
                    v-else-if="!uploadSuccessful"
                    class="result-message error-message"
                  >
                    <span>
                      There was an <u>error</u> uploading file
                      <i
                        ><b>{{ uploadedFiles[index].name }}</b></i
                      >
                      to <b>{{ uploadedPath }}</b>
                    </span>
                  </div>
                  <div v-else class="result-message success-message">
                    <span>
                      The file
                      <i
                        ><b>{{ uploadedFiles[index].name }}</b></i
                      >
                      can be found in your pod at <b>{{ uploadedPath }}</b>
                    </span>
                  </div>
                </li>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="use-guide">
    <DataUploadGuide />
  </div>
</template>

<script lang="ts">
import { handleFiles, uploadSuccess, alreadyExistsCheck } from "./fileUpload";
import ContainerNav from "./ContainerNav.vue";
import PodRegistration from "./PodRegistration.vue";
import DataUploadGuide from "./Guides/DataUploadGuide.vue";
import { useAuthStore } from "../stores/auth";

export default {
  components: {
    ContainerNav,
    PodRegistration,
    DataUploadGuide,
  },
  data() {
    return {
      uploadPath: "" as string,
      filesUploaded: [],
      uploadedFiles: [] as File[],
      uploadedPath: "" as string,
      files: [] as File[],
      uploadSuccessful: false,
      alreadyPresent: false,
      uploading: false,
      inputType: "newPath",
      urlRules: [
        // Check that a value exists
        (v: string) => !!v || "URL is required",
        // Validate if the input is a proper URL using the URL constructor
        (v: string) => {
          if (this.validUrlCheck(v)) {
            return true;
          } else {
            return "Invalid URL Path";
          }
        },
      ],
      vaildURL: null as boolean | null,
      inputKey: 0,
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
    checks if the value 'already exists' is present in this.fileUploaded
    */
    checkExists(inString: string) {
      this.alreadyPresent = alreadyExistsCheck(inString);
    },

    /*
    checks to see if an input URL is valid
    */
    validUrlCheck(u: string) {
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
    uploadFile(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        this.files = target.files;
      }
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
      if (this.files.length === 0) {
        alert("Please select a file to upload.");
        return;
      }
      this.uploadedFiles = [...this.files];
      this.uploadedPath = this.uploadPath;
      this.uploading = true;
      this.filesUploaded = await handleFiles(
        this.files,
        this.uploadPath,
        this.selectedPodUrl
      );
      this.uploadSuccessful = uploadSuccess(this.filesUploaded);
      this.uploading = false;

      this.clearFiles();
    },

    clearFiles() {
      this.files = [];
      this.$nextTick(() => { this.inputKey++; });
    },

    /* Takes in the emitted value from ContainerNav.vue */
    handleSelectedContainer(selectedContainer: string) {
      this.uploadPath = selectedContainer;
    },
  },
  mounted() {
    // Set initial upload path to the selected Pod URL
    if (this.selectedPodUrl !== "") {
      this.uploadPath = this.selectedPodUrl;
    }
  }
};
</script>

<style scoped>
/* Title bar */
.title-container {
  background-color: var(--panel);
  border-radius: 8px;
  margin: 0.5rem 0.5rem;
  color: var(--text-secondary);
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
  background: var(--panel);
  border-radius: 8px;
  margin: 0rem 0.5rem;
  padding: 0.2rem 0 0 1rem;
}

.path-container {
  margin: 0rem 0.5rem 0.5rem 0.5rem;
  border: 4px solid var(--border);
  border-radius: 6px;
}
/* Upload location nav container */
.container-location {
  display: flex;
  background-color: var(--panel);
}
.container-location .nav-container {
  display: flex;
  background-color: var(--bg-secondary);
  border-radius: 4px;
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
  padding: 0px 8px 3px 8px;
  text-decoration: none;
  border-bottom: 1px solid var(--text-secondary);
  color: var(--text-secondary);
}
#top-button {
  margin-top: 10px;
}
.nav-container li button {
  display: block;
  color: var(--text-secondary);
  border-radius: 4px;
  padding: 10px 10px;
  width: 100%;
  text-decoration: none;
}
.nav-container li button:hover {
  background-color: var(--panel-elev);
}
.nav-container .highlight {
  background-color: var(--primary);
  color: var(--main-white);
}

/* upload path input/selection */
.path-selection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  list-style-type: none;
  padding: 0;
  margin: 0;
  color: var(--text-secondary);
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
/* Aligns the check-mark horizontally with the button */
.check-path-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sel-pod {
  display: flex;
  align-items: center;
  margin-left: 0;
  gap: 10px;
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
  padding: 20px;
  background: var(--panel);
  color: var(--text-secondary);
  box-shadow: var(--shadow-1);
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
  margin: 0rem 0.5rem 0.5rem 0.5rem;
  background-color: var(--bg-secondary);
  border-radius: 6px;
}
.container {
  font-family: "Oxanium", monospace;
  max-width: 95%;
  margin: auto;
  padding: 20px;
  border-radius: 10px;
  box-shadow: var(--shadow-1);
}
.upload-section {
  font-family: "Oxanium", monospace;
  border-radius: 8px;
  background-color: var(--bg-secondary);
}
.upload-title {
  font-size: 16pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  margin-top: 10px;
  padding-left: 20px;
  padding-right: 20px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 10px;
}
.v-btn {
  margin-left: 15px;
  margin-bottom: 15px;
}
#writeForm {
  margin-left: 10px;
  color: var(--text-secondary);
}
.input-box {
  width: 99%;
}
.check-exists {
  list-style-type: none;
}

/* Upload button and spinner row */
.upload-btn-row {
  display: flex;
  align-items: center;
  padding: 0 0 1rem 0.5rem;
}
.upload-btn {
  margin: 0;
}
/* Spinner styles (copied from DataQuery.vue) */
.spinner-container {
  display: flex;
  align-items: center;
  margin-left: 8px;
}
.spinner {
  border: 4px solid rgba(63, 1, 117, 0.3);
  border-top: 4px solid #754ff6;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.upload-location-label {
  padding-left: 5px;
  display: inline-block;
}

/* Upload button and spinner row */
.upload-btn-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.upload-result-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-left: 10px;
}
.upload-result-row b {
  color: var(--yasqe-operator);
}
.result-message {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-family: "Oxanium", monospace;
  margin-right: 10px;
  padding: 0.5rem;
  border-radius: 6px;
  color: var(--text-secondary);
}
.error-message {
  border: 3px solid var(--error);
}
.duplicate-message {
  border: 3px solid var(--warning);
}
.success-message {
  border: 3px solid var(--yasqe-string);
}
/* Spinner styles */
.spinner-container {
  display: flex;
  align-items: center;
  margin-left: 8px;
}
.spinner {
  border: 4px solid rgba(63, 1, 117, 0.3);
  border-top: 4px solid #754ff6;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.use-guide {
  margin: 0 0.5rem;
}
.use-guide :deep(.container) {
  margin: 0;
}
</style>

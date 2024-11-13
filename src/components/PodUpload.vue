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
    <ul class="horizontal-list">
      <li>
        <span><b>Data upload location:</b> </span>
      </li>
      <li>
        <container-nav :currentPod="currentPod" />
      </li>
    </ul>
  </div>

  <v-container>
    <div v-if="currentPod !== ''">
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
        <div v-if="this.pod === 'Error: probably not logged in'">
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
  </v-container>

  <hr />

  <body class="use-guide">
    <h2 class="req">Data Upload Guide</h2>
    <ol>
      <li>Select the pod and container you want to upload a file to (Not Fully Funtional)</li>
      <li>Click the <b>"File Input"</b> bar above or drag and drop a file</li>
      <li>Click the <b>"Upload"</b> button</li>
      <li>
        Once the success label appears, your files should then be in your pod.
      </li>
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
      pod: "",
      filesUploaded: [],
      files: FileList,
      uploadDone: false,
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
      this.pod = this.selectedPod;
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
      this.filesUploaded = await handleFiles(this.files, this.pod);
      this.uploadDone = uploadSuccess(this.filesUploaded);
    },

    /* Takes in the emitted value from PodRegistration.vue */
    handlePodSelected(selectedPod) {
      this.currentPod = selectedPod;
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.getPodURL();
      // console.log(this.podURLs)
    }, 200);
  },
  props: {},
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
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Title bar */
.title-container {
  background-color: #445560;
  border-radius: 8px;
  margin-top: 10px;
  margin-bottom: 5px;
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
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  background: #445560;
  border-radius: 8px;
}

/* Container location bar */
.horizontal-list {
  display: flex;
  align-items: center;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.horizontal-list span {
  font-size: 18pt;
  font-family: "Oxanium", monospace;
  font-weight: 400;
  margin-left: 15px;
}

/* Data upload container */
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
}
.v-btn {
  margin-left: 15px;
  margin-bottom: 15px;
}
ul,
ol {
  margin-left: 20px;
  margin-bottom: 15px;
  margin-top: 5px;
}
ol li {
  margin-bottom: 10px;
  margin-left: 20px;
  list-style-type: upper-roman;
  align-items: Left;
}
.guide {
  text-align: Left;
}

/* User guide */
.use-guide {
  font-size: 16px;
  max-width: 95%;
}
.req {
  margin-top: 10px;
}
</style>

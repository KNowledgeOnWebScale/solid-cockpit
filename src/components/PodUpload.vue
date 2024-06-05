<template>
  <!-- The data upload card is only shown after login -->
  <v-container>
    <!-- Card that contains the data upload field -->
    <v-card
      title="Add Data to Pod"
      variant="tonal"
      justify="center"
      class="mx-auto"
      color="indigo-darken-3"
    >
      <!-- The file input section << Styling needs a little work >> -->
      <form id="writeForm">
        <v-file-input
          clearable
          label="Click to select file(s) OR drag and drop a file(s) here"
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
          ><b>Try logging out and logging back in!</b></v-alert
        >
      </div>
      <div v-else-if="!initialLoad">
        <!-- Shows that file upload was successful -->
        <div v-if="!fileUploaded">
          <v-alert
            class="mx-auto"
            title="File(s) successfully uploaded!"
            type="success"
            icon="$success"
            >(File(s) can be found in the
            <b>{{ this.pod }}uploads/</b> directory of your pod)</v-alert
          >
        </div>

        <!-- Alert for if file upload is not successful -->
        <div v-else>
          <v-alert
            class="mx-auto"
            title="There was an error with the file(s) upload!"
            type="error"
            icon="$error"
            >There seems to be an error with the file upload. There are some
            file types not supported in the current implementation. We are
            working on fixing this currently. Sorry!!</v-alert
          >
        </div>
      </div>
    </v-card>
  </v-container>

  <hr />

  <body>
    <h2 class="req">Data Uplod Guide</h2>
    <ol>
      <li>Click the <b>"File Input"</b> bar above or drag and drop a file</li>
      <li>Select the local file(s) you wish to upload</li>
      <li>Click the <b>"Upload"</b> button</li>
      <li>Voila! Your files should then be in your pod.</li>
    </ol>
  </body>
</template>

<script lang="ts">
import { getPodURLs, handleFiles } from "./fileUpload";
import { currentWebId } from "./login";

export default {
  data() {
    return {
      webId: "",
      podURLs: [],
      pod: "",
      fileUploaded: false,
      initialLoad: true,
      files: FileList,
    };
  },
  methods: {
    /*
  Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
  Obtains 'pod' variable (URL path to user's Pod).
  */
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podURLs = await getPodURLs(this.webId); // calls async function to get Pod URLs
      this.pod = this.podURLs[0]; // can fix this to handle multiple pods (<< FUTURE >>)
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
  */
    submitUpload() {
      this.fileUploaded = handleFiles(this.files, this.pod);
      this.initialLoad = false;
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.getPodURL();
    }, 200);
  },
  props: {},
};
</script>

<style scoped>
body {
  line-height: 1.6;
  margin: 15px;
  font-family: "Courier New", monospace;
  max-width: 900px;
  margin: auto;
  padding: 20px;
  background: #d0e0fc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.container {
  font-family: "Courier New", monospace;
  max-width: 900px;
  margin: auto;
  padding: 20px;
  background: #d0e0fc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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

.req {
  margin-top: 10px;
}
</style>

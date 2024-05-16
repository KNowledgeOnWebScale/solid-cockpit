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
        <!-- The file input section << Want to make this drag and drop? >> -->
        <form id="writeForm">
          <v-file-input 
            clearable 
            label="File input"  
            show-size 
            type="file"
            @change="uploadFile($event)"
            ref="file">
          </v-file-input>
          <!-- Button that sends the uploaded file to the connected Pod -->
          <v-btn 
            variant="tonal" 
            rounded="xs" 
            @click="submitUpload">
            Upload
          </v-btn>
        </form>
      </v-card>
  </v-container>
</template>


<script lang="ts">
import { getPodURLs, handleFiles } from './fileUpload';
import { currentWebId } from './login';

export default {
  data() {
    return {
      webId: '',
      podURLs: [],
      pod: '',
      fileToUpload: null,
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
    this.podURLs = await getPodURLs(this.webId);  // calls async function to get Pod URLs
    this.pod = this.podURLs[0];   // can fix this to handle multiple pods (<< FUTURE >>)
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
    console.log(this.pod)
    handleFiles(this.files, this.pod);
  }
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.getPodURL();
    }, 200);
  },
  props: {
  }
}
</script>


<style scoped>


</style>

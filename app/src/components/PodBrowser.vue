<template>
  <v-container v-show="loggedIn">
    <v-col cols="12">
      <v-card
        title="Add Data to Pod"
        variant="tonal"
        justify="center"
        max-width="550"
        class="mx-auto"
        color="indigo-darken-3"
      >
        <form id="writeForm">
          <v-file-input 
            label="File input" 
            variant="underlined" 
            show-size 
            type="file"
            @change="uploadFile($event)"
            ref="file">
          </v-file-input>
          <v-btn 
            variant="tonal" 
            rounded="xs" 
            @click="submitUpload">
            Upload
          </v-btn>
        </form>
      </v-card>
    </v-col>
  </v-container>
</template>


<script lang="ts">
import { getPodURLs, handleFiles } from './fileUpload';
import { isLoggedin, currentWebId } from './login';

export default {
  data() {
    return {
      loggedIn: false,
      podURLs: [],
      pod: '',
      fileToUpload: null,
      files: FileList,
    };
  },
  methods: {
  loginCheck() {
    /*
    Calls isLoggedin() from login.ts to check login status
    */
    this.loggedIn = isLoggedin(); // Calls function in login.ts to check login status
  }, 
  async getPodURL() {
    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID
    'pod' variable is key value returned
    */
    this.webId = currentWebId();
    this.podURLs = await getPodURLs(this.webId);  // calls async function to get Pod URLs
    this.pod = this.podURLs[0];   // can fix this to handle multiple pods (FUTURE)
  },
  uploadFile(event: FileList) {
    /*
    Calls uploadFile() from fileUpload.ts to upload a file to the user's pod
    */
    this.files = event.target.files;
  },
  submitUpload() {
    handleFiles(this.files, this.pod); // ISSUE
  }
  },
    mounted() {
      setTimeout(() => {
        this.loginCheck();
        this.getPodURL();
      }, 200); // Delay of 0.2 seconds
  },
  props: {
    title: {
      type: String,
      required: true
    },
  }
}
</script>

<style scoped>


</style>

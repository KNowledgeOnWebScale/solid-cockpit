<template>
  <!-- TODO: the pod choosing / registering section -->
  <div class="pod-register" v-if="loggedIn">
    <div v-if="!podAccess">

      <v-alert
        density="compact"
        text="Enter a pod URL to register to your webId:"
        title="No Pod Registered to your WebId"
        type="warning"
      > 
        <!-- TODO: a hint with the user's current "likely" pod based on WebId 
              Also, maybe a "one session" pod reference would be cool -->
        <div>
          <v-text-field density="compact" :rules="rules"></v-text-field>
          <v-btn variant="tonal" rounded="xs" @click="webIdData">
            Register Pod
          </v-btn>
        </div>
      </v-alert>
    </div>
  </div>

</template>

<script lang="ts">
import { webIdDataset } from "./getData";
import {
  isLoggedin,
  currentWebId,
  redirectToHomepage,
  redirectToLogin,
  logOut,
  getPodURLs,
} from "./login";

export default {
  data: () => ({
    loggedIn: false,
    menu: false,
    message: false,
    podAccess: false,
    podList: null,
    customPodUrl: null,
    currentPod: "",
    user: {
      webId: "",
      fullName: "John Doe", // Should pull this data from #card (and integrate to pop up)
      email: "john.doe@doe.com", // Should pull this data from #card
    },
    rules: [
        value => {
          try {
            const isUrl = new URL(value);
            return isUrl || 'Invalid URL.'
          } catch {
            return 'Invalid URL'
          }
        },
      ],
  }),
  methods: {
    logIn() {
      this.loggedIn = isLoggedin();
      this.webId = currentWebId();
    },
    async webIdData() {
      await webIdDataset(this.user.webId, this.customPodUrl);
      // this.findPodList()
    },
    async findPodList() {
      this.podList = await getPodURLs();
      this.currentPod = this.podList[0];
      console.log(this.podList);
      if (this.podList !== null) {
        try {
          this.podAccess = this.podList.length !== 0 ? true : this.podAccess;
        } catch(err) {
          console.log(err);
        }
      }
      console.log(this.podAccess);
    },
  },
  mounted() {
    setTimeout(() => {
        this.logIn();
      }, 200);
    setTimeout(() => {
      //this.findPodList();
    }, 500);
  },
};
</script>

<style scoped>
.pod-register {
  font-family: "Oxanium", monospace;
  max-width: 75%;
  margin: auto;
  margin-bottom: 20px;
}

</style>
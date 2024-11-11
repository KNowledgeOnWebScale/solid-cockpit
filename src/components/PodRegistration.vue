<template>
  <!-- TODO: the pod choosing / registering section -->
  <div class="pod-register" v-if="loggedIn">
    <div v-if="!podAccess">
      <v-alert
        density="compact"
        title="No Pod Registered to your WebId"
        type="warning"
      >
        <!-- TODO: a hint with the user's current "likely" pod based on WebId 
              Also, maybe a "one session" pod reference would be cool -->
        <div id="addAccess">
          <button @click="toggleForm" class="icon-button">
            <span>Input your Pod URL (optional)</span>
            <i v-if="!showFormIndex" class="material-icons right">add</i>
            <i v-if="showFormIndex" class="material-icons right"> remove </i>
            <v-tooltip v-if="showFormIndex" activator="parent" location="end"
              >Close Pod URL input
            </v-tooltip>
          </button>
          <button @click="findPodList" class="refresh icon-button right">
            <i class="material-icons right">refresh</i>
            <v-tooltip activator="parent" location="end"
              >Refresh to check if Pod has been added
            </v-tooltip>
          </button>
        </div>

        <!-- Add Pod to WebId form -->
        <form @submit.prevent="addToWebIdData">
          <div class="input-podURL">
            <div id="shareBox" v-if="showFormIndex" class="form-container">
              <!-- For adding custom Pod URL -->
              <v-text-field
                v-model="customPodUrl"
                density="compact"
                :rules="rules"
              ></v-text-field>
            </div>
            <v-btn
              class="pod-registerButton"
              variant="tonal"
              rounded="xs"
              type="submit"
            >
              Register Pod
              <v-tooltip activator="parent" location="end"
                >Click to (attempt) to add your pod to your WebId card
              </v-tooltip>
            </v-btn>
          </div>
        </form>
      </v-alert>
    </div>
    
    <!-- TODO: Add a section for pod selection -->
    <!-- Pod Selection dropdown -->
    <div class="select-pod" v-if="podAccess">
      <span>Current Pod</span>
      <v-select
        variant="outlined"
        color="#445560"
        v-model="currentPod"
        :items="podList"
      ></v-select>
    </div>
  </div>
</template>

<script lang="ts">
import { webIdDataset } from "./getData";
import { checkUrl } from "./privacyEdit";
import { isLoggedin, currentWebId, getPodURLs } from "./login";

export default {
  data: () => ({
    loggedIn: false,
    menu: false,
    message: false,
    podAccess: false,
    podList: null,
    customPodUrl: "",
    currentPod: "",
    showFormIndex: false,
    user: {
      webId: "",
      fullName: "John Doe", // TODO: Should pull this data from #card (and integrate to pop up)
      email: "john.doe@doe.com", // TODO: Should pull this data from #card
    },
    rules: [
      (value) => {
        return checkUrl(value, this.currentPod) ? "Invalid URL" : "";
      },
    ],
  }),
  methods: {
    logIn() {
      this.loggedIn = isLoggedin();
      this.user.webId = currentWebId();
    },
    /**
     * Method for adding a pod to a user's webId card
     */
    async addToWebIdData() {
      console.log(checkUrl(this.customPodUrl, this.currentPod));
      if (!checkUrl(this.customPodUrl, this.currentPod)) {
        console.log(this.customPodUrl);
        await webIdDataset(this.user.webId, this.customPodUrl);
      } else {
        console.log("Not a valid URL ... ");
      }
    },

    /**
     * Method for obtaining a user's list of pods
     */
    async findPodList() {
      this.podList = await getPodURLs();
      this.currentPod = this.podList[0];
      if (this.podList !== null) {
        try {
          this.podAccess = this.podList.length !== 0 ? true : this.podAccess;
        } catch (err) {
          console.log(err);
        }
      }
    },
    /* Toggles the Custom URL field */
    toggleForm() {
      this.showFormIndex = !this.showFormIndex;
    },
  },
  mounted() {
    setTimeout(() => {
      this.logIn();
    }, 200);
    setTimeout(() => {
      this.findPodList();
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

/* For pod registration */
.input-podURL {
  justify-content: center;
  align-items: center;
}
.pod-registerButton {
  margin-top: 10px;
}
#addAccess{
  display: flex;
}
.refresh{
  margin-left: auto;
}

/* For pod selection */
.select-pod {
  padding: 15px;
  margin: auto;
  background-color: #445560;
}
.select-pod span {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 700;
}
</style>

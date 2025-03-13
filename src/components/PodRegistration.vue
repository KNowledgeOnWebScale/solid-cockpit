<template>
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

    <!-- Pod Selection dropdown -->
    <div class="select-pod" v-if="podAccess">
      <ul class="horizontal-list">
        <li>
          <span>Select Pod:</span>
        </li>
        <li>
          <div class="sel-pod">
            <v-select
              variant="outlined"
              v-model="currentPod"
              :items="podList"
            ></v-select>
            <v-btn
              class="pod-selectButton"
              variant="tonal"
              rounded="xs"
              @click="selectPod"
            >
              Select Pod
              <v-tooltip activator="parent" location="end"
                >Click to select this pod
              </v-tooltip>
            </v-btn>
            <v-icon class="check-mark" v-if="podSuccess" color="green">mdi-check</v-icon>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { webIdDataset } from "./getData";
import { checkUrl } from "./privacyEdit";
import { isLoggedin, currentWebId, getPodURLs } from "./login";

export default {
  name: "PodRegistration",
  data: () => ({
    loggedIn: false,
    menu: false,
    message: false,
    podAccess: false,
    podList: null,
    customPodUrl: "",
    currentPod: "",
    showFormIndex: false,
    podSuccess: false,
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
      /* For TRIPLE consortium */
      if (this.customPodUrl === "") {
        await webIdDataset(this.user.webId, this.customPodUrl);
      } else {
        /* For provided URL */
        if (!checkUrl(this.customPodUrl, this.currentPod)) {
          console.log(this.customPodUrl);
          await webIdDataset(this.user.webId, this.customPodUrl);
        } else {
          /* For invalid URL 
        TODO: make this a little prettier */
          console.log("Not a valid URL ... ");
        }
      }
    },

    /**
     * Method for obtaining a user's list of pods
     */
    async findPodList() {
      this.podList = await getPodURLs();
      if (this.podList !== null) {
        this.currentPod = this.podList[0];
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

    successfulSelection() {
      this.podSuccess = true;
    },
    /* Emits selected pod to Parent component (LandingPage.vue) */
    selectPod() {
      const selectedPod = this.currentPod;
      this.$emit("pod-selected", selectedPod);
      // console.log("Selected pod: " + selectedPod);
      this.successfulSelection();
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
  margin: auto;
  margin-left: 15px;
  margin-bottom: 10px;
}

/* For pod registration */
.input-podURL {
  justify-content: center;
  align-items: center;
}
.pod-registerButton {
  margin-top: 10px;
}
#addAccess {
  display: flex;
}
.refresh {
  margin-left: auto;
}

/* For pod selection 
   TODO: Fix the alignment of this :( */

.horizontal-list {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.select-pod span {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 700;
}
.pod-selectButton {
  font-family: "Oxanium", monospace;
}
button:focus {
  background-color: transparent;
}
.sel-pod {
  display: flex;
  align-items: center;
  margin-left: 15px;
  gap: 20px;
}
.sel-pod .v-btn {
  margin-bottom: 5px;
}
.sel-pod .v-select {
  min-width: 150px;
  margin-top: 15px;
  font-family: "Oxanium", monospace;
}
.sel-pod .check-mark {
  margin-bottom: 5px;
}
</style>

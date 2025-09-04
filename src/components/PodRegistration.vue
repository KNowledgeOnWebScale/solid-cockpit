<template>
  <div class="pod-register" v-if="loggedIn">
    <!-- delay div prevents yellow flashing of pod selection box -->
    <h2>Pod Selection</h2>
    <div class="loading-spinner-container" v-if="delay">
      <div class="spinner"></div>
      <span class="loading-text">Checking login status ...</span>
    </div>

    <div class="delay-placeholder" v-if="!delay">
      <!-- Display current selected pod if selectedPodUrl is not empty -->
      <div v-if="podSuccess" class="current-pod">
        <p>Current Selected Pod: <strong>{{ authStore.selectedPodUrl }}</strong></p>
        <button
          class="change-pod-btn styled-button"
          @click="clearSelectedPod"
        >
          Change Pod
        </button>
      </div>

      <!-- Pod Selection dropdown -->
      <div class="select-pod" v-else>
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
                <v-tooltip class="tool-tip" activator="parent" location="end"
                  >Click to select this pod
                </v-tooltip>
              </v-btn>
              <v-icon class="check-mark" v-if="podSuccess" color="green"
                >mdi-check</v-icon
              >
            </div>
          </li>
        </ul>
      </div>

      <div class="add-webid" v-if="!podAccess">
        <v-alert
          density="compact"
          title="No Pod Registered to your WebId"
          type="warning"
        >
          <!-- TODO: a hint with the user's current "likely" pod based on WebId 
              Also, maybe a "one session" pod reference would be cool -->
          <div class="add-access">
            <button @click="toggleForm" class="icon-button">
              <span>Input your Pod URL (optional)</span>
              <i v-if="!showFormIndex" class="material-icons right">add</i>
              <i v-if="showFormIndex" class="material-icons right"> remove </i>
              <v-tooltip
                class="tool-tip"
                v-if="showFormIndex"
                activator="parent"
                location="end"
                >Close Pod URL input
              </v-tooltip>
            </button>
            <button @click="findPodList" class="refresh icon-button right">
              <i class="material-icons right">refresh</i>
              <v-tooltip class="tool-tip" activator="parent" location="end"
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
              <button
                class="pod-registerButton styled-button"
                type="submit"
              >
                Register Pod
                <span class="tooltip">Click to add your pod to your WebId card</span>
              </button>
            </div>
          </form>
        </v-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { webIdDataset } from "./getData";
import { checkUrl } from "./privacyEdit";
import { currentWebId, getPodURLs } from "./login";
import { useAuthStore } from "../stores/auth"; // Import the auth store

export default {
  name: "PodRegistration",
  data: () => ({
    menu: false,
    message: false,
    podAccess: false,
    delay: true,
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
  computed: {
    authStore() {
      return useAuthStore(); // Access the auth store
    },
    loggedIn() {
      return this.authStore.loggedIn; // Access loggedIn state
    },
    webId() {
      return this.authStore.webId; // Access webId state
    },
    podSuccess() {
      return this.authStore.selectedPodUrl !== ""; // Check if selectedPodUrl is not empty
    },
  },
  methods: {
    // delays the loading div so there is no yellow flash from async fetching
    toggleDelay() {
      this.delay = false;
    },
    /**
     * Method for adding a pod to a user's webId card
     */
    async addToWebIdData() {
      /* For TRIPLE consortium */
      if (this.customPodUrl === "") {
        await webIdDataset(currentWebId(), this.customPodUrl);
        this.$forceUpdate(); // Forces a re-render of the component
      } else {
        /* For provided URL */
        if (!checkUrl(this.customPodUrl, this.currentPod)) {
          await webIdDataset(currentWebId(), this.customPodUrl);
          this.$forceUpdate(); // Forces a re-render of the component
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
        //TODO: make this error display in DOM
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
    selectPod() {
      const selectedPod = this.currentPod;
      const authStore = useAuthStore(); // Access the auth store
      authStore.setSelectedPodUrl(selectedPod); // Set the selected Pod URL in the store
      this.$emit("pod-selected", selectedPod);
    },
    clearSelectedPod() {
      const authStore = useAuthStore(); // Access the auth store
      authStore.setSelectedPodUrl(""); // Clear the selected Pod URL
    },
  },
  mounted() {
    setTimeout(() => {
      this.findPodList();
    }, 200);
    setTimeout(() => {
      this.toggleDelay();
    }, 250);
  },
};
</script>

<style scoped>
.pod-register {
  font-family: "Oxanium", monospace;
  padding: 1rem;
}
.pod-register h2 {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
  font-size: 20pt;
  font-weight: 600;
}
.add-webid {
  padding: 0.5rem;
}
/* For pod registration */
.input-podURL {
  justify-content: center;
  align-items: center;
}
.pod-registerButton {
  margin-top: 10px;
}
.add-access {
  display: flex;
  align-items: center;
}
.add-access .icon-button {
  display: flex;
  align-items: center;
  margin-top: 0.2rem;
}
.add-access span {
  display: flex;
  align-items: center;
}
.refresh {
  margin-left: auto;
}
.tool-tip {
  font-family: "Oxanium", monospace;
}

/* Pod lodaing spinner */
.loading-spinner-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  margin: 0 0.25rem 0.25rem 0.25rem;
  padding: 1rem;
  margin-left: 8px;
}
.loading-text {
  font-family: "Oxanium", monospace;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
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

/* For pod selection */
.horizontal-list {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  list-style-type: none;
  padding: 0;
  margin: 0;
  color: var(--text-primary);
}
.select-pod span {
  margin: 0 0 0 1rem;
  font-size: 22px;
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
.sel-pod .v-select {
  min-width: 150px;
  font-family: "Oxanium", monospace;
}
.sel-pod .check-mark {
  margin-bottom: 5px;
}
.sel-pod :deep(.v-input__details) {
  display: none;
}

.delay-placeholder {
  background-color: transparent;
}

.current-pod {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0rem 0 0 1rem;
  font-size: 1.2rem;
  color: var(--text-primary);
}
.current-pod p {
  margin-top: 0.3rem;
}
.current-pod strong {
  padding-left: 0.5rem;
  font-style: italic;
  color: var(--yasqe-keyword);
}
.change-pod-btn {
  margin-right: 2rem;
  background-color: var(--muted);
}

.styled-button {
  display: inline-block;
  padding: 0.5rem 1.5rem; /* Increased padding */
  font-size: 1rem;
  font-weight: 500;
  font-family: "Oxanium", monospace;
  color: var(--text-secondary); /* High contrast text color */
  background-color: var(--muted); /* High contrast background color */
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.styled-button:hover {
  background-color: var(--hover); /* Darker shade on hover */
}
.tooltip {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-left: 8px;
}
</style>

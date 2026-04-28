<template>
  <div class="pod-register" v-if="loggedIn">
    <div class="loading-spinner-container" v-if="delay">
      <div class="spinner"></div>
      <span class="loading-text">Loading pods...</span>
    </div>

    <div class="register-shell" v-if="!delay">
      <!-- The selected-pod state is reduced to a single, utility-style action bar. -->
      <div v-if="podSuccess" class="current-pod">
        <div class="current-pod-summary">
          <div class="pod-icon-wrap">
            <v-icon size="28" color="var(--primary)">mdi-database-outline</v-icon>
          </div>
          <span class="current-pod-title">Current pod</span>
          <div class="current-pod-copy">
            <div class="current-pod-url-row">
              <div class="current-pod-value-group">
                <span class="current-pod-value">{{ authStore.selectedPodUrl }}</span>
                <v-btn class="copy-pod-btn" variant="text" rounded="lg" @click="copyPodUrl">
                  <v-icon size="18">mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
        <div class="pod-actions">
          <v-btn class="change-pod-btn" variant="outlined" rounded="lg" @click="clearSelectedPod">
            Change Pod
          </v-btn>
        </div>
      </div>

      <!-- The selection state stays on one row with minimal copy and aligned controls. -->
      <div class="select-pod" v-else>
        <span class="selection-label">Choose a pod</span>
        <div class="sel-pod">
          <v-select
            variant="outlined"
            v-model="currentPod"
            :items="podList"
            label="Pod URL"
            hide-details
          ></v-select>
          <v-btn
            class="pod-selectButton"
            variant="flat"
            rounded="lg"
            @click="selectPod"
          >
            Use Pod
          </v-btn>
        </div>
      </div>

      <!-- Empty-state card keeps the optional manual pod registration understandable. -->
      <div class="add-webid" v-if="!podAccess">
        <v-alert
          density="comfortable"
          title="No Pod Registered to your WebId"
          type="warning"
          variant="tonal"
        >
          <div class="add-access">
            <v-btn @click="toggleForm" class="icon-button" variant="text" rounded="lg">
              {{ showFormIndex ? "Hide Pod URL Input" : "Input Your Pod URL" }}
              <v-tooltip
                class="tool-tip"
                v-if="showFormIndex"
                activator="parent"
                location="end"
              >
                Close pod URL input
              </v-tooltip>
            </v-btn>
          </div>

          <!-- Manual pod registration remains available as a secondary recovery action. -->
          <form @submit.prevent="addToWebIdData">
            <div class="input-podURL">
              <div id="shareBox" v-if="showFormIndex" class="form-container">
                <v-text-field
                  v-model="customPodUrl"
                  density="compact"
                  :rules="rules"
                  label="Pod URL"
                  variant="outlined"
                  hide-details="auto"
                ></v-text-field>
              </div>
              <v-btn
                class="pod-registerButton"
                type="submit"
                variant="flat"
                rounded="lg"
              >
                Register Pod
              </v-btn>
            </div>
          </form>
        </v-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { webIdDataset } from "../services/solid/getData";
import { checkUrl } from "../services/solid/privacyEdit";
import { currentWebId, getPodURLs } from "../services/solid/login";
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
        await this.findPodList();
        this.showFormIndex = false;
        this.customPodUrl = "";
      } else {
        /* For provided URL */
        if (!checkUrl(this.customPodUrl, this.currentPod)) {
          await webIdDataset(currentWebId(), this.customPodUrl);
          await this.findPodList();
          this.showFormIndex = false;
          this.customPodUrl = "";
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
        this.podAccess = this.podList.length !== 0;
      } else {
        this.podAccess = false;
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
    // Copying the active pod URL saves users from manually selecting long URLs.
    async copyPodUrl() {
      if (!this.authStore.selectedPodUrl) {
        return;
      }
      await navigator.clipboard.writeText(this.authStore.selectedPodUrl);
    },
  },
  async mounted() {
    try {
      await this.findPodList();
    } finally {
      this.toggleDelay();
    }
  },
};
</script>

<style scoped>
/* Layout keeps pod selection as a single horizontal utility bar when space allows. */
.pod-register {
  font-family: "Oxanium", monospace;
  padding: 0.2rem 0;
}
.register-shell {
  display: grid;
  gap: 0.85rem;
  min-width: 0;
}
.add-webid {
  padding: 0;
}

/* Manual registration actions stay compact but expand cleanly on narrow screens. */
.input-podURL {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.8rem;
}
.pod-registerButton {
  justify-self: start;
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: var(--main-white);
}
.add-access {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.add-access .icon-button {
  color: var(--text-secondary);
  text-transform: none;
  letter-spacing: 0;
}
.tool-tip {
  font-family: "Oxanium", monospace;
}

/* Pod lodaing spinner */
.loading-spinner-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
}
.loading-text {
  font-family: "Oxanium", monospace;
  font-size: 1rem;
  font-weight: 600;
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

/* Pod selection card makes the main action obvious and keeps the current state readable. */
.select-pod,
.current-pod {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--panel) 96%, white 4%), var(--panel));
  box-shadow: var(--shadow-1);
}
.bar-label {
  display: flex;
  align-items: center;
}
.selection-label {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.current-pod p {
  flex-wrap: wrap;
  margin: 0;
}
.pod-selectButton {
  font-family: "Oxanium", monospace;
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: var(--main-white);
  min-width: 112px;
}
.sel-pod {
  display: flex;
  align-items: center;
  min-width: 0;
  width: 100%;
  gap: 0.75rem;
}
.sel-pod .v-select {
  flex: 1;
  min-width: 180px;
  font-family: "Oxanium", monospace;
}
.sel-pod :deep(.v-field) {
  border-radius: 12px;
}
.sel-pod :deep(.v-field__input) {
  color: var(--text-primary);
}
.sel-pod :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--border);
}
.sel-pod :deep(.v-input__details) {
  display: none;
}

.current-pod-summary {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.85rem;
  flex: 1 1 auto;
  min-width: 0;
}
.pod-icon-wrap {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.current-pod-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.current-pod-copy {
  display: flex;
  align-items: center;
  min-width: 0;
}
.current-pod-url-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.65rem;
  min-width: 0;
  width: 100%;
}
.current-pod-value-group {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.3rem 0.35rem 0.3rem 0.7rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-elev) 85%, white 15%);
  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.16);
}
.current-pod-value {
  display: block;
  min-width: 0;
  flex: 1;
  color: var(--pod-url-emphasis);
  line-height: 1.4;
  font-size: 0.98rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pod-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex: 0 0 auto;
}
.copy-pod-btn,
.change-pod-btn {
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
  border-color: var(--border);
  text-transform: none;
}
.copy-pod-btn {
  min-width: auto;
  padding-inline: 0.7rem;
  flex-shrink: 0;
}
.change-pod-btn {
  min-width: 118px;
}
.select-pod .selection-label {
  min-width: 0;
}
.form-container {
  width: 100%;
  max-width: 34rem;
}

/* Mid-size windows need a softer collapse before the full mobile stack. */
@media (max-width: 1120px) {
  .select-pod {
    display: grid;
    grid-template-columns: 1fr;
    align-items: stretch;
  }
  .selection-label {
    margin-bottom: 0.1rem;
  }
  .current-pod {
    align-items: stretch;
  }
  .current-pod-summary {
    flex-wrap: wrap;
  }
}



/* Responsive stacking keeps controls large enough to tap without wasting space. */
@media (max-width: 760px) {
  .sel-pod,
  .current-pod,
  .add-access {
    align-items: stretch;
  }
  .select-pod,
  .current-pod {
    align-items: stretch;
  }
  .current-pod p {
    white-space: normal;
    word-break: break-word;
  }
  .current-pod-summary {
    align-items: center;
    flex-wrap: wrap;
  }
  .current-pod-copy,
  .current-pod-url-row {
    width: 100%;
  }
  .current-pod-value-group {
    max-width: none;
    flex-wrap: wrap;
    border-radius: 18px;
  }
  .current-pod-value {
    white-space: normal;
    word-break: break-word;
  }
  /* Prevent dropdown field min-width from forcing awkward wrapping on phones. */
  .sel-pod .v-select,
  .sel-pod :deep(.v-input) {
    min-width: 0;
    width: 100%;
  }
  .pod-actions {
    justify-content: stretch;
  }
  .pod-selectButton,
  .change-pod-btn,
  .pod-registerButton,
  .add-access .icon-button {
    width: 100%;
  }
}
</style>

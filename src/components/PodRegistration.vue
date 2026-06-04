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
          <v-btn
            class="register-another-btn"
            variant="outlined"
            rounded="lg"
            @click="toggleForm"
          >
            {{ showFormIndex ? "Hide Input" : "Register new pod" }}
          </v-btn>
          <v-btn class="change-pod-btn" variant="outlined" rounded="lg" @click="clearSelectedPod">
            Change Pod
          </v-btn>
        </div>
      </div>

      <!-- The selection state stays on one row with minimal copy and aligned controls. -->
      <div class="select-pod" v-else-if="podAccess">
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
          <v-btn
            class="register-another-btn"
            variant="outlined"
            rounded="lg"
            @click="toggleForm"
          >
            {{ showFormIndex ? "Hide Input" : "Register new pod" }}
          </v-btn>
        </div>
      </div>

      <!-- Empty-state card keeps manual pod registration clear and compact. -->
      <div class="add-webid" v-if="!podAccess">
        <div class="empty-pod-state">
          <div class="empty-pod-main">
            <div class="empty-pod-icon-wrap">
              <v-icon size="24" color="var(--primary)">mdi-database-alert-outline</v-icon>
            </div>
            <div class="empty-pod-copy">
              <h4>No pod registered to your WebID</h4>
              <p>Add your pod URL once so it appears in the pod selector.</p>
            </div>
          <div class="empty-pod-actions">
              <v-btn
                @click="inferPodFromWebId"
                class="empty-pod-toggle"
                variant="outlined"
                rounded="lg"
                :loading="isInferringPod"
                :disabled="isInferringPod"
              >
                Infer from WebID
              </v-btn>
              <v-btn
                @click="toggleForm"
                class="empty-pod-toggle"
                variant="outlined"
                rounded="lg"
              >
                {{ showFormIndex ? "Hide Input" : "Add Pod URL" }}
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showFormIndex" class="manual-register-panel">
        <!-- Manual URL registration covers pods created after a WebID already exists. -->
        <form @submit.prevent="addToWebIdData">
          <div class="manual-register-copy">
            <h4>Register a pod URL</h4>
            <p>
              Use this when you created a new pod after your WebID already existed and the provider
              did not add the pod automatically.
            </p>
          </div>
          <div class="input-podURL">
            <div id="shareBox" class="form-container">
              <v-text-field
                v-model="customPodUrl"
                density="compact"
                :rules="[validatePodUrl]"
                label="Pod URL"
                hint="Example: https://your-pod.example/"
                persistent-hint
                variant="outlined"
                hide-details="auto"
              ></v-text-field>
            </div>
            <v-btn
              class="pod-registerButton"
              type="submit"
              variant="flat"
              rounded="lg"
              :loading="isRegisteringPod"
              :disabled="isRegisteringPod"
            >
              Register Pod
            </v-btn>
          </div>
        </form>
      </div>

      <p class="pod-register-feedback pod-register-error" v-if="registrationError">
        {{ registrationError }}
      </p>
      <p class="pod-register-feedback pod-register-success" v-if="registrationSuccess">
        {{ registrationSuccess }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { getSolidDataset } from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
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
    isInferringPod: false,
    isRegisteringPod: false,
    registrationError: "",
    registrationSuccess: "",
    user: {
      webId: "",
      fullName: "John Doe", // TODO: Should pull this data from #card (and integrate to pop up)
      email: "john.doe@doe.com", // TODO: Should pull this data from #card
    },
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
    /**
     * Vuetify rule callback for pod URL input. Kept as an instance method so
     * it has stable access to component state instead of relying on `this` in
     * `data()`, which caused runtime errors when opening the manual input form.
     */
    validatePodUrl(value: string) {
      return checkUrl(value, this.currentPod) ? "Invalid URL" : true;
    },
    // delays the loading div so there is no yellow flash from async fetching
    toggleDelay() {
      this.delay = false;
    },
    /**
     * Method for adding a pod to a user's webId card
     */
    async addToWebIdData() {
      this.registrationError = "";
      this.registrationSuccess = "";
      this.isRegisteringPod = true;
      /* For provided URL */
      if (this.customPodUrl === "") {
        this.registrationError = "Enter a valid pod URL to register.";
        this.isRegisteringPod = false;
        return;
      }

      if (checkUrl(this.customPodUrl, this.currentPod)) {
        this.registrationError = "Invalid pod URL. Please provide a full HTTP(S) URL.";
        this.isRegisteringPod = false;
        return;
      }

      try {
        const normalizedPodUrl = this.normalizeContainerUrl(this.customPodUrl);
        const isValidPod = await this.isValidPodCandidate(normalizedPodUrl);
        if (!isValidPod) {
          this.registrationError =
            "This URL could not be confirmed as a readable Solid pod container. Check the URL and access permissions, then try again.";
          return;
        }

        await webIdDataset(currentWebId(), normalizedPodUrl);
        const refreshed = await this.refreshPodListAfterRegistration(
          normalizedPodUrl
        );
        if (refreshed) {
          this.registrationSuccess = this.podSuccess
            ? "Pod URL registered. Click Change Pod if you want to switch to it now."
            : "Pod URL registered. Select it to continue.";
          this.showFormIndex = false;
          this.customPodUrl = "";
        } else {
          this.registrationSuccess =
            "Pod URL was written to your WebID, but pod discovery is still updating. Please retry in a moment or use Infer from WebID.";
        }
      } catch {
        this.registrationError =
          "Could not register pod URL on your WebID. Check permissions and try again.";
      } finally {
        this.isRegisteringPod = false;
      }
    },

    /**
     * Method for obtaining a user's list of pods
     */
    async findPodList() {
      this.podList = await getPodURLs();
      if (this.podList !== null) {
        this.currentPod = this.podList.length > 0 ? this.podList[0] : "";
        this.podAccess = this.podList.length !== 0;
      } else {
        this.currentPod = "";
        this.podAccess = false;
      }
    },
    /**
     * Compare pod URLs in a stable way regardless of trailing slash.
     */
    normalizePodUrlForCompare(urlValue: string): string {
      try {
        const parsed = new URL(urlValue);
        const normalizedPath = parsed.pathname.endsWith("/")
          ? parsed.pathname
          : `${parsed.pathname}/`;
        return `${parsed.origin}${normalizedPath}`;
      } catch {
        return urlValue.trim();
      }
    },
    /**
     * Pod list updates can lag briefly after WebID storage writes. Retry a few
     * times to avoid false negatives in the UI refresh.
     */
    async refreshPodListAfterRegistration(expectedPodUrl: string): Promise<boolean> {
      const expectedNormalized = this.normalizePodUrlForCompare(expectedPodUrl);
      const maxAttempts = 4;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await this.findPodList();
        const list = Array.isArray(this.podList) ? this.podList : [];
        const hasExpected = list.some(
          (podUrl) =>
            this.normalizePodUrlForCompare(String(podUrl)) === expectedNormalized
        );

        if (hasExpected || this.podAccess) {
          if (hasExpected) {
            this.currentPod = expectedPodUrl;
          }
          return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      return false;
    },
    /* Toggles the Custom URL field */
    toggleForm() {
      this.registrationError = "";
      this.registrationSuccess = "";
      this.showFormIndex = !this.showFormIndex;
    },
    /**
     * Extract likely pod container URLs from the current WebID using common
     * Solid profile path conventions, then deduplicate candidates.
     */
    inferPodCandidates(webId: string): string[] {
      const parsed = new URL(webId);
      const candidates: string[] = [];
      const seen = new Set<string>();

      const addCandidate = (candidate: string) => {
        const normalized = this.normalizeContainerUrl(candidate);
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        candidates.push(normalized);
      };

      const rawPath = parsed.pathname.replace(/\/+$/, "");
      const profileCardMatch = rawPath.match(/^(.*)\/profile\/card$/i);
      if (profileCardMatch) {
        addCandidate(`${parsed.origin}${profileCardMatch[1] || "/"}`);
      }

      const trailingCardMatch = rawPath.match(/^(.*)\/card$/i);
      if (trailingCardMatch) {
        addCandidate(`${parsed.origin}${trailingCardMatch[1] || "/"}`);
      }

      const pathSegments = parsed.pathname.split("/").filter(Boolean);
      if (pathSegments.length > 0) {
        addCandidate(`${parsed.origin}/${pathSegments[0]}/`);
      }

      // Fallback for providers where the pod root is at origin level.
      addCandidate(`${parsed.origin}/`);
      return candidates;
    },
    /**
     * Normalize inferred container URL shape before validation.
     */
    normalizeContainerUrl(urlValue: string): string {
      try {
        const parsed = new URL(urlValue);
        parsed.hash = "";
        parsed.search = "";
        parsed.pathname = parsed.pathname.endsWith("/")
          ? parsed.pathname
          : `${parsed.pathname}/`;
        return parsed.toString();
      } catch {
        return "";
      }
    },
    /**
     * Validate inferred pod candidate by checking that the container resolves
     * as a readable Solid dataset for the current authenticated session.
     */
    async isValidPodCandidate(candidateUrl: string): Promise<boolean> {
      try {
        await getSolidDataset(candidateUrl, { fetch });
        return true;
      } catch {
        return false;
      }
    },
    /**
     * Optional inference workflow: propose a valid pod candidate from WebID
     * and prefill the manual registration field for user confirmation.
     */
    async inferPodFromWebId() {
      this.registrationError = "";
      this.registrationSuccess = "";
      this.isInferringPod = true;
      try {
        const webIdValue = this.webId || currentWebId();
        if (!webIdValue || checkUrl(webIdValue, "")) {
          this.registrationError =
            "Could not infer pod because your WebID is missing or invalid.";
          return;
        }

        const candidates = this.inferPodCandidates(webIdValue);
        if (candidates.length === 0) {
          this.registrationError =
            "Could not infer pod from your WebID structure. Please enter your pod URL manually.";
          return;
        }

        for (const candidate of candidates) {
          if (await this.isValidPodCandidate(candidate)) {
            this.customPodUrl = candidate;
            this.showFormIndex = true;
            this.registrationSuccess =
              `Inferred pod candidate. Click Register Pod to confirm.`;
            return;
          }
        }

        this.registrationError =
          "Could not infer a valid pod from your WebID. Checked common candidates but none were readable.";
      } catch {
        this.registrationError =
          "Pod inference failed. Please enter your pod URL manually.";
      } finally {
        this.isInferringPod = false;
      }
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
.manual-register-panel {
  display: grid;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--panel) 95%, white 5%),
    var(--panel)
  );
  box-shadow: var(--shadow-1);
}
.manual-register-copy {
  display: grid;
  gap: 0.18rem;
}
.manual-register-copy h4 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-primary);
}
.manual-register-copy p {
  margin-top: 0.2rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--text-muted);
}
.add-webid {
  padding: 0;
}

/* Manual registration empty-state matches the app card language and stays compact. */
.empty-pod-state {
  display: grid;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--panel) 95%, white 5%),
    var(--panel)
  );
  box-shadow: var(--shadow-1);
}
.empty-pod-main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}
.empty-pod-actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-left: auto;
}
.empty-pod-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.empty-pod-copy {
  display: grid;
  gap: 0.2rem;
  flex: 1 1 16rem;
  min-width: 0;
}
.empty-pod-copy h4 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-primary);
}
.empty-pod-copy p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.4;
}
.empty-pod-toggle {
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
  border-color: var(--border);
  text-transform: none;
}
.pod-register-feedback {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.35;
}
.pod-register-error {
  color: #d86179;
}
.pod-register-success {
  color: #4fb89f;
}

/* Manual registration actions stay compact but expand cleanly on narrow screens. */
.input-podURL {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.75rem;
  padding-top: 1rem;
}
.pod-registerButton {
  justify-self: end;
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: var(--main-white);
  text-transform: none;
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
.change-pod-btn,
.register-another-btn {
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
.register-another-btn {
  min-width: 146px;
}
.select-pod .selection-label {
  min-width: 0;
}
.form-container {
  width: 100%;
  max-width: 34rem;
}
.form-container :deep(.v-field__input),
.form-container :deep(input) {
  color: var(--text-primary);
  opacity: 1;
}
.form-container :deep(input::placeholder) {
  color: var(--text-secondary);
  opacity: 1;
}
.form-container :deep(.v-field-label) {
  color: var(--text-secondary);
}
.form-container :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--border);
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
  .empty-pod-main {
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
  .empty-pod-toggle {
    width: 100%;
  }
  .empty-pod-actions {
    margin-left: 0;
    width: 100%;
  }
  .input-podURL {
    grid-template-columns: 1fr;
  }
  .pod-registerButton {
    justify-self: stretch;
  }
}
</style>

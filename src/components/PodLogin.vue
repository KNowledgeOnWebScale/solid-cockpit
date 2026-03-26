<template>
  <div class="login-container">
    <h2>Solid Pod Login</h2>

    <div class="loading-spinner-container" v-if="loading">
      <div class="spinner"></div>
      <span class="loading-text">Checking login status ...</span>
    </div>

    <div class="login-diplay" v-if="!loggedIn && !loading">
      <div class="input-row">
        <v-form class="form-row">
          <div class="input-row">
            <!-- Portion for entering the "Pod Provider URL" -->
            <v-combobox
              v-model="userUrl"
              clearable
              required
              variant="outlined"
              density="comfortable"
              auto-select-first="exact"
              label="Pod Provider:"
              type="url"
              :items="[
                'https://triple.ilabt.imec.be/',
                'https://solidcommunity.net/',
                'https://solidweb.org/',
                'https://login.inrupt.com',
                'http://localhost:3000/',
              ]"
            >
              <!-- Info button -->
              <template v-slot:prepend>
                <v-tooltip class="tool-tip" location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      fab
                      v-bind="props"
                      color="var(--text-muted)"
                      size="small"
                      icon="mdi-information"
                      >mdi-information</v-icon
                    >
                  </template>
                  Please offer the URL of your Pod Provider (Format:
                  https://example.com/)
                </v-tooltip>
              </template>
              <!-- "Login" button + form submission -->
              <template v-slot:append>
                <v-btn
                  class="mx-right"
                  color="var(--primary)"
                  name="btnLogin"
                  @click="handleLogin"
                  >Login</v-btn
                >
              </template>
            </v-combobox>
          </div>
        </v-form>
      </div>
      <!-- Alert that there was and issue with the Login URL -->
      <div id="errorIndicator" v-if="error">
        <v-alert
          closable
          title="Issue with the provided URL"
          type="error"
          icon="$error"
        ></v-alert>
      </div>

      <!-- "Don't have a pod" button redirects to Pod Provider site -->
      <v-btn
        id="new-pod"
        class="new-pod-btn"
        text="Don't have a pod?"
        variant="flat"
        @click="newpodRedir"
      ></v-btn>
    </div>

    <!-- Logged-in state is shown as a structured status card instead of a generic alert. -->
    <div class="logged-in" v-show="loggedIn">
      <div class="session-card">
        <div class="session-icon-wrap">
          <v-icon size="28" color="var(--success)">mdi-check-circle</v-icon>
        </div>
        <div class="session-title-row">
          <span class="session-title">Session active</span>
        </div>
        <div class="session-detail">
          <span class="session-label">WebID:</span>
          <div class="session-value-group">
            <span class="session-value">{{ webId }}</span>
            <!-- Copy control sits beside the WebID so the target of the action is explicit. -->
            <v-btn
              class="copy-webid-btn"
              variant="text"
              rounded="lg"
              @click="copyWebId"
            >
              <v-icon size="18">mdi-content-copy</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { startLogin, isLoggedin, currentWebId, session } from "./login";
import { provide } from "vue";
import { useAuthStore } from "../stores/auth";

export default {
  name: "LoginComponent",
  setup() {
    provide("sessionI", session.info);
  },
  data() {
    return {
      userUrl: "",
      isLoggedIn: false,
      isError: false,
      error: "",
      newPodDirections: false,
      currWebId: "",
      isActive: false,
      loading: true, // New loading state
    };
  },
  computed: {
    authStore() {
      return useAuthStore(); // Access the store
    },
    loggedIn() {
      return this.authStore.loggedIn; // Access loggedIn state
    },
    webId() {
      return this.authStore.webId; // Access webId state
    },
  },
  methods: {
    /*
    For the login to a Solid pod, calls startLogin from login.ts
    */
    async handleLogin() {
      const stat = await startLogin(this.userUrl);
      if (stat === "error") {
        this.error = "Cannot login properly...";
      } else {
        await this.loginCheck();
      }
    },
    /*
    Checks if user's current session is logged-in and displays the active webID.
    Obtains the loggedIn boolean and webId string.
    */
    async loginCheck() {
      const authStore = useAuthStore(); // Access the store
      await authStore.initializeAuth(true);
      this.isLoggedIn = authStore.loggedIn || isLoggedin();
      this.currWebId = authStore.webId || currentWebId();
      authStore.setAuth(this.isLoggedIn, this.currWebId); // Regularly update the store
    },
    /*
    Redirects user to page with Pod Providers
    */
    newpodRedir() {
      window.open(
        "https://solidproject.org/get_a_pod",
        "_blank"
      );
    },
    // Copying the WebID keeps the compact status layout practical for users.
    async copyWebId() {
      if (!this.webId) {
        return;
      }
      await navigator.clipboard.writeText(this.webId);
    },
  },
  async mounted() {
    await this.loginCheck();
    this.loading = false;
  },
};
</script>

<style scoped>
.login-container {
  padding: 0;
  background-color: transparent;
  font-family: "Oxanium", monospace;
  font-size: larger;
  border-radius: 0;
  margin-top: 0;
}
.login-container h2 {
  margin: 0 0 0.7rem 0;
  color: var(--text-primary);
}
.login-display {
  padding: 0.1rem 0 0 0;
}
.tool-tip {
  font-family: "Oxanium", monospace;
}
#errorIndicator {
  margin-bottom: 1rem;
  padding: 0.2rem 0.2rem;
  border: 2px solid var(--border);
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: var(--error);
}
.input-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  gap: 10px;
}
.input-row :deep(v-input__control) {
  color: var(--text-secondary);
}
.form-row {
  width: 100%;
}
.v-combobox {
  flex-grow: 1;
}
.v-btn,
.v-icon {
  flex-shrink: 0;
}
.logged-in {
  margin: 0;
}
.session-card {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  padding: 0.95rem 1rem;
  border: 1px solid color-mix(in srgb, var(--success) 36%, var(--border) 64%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--success) 12%, var(--panel) 88%);
  box-shadow: var(--shadow-1);
}
.session-icon-wrap {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--success) 18%, transparent);
}
.session-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.session-detail {
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 0.85rem;
  min-width: 0;
  margin-left: auto;
  width: 100%;
}
.session-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
}
.session-value-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  max-width: min(100%, 56rem);
  padding: 0.3rem 0.35rem 0.3rem 0.7rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel-elev) 85%, white 15%);
  border: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.16);
}
.session-value {
  color: var(--text-primary);
  font-size: 0.96rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-webid-btn {
  color: var(--text-secondary);
  text-transform: none;
  min-width: auto;
  padding-inline: 0.55rem;
}
#new-pod {
  margin-left: 0;
  margin-top: 0.5rem;
  margin-bottom: 0;
}
.new-pod-btn {
  background-color: var(--panel-elev);
  color: var(--text-secondary);
}
.new-pod-btn:hover {
  background-color: var(--hover);
}

/* Pod lodaing spinner */
.loading-spinner-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  margin: 0;
  padding: 0.95rem 1rem;
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
@media (max-width: 760px) {
  .session-card {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .session-detail {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
  }
  .session-label {
    line-height: 1.2;
  }
  .session-value-group {
    width: 100%;
    max-width: none;
    margin-left: 0;
  }
  .session-value {
    white-space: normal;
    word-break: break-all;
  }
}
</style>

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
                'https://inrupt.net/',
                'https://auth.inrupt.com/',
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

    <!-- Message that indicates a successful login -->
    <div class="logged-in" v-show="loggedIn">
      <v-alert
        class="mx-auto"
        title="Successfully logged-in!"
        type="success"
        icon="$success"
        >Current WebID: <b>{{ webId }}</b></v-alert
      >
    </div>
  </div>
</template>

<script lang="ts">
import { startLogin, isLoggedin, currentWebId, session, handleRedirectAfterPageLoad } from "./login";
import { provide, watch } from "vue";
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
        await handleRedirectAfterPageLoad();
        const authStore = useAuthStore(); // Access the store
        authStore.setAuth(true, currentWebId()); // Update the store
        this.isLoggedIn = isLoggedin();
        this.currWebId = currentWebId();
      }
    },
    /*
    Checks if user's current session is logged-in and displays the active webID.
    Obtains the loggedIn boolean and webId string.
    */
    async loginCheck() {
      const authStore = useAuthStore(); // Access the store
      this.isLoggedIn = isLoggedin();
      this.currWebId = currentWebId();
      authStore.setAuth(this.isLoggedIn, this.currWebId); // Regularly update the store
    },
    /*
    Redirects user to page with Pod Providers
    */
    newpodRedir() {
      window.open(
        "https://solidproject.org/for-developers#hosted-pod-services",
        "_blank"
      );
    },
  },
  mounted() {
    // Delay login check to ensure session is initialized
    setTimeout(() => {
      this.loginCheck();
      this.loading = false;
    }, 800);
  },
};
</script>

<style scoped>
.login-container {
  padding: 1rem;
  background-color: var(--panel);
  font-family: "Oxanium", monospace;
  font-size: larger;
  border-radius: 6px;
  margin-top: 0.5rem;
}
.login-container h2 {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}
.login-display {
  padding: 1rem;
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
  padding: 0.2rem 0.2rem;
  border: 2px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  font-style: italic;
  background-color: var(--success);
  margin: 0;
}
#new-pod {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
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
</style>

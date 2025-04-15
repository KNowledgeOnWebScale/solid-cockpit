<template>
  <div class="login-container">
    <h2>Solid Pod Login</h2>
    <div class="login-diplay" v-if="!loggedIn">
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
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      fab
                      v-bind="props"
                      color="white"
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
                  color="#EDE7F6"
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
        color="#EDE7F6"
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
import { startLogin, isLoggedin, currentWebId, session } from "./login";
import { provide } from "vue";

export default {
  name: "LoginComponent",
  setup() {
    provide("sessionI", session.info);
  },
  data() {
    return {
      userUrl: "", // sets default url (if nothing is entered)
      loggedIn: false,
      isError: false,
      error: "",
      newPodDirections: false,
      webId: "",
      isActive: false,
    };
  },
  methods: {
    /* 
    For the login to a Solid pod, calls startLogin from login.ts
    */
    async handleLogin() {
      const stat = await startLogin(this.userUrl);
      if (stat === "error") {
        this.error = "Cannot login properly...";
      }
      this.loginSuccess();
    },
    /* 
    Checks if user's current session is logged-in and displays the active webID.
    Obtains the loggedIn boolean and webId string.
    */
    loginCheck() {
      this.loggedIn = isLoggedin();
      this.webId = currentWebId();
    },
    /* 
    Emits when login is successful.
    */
    loginSuccess() {
      const loginStatus = this.loggedIn;
      this.$emit("login-success", loginStatus);
      // console.log("Selected pod: " + selectedPod);
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
    // Delays the execution loginCheck() on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.loginCheck();
    }, 100); // Delay of 2 seconds
  },
};
</script>

<style scoped>
.login-container {
  padding: 1rem;
  background-color: #445560;
  font-family: "Oxanium", monospace;
  font-size: larger;
  border-radius: 6px;
  margin-top: 0.5rem;
}
.login-container h2 {
  margin: 0.5rem 1rem 1rem 1rem;
}
.login-display {
  padding: 1rem;
}
#errorIndicator {
  margin-bottom: 1rem;
  padding: 0.2rem 0.2rem;
  border: 2px solid #d72920;
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: #ffcccc;
}
.input-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  gap: 10px;
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
  border: 2px solid #307104;
  border-radius: 6px;
  font-size: 14px;
  font-style: italic;
  background-color: #9fe8b7; /* Highlighted background color */
  margin: 0;
}
#new-pod {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
}
button:hover {
  background-color: #bda6fd;
}
button:active {
  background-color: #9b77ff;
}
</style>

<template>
  <v-container class="login-container">
    <!-- The card that conatins the login fields -->
    <v-card
      id="card"
      justify="center"
      class="mx-auto"
      color="#445560"
    ><h2>Solid Pod Login</h2>
      <v-col cols="12">
        <div v-show="!loggedIn">
          <!-- This login portion disappears after logging in -->
          <v-form>
            <v-container>
              <v-row>
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
                  :items="['https://triple.ilabt.imec.be/', 'https://solidcommunity.net/', 'https://solidweb.org/', 'https://inrupt.net/', 'https://auth.inrupt.com/', 'http://localhost:3000/']"
                >

                  <!-- Info button -->
                  <template v-slot:prepend>
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <v-icon fab v-bind="props" color="white" size="small" icon="mdi-information">mdi-information</v-icon>
                      </template>
                      Please offer the URL of your Pod Provider (Format: https://example.com/)
                    </v-tooltip>
                  </template>
                  <!-- "Login" button + form submission -->
                  <template v-slot:append>
                    <v-btn class="mx-right" color="#EDE7F6" name="btnLogin" @click="handleLogin">Login</v-btn>
                  </template>
                </v-combobox>
              </v-row>
            </v-container>
          </v-form>

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
                id = "new-pod"
                color="#EDE7F6"
                text="Don't have a pod?"
                variant="flat"
                @click="newpodRedir"
                ></v-btn>

            <!-- "Create new pod" directions pop-up -- not in use anymore -->
            <!--
            <template v-slot:default="{ isActive }">
              <v-card title="Pod Creation Instructions:">
                <v-card-text class="mx-auto">
                  Run in the console: <code>$ bash makePod.sh</code>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    text="Close Dialog"
                    @click="isActive.value = false"
                  ></v-btn>
                </v-card-actions>
              </v-card>
            </template>
            -->
        
        </div>
      </v-col>

      <!-- Message that indicates a successful login -->
      <div class="logged-in" v-show="loggedIn">
        <v-alert
          class="mx-auto"
          title="Successfully logged-in!"
          type="success"
          icon="$success"
        >Current WebID: <b>{{ webId }}</b></v-alert>
      </div>

    </v-card>
  </v-container>
</template>


<script lang="ts">
import { startLogin, isLoggedin, currentWebId, session } from "./login";
import { provide } from 'vue';

export default {
  name: "LoginComponent",
  setup() {
    provide('sessionI', session.info)
  },
  data() {
    return {
      userUrl: "", // sets default url (if nothing is entered)
      loggedIn: false,
      isError: false,
      error: '',
      newPodDirections: false,
      webId: '',
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
    Redirects user to page with Pod Providers
    */
    newpodRedir() {
      window.open('https://solidproject.org/for-developers#hosted-pod-services', '_blank');
    }
  },
  mounted() {
    // Delays the execution loginCheck() on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.loginCheck();
    }, 500); // Delay of 2 seconds
  },
};
</script>


<style scoped>
#card {
  font-family: "Oxanium", monospace;
  font-size: larger;
  border-radius: 6px;
}

h2 {
  margin-left: 1.5rem;
  margin-top: 15px;
}
#errorIndicator {
  padding: 2px 2px;
  border: 2px solid #d72920;
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: #ffcccc;
}

.logged-in {
  padding: 2px 2px;
  border: 2px solid #307104;
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: #9fe8b7; /* Highlighted background color */
}
.login-container {
  min-width: auto;
  max-width: 85%;
}
#new-pod {
  margin-left: 2rem;
  margin-bottom: 10px;
}
button:hover {
  background-color: #bda6fd;
}
button:active {
  background-color: #9b77ff;
}
</style>

<template>
  <v-container>
    <!-- The card that conatins the login fields -->
    <v-card
      title="Solid Pod Login"
      variant="tonal"
      justify="center"
      max-width="550"
      class="mx-auto"
      color="indigo-darken-3"
    >
      <v-col cols="12">
        <div v-show="!loggedIn">
          <!-- This login portion disappears after logging in -->
          <v-form>
            <v-container>
              <v-row>
                <!-- Portion for entering the "Pod Provider URL" -->
                <v-text-field
                  v-model="userUrl"
                  label="Pod Provider:"
                  type="url"
                  variant="outlined"
                  clearable
                  required
                >
                  <!-- Info button -->
                  <template v-slot:prepend>
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <v-icon fab v-bind="props" color="info" size="small" icon="mdi-information">mdi-information</v-icon>
                      </template>
                      Please offer the URL of your Pod Provider (Eg: http://localhost:3000/)
                    </v-tooltip>
                  </template>
                  <!-- "Login" button + form submission -->
                  <template v-slot:append>
                    <v-btn class="mx-right" color="surface-variant" name="btnLogin" @click="handleLogin">Login</v-btn>
                  </template>
                </v-text-field>
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

          <!-- "Create new pod" directions button -->
          <v-dialog max-width="500">
            <template v-slot:activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                color="surface-variant"
                text="Create New Pod?"
                variant="flat"
                ></v-btn>
            </template>
            <!-- "Create new pod" directions pop-up -->
            <template v-slot:default="{ isActive }">
              <v-card title="Pod Creation Instructions:">
                <v-card-text class="mx-auto">
                  Run in the console: <code>$ bash makePod.sh</code>
                </v-card-text>
              <!-- Need to fix BASH script to launch an existing pod (not create a new one) -->
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    text="Close Dialog"
                    @click="isActive.value = false"
                  ></v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        
        </div>
      </v-col>

      <!-- Message that indicates a successful login -->
      <div id="loggedIn" v-show="loggedIn">
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
import { startLogin, isLoggedin, currentWebId } from "./login";

export default {
  name: "LoginComponent",
  data() {
    return {
      userUrl: "http://localhost:3000/", // sets default url (if nothing is entered)
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
  },
  mounted() {
    // Delays the execution loginCheck() on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.loginCheck();
    }, 200); // Delay of 2 seconds
  },
};
</script>


<style scoped>
#errorIndicator {
  padding: 2px 2px;
  margin-bottom: 10px;
  margin-right: 2rem;
  border: 2px solid #d72920;
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: #ffcccc; /* Highlighted background color */
}

#loggedIn {
  padding: 2px 2px;
  margin-bottom: 10px;
  margin-right: 2rem;
  border: 2px solid #307104;
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: #9fe8b7; /* Highlighted background color */
}
button:hover {
  background-color: #bda6fd;
}

button:active {
  background-color: #9b77ff;
}
</style>

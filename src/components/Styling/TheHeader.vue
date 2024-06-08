<template>
  <v-card color="#ccdff8">
    <v-container>
      <v-row align="center" justify="center">
        <v-card-title justify="start">
          <h1>TRIPLE App</h1>
        </v-card-title>

        <div class="account">
          <div class="text-right">
            <v-menu
              v-model="menu"
              :close-on-content-click="false"
              location="end"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-account"
                  size="medium"
                  color="grey-darken-4"
                  justify="end"
                  v-bind="props"
                  @click="loginCheck"
                ></v-btn>
              </template>

              <v-card>
                <v-list class="text-right align-self-start">
                  <v-list-item
                    v-if="loggedIn"
                    title="Current WebID:"
                    :subtitle="user.webId"
                  ></v-list-item>
                  <v-list-item v-else title="Not logged in"></v-list-item>
                </v-list>

                <v-divider></v-divider>

                <v-list class="text-right align-self-start">
                  <div v-if="!loggedIn">
                    <v-list-item>
                      <v-btn
                        class="loginButton"
                        v-model="message"
                        color="blue"
                        label="Login"
                        @click="LoginpageRedir"
                        >Login</v-btn
                      >
                    </v-list-item>
                  </div>

                  <div v-if="loggedIn">
                    <v-list-item>
                      <v-btn
                        class="loginButton"
                        v-model="message"
                        color="red"
                        label="Logout"
                        @click="userLogout"
                        >Logout</v-btn
                      >
                    </v-list-item>
                  </div>
                </v-list>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    height="30"
                    min-width="40"
                    variant="text"
                    @click="menu = false"
                  >
                    Cancel
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </div>
        </div>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import {
  isLoggedin,
  currentWebId,
  redirectToHomepage,
  redirectToLogin,
  logOut,
} from "./../login";

export default {
  data: () => ({
    loggedIn: false,
    login_status: "",
    menu: false,
    message: false,
    user: {
      webId: "",
      fullName: "John Doe", // Should pull this data from #card (and integrate to pop up)
      email: "john.doe@doe.com", // Should pull this data from #card
    },
  }),
  methods: {
    async userLogout() {
      this.login_status = await logOut();
    },
    loginCheck() {
      this.loggedIn = isLoggedin();
      this.user.webId = currentWebId();
    },
    homepageRedir() {
      redirectToHomepage();
    },
    LoginpageRedir() {
      redirectToLogin();
    },
  },
  mounted(){
    setTimeout(() => {
      this.loginCheck()
    }, 200);
  },
  props: {},
};
</script>

<style scoped>
h1 {
  color: rgb(0, 0, 0);
  margin: 0;
  font-family: "Courier New", monospace;
  font-size: 3rem; /* Adjust as needed */
  text-align: center;
}

.account {
  position: absolute;
  right: 0;
  top: 0;
  padding: 15px; /* Optional: adjust the padding as needed */
}

</style>

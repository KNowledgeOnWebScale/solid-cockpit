<template>
  <v-card color="#AAA7AD">
    <v-container>
      <v-row align="center" justify="start">
        <img
          :src="require('../../assets/solid-cockpit-logo.png')"
          alt="Solid Cockpit logo"
        />
        <v-card-title justify="start">
          <h1>Solid Cockpit</h1>
        </v-card-title>

        <!-- the pod choosing / registering section -->
        <div class="header-right">
          <div class="register-pod" v-if="!podAccess">
            <v-btn variant="tonal" rounded="xs" @click="webIdData">
              Register Pod 
            </v-btn>

          </div>
          
          <div class="select-pod" v-if="podAccess">
            <v-select
              variant="outlined"
              color="#445560"
              v-model="currentPod"
              :items="podList"
            ></v-select>
          </div>

          <div class="account">
            <div class="text-right">
              <v-menu
                v-model="menu"
                :close-on-content-click="false"
                location="end"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    size="large"
                    color="#445560"
                    justify="end"
                    v-bind="props"
                    @click="loginCheck"
                    ><v-icon size="36px" color="#EDE7F6">mdi-account</v-icon></v-btn>
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
                      class="text-right"
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
  getPodURLs,
} from "./../login";
import { webIdDataset } from "./../getData";

export default {
  data: () => ({
    loggedIn: false,
    login_status: "",
    menu: false,
    message: false,
    podAccess: false,
    podList: null,
    customPodUrl: null,
    currentPod: "",
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
    async findPodList() {
      this.podList = await getPodURLs();
      this.currentPod = this.podList[0];
      console.log(this.podList);
      if (this.podList !== null) {
        try {
          this.podAccess = this.podList.length !== 0 ? true : this.podAccess;
        } catch(err) {
          console.log(err);
        }
      }
      console.log(this.podAccess);
    },
    async webIdData() {
      await webIdDataset(this.user.webId, this.customPodUrl);
      this.findPodList()

    }
  },
  mounted() {
    setTimeout(() => {
      this.loginCheck();
    }, 200);
    setTimeout(() => {
      this.findPodList();
    }, 500);
  },
};
</script>

<style scoped>
h1 {
  color: rgb(0, 0, 0);
  font-family: "Orbitron";
  font-size: 3rem;
  margin-left: 10px;
  text-align: Left;
}
img {
  width: 80px;
  height: auto;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.select-pod {
  margin-right: 20px;
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.account {
  display: flex;
  text-align: right;
  padding: 15px;
}
</style>

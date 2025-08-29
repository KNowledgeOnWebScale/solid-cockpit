<template>
  <div class="header-card">
    <div class="header-container">
      <v-row align="center" justify="start">
        <!-- Logo and App Title -->
        <img
          :src="logoUrl"
          alt="Solid Cockpit logo"
        />
        <v-card-title justify="start">
          <h1>Solid Cockpit</h1>
        </v-card-title>

        <div class="header-right">
          <!-- Account Icon -->
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
                    :color="loggedIn ? '#754ff6' : '#445560'"
                    justify="end"
                    v-bind="props"
                    @click="loginCheck"
                    ><v-icon size="36px" color="#EDE7F6">mdi-account</v-icon></v-btn>
                </template>

                <!-- Current session info -->
                <v-card>
                  <v-list class="text-right align-self-start">
                    <v-list-item
                      v-if="loggedIn"
                      title="Current WebID:"
                      :subtitle="user.webId"
                    ></v-list-item>
                    <v-list-item v-else title="Not logged in" class="not-logged-in-item"></v-list-item>
                  </v-list>

                  <v-divider></v-divider>

                  <v-list class="text-right align-self-start">
                    <!-- If logged out -->
                    <div v-if="!loggedIn">
                      <v-list-item>
                        <v-btn
                          class="loginButton styled-btn"
                          v-model="message"
                          color="blue"
                          label="Login"
                          @click="LoginpageRedir"
                          >Login</v-btn
                        >
                      </v-list-item>
                    </div>

                    <!-- If logged in -->
                    <div v-if="loggedIn">
                      <v-list-item>
                        <v-btn
                          class="loginButton styled-btn logout-btn"
                          v-model="message"
                          color="red"
                          label="Logout"
                          @click="userLogout"
                        >Logout</v-btn
                        >
                      </v-list-item>
                    </div>
                  </v-list>

                  <v-card-actions class="action-row">
                    <v-spacer></v-spacer>
                    <div class="action-btns">
                      <v-btn
                        class="text-right styled-btn cancel-btn"
                        height="30"
                        min-width="40"
                        variant="text"
                        @click="menu = false"
                      >
                        Cancel
                      </v-btn>
                    </div>
                  </v-card-actions>
                </v-card>
              </v-menu>
            </div>
          </div>
        </div>
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import {
  isLoggedin,
  currentWebId,
  redirectToHomepage,
  redirectToLogin,
  logOut,
} from "./../login";

interface User {
  webId: string;
  fullName: string;
  email: string;
}

export default {
  data() {
    return {
      logoUrl: new URL('../../assets/solid-cockpit-logo.png', import.meta.url).href as string,
      loggedIn: false as boolean,
      login_status: null as boolean | null,
      menu: false as boolean,
      message: false as boolean,
      podAccess: false as boolean,
      podList: null as string[] | null,
      customPodUrl: null as string | null,
      currentPod: "" as string,
      user: {
        webId: "" as string,
        fullName: "John Doe" as string,
        email: "john.doe@doe.com" as string,
      } as User,
    };
  },
  methods: {
    async userLogout(): Promise<void> {
      this.login_status = await logOut();
      window.location.reload();
    },
    loginCheck(): void {
      this.loggedIn = isLoggedin();
      this.user.webId = currentWebId();
    },
    homepageRedir(): void {
      redirectToHomepage();
    },
    LoginpageRedir(): void {
      redirectToLogin();
    },
  },
  mounted(): void {
    setTimeout(() => {
      this.loginCheck();
    }, 200);
    setTimeout(() => {
      //this.findPodList();
    }, 500);
  },
};
</script>

<style scoped>
.header-card {
  margin: 0;
}
.header-container {
  margin: 20px;
}
.header-container h1 {
  color: rgb(0, 0, 0);
  font-family: "Orbitron";
  font-size: 40pt;
  font-weight: 700;
  margin: 0 0 0 10px;
  text-align: Left;
}
.header-container img {
  width: 80px;
  height: auto;
  margin-left: 25px;
}

.header-container .header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.header-container .account {
  display: flex;
  text-align: right;
  padding: 15px;
  margin-right: 25px;
}

.styled-btn {
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(117, 79, 246, 0.10);
  transition: background 0.2s, color 0.2s;
  min-width: 100px;
  text-transform: none;
}
.styled-btn:hover {
  background-color: #445560 !important;
  color: #fff !important;
}
.logout-btn {
  background-color: #e53935 !important;
  color: #fff !important;
}
.logout-btn:hover {
  background-color: #ff6f60 !important;
  color: #fff !important;
}
.cancel-btn {
  margin-left: auto;
  margin-right: 0;
  font-family: "Oxanium", monospace;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 8px;
  min-width: 100px;
  text-transform: none;
}
.cancel-btn:hover {
  background-color: #d1c4e9 !important;
  color: #754ff6 !important;
}
.action-row {
  padding-right: 25px;
  padding-bottom: 10px;
  display: flex;
  justify-content: flex-end;
}
.action-btns {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.cancel-btn, .logout-btn {
  margin: 0;
  min-width: 120px;
}
.v-list-item {
  font-family: "Oxanium", monospace !important;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}
</style>

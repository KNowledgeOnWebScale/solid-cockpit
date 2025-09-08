<template>
  <div class="header-card">
    <div class="header-container">
      <v-row align="center" justify="start">
        <!-- Logo and App Title -->
        <img :src="logoUrl" alt="Solid Cockpit logo" />
        <v-card-title justify="start">
          <h1>Solid Cockpit</h1>
        </v-card-title>

        <div class="header-right">
          <!-- Change theme button -->
          <div class="theme-change">
            <ThemeSwitch />
          </div>
          <!-- Account Icon -->
          <div class="account">
            <div class="text-right">
              <v-menu
                v-model="menu"
                :close-on-content-click="false"
                location="end"
              >
                <template v-slot:activator="{ props }">
                  <button
                    class="icon-button"
                    :style="{ 'background-color': loggedIn ? 'var(--main-purple-dark)' : 'var(--gray-500)' }"
                    v-bind="props"
                  >
                    <v-icon size="36px" color="var(--main-white)">mdi-account</v-icon>
                  </button>
                </template>

                <!-- Current session info -->
                <v-card class="account-menu-card">
                  <v-list class="text-right align-self-start webId">
                    <v-list-item
                      v-if="loggedIn"
                      title="Current WebID:"
                      :subtitle="webId"
                    ></v-list-item>
                    <v-list-item
                      v-else
                      title="Not logged in"
                      class="not-logged-in-item"
                    ></v-list-item>
                  </v-list>

                  <v-divider></v-divider>

                  <v-list class="text-right align-self-start">
                    <!-- If logged out -->
                    <div v-if="!loggedIn">
                      <v-list-item>
                        <v-btn
                          class="loginButton styled-btn"
                          v-model="message"
                          color="var(--primary)"
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
                          color="var(--danger)"
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
import ThemeSwitch from "./ThemeSwitch.vue";
import { useAuthStore } from "../../stores/auth"; // Import the store
import {
  handleRedirectAfterPageLoad,
  redirectToHomepage,
  redirectToLogin,
  logOut,
} from "./../login";

export default {
  components: {
    ThemeSwitch,
  },
  data() {
    return {
      logoUrl: new URL("../../assets/solid-cockpit-logo.png", import.meta.url)
        .href as string,
      menu: false as boolean,
      message: false as boolean,
      notloggedOut: false as boolean,
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
    selectedPodUrl() {
      return this.authStore.selectedPodUrl; // Access selected Pod URL
    },
  },
  methods: {
    async userLogout(): Promise<void> {
      const authStore = useAuthStore();
      authStore.clearAuth();
      this.notloggedOut = await logOut();
      window.location.href = '/';
    },
    homepageRedir(): void {
      redirectToHomepage();
    },
    LoginpageRedir(): void {
      redirectToLogin();
    },
    async loginCheck(): Promise<void> {
      await handleRedirectAfterPageLoad();
    },
  },
  mounted() {
    this.loginCheck(); // Perform login check on component mount

    // Regularly check login status
    setInterval(() => {
      this.loginCheck();
    }, 30000); // Check every 30 seconds
  },
};
</script>

<style scoped>
.header-card {
  margin: 0;
  background-color: var(--panel);
}
.header-container {
  margin: 20px;
}
.header-container h1 {
  color: var(--text-primary);
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

.theme-change {
  margin-left: auto;
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
.webId {
  color: var(--text-secondary);
}

.styled-btn {
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(117, 79, 246, 0.1);
  transition: background 0.2s, color 0.2s;
  min-width: 100px;
  text-transform: none;
  background-color: var(--primary);
  color: var(--main-white);
}
.styled-btn:hover {
  background-color: var(--primary-700) !important;
  color: var(--main-white) !important;
}
.logout-btn {
  background-color: var(--danger) !important;
  color: var(--main-white) !important;
}
.logout-btn:hover {
  filter: brightness(1.2);
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
  background-color: transparent;
  color: var(--text-secondary);
}
.cancel-btn:hover {
  background-color: var(--hover) !important;
  color: var(--text-primary) !important;
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
.cancel-btn,
.logout-btn {
  margin: 0;
  min-width: 120px;
}
.v-list-item {
  font-family: "Oxanium", monospace !important;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}
.account-menu-card {
  background-color: var(--muted) !important;
  color: var(--text-secondary);
}
.account-menu-card .v-list {
  background-color: transparent !important;
}
/* Login sttatus button icon */
.icon-button {
  padding: 0.6rem;
  border-radius: 999px;
  border: 2px solid var(--main-white);
  cursor: pointer;
}
</style>

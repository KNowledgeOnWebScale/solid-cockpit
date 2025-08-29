<template>
  <v-container class="content-container">
    <v-col cols="12">
      <div class="logo-container">
        <img
          :src="visualUrl"
          alt="Full Solid Cockpit logo"
        />
      </div>

    </v-col>
  </v-container>

  <div class="login-container">
    <pod-login />
  </div>

  <div class="guide">
    <landing-guide />
  </div>
</template>

<script lang="ts">
import { handleRedirectAfterPageLoad, isLoggedin } from "./login";
import PodLogin from "./PodLogin.vue";
import PodRegistration from "./PodRegistration.vue";
import LandingGuide from "./Guides/LandingGuide.vue";

export default {
  components: {
    PodLogin,
    PodRegistration,
    LandingGuide,
  },
  props: {
    currPod: String,
  },
  data: () => ({
    login_status: true as boolean,
    visualUrl: new URL('../assets/full-sc-logo-nb.png', import.meta.url).href as string,
  }),
  methods: {
    async credentials(): Promise<void> {
      handleRedirectAfterPageLoad();
    },
    loggedIn(): boolean {
      return isLoggedin();
    },
    mounted(): void {
      this.credentials();
      // Delays the execution of these functions on page reload (to avoid async-related errors)
      setTimeout(() => {
        this.login_status = this.loggedIn();
      }, 200);
    },
  },
};
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
img {
  max-width: 80%;
  margin-top: 1rem;
  height: auto;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.login-container {
  margin: 0 0.5rem 0.5rem 0.5rem;
  
}
.pod-reg {
  background-color: #445560;
  border-radius: 8px;
  max-width: 100%;
  margin: 0.5rem 1rem;
  padding: 0.2rem 0 0 1rem;
}
.entry {
  font-family: "Oxanium", monospace;
  color: #28353e;
  text-align: center;
  margin-top: 10px;
}
.entry a {
  text-decoration: none;
  color: #28353e;
}
.entry span {
  font-family: "Orbitron";
}
</style>
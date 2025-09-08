<template>
  <v-container class="content-container">
    <v-col cols="12">
      <div class="logo-container">
        <img :src="visualUrl" alt="Full Solid Cockpit logo" />
      </div>
    </v-col>
  </v-container>

  <div class="login-container">
    <pod-login />
  </div>

  <div v-if="loggedIn" class="pod-chooseContainer">
    <PodRegistration />
  </div>

  <div class="guide">
    <landing-guide />
  </div>
</template>

<script lang="ts">
import { handleRedirectAfterPageLoad } from "./login";
import PodLogin from "./PodLogin.vue";
import PodRegistration from "./PodRegistration.vue";
import LandingGuide from "./Guides/LandingGuide.vue";
import { useAuthStore } from "../stores/auth";

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
    visualUrl: new URL("../assets/full-sc-logo-nb.png", import.meta.url).href,
  }),
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
    async credentials(): Promise<void> {
      handleRedirectAfterPageLoad();
    },
  },
  mounted() {
    setTimeout(() => {
      this.credentials();
    }, 500); // Delay to ensure authStore is ready
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
  margin: 0 0.5rem 0.25rem 0.5rem;
}
.pod-chooseContainer {
  margin: 0 1rem 0.5rem 1rem;
  background-color: var(--panel);
  border-radius: 6px;
}

</style>

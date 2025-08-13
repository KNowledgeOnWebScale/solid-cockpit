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

  <div class="container">
    <div class="item">
      <button class="dropdown-toggle" @click="toggleInfoDropdown">
        <h2 class="guide" style="display:inline;">What can this application do?</h2>
        <i class="material-icons dropdown-arrow">
          {{ infodropdownOpen ? "keyboard_arrow_down" : "chevron_right" }}</i>
      </button>
      <div v-if="infodropdownOpen" class="dropdown-content">
        <h3 class="req"><i class="material-icons arrow-bullet">chevron_right</i> Connect to your <a href="https://solidproject.org/">Solid Pod</a></h3>
        <p>Login to your pod via your pod provider + personal credentials.</p>
        <h3 class="req"><i class="material-icons arrow-bullet">chevron_right</i> Manage files in your pod</h3>
        <p>Upload, delete, and move files in your Solid Pod.</p>
        <h3 class="req"><i class="material-icons arrow-bullet">chevron_right</i> Query your pod (and SPARQL endpoints you specify)</h3>
        <p>
          Execute SPARQL queries over your pod and other accessible Solid Pods or
          SPARQL Endpoints.
        </p>
        <h3 class="req"><i class="material-icons arrow-bullet">chevron_right</i> Edit the privacy of files in your pod</h3>
        <p>
          Modify access controls for files and containers in your pod + notify
          others of the changes.
        </p>
        <h3 class="req">
          <i class="material-icons arrow-bullet">chevron_right</i> Coming soon: edit the profile information associated with your
          Pod/webId
        </h3>
        <p>
          Edit the personal data incorporated with your Solid Pod and/or your
          WebID.
        </p>
      </div>
    </div>
    
    <div class="item">
      <button class="dropdown-toggle" @click="toggleGuideDropdown">
        <h2 class="guide" style="display:inline;">Guides:</h2>
        <i class="material-icons dropdown-arrow">
          {{ guidedropdownOpen ? "keyboard_arrow_down" : "chevron_right" }}</i>
      </button>
      <div v-if="guidedropdownOpen" class="dropdown-content">
        ...
      </div>
    </div>


  </div>


</template>

<script lang="ts">
import { getPublicDefaultAccess } from "@inrupt/solid-client";
import { handleRedirectAfterPageLoad, isLoggedin } from "./login";
import PodLogin from "./PodLogin.vue";
import PodRegistration from "./PodRegistration.vue";

export default {
  components: {
    PodLogin,
    PodRegistration,
  },
  props: {
    currPod: String,
  },
  data: () => ({
    login_status: true as boolean,
    visualUrl: new URL('../assets/full-sc-logo-nb.png', import.meta.url).href as string,
    infodropdownOpen: false as boolean,
    guidedropdownOpen: false as boolean,
  }),
  methods: {
    toggleInfoDropdown() {
      this.infodropdownOpen = !this.infodropdownOpen;
    },
    toggleGuideDropdown() {
      this.guidedropdownOpen = !this.guidedropdownOpen;
    },
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

.guide {
  text-align: Left;
}

.req {
  margin-top: 10px;
  font-size: 12pt;
}

.detail {
  font-size: 0.9em;
}

p {
  font-size: 11pt;
  margin-left: 2.5rem;
  margin-bottom: 15px;
}

body {
  line-height: 1.6;
  margin: 15px;
  background-color: #28353e;
}

code {
  background: #28353e;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}

pre {
  padding-left: 10px;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

ul,
ol {
  margin-left: 20px;
  margin-bottom: 15px;
  margin-top: 5px;
}

ol li {
  margin-bottom: 10px;
  margin-left: 20px;
  list-style-type: upper-roman;
  align-items: Left;
}

a {
  color: #86b2df;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
.content-container {
  min-width: auto;
}
.container {
  font-family: "Oxanium", monospace;
  max-width: 100%;
  margin: 0 1rem;
  padding: 1rem;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Dropdown style */
.dropdown-toggle {
  background: #28353e;
  border: 1px solid #ede7f6;
  color: #ede7f6;
  font-family: "Oxanium", monospace;
  font-size: 12pt;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dropdown-toggle:hover {
  background: #37474f;
  color: #fff;
}
.dropdown-arrow {
  font-size: 1.5em;
  margin-left: 0.5em;
  color: #ede7f6;
}
.dropdown-content {
  margin-top: 0.5rem;
  background: #37474f;
  border-radius: 8px;
  padding: 0.2rem 0.5rem;
  color: #ede7f6;
  box-shadow: 0 1px 8px rgba(0,0,0,0.10);
}
.arrow-bullet {
  font-size: 1.1em;
  color: #ede7f6;
  margin-right: 0.5em;
  vertical-align: middle;
}
</style>
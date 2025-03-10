<template>
  <v-container class="content-container">
    <v-col cols="12">
      <div class="logo-container">
        <img
          :src="require('../assets/full-sc-logo-nb.png')"
          alt="Full Solid Cockpit logo"
        />
      </div>

    </v-col>
  </v-container>

  <div>
    <pod-login />
  </div>

  <div class="pod-reg">
    <pod-registration />
  </div>

  <body>
    <!-- TODO: Make these drop downs (with more in-depth guides for non-experts) -->
    <div class="container" >
      <h2 class="guide">What can this application do?</h2>

      <hr />

      <h3 class="req">1. Connect to your <a href="https://solidproject.org/">Solid Pod</a></h3>

      <p>Login to your pod via your pod provider + personal credentials.</p>

      <hr />

      <h3 class="req">2. Manage files in your pod</h3>
      <p>Upload, delete, and move files in your Solid Pod.</p>

      <hr />

      <h3 class="req">3. Query your pod (and SPARQL endpoints you specify)</h3>
      <p>
        Execute SPARQL queries over your pod and other accessible Solid Pods or
        SPARQL Endpoints.
      </p>

      <hr />

      <h3 class="req">4. Edit the privacy of files in your pod</h3>
      <p>
        Modify access controls for files and containers in your pod + notify
        others of the changes.
      </p>

      <hr />

      <h3 class="req">
        5. Coming soon: edit the profile information associated with your
        Pod/webId
      </h3>
      <p>
        Edit the personal data incorporated with your Solid Pod and/or your
        WebID.
      </p>
    </div>
  </body>
</template>

<script>
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
    login_status: true,
  }),
  methods: {
    async credentials() {
      handleRedirectAfterPageLoad();
    },
    loggedIn() {
      return isLoggedin();
    },
    mounted() {
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
  height: auto;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.pod-reg {
  background-color: #445560;
  border-radius: 8px;
  max-width: 80%;
  margin: auto;
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
}

.detail {
  font-size: 0.9em;
}

p {
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
  max-width: 84%;
  margin: auto;
  padding: 20px;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>

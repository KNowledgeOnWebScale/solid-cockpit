<template>
  <v-container>
    <v-col cols="12">
      <v-card
        variant="tonal"
        justify="center"
        class="mx-auto"
        color="blue-grey-darken-1"
      >
        <div class="entry">
          <h1>Welcome to Solid Cockpit!</h1>
          <h2>Below are some resources for setting up a Solid Pod <br /> (if you don't already have one)</h2>
          <!-- Make these drop downs (with more in-depth guides for non-experts)-->
          <h3>Hosting service (SolidCommunity.net etc)</h3>
          <h3>Community Solid Server (local Solid pod)</h3>
        </div>
      </v-card>
    </v-col>
  </v-container>

  <body>
    <div class="container">
      <h1 class="guide">What can this application do?</h1>
      
      <hr />

      <h2 class="req">1. Connect to your Pod</h2>
      
      <p>Login to your pod via your pod provider + personal credentials.</p>

      <hr />

      <h2 class="req">2. Manage files in your pod</h2>
      <p>
        Upload, delete, and move files in your Solid Pod.
      </p>

      <hr />

      <h2 class="req">3. Query your pod (and SPARQL endpoints you specify)</h2>
      <p>
        Execute SPARQL queries over your pod and other accessible Solid Pods or SPARQL Endpoints.
      </p>

      <hr />

      <h2 class="req">4. Edit the privacy of files in your pod</h2>
      <p>
        Modify access controls for files and containers in your pod + notify others of the changes.
      </p>

      <hr />

      <h2 class="req">5. Coming soon: edit the profile information associated with your Pod/webId</h2>
      <p>
        Edit the personal data incorporated with your Solid Pod and/or your WebID.
      </p>

    </div>
  </body>
</template>

<script>
import { handleRedirectAfterPageLoad, isLoggedin } from "./login";

export default {
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
.entry {
  font-family: "Courier New", monospace;
  text-align: center;
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

.container {
  font-family: "Courier New", monospace;
  max-width: 900px;
  margin: auto;
  padding: 20px;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>

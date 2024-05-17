<template>
  <v-container>
    <v-col cols="12">
      <v-card
        variant="tonal"
        justify="center"
        class="mx-auto"
        color="indigo-darken-3"
      >
        <div class="entry">
          <h1>Welcome to the TRIPLE App!</h1>
          <h2>Below is a guide to get you started.</h2>
          <h3>(Similar instructions found in the README)</h3>
        </div>
      </v-card>
    </v-col>
  </v-container>

  <body>
    <div class="container">
      <h1 class="guide">Getting Started:</h1>
      <hr />

      <h2 class="req">Requirements:</h2>
      <ul>
        <li>
          <a href="https://nodejs.org/en/">Node.js</a>
        </li>
        <li><a href="https://www.npmjs.com/package/download">npm</a></li>
        <li><a href="https://git-scm.com/downloads">git</a></li>
      </ul>
      <hr />

      <h2 class="req">1. Repo Cloning and Starting your local Solid pod</h2>
      <ol>
        <li>
          Clone the project git repo (it has some useful scripts for later).<br />For
          help see
          <a
            href="https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository"
            >it clone guide.</a
          >
        </li>
      </ol>
      <pre><code>$ git clone https://github.com/ecrum19/TRIPLE_App.git</code></pre>
      <ol start="2">
        <li>To start pod set-up, execute the following command:</li>
      </ol>
      <pre><code>$ bash makePod.sh</code></pre>

      <hr />

      <h2>2. Setting up the Solid pod</h2>
      <ol>
        <li>
          Using a web browser navigate to
          <a href="http://localhost:3000/">http://localhost:3000/</a>
        </li>
        <li>Click the link: "Sign up for an account"</li>
        <li>Fill out the fields and click "Register"</li>
        <li>On the "Your Account" page, click on "Create pod"</li>
        <li>Enter a name for the pod and click "Create pod"</li>
        <li>Return to the home page by clicking "Back"</li>
      </ol>
      <p>
        Voila, you now have a pod hosted by your local machine. Now, let us add
        something to it!
      </p>

      <h4>Launching the TRIPLE App</h4>
      <ol>
        <li>First install all dependencies:</li>
      </ol>
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
        console.log(this.login_status);
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

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 15px;
  background-color: #f4f4f4;
}

code {
  background: #f4f4f4;
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
  color: #0066cc;
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
  background: #d0e0fc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>

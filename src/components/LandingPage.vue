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
            >git clone guide.</a
          >
        </li>
      </ol>
      <pre><code>$ git clone https://github.com/ecrum19/TRIPLE_App.git</code></pre>
      <ol start="2">
        <li>
          To start pod set-up, within the TRIPLE_App/ directory execute the
          following command:
        </li>
      </ol>
      <pre><code>$ bash makePod.sh</code></pre>

      <hr />

      <h2 class="req">2. Setting up the Solid pod</h2>
      <ol>
        <li>
          Using a web browser navigate to
          <b><a href="http://localhost:3000/" target="_blank">http://localhost:3000/</a></b>
        </li>
        <li>Either <b><a href="http://localhost:3000/.account/login/password/register/" target="_blank">"Sign up"</a></b> or 
          <b><a href="http://localhost:3000/.account/login/password/" target="_blank">"Login"</a></b></li>
        <li>Once on the <b>"Your Account"</b> page, click on <b>"Create pod"</b></li>
        <li>Enter a name for the pod and click <b>"Create pod"</b></li>
        <li>Return to the home page by clicking <b>"Back"</b></li>
      </ol>
      <p>
        <b>Voila</b>, now you a pod! <strong>Time to return to the command line </strong>(briefly).<br />
        <span class="detail">
          (Please note that if the terminal window you executed the bash script [in step <b>1</b>-II] is terminated, 
          the Solid pod will no longer be accessible until it is re-launched (return to step <b>1</b>-II). 
          For more info see
          <a
            href="https://communitysolidserver.github.io/CommunitySolidServer/latest/"
            >Community Solid Server Documentation</a
          >.)
        </span>
      </p>

      <hr />

      <h2 class="req">3. Register your Pod on your new WebID</h2>
      <ol>
        <li>Within the TRIPLE_App/ directory, execute the command below:</li>
        <pre><code>$ bash podRegistration.sh</code></pre>
        <li>At the prompt, enter the name of your pod from above (E.g. test)</li>
      </ol>
      <p>
        Great, now <strong>we are finished with set-up!!</strong> 
        Return to the 
        <a href="https://ecrum19.github.io/TRIPLE_App/">Triple App</a> 
        for the next steps.<br />
      </p>
      <hr />

      <h2 class="req">4. Solid Pod Login within the TRIPLE App</h2>
      <ol>
        <li>
          Click the <b>"Data Upload"</b> tab in the nav bar within the TRIPLE
          App
        </li>
        <li>
          If you followed the above sections to launch a local Solid Pod, simply
          click the <b>"Login"</b> button that appears (because your pod provider is localhost:3000)
        </li>
        <li>After the redirect, click the <b>"Authorize"</b> button</li>
        <li>
          Once redirected back to the main page of the TRIPLE App, use the nav
          bar to select the <b>"Data Upload"</b> tab
        </li>
      </ol>

      <hr />

      <h2 class="req">5. Data Upload Functionality</h2>
      <ol>
        <li>Click the <b>"Data Upload"</b> tab of the nav bar above</li>
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

.detail {
  font-size: 0.9em;
}

p {
  margin-bottom: 15px;
}

body {
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

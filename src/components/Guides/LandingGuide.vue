<template>
  <div class="container">
    <div class="item">
      <button class="dropdown-toggle" @click="toggleInfoDropdown">
        <h2 class="guide" style="display: inline">
          What can this application do?
        </h2>
        <i class="material-icons dropdown-arrow">
          {{ infodropdownOpen ? "keyboard_arrow_down" : "chevron_right" }}</i
        >
      </button>
      <div v-if="infodropdownOpen" class="dropdown-content">
        <h3 class="req">
          <i class="material-icons arrow-bullet">chevron_right</i> Connect to
          your <a href="https://solidproject.org/">Solid Pod</a>
        </h3>
        <p>Login to your pod via your pod provider + personal credentials.</p>
        <h3 class="req">
          <i class="material-icons arrow-bullet">chevron_right</i> Manage files
          in your pod
        </h3>
        <p>Upload, delete, and move resources in your Solid Pod.</p>
        <h3 class="req">
          <i class="material-icons arrow-bullet">chevron_right</i> Query your
          pod (and SPARQL endpoints you specify)
        </h3>
        <p>
          Execute SPARQL queries over your pod and other accessible Solid Pods
          and/or SPARQL Endpoints.
        </p>
        <h3 class="req">
          <i class="material-icons arrow-bullet">chevron_right</i> Edit the
          privacy of files in your pod
        </h3>
        <p class="middle-line">
          Modify access controls of containers and resources in your pod +
          notify others of the changes.
        </p>
        <p class="middle-line">
          Save query and results to a query cache in your pod
        </p>
        <p class="last-line">
          Share queries and results from your query cache and improve query
          performance with the cache
        </p>
      </div>
    </div>

    <div class="item">
      <button class="dropdown-toggle" @click="toggleGuideDropdown">
        <h2 class="guide" style="display: inline">Guides:</h2>
        <i class="material-icons dropdown-arrow">
          {{ guidedropdownOpen ? "keyboard_arrow_down" : "chevron_right" }}</i
        >
      </button>
      <div v-if="guidedropdownOpen" class="dropdown-content">
        <div class="guide-item">
          <button class="dropdown-toggle" @click="toggleWaysToGetPod">
            <h3>Ways to Get a Solid Pod:</h3>
            <i class="material-icons dropdown-arrow">
              {{
                waysToGetPodOpen ? "keyboard_arrow_down" : "chevron_right"
              }}</i
            >
          </button>
          <div v-if="waysToGetPodOpen" class="pod-prov">
            <ul>
              <li>
                <a
                  href="https://communitysolidserver.github.io/CommunitySolidServer/latest/"
                  target="_blank"
                  rel="noopener"
                  >Community Solid Server</a
                >: For hosting a Solid Pod on your local machine or on a custom
                server.
              </li>
              <li>
                <a
                  href="https://solidcommunity.net/"
                  target="_blank"
                  rel="noopener"
                  >Solidcommunity.net</a
                >: A community-run Solid server (very easy).
              </li>
              <li>
                <a
                  href="https://solidproject.org/for-developers#hosted-pod-services"
                  target="_blank"
                  rel="noopener"
                  >Other Solid Pod Hosting Services</a
                >: A catalogue of other services that offer Solid Pod hosting.
              </li>
            </ul>
          </div>
        </div>

        <div class="guide-item">
          <button class="dropdown-toggle" @click="toggleTripleGuide">
            <h3>TRIPLE Guide</h3>
            <i class="material-icons dropdown-arrow">
              {{ tripleGuideOpen ? "keyboard_arrow_down" : "chevron_right" }}</i
            >
          </button>
          <div v-if="tripleGuideOpen" class="triple-content">
            <p class="last-line">
              Welcome to the TRIPLE Getting Started Guide! This document will
              help you set up a Solid Pod and introduce you to the features of
              the Solid Cockpit app. Follow the steps carefully to get up and
              running 🚀
            </p>

            <div class="triple-item">
              <button class="dropdown-toggle" @click="toggleObjectives">
                <h4>🎯 Objectives of This Guide</h4>
                <i class="material-icons dropdown-arrow">
                  {{
                    objectivesOpen ? "keyboard_arrow_down" : "chevron_right"
                  }}</i
                >
              </button>
              <div v-if="objectivesOpen">
                <ol>
                  <li>
                    Setting up a Solid Pod (that is accessible via the internet)
                  </li>
                  <li>
                    Logging into your Pod at any time (after setting it up)
                  </li>
                  <li>
                    Understanding the features and functionalities of the Solid
                    Cockpit app.
                  </li>
                  <li>
                    Overview of future capabilities, such as managing pod
                    contents, adjusting data privacy, and querying data using
                    SPARQL.
                  </li>
                </ol>
              </div>
            </div>

            <div class="triple-item">
              <button class="dropdown-toggle" @click="toggleSetupPod">
                <h4>🌐 Setting Up a Solid Pod (Online)</h4>
                <i class="material-icons dropdown-arrow">
                  {{
                    setupPodOpen ? "keyboard_arrow_down" : "chevron_right"
                  }}</i
                >
              </button>
              <div v-if="setupPodOpen">
                <p>
                  To <strong>set up</strong> your Solid Pod using the TRIPLE
                  platform, follow these steps:
                </p>
                <ol>
                  <li>
                    <strong
                      >🔗 Navigate to our Solid Pod Hosting website</strong
                    >
                    <p>
                      Go to
                      <a
                        href="https://triple.ilabt.imec.be/"
                        target="_blank"
                        rel="noopener"
                        >https://triple.ilabt.imec.be/</a
                      >
                    </p>
                    <p>Use the following credentials to enter the site:</p>
                    <ul>
                      <li><strong>Password</strong>: <code>triple</code></li>
                    </ul>
                  </li>
                  <li>
                    <strong>🔐 Sign Up to make a Pod</strong>
                    <p>
                      Click <strong>Sign Up</strong> (assuming this is your
                      first time)
                    </p>
                  </li>
                  <li>
                    <strong>🛠️ Create Your Solid Pod</strong>
                    <p>
                      Once you are on the <strong>Your Account</strong> page,
                      click on <strong>Create Pod</strong>.
                    </p>
                    <p>
                      Enter a name for your new pod and click
                      <strong>Create Pod</strong>.
                    </p>
                    <p>
                      After creating your pod, return to the home page by
                      clicking
                      <strong>Back</strong>.
                    </p>
                  </li>
                </ol>
              </div>
            </div>

            <div class="triple-item">
              <button class="dropdown-toggle" @click="toggleLoginPod">
                <h4>🔑 Logging into your Solid Pod (after creation)</h4>
                <i class="material-icons dropdown-arrow">
                  {{
                    loginPodOpen ? "keyboard_arrow_down" : "chevron_right"
                  }}</i
                >
              </button>
              <div v-if="loginPodOpen">
                <ol>
                  <li>
                    <strong>Navigate to our Solid Pod Hosting website</strong>
                    <p>
                      Go to
                      <a
                        href="https://triple.ilabt.imec.be/"
                        target="_blank"
                        rel="noopener"
                        >https://triple.ilabt.imec.be/</a
                      >
                    </p>
                    <p>Use the following credentials to enter the site:</p>
                    <ul>
                      <li><strong>Password</strong>: <code>triple</code></li>
                    </ul>
                  </li>
                  <li>
                    <strong>Login using your credentials</strong>
                    <p>
                      Click <strong>Login</strong> (assuming you have already
                      made an account)
                    </p>
                  </li>
                  <li>
                    <strong>Register your Pod on your new WebID card</strong>
                    <p>
                      Navigate to the "Home" page of the
                      <a
                        href="https://knowledgeonwebscale.github.io/solid-cockpit/home"
                        target="_blank"
                        rel="noopener"
                        >Solid-Cockpit Webpage</a
                      >
                    </p>
                    <p>
                      Login to your Solid Pod using the
                      "https://triple.ilabt.imec.be/" provider
                    </p>
                    <p>
                      CLICK the "REGISTER POD" button (not necessary to enter
                      any PodURL)
                    </p>
                    <p>Thats it. Now you are connected to your new Pod!!</p>
                  </li>
                </ol>
              </div>
            </div>

            <div class="triple-item">
              <button class="dropdown-toggle" @click="toggleUsingApp">
                <h4>🛫 Using the Solid Cockpit App</h4>
                <i class="material-icons dropdown-arrow">
                  {{
                    usingAppOpen ? "keyboard_arrow_down" : "chevron_right"
                  }}</i
                >
              </button>
              <div v-if="usingAppOpen">
                <p>
                  The Solid Cockpit app provides several functionalities for
                  managing and interacting with your Solid Pod.
                </p>

                <button
                  class="dropdown-toggle"
                  @click="toggleAvailableFeatures"
                >
                  <h5>✨ Available Features</h5>
                  <i class="material-icons dropdown-arrow">
                    {{
                      availableFeaturesOpen
                        ? "keyboard_arrow_down"
                        : "chevron_right"
                    }}</i
                  >
                </button>
                <div v-if="availableFeaturesOpen">
                  <ol>
                    <li>
                      <strong>📝 Data Upload</strong>
                      <p>Upload data to your Pod.</p>
                      <p>
                        When uploading RDF data, file validity can be assessed
                        before uploading.
                      </p>
                      <p>Specify and modify the metadata of uploaded files.</p>
                    </li>
                    <li>
                      <strong>🗂️ Data Browser</strong> (under construction)
                      <p>
                        View, modify, move, and delete the contents of your Pod.
                      </p>
                      <p>
                        Explore and edit the container structure of your Pod.
                      </p>
                    </li>
                    <li>
                      <strong>🔍 Data Query</strong>
                      <p>
                        An editor to write SPARQL queries to interact with data
                        in your Pod, the Pods of others, and SPARQL Endpoints.
                      </p>
                      <p>
                        A user input to designate the sources for the queries.
                      </p>
                      <p>
                        Options that impact the the output formats, query
                        execution, and other relevant parameters.
                      </p>
                    </li>
                    <li>
                      <strong>🔒 Data Privacy Management</strong>
                      <p>
                        View the current privacy settings for your data (Read,
                        Write, and Append).
                      </p>
                      <p>
                        Add or change privacy settings to containers and
                        resources in your Pod.
                      </p>
                      <p>
                        Give and receive notifications related to new access
                        rights to the data of others.
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div class="triple-item">
              <button class="dropdown-toggle" @click="toggleNearFuture">
                <h4>🔮 In the Near Future</h4>
                <i class="material-icons dropdown-arrow">
                  {{
                    nearFutureOpen ? "keyboard_arrow_down" : "chevron_right"
                  }}</i
                >
              </button>
              <div v-if="nearFutureOpen">
                <ul>
                  <li>
                    Improve the functionality of the Pod Browser for displaying
                    pod contents effectively.
                  </li>
                  <li>
                    Ability to query using the SIB SPARQL Editor (with
                    auto-complete + class visualization + example queries)
                  </li>
                  <li>
                    Enhance privacy management display ++ include
                    sharedWithMe.ttl // sharedWithOthers.ttl
                  </li>
                </ul>
              </div>
            </div>
            <div class="triple-item">
              <button class="dropdown-toggle" @click="toggleSupport">
                <h4>🤝 Support and Further Information</h4>
                <i class="material-icons dropdown-arrow">
                  {{ supportOpen ? "keyboard_arrow_down" : "chevron_right" }}</i
                >
              </button>
              <div v-if="supportOpen">
                <p>
                  If you encounter issues during setup or usage, please consult
                  our support resources or reach out to our support team for
                  assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data: () => ({
    infodropdownOpen: false as boolean,
    guidedropdownOpen: false as boolean,
    waysToGetPodOpen: false as boolean,
    tripleGuideOpen: false as boolean,
    objectivesOpen: false as boolean,
    setupPodOpen: false as boolean,
    loginPodOpen: false as boolean,
    usingAppOpen: false as boolean,
    availableFeaturesOpen: false as boolean,
    nearFutureOpen: false as boolean,
    supportOpen: false as boolean,
  }),
  methods: {
    toggleInfoDropdown() {
      this.infodropdownOpen = !this.infodropdownOpen;
    },
    toggleGuideDropdown() {
      this.guidedropdownOpen = !this.guidedropdownOpen;
    },
    toggleWaysToGetPod() {
      this.waysToGetPodOpen = !this.waysToGetPodOpen;
    },
    toggleTripleGuide() {
      this.tripleGuideOpen = !this.tripleGuideOpen;
    },
    toggleObjectives() {
      this.objectivesOpen = !this.objectivesOpen;
    },
    toggleSetupPod() {
      this.setupPodOpen = !this.setupPodOpen;
    },
    toggleLoginPod() {
      this.loginPodOpen = !this.loginPodOpen;
    },
    toggleUsingApp() {
      this.usingAppOpen = !this.usingAppOpen;
    },
    toggleAvailableFeatures() {
      this.availableFeaturesOpen = !this.availableFeaturesOpen;
    },
    toggleNearFuture() {
      this.nearFutureOpen = !this.nearFutureOpen;
    },
    toggleSupport() {
      this.supportOpen = !this.supportOpen;
    },
  },
};
</script>

<style scoped>
.item {
  background-color: var(--panel);
  border-radius: 6px;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 3px solid var(--border);
}
.guide {
  text-align: Left;
}
.req {
  margin-top: 10px;
  font-size: 15pt;
}
p {
  font-size: 13pt;
  margin-left: 2.5rem;
}
.middle-line {
  margin-top: 0;
  margin-bottom: 0;
}
.last-line {
  margin-bottom: 15px;
}
body {
  line-height: 1.6;
  margin: 15px;
  background-color: var(--panel);
}
code {
  background: var(--bg);
  color: var(--text-secondary);
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
  color: var(--primary);
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
  padding: 0.5rem 1rem;
  background: var(--panel);
  border-radius: 10px;
  box-shadow: var(--shadow-1);
}
.guide-item {
  border-radius: 6px;
  border: 1px solid var(--border);
  margin: 0 0 0.5rem 0;
}
.triple-content {
  padding: 0 0.5rem;
}
.triple-item {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  margin: 0 0 0.5rem 0;
}
/* Dropdown style */
.dropdown-toggle {
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 12pt;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dropdown-toggle:hover {
  background: var(--muted);
  color: var(--text-secondary);
}
.dropdown-arrow {
  font-size: 1.5em;
  margin-left: 0.5em;
  color: var(--text-secondary);
}
.dropdown-content {
  margin: 0 0 0.5rem 0;
  background: var(--panel);
  border-radius: 6px;
  padding: 0.5rem 0.5rem;
  color: var(--text-secondary);
}
.arrow-bullet {
  font-size: 1.1em;
  color: var(--text-secondary);
  margin-right: 0.5em;
  vertical-align: middle;
}
.pod-prov li {
  margin-left: 1.5rem;
  padding: 0.5rem 0;
}
</style>

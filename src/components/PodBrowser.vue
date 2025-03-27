<template>
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
    rel="stylesheet"
  />
  <!-- Title bar -->
  <div class="title-container">
    <span>Pod Data Browser</span>
  </div>

  <div class="pod-chooseContainer">
    <PodRegistration @pod-selected="handlePodSelected" />
  </div>

  <body class="content-body">
    <div class="container-location" v-if="currentPod !== ''">
      <div class="nav-container">
        <div class="path-selection">
          <ul>
            <li>
              <span><b>Current location:</b> </span>
            </li>
            <li>
              <span class="current-location">{{ currentLocation }}</span>
            </li>
            <!-- Browse existing path -->
            <li class="container-choose">
              <container-nav
                :currentPod="currentPod"
                @path-selected="handleSelectedContainer"
              />
            </li>
            <li>
              <button
                @click="getItems(displayPath)"
                class="icon-button right"
              >
                <i class="material-icons not-colored right">refresh</i>
                <v-tooltip activator="parent" location="end"
                  >Refresh directory contents
                </v-tooltip>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="pod-directories">
        <div class="container-fluid">
          <div class="items-label">
            <span><b>Items:</b></span>
          </div>
          <ul>
            <!-- Iterates over list of containers in a pod -->
            <li v-for="(url, index) in urls" :key="index">
              <div class="card-panel folder">
                <i class="material-icons not-colored left">{{
                  containerCheck(url) ? "folder" : "description"
                }}</i>
                {{ url }}
                <button
                  @click="toggleInfo(index), getItemInfo(url)"
                  class="icon-button right"
                >
                  <i class="material-icons not-colored right">
                    {{
                      showInfoIndex === null
                        ? "chevron_right"
                        : "keyboard_arrow_down"
                    }}</i
                  >
                </button>

                <!--TODO: Item Info -->
                <div v-if="showInfoIndex === index" class="form-container">
                  <!-- TODO: Edit Data (rename / delete) -->
                  <!-- TODO: If RDF data: provide an RDF editor -->
                  <div class="info-display">
                    <li>Source IRI: {{ info.sourceIri }}</li>
                    <li>Type: {{ info.linkedResources.type }}</li>
                    <li>
                      Described By: {{ info.linkedResources.describedby }}
                    </li>
                  </div>
                  <div class="edit-delete">
                    <button
                      @click="confirmAndDelete(info.sourceIri)"
                      class="delete-button"
                      :disabled="deletionSuccess"
                    >
                      Delete
                    </button>
                    <button @click="toggleForm(index)" class="edit-button">
                      Edit ...
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </body>

  <div class="use-guide">
    <!-- TODO: Make these drop downs (with more in-depth guides for non-experts) -->
    <div class="guide-container">
      <h2 class="guide">Pod Browser Guide</h2>

      <hr class="line" />
      <ol class="list-container">
        <li class="req">Select the Pod you want to Browse.</li>

        <li class="req">Navigate to the directory you want to browse.</li>

        <li class="req">
          Click the <i class="material-icons not-colored">chevron_right</i> to
          see resource information.
        </li>

        <li class="req">
          Future work: Graphical browser (as an interactive knowledge graph) /
          Data Deletion / RDF data + Metadata editing (with syntax checking) /
          View filtering / Search bar (for quick searching)
        </li>
      </ol>
    </div>
  </div>
</template>

<script lang="ts">
import { currentWebId } from "./login";
import { fetchData, WorkingData } from "./getData";
import { deleteFromPod, deleteContainer } from "./fileUpload";
import { getContainedResourceUrlAll } from "@inrupt/solid-client";
import ContainerNav from "./ContainerNav.vue";
import PodRegistration from "./PodRegistration.vue";

interface info {
  sourceIri: string;
  linkedResources: {
    type: string;
    describedby: string;
  };
}

export default {
  components: {
    ContainerNav,
    PodRegistration,
  },
  data() {
    return {
      loggedIn: false,
      webId: "",
      currentPod: "",
      displayPath: "",
      currentLocation: "",
      showInfoIndex: null as number | null,
      showEditIndex: null as number | null,
      podData: null,
      urls: [] as string[],
      dirContents: null as WorkingData | null,
      containerContents: null as WorkingData | null,
      info: null as info | null,
      containerUrls: [] as string[],
      resourceUrls: [] as string[],
      container: [] as string[],
      queryItems: null as WorkingData | null,
      deletionSuccess: false as boolean,
    };
  },
  methods: {
    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
    },

    /*
    Calls executeQuery from queryPod.ts to obtain all data from logged-in user's Pod.
    Obtains items variable (IRIs of all Pod data).
    */
    // COOL IDEA --> << Interactable Knowledge graph (with tabular display toggle) >>
    async podContentsQuery() {
      this.queryItems = null;
    },

    /*
    TODO: Filters the binding stream to show only useful stuff...
    */
    filteredItems() {
      // not sure
    },

    /**
     * Displays a confirmation pop-up before deleting a resource.
     * If the user confirms, calls deleteResource.
     * If the user cancels, does nothing.
     *
     * @param fileUrl The URL of the resource to delete.
     */
    confirmAndDelete(fileUrl: string) {
      const userConfirmed = window.confirm(
        "Are you sure you want to delete this resource? This action cannot be undone."
      );

      if (userConfirmed) {
        this.deleteResource(fileUrl);
      } else {
        console.log("Deletion canceled by the user.");
      }
    },

    /*
    Deleted the resource at the given URL.
    TODO: Add protections/recursion for deleting containers ...
    */
    async deleteResource(fileUrl: string) {
      this.deletionSuccess = true;
      try {
        // for container deletion
        if (fileUrl.endsWith("/")) {
          this.deletionSuccess = await deleteContainer(fileUrl);
          this.urls = this.urls.filter((url) => url !== fileUrl);
          await this.getItems(this.displayPath);
        } else {
          this.deletionSuccess = await deleteFromPod(fileUrl);
        }

        if (this.deletionSuccess) {
          this.urls = this.urls.filter((url) => url !== fileUrl);
          await this.getItems(this.displayPath);
        } else {
          this.deletionSuccess = false;
          console.error(`Failed to delete resource: ${fileUrl}`);
        }
      } catch (error) {
        this.deletionSuccess = false;
        console.error(`Error deleting resource: ${fileUrl}`, error);
      } finally {
        this.deletionSuccess = false;
      }
    },

    async getItems(path: string) {
      try {
        this.dirContents = await fetchData(path); // value is SolidDataset
        this.urls = getContainedResourceUrlAll(this.dirContents);
        this.separateUrls();
      } catch (e) {
        console.error("Could not fetch data info from the URL provided...");
      }
    },

    async getItemInfo(path: string) {
      this.dirContents = await fetchData(path);
      this.info = this.dirContents.internal_resourceInfo;
    },

    /*
    Checks if the input item url is a container
    */
    containerCheck(itemUrl: string) {
      return itemUrl.endsWith("/");
    },
    /**
     * Sorts container URLs and resource URLs into different lists
     */
    separateUrls() {
      this.containerUrls = this.urls.filter((url: string) => url.endsWith("/"));
      this.resourceUrls = this.urls.filter((url: string) => !url.endsWith("/"));
      if (
        this.currentLocation === this.currentPod &&
        !this.urls.includes(this.currentPod)
      ) {
        this.urls.push(this.currentPod);
        this.containerUrls.push(this.currentPod);
      }
      this.urls = this.urls.sort((a: string, b: string) => a.length - b.length);
      this.container = this.urls.sort(
        (a: string, b: string) => a.length - b.length
      );
      this.resourceUrls = this.urls.sort(
        (a: string, b: string) => a.length - b.length
      );
    },

    /*
    Two methods for controlling the UI
    */
    toggleForm(index: number) {
      if (this.showEditIndex === index) {
        this.showEditIndex = null; // Hide the form if it's already shown
      } else {
        this.showEditIndex = index; // Show the form for the clicked item
      }
    },
    toggleInfo(index: number) {
      if (this.showInfoIndex === index) {
        this.showInfoIndex = null; // Hide the form if it's already shown
      } else {
        this.showInfoIndex = index; // Show the form for the clicked item
      }
    },
    /* Takes in the emitted value from PodRegistration.vue */
    handlePodSelected(selectedPod: string) {
      this.currentPod = selectedPod;
      this.displayPath = this.currentPod;
      this.getItems(this.displayPath);
    },
    /* Takes in the emitted value from ContainerNav.vue */
    handleSelectedContainer(selectedContainer: string) {
      this.displayPath = selectedContainer;
      this.getItems(this.displayPath);
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
  },
};
</script>

<style scoped>
body {
  background-color: #a9a7ad;
  font-size: 13px;
  border-radius: 6px;
}
.content-body {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  border-radius: 6px;
}

/* Title bar */
.title-container {
  background-color: #445560;
  border-radius: 8px;
  margin: 0.5rem 0.5rem;
}
.title-container span {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  padding-left: 20px;
  padding-right: 20px;
}

/* General container */
.container-location {
  padding: 1rem 0.5rem;
  background-color: #445560;
  border-radius: 8px;
  margin: 0rem 0.5rem 0rem 0.5rem;
}

/* Container pod-chooser bar */
.container-choose {
  width: 100%;
}
.pod-chooseContainer {
  background: #445560;
  border-radius: 8px;
  margin: 0rem 0.5rem;
}
.container-location .nav-container {
  display: flex;
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  min-width: fit-content;
}

/* Container for directory navigation */
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.nav-container ul {
  list-style-type: none;
  padding: 10px;
  height: 100%;
  overflow: auto;
}
.path-selection {
  display: flex;
  align-items: center;
  list-style-type: none;
  width: 100%;
}
.path-selection ul {
  display: flex;
  list-style: none; /* Remove bullet points */
  padding: 0;
  margin: 0;
  width: 100%;
  justify-content: space-between; /* Spread list items across full width */
  align-items: center;
}
.path-selection li {
  margin-right: 10px; /* Add some spacing between list items */
  white-space: nowrap; /* Prevent wrapping */
}
.path-selection span {
  font-size: 18pt;
  font-family: "Oxanium", monospace;
  font-weight: 400;
  margin-left: 0.5rem;
}
.container-choose {
  margin-left: auto; /* Push the container selector to the right */
  box-shadow: none;
}
.dir-nav {
  background-color: #445560;
  border-radius: 6px;
  display: flex;
  align-items: center;
  box-shadow: none;
}

/* data display */
.items-label span {
  font-family: "Oxanium", monospace;
  font-weight: 400;
  font-size: 18pt;
  margin-left: 0.5rem;
}
.pod-directories {
  flex: 1 1 auto;
  overflow-y: auto;
  scroll-behavior: smooth;
  max-height: 40em;
}
.card-panel {
  background-color: #28353e;
  margin: 0.2rem;
  padding: 1.7rem;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  border-radius: 6px;
  outline: 0.5px solid #ede7f6;
}
.card-panel:hover {
  outline: 0.1px solid #754ff6;
}
.delete-button:hover {
  background-color: #555;
  color: white;
}
.card-panel button:focus {
  background-color: transparent;
}
.folder i {
  margin-top: -2px;
}
.card-panel .not-colored {
  color: #ede7f6;
}

/* Delete button */
.delete-button {
  font-family: "Oxanium", monospace;
  padding: 0.75rem;
  margin: 0.5rem 0.5rem 0 0.5rem;
  color: #28353e;
  background-color: #ede7f6;
  border-radius: 5px;
}

/* The how to use guide */
.use-guide {
  margin: 0.5rem;
}
.guide-container {
  font-family: "Oxanium", monospace;
  font-size: 16pt;
  width: 100%;
  margin: auto;
  padding: 0.5rem 0rem 0.5rem 0.5rem;
  background: #445560;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.guide {
  text-align: Left;
  font-size: 18pt;
  margin: 0.5rem;
  font-weight: 600;
}
.line {
  margin-right: 0.5rem;
}
.list-container {
  margin: 0 1.5rem;
}
.req {
  margin: 1rem 0.5rem;
  font-size: 14pt;
  list-style-type: upper-roman;
  align-items: Left;
}
</style>

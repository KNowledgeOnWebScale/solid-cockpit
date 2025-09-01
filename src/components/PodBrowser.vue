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
              <button @click="getItems(displayPath)" class="icon-button right">
                <i class="material-icons not-colored right">refresh</i>
                <v-tooltip activator="parent" location="end"
                  >Refresh directory contents
                </v-tooltip>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- TODO: add an RDF editor for RDF data ...  -->
      <div class="pod-directories">
        <div class="container-fluid">
          <div class="items-label">
            <span><b>Items:</b></span>
          </div>
          <ul>
            <!-- Iterates over list of containers in a pod -->
            <li v-for="(url, index) in urls" :key="index">
              <div class="card-panel folder">
                <button
                  @click="toggleInfo(index, url)"
                  class="icon-button full-width"
                >
                  <div class="icon-hash">
                    <i class="material-icons not-colored left">{{
                      containerCheck(url) ? "folder" : "description"
                    }}</i>
                    {{ url }}
                  </div>
                  <div class="info-icon">
                    <i class="material-icons not-colored info-icon">
                    {{
                      showInfoIndex === index
                        ? "keyboard_arrow_down info"
                        : "chevron_right info"
                    }}</i
                  >
                  </div>
                  
                </button>

                <!-- Item Info -->
                <div v-if="showInfoIndex === index" class="item-info-container">
                  <div class="info-row">
                    <strong class="info-label">Source IRI:</strong>
                    <div class="info-value-container">
                      <span class="info-value iri" :title="info.sourceIri">{{
                        info.sourceIri
                      }}</span>
                      <button
                        @click="copyToClipboard(info.sourceIri)"
                        class="copy-button"
                      >
                        <i class="material-icons">content_copy</i>
                        <v-tooltip activator="parent" location="end"
                          >Copy IRI</v-tooltip
                        >
                      </button>
                    </div>
                  </div>
                  <div class="info-row">
                    <strong class="info-label">Type:</strong>
                    <span class="info-value">{{
                      containerCheck(url) ? "Container" : "Resource"
                    }}</span>
                  </div>
                  <div
                    class="info-row"
                    v-if="info && info.linkedResources.describedby"
                  >
                    <strong class="info-label">Metadata:</strong>
                    <div class="info-value-container">
                      <a
                        :href="info.linkedResources.describedby"
                        target="_blank"
                        class="info-value link"
                        :title="info.linkedResources.describedby"
                        >{{ info.linkedResources.describedby }}</a
                      >
                    </div>
                  </div>
                  <!-- TODO: figure out if this works and what edit does -->
                  <div class="edit-delete">
                    <button
                      @click="confirmAndDelete(info.sourceIri)"
                      class="delete-button"
                      :disabled="deletionSuccess"
                    >
                      Delete
                    </button>
                    <button @click="toggleForm(index, url)" class="delete-button">
                      Edit
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

  <PodBrowserGuide />
</template>

<script lang="ts">
import { currentWebId } from "./login";
import { fetchData, WorkingData } from "./getData";
import { deleteFromPod, deleteContainer } from "./fileUpload";
import { getContainedResourceUrlAll } from "@inrupt/solid-client";
import ContainerNav from "./ContainerNav.vue";
import PodRegistration from "./PodRegistration.vue";
import PodBrowserGuide from "./Guides/PodBrowserGuide.vue";

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
    PodBrowserGuide,
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
      newName: "" as string,
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
      const isContainer = fileUrl.endsWith("/");
      const message = isContainer
        ? "Are you sure you want to delete this container and all its contents? This action cannot be undone."
        : "Are you sure you want to delete this resource? This action cannot be undone.";

      const userConfirmed = window.confirm(message);

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

    // TODO: Strategy -->
    // Copy existing resource to an object
    // Delete existing resource
    // Upload resource object using new name / dir path
    async handleRename(sourceUrl: string) {
      if (!this.newName || this.newName.trim() === "") {
        alert("Please provide a new name.");
        return;
      }

      const isContainer = sourceUrl.endsWith("/");
      const url = new URL(sourceUrl);
      const path = url.pathname;
      const lastSlash = path.endsWith("/")
        ? path.slice(0, -1).lastIndexOf("/")
        : path.lastIndexOf("/");
      const parentPath = path.substring(0, lastSlash + 1);
      const destinationUrl =
        url.origin + parentPath + this.newName.trim() + (isContainer ? "/" : "");

      if (sourceUrl === destinationUrl) {
        this.showEditIndex = null;
        return; // Name hasn't changed
      }

      // try {
      //   await moveFile(sourceUrl, destinationUrl);
      //   alert("Resource renamed successfully!");
      //   this.showEditIndex = null;
      //   this.newName = "";
      //   await this.getItems(this.displayPath);
      // } catch (error) {
      //   console.error("Error renaming resource:", error);
      //   alert(`Failed to rename resource. See console for details: ${error}`);
      // }
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
    Copies text to the clipboard
    */
    copyToClipboard(text: string) {
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy: ", err);
      });
    },

    /*
    Two methods for controlling the UI
    */
    toggleForm(index: number, url: string) {
      if (this.showEditIndex === index) {
        this.showEditIndex = null; // Hide the form if it's already shown
      } else {
        this.showEditIndex = index; // Show the form for the clicked item
        const name = url.split("/").filter(Boolean).pop() || "";
        this.newName = name;
      }
    },
    toggleInfo(index: number, url: string) {
      if (this.showInfoIndex === index) {
        this.showInfoIndex = null; // Hide the form if it's already shown
      } else {
        this.showInfoIndex = index; // Show the form for the clicked item
        this.getItemInfo(url);
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
button:focus {
  background-color: transparent !important;
}

body {
  background-color: var(--bg);
  font-size: 13px;
  border-radius: 6px;
}
.content-body {
  display: flex;
  flex-direction: column;
  border-radius: 6px;
}

/* Title bar */
.title-container {
  background-color: var(--panel);
  border-radius: 8px;
  margin: 0.5rem 0.5rem;
}
.title-container span {
  font-size: 30pt;
  font-family: "Oxanium", monospace;
  font-weight: 500;
  padding-left: 20px;
  padding-right: 20px;
  color: var(--text-primary);
}

/* General container */
.container-location {
  padding: 1rem 0.5rem;
  background-color: var(--panel);
  border-radius: 8px;
  margin: 0.25rem 0.5rem 0rem 0.5rem;
}

/* Container pod-chooser bar */
.pod-chooseContainer {
  background: var(--panel);
  border-radius: 8px;
  margin: 0rem 0.5rem;
  padding: 0.2rem 0 0 1rem;
}

/* Container for directory navigation */
.nav-container {
  display: flex;
  border-radius: 8px;
  font-family: "Oxanium", monospace;
  justify-content: space-between;
  align-items: center;
}
.nav-container ul {
  list-style-type: none;
  padding: 10px;
  height: 100%;
  flex-wrap: wrap;
}
.path-selection {
  display: flex;
  align-items: center;
  list-style-type: none;
  width: 100%;
  color: var(--text-primary);
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
/* TODO: Fix the wrapping of this non-sense */
.path-selection li {
  margin-right: 10px; /* Add some spacing between list items */
  flex-wrap: wrap;
  font-family: "Oxanium", monospace;
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
  background-color: var(--panel);
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
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
  color: var(--text-primary);
}
.pod-directories {
  flex: 1 1 auto;
  overflow: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  height: 40em;
  min-height: 20em;
  resize: vertical;
}
.card-panel {
  background-color: var(--muted);
  margin: 0.2rem;
  padding: 1.7rem;
  font-family: "Oxanium", monospace;
  font-size: 14pt;
  border-radius: 6px;
  outline: 0.5px solid var(--text-muted);
}
.card-panel:hover {
  outline: 0.1px solid var(--primary);
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
  color: var(--text-muted);
}
.icon-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  width: 100%;
  padding: 0.5rem;
  border-radius: 5px;
  transition: background 0.3s;
}
.icon-hash {
  font-family: "Oxanium", monospace;
  color: var(--text-secondary);
}
.info-icon {
  margin-left: auto;
}

.item-info-container {
  background-color: var(--bg);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
  border: 1px solid var(--border);
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 12pt;
}

.info-label {
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 1rem;
  min-width: 100px;
}

.info-value-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.info-value {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-value.link {
  color: var(--primary);
  text-decoration: none;
}

.info-value.link:hover {
  text-decoration: underline;
}

.copy-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.copy-button .material-icons {
  color: var(--text-muted);
  font-size: 18px;
}

.copy-button:hover .material-icons {
  color: var(--primary);
}

/* Delete button */
.delete-button {
  font-family: "Oxanium", monospace;
  padding: 0.75rem;
  margin: 0.5rem 0.5rem 0 0.5rem;
  color: var(--panel-elev);
  background-color: var(--text-muted);
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

.edit-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}
.edit-input {
  flex-grow: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  background-color: var(--bg);
  color: var(--text-primary);
}
.edit-button {
  font-family: "Oxanium", monospace;
  padding: 0.5rem 1rem;
  color: var(--panel-elev);
  background-color: var(--primary);
  border-radius: 5px;
  border: none;
  cursor: pointer;
}
.edit-button.cancel {
  background-color: var(--text-muted);
}
</style>

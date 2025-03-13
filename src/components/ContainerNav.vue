<template>
  <nav class="dir-nav">
    <div class="directory-nav">
      <ul class="horizontal-list">
        <li>
          <span class="current-location">{{ currentLocation }}</span>
        </li>
        <li>
          <div class="select-dir">
            <v-select
              clearable
              variant="outlined"
              v-model="currentUrl"
              :items="childContainers(currentLocation, containerUrls)"
            ></v-select>
            <v-btn
              class="navigate-btn"
              :disabled="currentUrl === null"
              @click="changeCurrentLocation(currentUrl)"
              >Go</v-btn
            >
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
import { getContainedResourceUrlAll } from "@inrupt/solid-client";
import { WorkingData } from "./privacyEdit";
import { currentWebId } from "./login";
import { fetchData, fetchAclAgents } from "./getData";

export default {
  name: 'ContainerNav',
  props: {
    currentPod: String
  },
  data() {
    return {
      webId: "",
      dirContents: WorkingData,
      currentLocation: "",
      currentUrl: null,
      urls: [],
      containerUrls: [],
      resourceUrls: [],
      hasAccess: [],
    };
  },
  methods: {
    /**
     * method that returns a list of child container URLs from within a specified parent container
     *
     * @param currentDir the current container from which child containers should be identified
     * @param contUrlList the list of containers in the current directory
     */
    childContainers(currentDir, contUrlList) {
      const newUrlLst = contUrlList
        .filter((url) => url !== currentDir) // Remove the current parent container
        .map((url) => {
          const segments = url
            .split("/")
            .filter((segment) => segment.length > 0);
          return segments[segments.length - 1] + "/";
        });
      // for navigating up a directory path (not possible when in root directory)
      if (currentDir !== this.currentPod) {
        newUrlLst.push("/..");
      }
      return newUrlLst.sort((a, b) => a.length - b.length);
    },
    /**
     * method that allows for the traversal of the container structure in a User's Pod
     *
     * @param aNewLocation the container name that a user will be traversing to
     */
    async changeCurrentLocation(aNewLocation) {
      const dismembered = this.currentLocation.split("//");
      const segments = dismembered[1]
        .split("/")
        .filter((segment) => segment.length > 0);

      // for moving 'up' the container levels (toward the root)
      if (aNewLocation === "/..") {
        segments.pop();
        const newUrl = dismembered[0] + "//" + segments.join("/") + "/";
        this.currentLocation = newUrl;
        await this.getSpecificData(newUrl);
        this.currentUrl = null;
        this.selectPath();

      }
      // for moving 'down' the container levels (away from the root)
      else {
        const newUrl =
          dismembered[0] + "//" + segments.join("/") + "/" + aNewLocation;
        this.currentLocation = newUrl;
        await this.getSpecificData(newUrl);
        this.currentUrl = null;
        this.selectPath();
      }
    },
    /**
     * Obtains the containers within the root directory of a user's pod,
     * puts the URLs for these containers into an array,
     * then sorts the array to reflect heirarchy
     */
    async getGeneralData() {
      this.dirContents = await fetchData(this.currentPod);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
    },
    /**
     * Obtains a list containers and/or resources located in the provided container
     *
     * @param path the URL of the container for which access rights are being displayed
     */
    async getSpecificData(path) {
      this.dirContents = await fetchData(path);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
    },

    /**
     * Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
     * Obtains 'pod' variable (URL path to user's Pod).
     */
    async podURL() {
      this.webId = currentWebId();
      this.currentLocation = this.currentPod; 
    },
    /**
     * Sorts container URLs and resource URLs into different lists
     */
    separateUrls() {
      this.containerUrls = this.urls.filter((url) => url.endsWith("/"));
      this.resourceUrls = this.urls.filter((url) => !url.endsWith("/"));
      if (
        this.currentLocation === this.currentPod &&
        !this.urls.includes(this.currentPod)
      ) {
        this.urls.push(this.currentPod);
        this.containerUrls.push(this.currentPod);
      }
      this.urls = this.urls.sort((a, b) => a.length - b.length);
      this.container = this.urls.sort((a, b) => a.length - b.length);
      this.resourceUrls = this.urls.sort((a, b) => a.length - b.length);
    },


    /**
     * Emits the current URL path
     */
    selectPath() {
      const selectedPath = this.currentLocation;
      this.$emit("path-selected", selectedPath);
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    this.podURL();
    setTimeout(() => {
      try {
        this.getGeneralData();
      } catch(err) {
        console.log(err);
      }
    }, 500);
  },
};
</script>

<style scoped>

.horizontal-list {
  display: flex;
  align-items: center;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.dir-nav {
  padding: 10px;
}

.directory-nav span {
  font-size: 16pt;
  font-family: "Oxanium", monospace;
  font-weight: 400;
  margin-left: 25px;
}
.nav-wrapper {
  padding-left: 20px;
  padding-right: 20px;
}
.select-dir {
  display: flex;
  align-items: center;
  margin-left: 15px;
  gap: 20px;
}

.select-dir .v-btn {
  margin-bottom: 15px;
}
.select-dir .v-select {
  min-width: 150px;
  margin-top: 15px;
  font-family: "Oxanium", monospace;
}
.navigate-btn {
  font-family: "Oxanium", monospace;
  margin-top: 10px;
}
</style>

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

<script lang="ts">
import { defineComponent } from "vue";
import { getContainedResourceUrlAll } from "@inrupt/solid-client";
import { currentWebId } from "./login";
import { fetchData, WorkingData } from "./getData";

interface ContainerNavProps {
  currentPod: string;
}

export default defineComponent({
  name: "ContainerNav",
  props: {
    currentPod: String,
  },
  data() {
    return {
      webId: "" as string,
      dirContents: null as WorkingData | null,
      currentLocation: "" as string,
      currentUrl: '' as string | null,
      urls: [] as string[],
      containerUrls: [] as string[],
      resourceUrls: [] as string[],
    };
  },
  methods: {
    /**
     * Returns a list of child container URLs from within a specified parent container.
     */
    childContainers(currentDir: string, contUrlList: string[]): string[] {
      const newUrlLst = contUrlList
        .filter((url) => url !== currentDir)
        .map((url) => {
          const segments = url.split("/").filter((segment) => segment.length > 0);
          return segments[segments.length - 1] + "/";
        });
      if (currentDir !== this.currentPod) {
        newUrlLst.push("/..");
      }
      return newUrlLst.sort((a, b) => a.length - b.length);
    },
    /**
     * Allows traversal of the container structure in a user's Pod.
     */
    async changeCurrentLocation(aNewLocation: string): Promise<void> {
      const dismembered = this.currentLocation.split("//");
      const segments = dismembered[1].split("/").filter((segment) => segment.length > 0);

      if (aNewLocation === "/..") {
        segments.pop();
        const newUrl = dismembered[0] + "//" + segments.join("/") + "/";
        this.currentLocation = newUrl;
        await this.getSpecificData(newUrl);
        this.currentUrl = null;
        this.selectPath();
      } else {
        const newUrl = dismembered[0] + "//" + segments.join("/") + "/" + aNewLocation;
        this.currentLocation = newUrl;
        await this.getSpecificData(newUrl);
        this.currentUrl = null;
        this.selectPath();
      }
    },
    /**
     * Obtains the containers within the root directory of a user's pod.
     */
    async getGeneralData(): Promise<void> {
      try {
        this.dirContents = await fetchData(this.currentPod);
        this.urls = getContainedResourceUrlAll(this.dirContents);
        this.separateUrls();
      } catch (err) {
        console.log(err);
      }
    },
    /**
     * Obtains a list of containers and/or resources located in the provided container.
     */
    async getSpecificData(path: string): Promise<void> {
      this.dirContents = await fetchData(path);
      this.urls = getContainedResourceUrlAll(this.dirContents);
      this.separateUrls();
    },
    /**
     * Calls getPodURLs() to obtain a list of pods from the logged-in user's webID.
     */
    async podURL(): Promise<void> {
      this.webId = currentWebId();
      this.currentLocation = this.currentPod;
    },
    /**
     * Sorts container URLs and resource URLs into different lists.
     */
    separateUrls(): void {
      this.containerUrls = this.urls.filter((url) => url.endsWith("/"));
      this.resourceUrls = this.urls.filter((url) => !url.endsWith("/"));
      if (this.currentLocation === this.currentPod && !this.urls.includes(this.currentPod)) {
        this.urls.push(this.currentPod);
        this.containerUrls.push(this.currentPod);
      }
      this.urls = this.urls.sort((a, b) => a.length - b.length);
      this.containerUrls = this.containerUrls.sort((a, b) => a.length - b.length);
      this.resourceUrls = this.resourceUrls.sort((a, b) => a.length - b.length);
    },
    /**
     * Emits the current URL path.
     */
    selectPath(): void {
      const selectedPath = this.currentLocation;
      this.$emit("path-selected", selectedPath);
    },
  },
  mounted() {
    this.podURL();
    setTimeout(() => {
      try {
        this.getGeneralData();
      } catch (err) {
        console.log(err);
      }
    }, 500);
  },
});
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

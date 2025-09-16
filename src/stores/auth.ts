import { defineStore } from "pinia";
import { isLoggedin, currentWebId } from "../components/login";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    loggedIn: false,
    webId: "" as string,
    selectedPodUrl: "" as string,
  }),
  actions: {
    initializeAuth() {
      this.loggedIn = isLoggedin();
      this.webId = currentWebId();
    },
    setAuth(loggedIn: boolean, webId: string) {
      this.loggedIn = loggedIn;
      this.webId = webId;
    },
    setSelectedPodUrl(podUrl: string) {
      this.selectedPodUrl = podUrl; // Action to set selected Pod URL
    },
    clearAuth() {
      this.loggedIn = false;
      this.webId = "";
      this.selectedPodUrl = ""; // Clear selected Pod URL
    },
  },
});

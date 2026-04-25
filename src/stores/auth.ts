import { defineStore } from "pinia";
import {
  isLoggedin,
  currentWebId,
  handleRedirectAfterPageLoad,
} from "../services/solid/login";

let authInitPromise: Promise<void> | null = null;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    loggedIn: false,
    webId: "" as string,
    selectedPodUrl: "" as string,
    authReady: false,
    authLoading: false,
  }),
  actions: {
    async initializeAuth(force = false) {
      if (!force && this.authReady) {
        return;
      }

      if (!force && authInitPromise) {
        return authInitPromise;
      }

      this.authLoading = true;
      authInitPromise = (async () => {
        await handleRedirectAfterPageLoad();
        this.loggedIn = isLoggedin();
        this.webId = currentWebId() ?? "";
        this.authReady = true;
      })().finally(() => {
        this.authLoading = false;
        authInitPromise = null;
      });

      return authInitPromise;
    },
    setAuth(loggedIn: boolean, webId: string) {
      this.loggedIn = loggedIn;
      this.webId = webId;
      this.authReady = true;
    },
    setSelectedPodUrl(podUrl: string) {
      this.selectedPodUrl = podUrl; // Action to set selected Pod URL
    },
    clearAuth() {
      this.loggedIn = false;
      this.webId = "";
      this.selectedPodUrl = ""; // Clear selected Pod URL
      this.authReady = true;
    },
  },
});

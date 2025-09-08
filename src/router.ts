import { createRouter, createWebHistory } from "vue-router";

import LandingPage from "./components/LandingPage.vue";

import PodLogin from "./components/PodLogin.vue";
import PodUpload from "./components/PodUpload.vue";
import PodBrowser from "./components/PodBrowser.vue";
import DataQuery from "./components/DataQuery.vue";
import EditPrivacy from "./components/EditPrivacy.vue";
import NotFound from "./components/Styling/NotFound.vue";

import { useAuthStore } from "./stores/auth";

/**
 * The router here allows for navigation between different functional pages of the TRIPLE App
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      name: "Home",
      path: "/",
      components: { default: LandingPage },
    },
    {
      name: "Login Page",
      path: "/login",
      components: { default: PodLogin },
    },
    {
      name: "Data Upload",
      path: "/dataUpload",
      components: { default: PodUpload },
    },
    {
      name: "Pod Browser",
      path: "/podBrowser",
      components: { default: PodBrowser },
    },
    {
      name: "Query",
      path: "/dataQuery",
      components: { default: DataQuery },
    },
    {
      name: "Data Privacy",
      path: "/privacy",
      components: { default: EditPrivacy },
    },
  ],
});

/**
 * A timeout here is necessary because the isLoggedin() function relies on an async function handleRedirectAfterPageLoad() to return boolean
 * The result is the routing of the web page flow from the login page to the functional parts of the app
 * (and returning to the login page if logged out at any point)
 */
const publicPages = ["Home", "Login Page", "Query"];

setTimeout(() => {
  const authStore = useAuthStore();
  router.beforeEach(async (to, from, next) => {

    // make sure the user is authenticated
    if (publicPages.includes(to.name as string)) {
      // Always allow public pages
      return next();
    }
    // If not logged in, redirect to login
    if (!authStore.loggedIn) {
      return next({ name: "Login Page" });
    }
    // Otherwise allow navigation
    next();
  });
}, 100);

/* router.afterEach(function (to, from) {
  // sending analytics data
  console.log(to, from);
});  */

export default router;

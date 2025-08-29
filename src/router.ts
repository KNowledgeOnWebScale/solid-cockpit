import { createRouter, createWebHistory } from "vue-router";

import LandingPage from "./components/LandingPage.vue";

import PodLogin from "./components/PodLogin.vue";
import PodUpload from "./components/PodUpload.vue";
import PodBrowser from "./components/PodBrowser.vue";
import DataQuery from "./components/DataQuery.vue";
import EditPrivacy from "./components/EditPrivacy.vue";
import NotFound from "./components/Styling/NotFound.vue";

import { isLoggedin } from "./components/login";

/**
 * The router here allows for navigation between different functional pages of the TRIPLE App
 */
const router = createRouter({
  history: createWebHistory('/solid-cockpit/'),
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
    { 
      name: "CatchAll",
      path: '/:notFound(.*)',
      components: NotFound,
    }
  ],
});

/**
 * A timeout here is necessary because the isLoggedin() function relies on an async function handleRedirectAfterPageLoad() to return boolean
 * The result is the routing of the web page flow from the login page to the functional parts of the app
 * (and returning to the login page if logged out at any point)
 */
const publicPages = ["Home", "Login Page", "Query"];
setTimeout(() => {
  router.beforeEach(async (to, from, next) => {
    // make sure the user is authenticated
    if (publicPages.includes(to.name)) {
      // Always allow public pages
      return next();
    }
    // If not logged in, redirect to login
    if (!isLoggedin()) {
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

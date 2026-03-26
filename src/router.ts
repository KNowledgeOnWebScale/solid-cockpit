import { createRouter, createWebHistory } from "vue-router";

import LandingPage from "./components/LandingPage.vue";

import PodLogin from "./components/PodLogin.vue";
import PodUpload from "./components/PodUpload.vue";
import PodBrowser from "./components/PodBrowser.vue";
import DataQuery from "./components/DataQuery.vue";
import EditPrivacy from "./components/EditPrivacy.vue";
import NotFound from "./components/Styling/NotFound.vue";

import { useAuthStore } from "./stores/auth";
import { PUBLIC_ROUTE_NAMES } from "./navigation";

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
    {
      name: "CatchAll",
      path: "/:pathMatch(.*)*",
      component: NotFound,
    },
  ],
});

/**
 * Initialize auth/session state before running protected-route checks.
 */
router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if (!authStore.authReady || authStore.authLoading) {
    await authStore.initializeAuth();
  }

  if (PUBLIC_ROUTE_NAMES.includes(to.name as (typeof PUBLIC_ROUTE_NAMES)[number])) {
    return true;
  }

  if (!authStore.loggedIn) {
    return { name: "Home" };
  }

  return true;
});

/* router.afterEach(function (to, from) {
  // sending analytics data
  console.log(to, from);
});  */

export default router;

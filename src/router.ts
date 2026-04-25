import { createRouter, createWebHistory } from "vue-router";

const LandingPage = () => import("./components/LandingPage.vue");
const PodLogin = () => import("./components/PodLogin.vue");
const PodUpload = () => import("./components/PodUpload.vue");
const PodBrowser = () => import("./components/PodBrowser.vue");
const DataQuery = () => import("./components/DataQuery.vue");
const EditPrivacy = () => import("./components/EditPrivacy.vue");
const NotFound = () => import("./components/Styling/NotFound.vue");

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

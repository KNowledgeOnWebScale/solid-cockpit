import { createRouter, createWebHistory } from "vue-router";

import LandingPage from './components/LandingPage.vue';
import TheHeader from './components/Styling/TheHeader.vue'
import FunctionSelector from './components/Styling/FunctionSelector.vue'
// import TheFooter from './components/Styling/TheFooter.vue'

import PodLogin from './components/PodLogin.vue';
import PodUpload from './components/PodUpload.vue';
import PodBrowser from './components/PodBrowser.vue';
import DataQuery from './components/DataQuery.vue';
import EditPrivacy from './components/EditPrivacy.vue';

import { isLoggedin } from './components/login'

/**
 * The router here allows for navigation between different functional pages of the TRIPLE App
 */
const router = createRouter ({
  history: createWebHistory(),
  routes: [
    {
      name: "Login Page",
      path: "/login",
      components: { default: PodLogin, header: TheHeader },
    },
    {
      name: "Landing Page",
      path: "/",
      components: { default: LandingPage, header: TheHeader, navBar: FunctionSelector },
      children: [
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
          name: "Edit Data Privacy",
          path: "/editPrivacy",
          components: { default: EditPrivacy },
        },
      ]
    },
  ]
});

/**
 * A timeout here is necessary because the isLoggedin() function relies on an async function handleRedirectAfterPageLoad() to return boolean
 * The result is the routing of the web page flow from the login page to the functional parts of the app 
 * (and returning to the login page if logged out at any point)
 */
setTimeout(() => { 
  router.beforeEach(function (to, from, next) {
    // make sure the user is authenticated
    if (!isLoggedin() && to.name !== 'Login Page') {
      next({ name: 'Login Page' })
    } else if (isLoggedin() && to.name === 'Login Page') {
      next({ name: 'Landing Page' })
    } else {
      next()
    }
  });
}, 100);


/* router.afterEach(function (to, from) {
  // sending analytics data
  console.log(to, from);
});  */

export default router;

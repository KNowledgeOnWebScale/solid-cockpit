import { createRouter, createWebHistory } from "vue-router";

import HomePage from './components/HomePage.vue';
import TheHeader from './components/Styling/TheHeader.vue'
// import TheFooter from './components/Styling/TheFooter.vue'

import PodLogin from './components/PodLogin.vue';
import PodUpload from './components/PodUpload.vue';
import PodBrowser from './components/PodBrowser.vue';
import DataQuery from './components/DataQuery.vue';
import EditPrivacy from './components/EditPrivacy.vue';



const router = createRouter ({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'Home Page' } },
    {
      name: "Login Page",
      path: "/login",
      components: { default: PodLogin, header: TheHeader },
    },
    {
      name: "Home Page",
      path: "/home",
      components: { default: HomePage, header: TheHeader },
    },
    {
      name: "Data Upload",
      path: "/dataUpload",
      components: { default: PodUpload, header: TheHeader },
    },
    {
      name: "Pod Browser",
      path: "/podBrowser",
      components: { default: PodBrowser, header: TheHeader },
    },
    {
      name: "Query",
      path: "/dataQuery",
      components: { default: DataQuery, header: TheHeader },
    },
    {
      name: "Edit Data Privacy",
      path: "/editPrivacy",
      components: { default: EditPrivacy, header: TheHeader },
    },
  ]
});


router.beforeEach(function (to, from, next) {
  console.log("Global beforeEach");
  console.log(to, from);
  if (to.meta.needsAuth) {
    console.log("Needs auth!");
    next();
  } else {
    next();
  }
  // if (to.name === 'team-members') {
  //   next();
  // } else {
  //   next({ name: 'team-members', params: { teamId: 't2' } });
  // }
  // next();
});

router.afterEach(function (to, from) {
  // sending analytics data
  console.log("Global afterEach");
  console.log(to, from);
});

export default router;

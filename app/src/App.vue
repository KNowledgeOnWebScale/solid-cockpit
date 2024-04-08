<template>
  <header>
    <router-view name="header"></router-view>
  </header>
  <nav>
    <router-view name="navBar"></router-view>
  </nav>
  <main id="app">
    <router-view></router-view>
  </main>
</template>


<script lang="ts">

export default {
  name: 'App',
  components: {
  },
};

// need to add:
// (optional) -- a way for a user to select the pod (view/edit via dropdown)
// 1. a way to designate where a file is uploaded to (i.e. directory structure)
//
// 2. a Pod data browser -- getting there (maybe a comunica issue)
// 
// 3. On load -- (fix method of showing stuff (isLoggedin() is dumb)
//    A. /login page
//    B. login redirects to /home (with FunctionSelector)
//    C. redirects work ...
//    D. Make Query and Privacy components

// workflow issues:
// 1. New pod initialization / old pod re-starting
//    -- need to fix makePod.sh (npx vs local installation?)
// 2. when Pod is created, it is not automatically reflected in the card$.ttl file?
//    -- need to automate a way to add "<http://www.w3.org/ns/pim/space#storage> <../> ."
</script>


<style src="./assets/main.css"></style>

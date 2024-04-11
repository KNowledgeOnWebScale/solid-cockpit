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

/**
 * need to add:
 * 
 * (optional) -- 
 * A. a way for a user to select the pod (view/edit via dropdown)
 * B. ...
 * 
 * General issues:
 * I. New pod initialization / old pod re-starting (CSS interface)
 * II. the presence of <http://www.w3.org/ns/pim/space#storage> <../> . on User card$.ttl
 * III. Web hosting of the application -- github pages
 * 
 * Data Upload:
 * 1. a way to designate where a file is uploaded to (i.e. directory structure)
 * 2. a drag and drop interface
 * 3. a loading icon (to tell when file upload is done)
 * 
 * Data Browser:
 * 4. a Pod data browser -- use new Comunica engine
 * 5. designate a way to display the directory structure (along with the files)
 * 
 * Data Query:
 * 6. Area to write the query
 * 7. Area to designate sources
 * 8. submit query button
 * 9. streamed output display
 * 
 * Data Privacy:
 * 10. A view of the current privacy
 * 11. A way to add/change privacy
 */
</script>


<style src="./assets/main.css"></style>

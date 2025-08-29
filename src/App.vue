<template>
  <the-header />
  <function-selector />
  <main id="app">
    <router-view></router-view>
  </main>
  <div id="footer">
    <the-footer />
  </div>
</template>


<script lang="ts">
import FunctionSelector from './components/Styling/FunctionSelector.vue';
import TheHeader from './components/Styling/TheHeader.vue';
import TheFooter from './components/Styling/TheFooter.vue';

export default {
  name: 'App',
  components: {
    TheHeader,
    FunctionSelector,
    TheFooter,
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
 * I. ...
 * 
 * Data Upload:
 * 1. a way to designate where a file is uploaded to (i.e. directory structure)
 * 2. a loading icon (to tell when file upload is done)
 * 
 * Data Browser:
 * 3. a Pod data browser -- use new Comunica engine
 * 4. designate a way to display the directory structure (along with the files)
 * 
 * Data Query:
 * 5. Area to write the query
 * 6. Area to designate sources
 * 7. submit query button
 * 8. streamed output display
 * 
 * Data Privacy:
 * 9. A view of the current privacy
 * 10. A way to add/change privacy
 */
</script>


<style src="./assets/main.css"></style>

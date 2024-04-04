<template>
  <TheHeader title="TRIPLE App" />
  <div id="app">
    <LoginComponent />
    <UploadComponent />
    <BrowserComponent />
  </div>
</template>


<script lang="ts">
import TheHeader from './components/Styling/TheHeader.vue';
import LoginComponent from './components/PodLogin.vue';
import UploadComponent from './components/PodUpload.vue';
import BrowserComponent from './components/PodBrowser.vue';

export default {
  name: 'App',
  components: {
    TheHeader,
    LoginComponent,
    UploadComponent,
    BrowserComponent
  },
};

// need to add:
// (optional) -- a way for a user to select the pod (view/edit via dropdown)
// 1. a way to designate where a file is uploaded to (i.e. directory structure)
//
// 2. a Pod data browser
// 

// workflow issues:
// 1. New pod initialization / old pod re-starting
//    -- need to fix makePod.sh (npx vs local installation?)
// 2. when Pod is created, it is not automatically reflected in the card$.ttl file?
//    -- need to automate a way to add "<http://www.w3.org/ns/pim/space#storage> <../> ."
</script>


<style src="./assets/main.css"></style>

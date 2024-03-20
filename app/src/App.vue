<template>
  <TheHeader title="TRIPLE App" />
  <div id="app">
    <LoginComponent title="Solid Pod Login" />
    <UploadComponent title="Add Data to Pod" />
  </div>
</template>


<script lang="ts">
import TheHeader from './components/Styling/TheHeader.vue';
import LoginComponent from './components/PodLogin.vue';
import UploadComponent from './components/PodBrowser.vue'

export default {
  name: 'App',
  components: {
    TheHeader,
    LoginComponent,
    UploadComponent
  },
};
</script>


<style src="./assets/main.css"></style>

<template>
  <div id="app">
    <LoginComponent />
    <UploadComponent />
  </div>
</template>


<script lang="ts">
import LoginComponent from './components/PodLogin.vue';
import UploadComponent from './components/PodBrowser.vue'

export default {
  name: 'App',
  components: {
    LoginComponent,
    UploadComponent
  },
};
</script>
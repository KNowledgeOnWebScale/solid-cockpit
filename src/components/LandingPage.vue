<template>
  <v-container>
    <v-col cols="12">
      <v-card
        variant="tonal"
        justify="center"
        class="mx-auto"
        color="indigo-darken-3"
      >
        <h1>Welcome to the TRIPLE App!</h1>
        <h2>Below is a guide to get you started.</h2>
      </v-card>
    </v-col>
  </v-container>
</template>

<script>
import { handleRedirectAfterPageLoad, isLoggedin } from "./login";

export default {
  data: () => ({
    login_status: true,
  }),
  methods: {
    async credentials() {
      handleRedirectAfterPageLoad();
    },
    loggedIn() {
      return isLoggedin();
    },
    mounted() {
      this.credentials();
      // Delays the execution of these functions on page reload (to avoid async-related errors)
      setTimeout(() => {
        this.login_status = this.loggedIn();
        console.log(this.login_status);
      }, 200);
    },
  },
};
</script>

<style scoped>
h1,h2 {
  font-family: "Courier New", monospace;
  text-align: center;
}
</style>
<template>
  <v-container>
    <v-col cols="12">
      <v-card
        variant="tonal"
        justify="center"
        max-width="550"
        class="mx-auto"
        color="indigo-darken-3"
      >
      </v-card>
      <router-view />
    </v-col>
  </v-container>
</template>

<script>
import { handleRedirectAfterPageLoad, isLoggedin } from "./login";

export default {
  data: () => ({
    login_status: true
  }),
  methods: {
    async credentials() {
      handleRedirectAfterPageLoad();
    },
    loggedIn() {
      return isLoggedin()
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

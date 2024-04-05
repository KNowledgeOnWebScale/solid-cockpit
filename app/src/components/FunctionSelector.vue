<template>
  <v-card v-if="loggedIn">
    <nav>
      <v-tabs
        v-model="tab"
        align-tabs="center"
        color="deep-purple-accent-4"
        bg-color="#9fbbdf"
        fixed-tabs>
        <v-tab v-for="tabName in items" :key="tabName">
          <router-link :to="{ name: tabName }">{{ tabName }}</router-link>
        </v-tab>
      </v-tabs>
    </nav>
  </v-card>
</template>

<script>
import { isLoggedin } from "./login";

export default {
  data: () => ({
    loggedIn: false,
    tab: null,
    items: ["Data Upload", "Pod Browser", "Query", "Edit Data Privacy"],
  }),
  methods: {
    loginCheck() {
      this.loggedIn = isLoggedin();
    }
  },
  mounted() {
    // Delays the execution loginCheck() on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.loginCheck();
    }, 200); // Delay of 2 seconds
  },
};
</script>


<style scoped>
a.router-link-active, a:not(.router-link-active) {
  text-decoration: none;
}
</style>
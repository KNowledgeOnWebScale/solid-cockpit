<template>
  <v-container v-show="loggedIn">
    <v-col cols="12">
      <v-card
        title="Pod Contents"
        variant="tonal"
        justify="center"
        max-width="550"
        class="mx-auto"
        color="indigo-darken-3"
      >
        <v-infinite-scroll height="400" @load="load">
          <template v-for="(item, index) in filteredItems" :key="index">
            <!-- need a clever way to filter and display results here -->
            <div
              :class="[
                'pa-2',
                item.get('s') === queryItems[index].get('s')
                  ? 'bg-grey-lighten-2'
                  : '',
              ]"
            >
              Object:{{ item.get("o").value }}
            </div>
          </template>
          <template v-slot:loading> Thats it. </template>
        </v-infinite-scroll>
      </v-card>
    </v-col>
  </v-container>
  <div v-for="(i, index) in queryItems" :key="index">
    <p>{{ i.get("s") }}</p>
    <p>{{ i.get("p") }}</p>
    <p>{{ i.get("o") }}</p>
  </div>
</template>

<script lang="ts">
import { isLoggedin, currentWebId, session } from "./login";
import { getPodURLs } from "./fileUpload";
import { executeQuery } from "./queryPod";
export default {
  data() {
    return {
      loggedIn: false,
      webId: "",
      podURLs: [],
      pod: "",
      queryItems: [],
    };
  },
  methods: {
    /*
    Calls isLoggedin() from login.ts to check login status
    */
    loginCheck() {
      this.loggedIn = isLoggedin(); // Calls function in login.ts to check login status
    },
    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podURLs = await getPodURLs(this.webId); // calls async function to get Pod URLs
      this.pod = this.podURLs[0]; // can fix this to handle multiple pods (<< FUTURE >>)
    },

    /*
    Calls executeQuery from queryPod.ts to obtain all data from logged-in user's Pod.
    Obtains items variable (IRIs of all Pod data).
    */
    // COOL IDEA --> << Interactable Knowledge graph (with tabular display toggle) >>
    async podContentsQuery() {
      this.queryItems = await executeQuery(this.pod, session);
    },

    /*
    Filters the binding stream to show only useful stuff...
    */
    filteredItems() {
      return this.queryItems.filter(i => {
        // Replace this with your actual condition
        return i.get("s") !== 'some value';
      });
    },
    /*
    For the loading of the Pod data display
    */
    load({ done }) {
      // Very unsure what this does and how it does it ...
      setTimeout(() => {
        this.queryItems.push(
          ...Array.from(
            { length: 10 },
            (k, v) => v + this.queryItems.at(-1) + 1
          )
        );
        done("ok");
      }, 4000);
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.loginCheck();
      this.getPodURL();
    }, 200);
    setTimeout(() => {
      this.podContentsQuery();
    }, 300);
  },
};
</script>

<style scoped></style>

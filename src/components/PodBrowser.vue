<template>
  <v-container>
    <v-col cols="12">
      <!-- Displays contents if the query returns results without an error -->
      <v-card
        title="Pod Contents"
        variant="tonal"
        justify="center"
        class="mx-auto"
        color="indigo-darken-3"
        v-if="queryItems !== null"
      >
        <v-infinite-scroll>
          <template v-for="(item, index) in queryItems" :key="index">
            <!-- need a clever way to filter and display results here -->
            <div :class="['pa-2', index % 1 === 0 ? 'bg-grey-lighten-2' : '']">
              {{ item }}
            </div>
          </template>
          <template v-slot:loading> </template>
        </v-infinite-scroll>
      </v-card>

      <!-- Displays warning if query encounters an error -->
      <v-card
        variant="tonal"
        justify="center"
        class="mx-auto"
        color="indigo-darken-3"
        v-if="queryItems === null"
      >
        <v-alert
          type="error"
          title="Error occurred when querying Pod with Comunica"
          >Apologies, but currently unable to display pod contents at the moment. Functionality will hopefully be fixed soon :/</v-alert
        >
      </v-card>
    </v-col>
  </v-container>
</template>

<script lang="ts">
import { currentWebId, session, getPodURLs } from "./login";
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
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podURLs = await getPodURLs(); // calls async function to get Pod URLs
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
      // not sure
    },
    /*
    For the loading of the Pod data display
    */
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.getPodURL();
    }, 200);
    setTimeout(() => {
      this.podContentsQuery();
    }, 400);
  },
};
</script>

<style scoped></style>

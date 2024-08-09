<template>
  <v-container>
    <v-col cols="12">
      <v-card
        title="Change Privacy of Data"
        variant="tonal"
        justify="center"
        class="mx-auto"
        color="indigo-darken-3"
      >
      <span> {{  dirContents  }}</span>

      
      </v-card>
    </v-col>
  </v-container>
</template>

<script>
import { obtainSolidDataset } from "./privacyEdit";
import { currentWebId } from "./login";
import { getPodURLs } from "./fileUpload";

export default {
  data() {
    return {
      webId: "",
      podURLs: [],
      pod: "",
      dirContents: "",
    };
  },
  methods: {
    /*
    Calls getPodURLs() from fileUpload.ts to obtain a list of pods from the logged-in user's webID.
    Obtains 'pod' variable (URL path to user's Pod).
    */
    async getPodURL() {
      this.webId = currentWebId(); // fetches user webID from login.ts
      this.podURLs = await getPodURLs(this.webId); // calls async function to get Pod URLs
      this.pod = this.podURLs[0]; // can fix this to handle multiple pods (<< FUTURE >>)
    },
    async getPodData() {
      this.dirContents = await obtainSolidDataset(this.pod + "uploads/");
    },
  },
  mounted() {
    // Delays the execution of these functions on page reload (to avoid async-related errors)
    setTimeout(() => {
      this.getPodURL();
    }, 200);
    setTimeout(() => {
      this.getPodData();
    }, 400);
  },
};
</script>

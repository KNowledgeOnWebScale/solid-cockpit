<template>
  <v-footer>
    <div>
      <strong>Contact: </strong>

      <v-spacer></v-spacer>

    </div>

    <div>
      {{ new Date().getFullYear() }} — <strong>Ghent University</strong>
    </div>
  </v-footer>

</template>

<script>
  export default {
    data: () => ({
      icons: [
        'mdi-twitter',
        'mdi-linkedin',
        'mdi-github',
      ],
    }),
  }

  // This is quite not working. Very boken.
</script>



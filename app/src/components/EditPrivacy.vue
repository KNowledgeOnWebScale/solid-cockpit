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
      </v-card>
    </v-col>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    user: {
        webId: '...',
        fullName: 'John Doe',
        email: 'john.doe@doe.com',
      },
  }),
};</script>

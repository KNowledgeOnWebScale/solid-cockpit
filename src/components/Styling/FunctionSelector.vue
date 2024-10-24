<template>
  <v-card>
    <nav>
      <v-tabs
        v-model="tab"
        align-tabs="center"
        color="deep-purple-lighten-5"
        bg-color="#445560"
        fixed-tabs>
        <v-tab border="sm" v-for="tabName in items" :key="tabName" :to="{ name: tabName }">
          {{ tabName }}
        </v-tab>
      </v-tabs>
    </nav>
  </v-card>
</template>

<script>
export default {
  data: () => ({
    tab: null,
    items: ["Home", "Data Upload", "Pod Browser", "Query", "Data Privacy"],
  }),  
};
</script>


<style scoped>
a.router-link-active, a:not(.router-link-active) {
  text-decoration: none;
}
</style>
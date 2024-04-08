<template>
  <v-card>
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
export default {
  data: () => ({
    tab: null,
    items: ["Data Upload", "Pod Browser", "Query", "Edit Data Privacy"],
  }),  
};
</script>


<style scoped>
a.router-link-active, a:not(.router-link-active) {
  text-decoration: none;
}
</style>
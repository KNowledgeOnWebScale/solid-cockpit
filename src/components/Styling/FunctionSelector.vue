<template>
  <v-card class="function-selector">
    <nav class="nav-nav">
      <v-tabs
        class="nav-bar"
        v-model="tab"
        align-tabs="center"
        color="var(--text-muted)"
        bg-color="var(--muted)"
        fixed-tabs
      >
        <v-tab
          class="specific-tab"
          border="sm"
          v-for="tabName in items"
          :key="tabName"
          :to="{ name: tabName }"
        >
          {{ tabName }}
        </v-tab>
      </v-tabs>
    </nav>
  </v-card>
</template>

<script lang="ts">
export default {
  data: () => ({
    tab: null as string | null,
    items: ["Home", "Data Upload", "Pod Browser", "Query", "Data Privacy"],
  }),
};
</script>

<style scoped>
.nav-nav {
  all: unset;
  margin: 10px 0 10px 0;
  color: var(--text-secondary);
}

.nav-bar {
  font-family: "Oxanium", monospace;
}
.specific-tab {
  font-size: 13pt;
}
a.router-link-active,
a:not(.router-link-active) {
  text-decoration: none;
}
</style>

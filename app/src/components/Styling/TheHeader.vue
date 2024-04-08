<template>
  <v-card color="#ccdff8">
    <v-container>
      <v-card-title justify="center">
        <h1 class="font-weight-bold text-h2 text-courier-new">TRIPLE App</h1>
      </v-card-title>
    </v-container>
  </v-card>
</template>

<script lang="ts">
export default {
  data: () => ({}),
};
</script>

<style scoped>
header {
  width: 100%;
  height: 5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ccdff8;
}

header h1 {
  color: rgb(0, 0, 0);
  margin: 0;
  font-family: "Courier New", monospace;
}
</style>

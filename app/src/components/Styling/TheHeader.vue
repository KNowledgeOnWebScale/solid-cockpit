<template>
  <header>
    <h1>{{ title }}</h1>
  </header>
</template>

<script lang="ts">
export default {
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
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

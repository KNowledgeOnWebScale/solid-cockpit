<template>
    <section>
      <base-card>
      <h3>{{ title }}</h3>
        <form id="writeForm">
          <label id="writelabel" for="input_file"></label>
          <input
            type="file"
            id="input_file"
            name="data"
          />
          <button type="submit">
            Upload
          </button>
        </form>
      </base-card>
    </section>
    
</template>


<script lang="ts">
import BaseCard from './Styling/BaseCard.vue';
import { uploadFile } from './fileUpload';

export default {
  props: {
    title: {
      type: String,
      required: true
    },
  }
}

</script>



<style scoped>
input {
  padding: 10px 10px;
  color: rgb(10, 10, 10);
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease; /* Smooth transition effect */
}
button {
  padding: 10px 20px;
  background-color: #2529f7;
  color: white;
  border: 2px solid #037dc4; /* Darker purple outline */
  border-radius: 10px; /* Rounded corners */
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease; /* Smooth transition effect */
}
button:hover {
  background-color: #b2bdfc;
}
button:active {
  background-color: #c7c3ff;
}

</style>
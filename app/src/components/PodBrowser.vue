<template>
    <section v-show="loggedIn">
      <base-card>
      <h3>{{ title }}</h3>
        <form id="writeForm">
          <label id="writelabel" for="input_file"></label>
          <input
            type="file"
            id="input_file"
            name="data"
          />
          <button @click="doFileUpload">
            Upload
          </button>
        </form>
      </base-card>
    </section>
</template>


<script lang="ts">
import BaseCard from './Styling/BaseCard.vue';
import { uploadFile, getPodURLs } from './fileUpload';
import { isLoggedin } from './login';

export default {
  data() {
    return {
      loggedIn: false,
      podURLs: [],
    };
  },
  methods: {
    doFileUpload() {
      uploadFile(this.podURLs[0], document.getElementById('input_file')); // ISSUE
    },
    loginCheck() {
      this.loggedIn = isLoggedin();
      this.podURLs = getPodURLs();
      console.log(this.podURLs[0]) // ISSUE -> sometimes works, other times is undefined?
    },
  },
  mounted() {
    setTimeout(() => {
    this.loginCheck();
    }, 200); // Delay of 0.2 seconds
  },
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
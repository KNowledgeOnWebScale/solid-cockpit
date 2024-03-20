<template>
  <section>
    <base-card>
      <header>
        <h3>{{ title }}</h3>
      </header>
      <label id="labelLogin" for="btnLogin"></label>
      <button name="btnLogin" @click="handleLogin">Login</button>
      <p id="labelStatus" class="labelStatus"></p>
    </base-card>
  </section>
</template>


<script lang="ts">
import { startLogin } from './login';


export default {
  name: 'LoginComponent',
  methods: {
    async handleLogin() {
      await startLogin();
    },
  },
  props: {
    title: {
      type: String,
      required: true
    },
  }
}

// need to add 
// 1. a way to get the pod url
// 2. a way to write to a solid pod
// 3. a way to check if that data has been uploaded
</script>



<style scoped>
button {
  padding: 10px 15px;
  background-color: #9b77ff;
  color: white;
  border: 2px solid #5e3f99; /* Darker purple outline */
  border-radius: 10px; /* Rounded corners */
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease; /* Smooth transition effect */
}

button:hover {
  background-color: #bda6fd;
}

button:active {
  background-color: #9b77ff;
}
</style>
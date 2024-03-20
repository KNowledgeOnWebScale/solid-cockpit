<template>
  <section>
    <base-card>
      <header>
        <h3>{{ title }}</h3>
      </header>
      <label for="urlInput">Pod Location URL: </label>
      <input id="urlInput" v-model="userUrl" type="url" placeholder="Eg: http://localhost:3000/" />

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
  data() {
    return {
      userUrl: null
    };
  },
  methods: {
    async handleLogin() {
      await startLogin();
      console.log(this.userUrl)
    },
  },
  props: {
    title: {
      type: String,
      required: true
    },
  }
}

// Problem is in here somewhere... Has something to do with the v-model input field...

// need to add 
// 1. a way to get the pod url
// 2. a way to write to a solid pod
// 3. a way to check if that data has been uploaded
</script>



<style scoped>
input {
  padding: 10px 15px;
  margin-bottom: 10px; /* Add some margin to separate the fields */
  margin-right: 2rem; /* Add space between the input field and the button
  border: 2px solid #5e3f99; /* Darker purple outline */
  border-radius: 10px; /* Rounded corners */
  font-size: 14px;
}

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
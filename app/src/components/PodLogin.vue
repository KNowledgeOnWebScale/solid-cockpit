<template>
  <head>
    <meta charset="utf-8" />
    <title>TRIPLE App Data Upload</title>
  </head>

  <body>
    <header>
      <h2>TRIPLE App File Upload</h2>
    </header>
    <section id="login" class="panel">
      <div class="row">
        <label id="labelLogin" for="btnLogin">Click the button to </label>
        <button name="btnLogin" @click="handleLogin">Login</button>
        <p id="labelStatus" class="labelStatus"></p>
      </div>
    </section>
  </body>
</template>


<script lang="ts">
import { startLogin } from './login';


export default {
  name: 'LoginComponent',
  methods: {
    async handleLogin() {
      await startLogin();
    },
  }
}

// need to add 
// 1. a way to get the pod url
// 2. a way to write to a solid pod
// 3. a way to check if that data has been uploaded
</script>


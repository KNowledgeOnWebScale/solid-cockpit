<template>
  <head>
    <meta charset="utf-8" />
    <title>TRIPLE App Data Upload</title>
    <link rel="stylesheet" href="my-demo.css" />
  </head>

  <body>
    <header>
      <h2>Getting Started</h2>
      <h3>with Inrupt JavaScript Client Libraries</h3>
    </header>
    <section id="login" class="panel">
      <div class="row">
        <label id="labelLogin" for="btnLogin">1. Click the button to</label>
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

</script>
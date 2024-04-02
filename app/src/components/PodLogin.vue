/* eslint-disable */
<template>
  <section>
    <base-card>
      <header>
        <h3>{{ title }}</h3>
      </header>
      <div id="toLogin" v-show="!loggedIn">
        <div id="loginButton">
          <label for="urlInput">Pod Provider: </label>
          <input
            id="urlInput"
            v-model="userUrl"
            type="url"
            placeholder="Eg: http://localhost:3000/"
          />
          <button name="btnLogin" @click="handleLogin">Login</button>
        </div>

        <div id="errorIndicator" v-if="error">
          <p>Error: {{ error }}</p>
        </div>

        <div id="newpodButton">
          <label for="btnNewpod">No Pod yet: </label>
          <button id="btnNewpod" @click="newPodDirections = !newPodDirections">Create New Pod</button>
          <div id="createPodDirections" v-show="newPodDirections">
            <span><em>Run in the console: </em> <code>$ bash makePod.sh</code></span>
            <!-- Need to fix BASH script to launch an existing pod (not create a new one) -->
          </div>
        </div>
      </div>

      <div id="loggedIn" v-show="loggedIn">
        <p>Currently logged-in with WebID: {{ webId }}</p>
      </div>
    </base-card>
  </section>
</template>

<script lang="ts">
import { startLogin, isLoggedin, currentWebId } from './login';

export default {
  name: 'LoginComponent',
  data() {
    return {
      userUrl: 'http://localhost:3000/',  // sets default url (if nothing is entered)
      loggedIn: false,
      isError: false,
      error: '',
      newPodDirections: false,
      webId: '',
    };
  },
  methods: {
  async handleLogin() {   // for the login to a Solid pod
    const stat = await startLogin(this.userUrl);  // Need session to remember...
    if (stat === 'error') {
        this.error = 'Cannot login properly...';
    } 
  },
  loginCheck() {
    this.loggedIn = isLoggedin();
    this.webId = currentWebId()
  } 
  },
  mounted() {
    setTimeout(() => {
    this.loginCheck();
    }, 200); // Delay of 2 seconds
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

#loginButton {
  button {
    padding: 10px 15px;
    background-color: #b296fe;
    color: white;
    border: 2px solid #9062e5; /* Darker purple outline */
    border-radius: 10px; /* Rounded corners */
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease; /* Smooth transition effect */
  }
}

#newpodButton {
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
}

#createPodDirections{
  padding: 10px 5px;
  font-size: 12px;
}

#errorIndicator {
  padding: 2px 2px;
  margin-bottom: 10px;
  margin-right: 2rem;
  border: 2px solid #d72920;
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: #ffcccc; /* Highlighted background color */
}

#loggedIn {
  padding: 2px 2px;
  margin-bottom: 10px;
  margin-right: 2rem;
  border: 2px solid #307104;
  border-radius: 5px;
  font-size: 14px;
  font-style: italic;
  background-color: #9fe8b7; /* Highlighted background color */
}
button:hover {
  background-color: #bda6fd;
}

button:active {
  background-color: #9b77ff;
}
</style>

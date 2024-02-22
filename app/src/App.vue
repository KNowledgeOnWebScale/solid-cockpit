<template>
  <ListBrowser v-if="session.info.isLoggedIn" />
  <LoginForm v-else />
</template>


<script setup lang="ts">
import { session } from './components'

import PodLogin from './components/PodLogin.vue'
</script>
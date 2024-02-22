<template>
    <div class="flex flex-col m-auto w-1/4">
        <form class="flex flex-col gap-4 py-12 px-10 bg-background shadow rounded">
            <AppIcon class="w-10 h-10 m-auto" />
            <h1 class="text-xl text-center">{{ appName }}</h1>
            <input type="text" id="webid" :placeholder="webId" v-model="webIdUrl" class="py-1 px-2 rounded border text-center" />
            <input type="submit" @click="loginHandler" class="py-1 px-2 rounded text-background lowercase bg-accent cursor-pointer hover:bg-highlight active:bg-foreground" :value="login" />
        </form>
  </div>
</template>



<script setup lang="ts">
import { Ref, ref } from 'vue';
import { login, getWebId, defaultWebId, appName, webId } from './index'

const webIdUrl: Ref<string> = ref(defaultWebId)

function loginHandler(event: Event): void {
    event.preventDefault()
    getWebId(webIdUrl.value)
        .then((webId) => login(webId.oidcIssuer, appName))
        .catch((reason: any) => console.log(reason))
}
</script>
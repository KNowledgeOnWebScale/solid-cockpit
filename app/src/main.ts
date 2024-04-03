import { createApp } from 'vue'
import App from './App.vue';
import BaseCard from './components/Styling/BaseCard.vue';

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
// import "@mdi/font/css/materialdesignicons.css" -- CSS loader webpack config problems...

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})

const app = createApp(App).use(vuetify)

app.component('base-card', BaseCard);  // A container for adding functionalities easily

app.mount('#app')

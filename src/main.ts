import { createApp } from 'vue'

import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

import './assets/theme.css'

const pinia = createPinia();
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
  theme: {
    defaultTheme: 'dark', // or 'light'
    themes: {
      dark: {
        colors: {
          surface: '#28353e',     // --main-darker2
          'on-surface': '#ede7f6',// --main-white
          primary: '#754ff6',     // --main-purple
          background: '#22343a',  // your page bg (if different from surface)
        },
      },
      light: {
        colors: {
          surface: '#ffffff',
          'on-surface': '#182028',
          primary: '#754ff6',
          background: '#faf8ff',
        },
      },
    },
  },
})

const app = createApp(App).use(vuetify);
app.use(router);
app.use(pinia);
app.mount('#app');

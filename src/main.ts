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
app.use(createPinia());

// Set theme based on data-theme attribute
const observer = new MutationObserver(() => {
  const newTheme = document.documentElement.getAttribute('data-theme');
  if (newTheme) {
    vuetify.theme.change(newTheme);
  }
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// Set initial theme
const initialTheme = document.documentElement.getAttribute('data-theme');
if (initialTheme) {
  vuetify.theme.global.name.value = initialTheme;
}

app.mount('#app');
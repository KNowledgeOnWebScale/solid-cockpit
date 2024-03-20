import { createApp } from 'vue'

import App from './App.vue';
import BaseCard from './components/Styling/BaseCard.vue';

const app = createApp(App);

app.component('base-card', BaseCard);  // A container for adding functionalities easily

app.mount('#app')

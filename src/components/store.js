import { defineStore } from 'pinia';

export const useNavLocationStore = defineStore('navLocation', {
  state: () => {
    return {
      currLocation: null,
    }
  },
})
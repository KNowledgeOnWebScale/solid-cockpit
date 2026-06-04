import { defineStore } from "pinia";

interface DirectContainerSizeEntry {
  bytes: number;
  computedAt: number;
  stale: boolean;
}

export const useContainerSizeStore = defineStore("containerSize", {
  state: () => ({
    directSizeByContainer: {} as Record<string, DirectContainerSizeEntry>,
  }),
  actions: {
    getDirectSize(containerUrl: string): number | undefined {
      const entry = this.directSizeByContainer[containerUrl];
      if (!entry || entry.stale) {
        return undefined;
      }
      return entry.bytes;
    },
    setDirectSize(containerUrl: string, bytes: number) {
      this.directSizeByContainer[containerUrl] = {
        bytes,
        computedAt: Date.now(),
        stale: false,
      };
    },
    markStale(containerUrl: string) {
      const entry = this.directSizeByContainer[containerUrl];
      if (entry) {
        entry.stale = true;
      }
    },
    clear() {
      this.directSizeByContainer = {};
    },
  },
});

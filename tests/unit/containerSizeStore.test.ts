import test from "node:test";
import assert from "node:assert/strict";
import { createPinia, setActivePinia } from "pinia";
import { useContainerSizeStore } from "../../src/stores/containerSize.ts";

test("container size store returns cached values until invalidated", () => {
  setActivePinia(createPinia());
  const store = useContainerSizeStore();

  store.setDirectSize("https://pod.example/docs/", 2048);
  assert.equal(store.getDirectSize("https://pod.example/docs/"), 2048);

  store.markStale("https://pod.example/docs/");
  assert.equal(store.getDirectSize("https://pod.example/docs/"), undefined);
});

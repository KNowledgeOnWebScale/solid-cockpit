import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PodRegistration from "../../src/components/PodRegistration.vue";
import LandingGuide from "../../src/components/Guides/LandingGuide.vue";
import { useAuthStore } from "../../src/stores/auth";

const {
  getPodURLsMock,
  currentWebIdMock,
  webIdDatasetMock,
  checkUrlMock,
  getSolidDatasetMock,
} = vi.hoisted(() => ({
  getPodURLsMock: vi.fn(),
  currentWebIdMock: vi.fn(() => "https://user.example/profile/card#me"),
  webIdDatasetMock: vi.fn(async () => {}),
  checkUrlMock: vi.fn(() => false),
  getSolidDatasetMock: vi.fn(async () => ({})),
}));

vi.mock("../../src/services/solid/login.ts", () => ({
  currentWebId: currentWebIdMock,
  getPodURLs: getPodURLsMock,
}));

vi.mock("../../src/services/solid/getData.ts", () => ({
  webIdDataset: webIdDatasetMock,
}));

vi.mock("../../src/services/solid/privacyEdit.ts", () => ({
  checkUrl: checkUrlMock,
}));

vi.mock("@inrupt/solid-client", () => ({
  getSolidDataset: getSolidDatasetMock,
}));

vi.mock("@inrupt/solid-client-authn-browser", () => ({
  fetch: vi.fn(),
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
};

function makeVuetifyStubs() {
  return {
    "v-btn": {
      props: ["type", "disabled", "loading"],
      emits: ["click"],
      template:
        '<button class="v-btn-stub" :type="type || \'button\'" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
    },
    "v-icon": {
      template: '<span class="v-icon-stub"><slot /></span>',
    },
    "v-select": {
      props: ["modelValue", "items"],
      emits: ["update:modelValue"],
      template: `
        <select
          class="v-select-stub"
          :value="modelValue"
          @change="$emit('update:modelValue', $event.target.value)"
        >
          <option v-for="item in items" :key="item" :value="item">{{ item }}</option>
        </select>
      `,
    },
    "v-text-field": {
      props: ["modelValue", "label", "placeholder"],
      emits: ["update:modelValue"],
      template: `
        <input
          class="v-text-field-stub"
          :value="modelValue"
          :placeholder="placeholder"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      `,
    },
  };
}

function mountPodRegistration(selectedPodUrl = "https://pod.example/") {
  const pinia = createPinia();
  const authStore = useAuthStore(pinia);
  authStore.setAuth(true, "https://user.example/profile/card#me");
  authStore.setSelectedPodUrl(selectedPodUrl);

  return mount(PodRegistration, {
    global: {
      plugins: [pinia],
      stubs: makeVuetifyStubs(),
    },
  });
}

describe("PodRegistration manual registration flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPodURLsMock.mockResolvedValue(["https://pod.example/"]);
    checkUrlMock.mockReturnValue(false);
    getSolidDatasetMock.mockResolvedValue({});
  });

  it("shows manual registration controls even when a pod is already selected", async () => {
    const wrapper = mountPodRegistration();
    await flushPromises();

    expect(wrapper.text()).toContain("Register new pod");

    await wrapper
      .findAll(".v-btn-stub")
      .find((button) => button.text().includes("Register new pod"))
      ?.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Register a pod URL");
    expect(wrapper.text()).toContain("your WebID already existed");
  });

  it("registers a manually entered pod URL for users who already have a pod", async () => {
    let callCount = 0;
    getPodURLsMock.mockImplementation(async () => {
      callCount += 1;
      return callCount > 1
        ? ["https://pod.example/", "https://pod.example/new/"]
        : ["https://pod.example/"];
    });

    const wrapper = mountPodRegistration();
    await flushPromises();

    await wrapper
      .findAll(".v-btn-stub")
      .find((button) => button.text().includes("Register new pod"))
      ?.trigger("click");
    await flushPromises();

    await wrapper.get(".v-text-field-stub").setValue("https://pod.example/new/");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(webIdDatasetMock).toHaveBeenCalledWith(
      "https://user.example/profile/card#me",
      "https://pod.example/new/"
    );
    expect(wrapper.text()).toContain("Pod URL registered. Click Change Pod if you want to switch to it now.");
  });

  it("does not write a pod URL to the WebID when the target is not a readable Solid container", async () => {
    getSolidDatasetMock.mockRejectedValueOnce(new Error("403 Forbidden"));

    const wrapper = mountPodRegistration();
    await flushPromises();

    await wrapper
      .findAll(".v-btn-stub")
      .find((button) => button.text().includes("Register new pod"))
      ?.trigger("click");
    await flushPromises();

    await wrapper.get(".v-text-field-stub").setValue("https://pod.example/not-readable/");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(webIdDatasetMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("could not be confirmed as a readable Solid pod container");
  });
});

describe("Landing guide pod registration note", () => {
  it("documents the manual registration workflow for newly created pods", async () => {
    const wrapper = mount(LandingGuide);

    await wrapper.get(".guide-toggle").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("When you need to register a pod manually");
    expect(wrapper.text()).toContain("provider did not add it to your WebID automatically");
    expect(wrapper.text()).toContain("Register new pod");
  });
});

import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { nextTick } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PodBrowser from "../../src/components/PodBrowser.vue";
import { useAuthStore } from "../../src/stores/auth";

const {
  mockUrls,
  getContainedResourceUrlAllMock,
  fetchDataMock,
  getSolidDatasetMock,
  getFileMock,
  movePodItemMock,
  renamePodItemMock,
} = vi.hoisted(() => {
  const mockUrls = [
    "https://pod.example/",
    "https://pod.example/docs/",
    "https://pod.example/docs/report.ttl",
    "https://pod.example/image.png",
  ];

  return {
    mockUrls,
    getContainedResourceUrlAllMock: vi.fn(() => mockUrls),
    fetchDataMock: vi.fn(async (url: string) => ({
      internal_resourceInfo: {
        sourceIri: url,
        linkedResources: {
          describedby: `${url}.meta`,
        },
      },
    })),
    getSolidDatasetMock: vi.fn(async () => ({})),
    getFileMock: vi.fn(async (url: string) => ({
      name: url.split("/").pop() || "file.ttl",
      type: "text/turtle",
      size: 2048,
      lastModified: Date.UTC(2026, 2, 25),
    })),
    movePodItemMock: vi.fn(async () => "https://pod.example/archive/report.ttl"),
    renamePodItemMock: vi.fn(async () => "https://pod.example/docs/renamed.ttl"),
  };
});

vi.mock("../../src/components/getData.ts", () => ({
  fetchData: fetchDataMock,
}));

vi.mock("../../src/components/login.ts", () => ({
  currentWebId: vi.fn(() => "https://user.example/profile/card#me"),
  getPodURLs: vi.fn(async () => ["https://pod.example/"]),
}));

vi.mock("../../src/components/fileUpload.ts", () => ({
  deleteFromPod: vi.fn(async () => true),
  deleteContainer: vi.fn(async () => true),
  movePodItem: movePodItemMock,
  renamePodItem: renamePodItemMock,
}));

vi.mock("../../src/components/privacyEdit.ts", () => ({
  checkUrl: vi.fn(() => false),
}));

vi.mock("@inrupt/solid-client", () => ({
  getContainedResourceUrlAll: getContainedResourceUrlAllMock,
  getSolidDataset: getSolidDatasetMock,
  getFile: getFileMock,
}));

vi.mock("@inrupt/solid-client-authn-browser", () => ({
  fetch: vi.fn(),
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
};

function mountBrowser() {
  const pinia = createPinia();
  const authStore = useAuthStore(pinia);
  authStore.setAuth(true, "https://user.example/profile/card#me");
  authStore.setSelectedPodUrl("https://pod.example/");

  return mount(PodBrowser, {
    global: {
      plugins: [pinia],
      config: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("v-"),
        },
      },
      stubs: {
        PodRegistration: true,
        PodBrowserGuide: true,
        ContainerNav: {
          template: '<div class="container-nav-stub" @click="$emit(\'path-selected\', \'https://pod.example/archive/\')">nav</div>',
        },
      },
    },
  });
}

describe("PodBrowser features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.stubGlobal("alert", vi.fn());
  });

  it("keeps filters hidden by default and filters items by type and search", async () => {
    const wrapper = mountBrowser();
    await flushPromises();

    expect(wrapper.find(".filters-panel").exists()).toBe(false);
    expect((wrapper.vm as unknown as { filteredUrls: string[] }).filteredUrls).toHaveLength(4);

    await wrapper.get(".filter-toggle").trigger("click");
    expect(wrapper.find(".filters-panel").exists()).toBe(true);

    const chips = wrapper.findAll(".filter-chip");
    await chips[1].trigger("click");
    expect((wrapper.vm as unknown as { filteredUrls: string[] }).filteredUrls).toEqual([
      "https://pod.example/",
      "https://pod.example/docs/",
    ]);

    await wrapper.get("#itemSearch").setValue("report");
    expect((wrapper.vm as unknown as { filteredUrls: string[] }).filteredUrls).toEqual([]);

    await chips[0].trigger("click");
    expect((wrapper.vm as unknown as { filteredUrls: string[] }).filteredUrls).toEqual([
      "https://pod.example/docs/report.ttl",
    ]);

    await wrapper.get(".filter-reset").trigger("click");
    expect((wrapper.vm as unknown as { filteredUrls: string[] }).filteredUrls).toHaveLength(4);
  });

  it("renders collapsed move and rename panels when item details are expanded", async () => {
    const wrapper = mountBrowser();
    await flushPromises();

    await wrapper.findAll(".item-toggle")[0].trigger("click");
    await flushPromises();

    expect(wrapper.find(".move-card").exists()).toBe(false);
    expect(wrapper.find(".rename-card").exists()).toBe(false);
    expect(wrapper.text()).toContain("Move item");
    expect(wrapper.text()).toContain("Rename item");
    expect(wrapper.text()).toContain("Delete item");
  });

  it("supports move destination modes and calls move helper", async () => {
    const wrapper = mountBrowser();
    await flushPromises();

    await wrapper.findAll(".item-toggle")[2].trigger("click");
    await flushPromises();

    await wrapper.findAll(".action-toggle")[0].trigger("click");
    expect(wrapper.find(".move-card").exists()).toBe(true);

    const modeButtons = wrapper.findAll(".move-mode-switch button");
    await modeButtons[0].trigger("click");
    const moveInput = wrapper.get(".move-input");
    await moveInput.setValue("https://pod.example/archive/");
    await wrapper.get(".move-btn").trigger("click");

    expect(movePodItemMock).toHaveBeenCalledWith(
      "https://pod.example/image.png",
      "https://pod.example/archive/",
      "https://pod.example/"
    );
  });

  it("supports rename panel and calls rename helper", async () => {
    const wrapper = mountBrowser();
    await flushPromises();

    await wrapper.findAll(".item-toggle")[2].trigger("click");
    await flushPromises();

    await wrapper.findAll(".action-toggle")[1].trigger("click");
    expect(wrapper.find(".rename-card").exists()).toBe(true);

    await wrapper.get(".rename-input").setValue("renamed.ttl");
    await wrapper.get(".rename-btn").trigger("click");

    expect(renamePodItemMock).toHaveBeenCalledWith(
      "https://pod.example/image.png",
      "renamed.ttl",
      "https://pod.example/"
    );
  });
});

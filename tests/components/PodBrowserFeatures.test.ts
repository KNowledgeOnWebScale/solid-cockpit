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
  getThingAllMock,
  getDatetimeMock,
  getIntegerMock,
  getDecimalMock,
  getStringNoLocaleMock,
  getPodResourceDownloadMock,
  movePodItemMock,
  renamePodItemMock,
} = vi.hoisted(() => {
  const mockUrls = [
    "https://pod.example/",
    "https://pod.example/docs/",
    "https://pod.example/docs/report.ttl",
    "https://pod.example/image.png",
  ];
  const dctModified = "http://purl.org/dc/terms/modified";

  return {
    mockUrls,
    getContainedResourceUrlAllMock: vi.fn(() => mockUrls),
    fetchDataMock: vi.fn(async (url: string) => {
      if (url.endsWith(".meta")) {
        return {
          __things: [
            {
              [dctModified]: new Date("2026-03-26T09:15:00Z"),
            },
          ],
          internal_resourceInfo: {
            sourceIri: url,
            linkedResources: {},
          },
        };
      }

      return {
        internal_resourceInfo: {
          sourceIri: url,
          linkedResources: {
            describedby: `${url}.meta`,
          },
        },
      };
    }),
    getSolidDatasetMock: vi.fn(async () => ({})),
    getFileMock: vi.fn(async (url: string) => ({
      name: url.split("/").pop() || "file.ttl",
      type: "text/turtle",
      size: 2048,
      lastModified: Date.UTC(2026, 2, 25),
    })),
    getThingAllMock: vi.fn((dataset: { __things?: unknown[] }) => dataset.__things || []),
    getDatetimeMock: vi.fn((thing: Record<string, unknown>, predicate: string) => {
      const value = thing[predicate];
      return value instanceof Date ? value : null;
    }),
    getIntegerMock: vi.fn(() => null),
    getDecimalMock: vi.fn(() => null),
    getStringNoLocaleMock: vi.fn(() => null),
    getPodResourceDownloadMock: vi.fn(async (url: string) => ({
      file: new File(["downloaded"], url.split("/").pop() || "file.ttl", {
        type: "text/turtle",
      }),
      fileName: url.split("/").pop() || "file.ttl",
    })),
    movePodItemMock: vi.fn(async () => "https://pod.example/archive/report.ttl"),
    renamePodItemMock: vi.fn(async () => "https://pod.example/docs/renamed.ttl"),
  };
});

vi.mock("../../src/services/solid/getData.ts", () => ({
  fetchData: fetchDataMock,
}));

vi.mock("../../src/services/solid/login.ts", () => ({
  currentWebId: vi.fn(() => "https://user.example/profile/card#me"),
  getPodURLs: vi.fn(async () => ["https://pod.example/"]),
}));

vi.mock("../../src/services/solid/fileUpload.ts", () => ({
  deleteFromPod: vi.fn(async () => true),
  deleteContainer: vi.fn(async () => true),
  getPodResourceDownload: getPodResourceDownloadMock,
  movePodItem: movePodItemMock,
  renamePodItem: renamePodItemMock,
}));

vi.mock("../../src/services/solid/privacyEdit.ts", () => ({
  checkUrl: vi.fn(() => false),
}));

vi.mock("@inrupt/solid-client", () => ({
  getContainedResourceUrlAll: getContainedResourceUrlAllMock,
  getSolidDataset: getSolidDatasetMock,
  getFile: getFileMock,
  getThingAll: getThingAllMock,
  getDatetime: getDatetimeMock,
  getInteger: getIntegerMock,
  getDecimal: getDecimalMock,
  getStringNoLocale: getStringNoLocaleMock,
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
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:pod-resource"),
      revokeObjectURL: vi.fn(),
    }));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
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

  it("shows resource-only compact download action and triggers the download helper", async () => {
    const wrapper = mountBrowser();
    await flushPromises();

    await wrapper.findAll(".item-toggle")[0].trigger("click");
    await flushPromises();
    expect(wrapper.find(".download-icon-button").exists()).toBe(false);

    await wrapper.findAll(".item-toggle")[2].trigger("click");
    await flushPromises();
    expect(wrapper.find(".download-icon-button").exists()).toBe(true);

    await wrapper.get(".download-icon-button").trigger("click");
    await flushPromises();

    expect(getPodResourceDownloadMock).toHaveBeenCalledWith("https://pod.example/image.png");
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:pod-resource");
  });

  it("renders specific parser diagnostics when a Turtle resource is malformed", async () => {
    fetchDataMock.mockImplementation(async (url: string) => {
      if (url === "https://pod.example/image.png") {
        throw new Error(
          'Encountered an error parsing the Resource at [https://pod.example/image.png] with content type [text/turtle]: Error: Expected punctuation to follow ""Azinphos-methyl ((#))"" on line 82.'
        );
      }
      return {
        internal_resourceInfo: {
          sourceIri: url,
          linkedResources: {
            describedby: `${url}.meta`,
          },
        },
      };
    });

    const wrapper = mountBrowser();
    await flushPromises();

    await wrapper.findAll(".item-toggle")[2].trigger("click");
    await flushPromises();

    expect(wrapper.find(".info-warning").exists()).toBe(true);
    expect(wrapper.text()).toContain("Invalid Turtle syntax detected");
    expect(wrapper.text()).toContain("line 82");
    expect(wrapper.text()).toContain("Azinphos-methyl ((#))");
    expect(wrapper.text()).toContain("text/turtle");
  });
});

import { RouterLinkStub, mount, shallowMount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TheFooter from "../../src/components/Styling/TheFooter.vue";
import ThemeSwitch from "../../src/components/Styling/ThemeSwitch.vue";
import FunctionSelector from "../../src/components/Styling/FunctionSelector.vue";
import { useAuthStore } from "../../src/stores/auth";

vi.mock("../../src/components/login.ts", () => ({
  session: {
    info: {
      isLoggedIn: false,
      webId: "https://user.example/profile/card#me",
    },
  },
  startLogin: vi.fn(async () => ""),
  isLoggedin: vi.fn(() => false),
  currentWebId: vi.fn(() => "https://user.example/profile/card#me"),
  getPodURLs: vi.fn(async () => ["https://pod.example/"]),
  redirectToHomepage: vi.fn(),
  redirectToLogin: vi.fn(),
  logOut: vi.fn(async () => false),
  handleRedirectAfterPageLoad: vi.fn(async () => {}),
}));

vi.mock("../../src/components/getData.ts", () => ({
  webIdDataset: vi.fn(async () => {}),
  fetchData: vi.fn(async (url: string) => ({
    internal_resourceInfo: {
      sourceIri: url,
      linkedResources: {
        type: "resource",
        describedby: `${url}.meta`,
      },
    },
  })),
  fetchPermissionsData: vi.fn(async () => ({})),
  fetchAclAgents: vi.fn(async () => ({
    "https://friend.example/profile/card#me": {
      read: true,
      append: false,
      write: false,
      control: false,
    },
  })),
  fetchPublicAccess: vi.fn(async () => ({
    read: true,
    append: false,
    write: false,
    control: false,
  })),
}));

vi.mock("../../src/components/fileUpload.ts", () => ({
  handleFiles: vi.fn(async () => [{ name: "mock-file.ttl" }]),
  uploadSuccess: vi.fn(() => true),
  alreadyExistsCheck: vi.fn(() => false),
  deleteFromPod: vi.fn(async () => true),
  deleteContainer: vi.fn(async () => true),
  deleteThing: vi.fn(async () => true),
}));

vi.mock("../../src/components/privacyEdit.ts", () => ({
  checkUrl: vi.fn(() => false),
  generateAcl: vi.fn(async () => true),
  changeAclAgent: vi.fn(async () => true),
  changeAclPublic: vi.fn(async () => true),
  createInboxWithACL: vi.fn(async () => true),
  updateSharedWithMe: vi.fn(async () => true),
  updateSharedWithOthers: vi.fn(async () => true),
  getSharedWithOthers: vi.fn(async () => []),
  getSharedWithMe: vi.fn(async () => ({
    lastAccessed: "2025-01-01T00:00:00.000Z",
    sharedItems: [],
  })),
  saveNewAccessTime: vi.fn(async () => true),
}));

vi.mock("../../src/components/queryPod.ts", () => ({
  ensureCacheContainer: vi.fn(async (_pod: string, _webId: string, base: string) => `${base}querycache/`),
  createQueriesTTL: vi.fn(async () => "hash-abc"),
  uploadQueryFile: vi.fn(async () => "hash-abc.rq"),
  uploadResults: vi.fn(async () => "hash-abc.json"),
  getStoredTtl: vi.fn(async () => false),
  fetchQueryFileData: vi.fn(async () => "SELECT * WHERE { ?s ?p ?o }"),
  getCachedQueries: vi.fn(async () => []),
  executeQueryWithPodConnected: vi.fn(async () => "no-cache"),
  fetchSparqlJsonFileData: vi.fn(async () => ({
    head: { vars: [] },
    results: { bindings: [] },
  })),
  stopQuery: vi.fn(() => true),
  cleanSourcesUrls: vi.fn(() => []),
  executeQueryInMainThread: vi.fn(async () => ({
    provenanceOutput: null,
    resultsOutput: {
      head: { vars: [] },
      results: { bindings: [] },
    },
  })),
}));

vi.mock("@inrupt/solid-client", () => ({
  getContainedResourceUrlAll: vi.fn(() => [
    "https://pod.example/",
    "https://pod.example/container/",
    "https://pod.example/container/file.ttl",
  ]),
  internal_AclRule: {},
}));

vi.mock("@triply/yasqe", () => {
  class YasqeMock {
    private value = "";

    constructor(_element: Element | null, _options: Record<string, unknown>) {}

    setValue(value: string) {
      this.value = value;
    }

    getValue() {
      return this.value;
    }

    setCursor(_cursor: Record<string, number>) {}

    focus() {}

    destroy() {}

    on(_event: string, _callback: (instance: { getValue: () => string }) => void) {}
  }

  return {
    default: YasqeMock,
  };
});

vi.mock("@triply/yasr", () => {
  class YasrMock {
    constructor(_element: Element | null, _options: Record<string, unknown>) {}

    setResponse(_response: unknown, _prefixes: Record<string, string>) {}

    destroy() {}
  }

  return {
    default: YasrMock,
  };
});

const componentModules = import.meta.glob("../../src/components/**/*.vue");
const componentEntries = Object.entries(componentModules).sort(([a], [b]) =>
  a.localeCompare(b)
);

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function makeProps(path: string): Record<string, unknown> {
  if (path.endsWith("/Styling/SharedWith.vue")) {
    return {
      currentOperation: "sharedWithMe",
      currentPod: "https://pod.example/",
      currentWebId: "https://user.example/profile/card#me",
    };
  }

  if (path.endsWith("/ContainerNav.vue")) {
    return {
      currentPod: "https://pod.example/",
    };
  }

  if (path.endsWith("/LandingPage.vue")) {
    return {
      currPod: "https://pod.example/",
    };
  }

  return {};
}

describe("Focused Styling Component Tests", () => {
  it("FunctionSelector only shows Home and Query when logged out", () => {
    const pinia = createPinia();
    const authStore = useAuthStore(pinia);
    authStore.setAuth(false, "");

    const wrapper = shallowMount(FunctionSelector, {
      global: {
        plugins: [pinia],
        config: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("v-"),
          },
        },
      },
    });

    expect((wrapper.vm as unknown as { items: string[] }).items).toEqual(["Home", "Query"]);
  });

  it("FunctionSelector shows all functional pages when logged in", () => {
    const pinia = createPinia();
    const authStore = useAuthStore(pinia);
    authStore.setAuth(true, "https://user.example/profile/card#me");

    const wrapper = shallowMount(FunctionSelector, {
      global: {
        plugins: [pinia],
        config: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("v-"),
          },
        },
      },
    });

    expect((wrapper.vm as unknown as { items: string[] }).items).toEqual([
      "Home",
      "Data Upload",
      "Pod Browser",
      "Query",
      "Data Privacy",
    ]);
  });

  it("ThemeSwitch initializes from saved localStorage theme", async () => {
    localStorage.setItem("app-theme", "light");

    const wrapper = mount(ThemeSwitch);
    await nextTick();

    const button = wrapper.get("button.theme-switch");
    expect(button.attributes("data-mode")).toBe("light");
    expect(button.attributes("aria-checked")).toBe("false");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("ThemeSwitch defaults to dark and toggles theme on click", async () => {
    const wrapper = mount(ThemeSwitch);
    await nextTick();

    const button = wrapper.get("button.theme-switch");
    expect(button.attributes("data-mode")).toBe("dark");
    expect(localStorage.getItem("app-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await button.trigger("click");
    expect(button.attributes("data-mode")).toBe("light");
    expect(button.attributes("aria-checked")).toBe("false");
    expect(localStorage.getItem("app-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("ThemeSwitch toggles theme on keyboard handlers", async () => {
    const wrapper = mount(ThemeSwitch);
    await nextTick();

    const button = wrapper.get("button.theme-switch");
    expect(button.attributes("data-mode")).toBe("dark");

    await button.trigger("keydown.enter");
    expect(button.attributes("data-mode")).toBe("light");

    await button.trigger("keydown.space");
    expect(button.attributes("data-mode")).toBe("dark");
  });

  it("TheFooter renders version metadata and shows last modified date after fetch", async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => [
        {
          commit: { committer: { date: "2026-02-20T10:20:30.000Z" } },
        },
      ],
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const wrapper = mount(TheFooter);
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("Last Modified: 2026-02-20");
    });

    expect(wrapper.text()).toContain("Version: v1.0.0");
    expect(wrapper.text()).toContain("Version: v1.0.0");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("TheFooter keeps last-modified hidden when commit API returns no entries", async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => [],
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const wrapper = mount(TheFooter);
    await flushPromises();

    expect(wrapper.text()).not.toContain("Last Modified:");
  });

  it("TheFooter handles fetch failures without crashing", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network failure");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const wrapper = mount(TheFooter);
    await flushPromises();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Last Modified:");
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("All Vue Components Smoke Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => [] })));
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.stubGlobal("open", vi.fn());
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  for (const [path, loadComponent] of componentEntries) {
    it(`mounts ${path}`, async () => {
      const module = await loadComponent();
      const component = module.default;

      const wrapper = shallowMount(component, {
        props: makeProps(path),
        global: {
          plugins: [createPinia()],
          config: {
            compilerOptions: {
              isCustomElement: (tag) => tag.startsWith("v-"),
            },
          },
          stubs: {
            RouterLink: RouterLinkStub,
            RouterView: true,
            transition: false,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });
  }
});

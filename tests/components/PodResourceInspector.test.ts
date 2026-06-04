import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PodResourceInspector from "../../src/components/PodResourceInspector.vue";

const {
  fetchAclAgentsMock,
  fetchPublicAccessMock,
  fetchResourcePreviewMock,
  fetchResourceFullTextMock,
  validateResourceContentMock,
  buildCsvPreviewTableMock,
  analyzeResourceStructureMock,
  saveResourceContentMock,
} = vi.hoisted(() => ({
  fetchAclAgentsMock: vi.fn(async () => ({
    "https://user.example/profile/card#me": {
      read: true,
      write: true,
      append: true,
      control: false,
    },
  })),
  fetchPublicAccessMock: vi.fn(async () => ({
    read: true,
    append: false,
    write: false,
    control: false,
  })),
  fetchResourcePreviewMock: vi.fn(async () => ({
    text: '{\n  "hello": "world"\n}',
    formatInfo: {
      format: "json",
      label: "JSON",
      contentType: "application/json",
      editable: true,
      supported: true,
    },
    truncated: false,
    byteLength: 22,
  })),
  fetchResourceFullTextMock: vi.fn(async () => ({
    text: '{\n  "hello": "world"\n}',
    formatInfo: {
      format: "json",
      label: "JSON",
      contentType: "application/json",
      editable: true,
      supported: true,
    },
    truncated: false,
    byteLength: 22,
  })),
  validateResourceContentMock: vi.fn(async () => ({
    valid: true,
    summary: "JSON syntax is valid.",
    details: [],
  })),
  buildCsvPreviewTableMock: vi.fn(() => null),
  analyzeResourceStructureMock: vi.fn(() => ({
    title: "JSON object count",
    value: "1 object",
  })),
  saveResourceContentMock: vi.fn(async () => {}),
}));

vi.mock("../../src/services/solid/getData.ts", () => ({
  fetchAclAgents: fetchAclAgentsMock,
  fetchPublicAccess: fetchPublicAccessMock,
}));

vi.mock("../../src/services/solid/resourceInspector.ts", () => ({
  fetchResourcePreview: fetchResourcePreviewMock,
  fetchResourceFullText: fetchResourceFullTextMock,
  validateResourceContent: validateResourceContentMock,
  buildCsvPreviewTable: buildCsvPreviewTableMock,
  analyzeResourceStructure: analyzeResourceStructureMock,
  saveResourceContent: saveResourceContentMock,
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
};

type InspectorVm = {
  permissionState: "unknown" | "confirmed" | "blocked";
};

function mountInspector() {
  return mount(PodResourceInspector, {
    props: {
      resourceUrl: "https://pod.example/data.json",
      contentType: "application/json",
      webId: "https://user.example/profile/card#me",
    },
    global: {
      stubs: {
        "v-btn": {
          props: ["disabled", "loading"],
          emits: ["click"],
          template:
            '<button class="v-btn-stub" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });
}

describe("PodResourceInspector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the preview lazily when the panel is opened", async () => {
    const wrapper = mountInspector();

    expect(fetchResourcePreviewMock).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("JSON syntax is valid.");

    await wrapper.get(".inspector-toggle").trigger("click");
    await flushPromises();

    expect(fetchResourcePreviewMock).toHaveBeenCalledOnce();
    expect(fetchAclAgentsMock).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain("JSON syntax is valid.");
    expect(wrapper.text()).toContain("1 object");
    expect(wrapper.text()).toContain('"hello": "world"');
  });

  it("collapses longer previews and lets the user expand them on demand", async () => {
    fetchResourcePreviewMock.mockResolvedValueOnce({
      text: Array.from({ length: 24 }, (_, index) => `line ${index + 1}`).join("\n"),
      formatInfo: {
        format: "txt",
        label: "Plain text",
        contentType: "text/plain",
        editable: true,
        supported: true,
      },
      truncated: false,
      byteLength: 180,
    });
    analyzeResourceStructureMock.mockReturnValueOnce({
      title: "Text dimensions",
      value: "24 rows / 7 columns",
    });

    const wrapper = mountInspector();
    await wrapper.get(".inspector-toggle").trigger("click");
    await flushPromises();

    expect(wrapper.find(".preview-expand-toggle").exists()).toBe(true);
    expect(wrapper.find(".inspector-text-surface").classes()).toContain("collapsed");

    await wrapper.get(".preview-expand-toggle").trigger("click");
    await flushPromises();

    expect(wrapper.find(".inspector-text-surface").classes()).not.toContain("collapsed");
    expect(wrapper.text()).toContain("Show less");
  });

  it("supports entering edit mode and saving validated changes", async () => {
    const wrapper = mountInspector();

    await wrapper.get(".inspector-toggle").trigger("click");
    await flushPromises();
    await wrapper.get(".v-btn-stub").trigger("click");
    await flushPromises();

    const editor = wrapper.get(".inspector-editor");
    await editor.setValue('{\n  "hello": "updated"\n}');
    await flushPromises();

    const buttons = wrapper.findAll(".v-btn-stub");
    await buttons[0].trigger("click");
    await flushPromises();

    expect(fetchResourceFullTextMock).toHaveBeenCalledOnce();
    expect(saveResourceContentMock).toHaveBeenCalledWith(
      "https://pod.example/data.json",
      '{\n  "hello": "updated"\n}',
      expect.objectContaining({
        format: "json",
      })
    );
    expect(wrapper.text()).toContain("Saved changes to the pod resource.");
  });

  it("keeps editing unavailable when ACL data indicates read-only access", async () => {
    fetchAclAgentsMock.mockResolvedValueOnce({
      "https://user.example/profile/card#me": {
        read: true,
        write: false,
        append: false,
        control: false,
      },
    });
    fetchPublicAccessMock.mockResolvedValueOnce({
      read: true,
      write: false,
      append: false,
      control: false,
    });

    const wrapper = mountInspector();
    await wrapper.get(".inspector-toggle").trigger("click");
    await flushPromises();

    expect((wrapper.vm as unknown as InspectorVm).permissionState).toBe("blocked");
  });
});

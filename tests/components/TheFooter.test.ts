import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import TheFooter from "../../src/components/Styling/TheFooter.vue";

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("TheFooter.vue", () => {
  it("renders version metadata and shows last modified date after fetch", async () => {
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
    expect(wrapper.text()).toContain("web-app-v1.0.0");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps last-modified hidden when commit API returns no entries", async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => [],
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const wrapper = mount(TheFooter);
    await flushPromises();

    expect(wrapper.text()).not.toContain("Last Modified:");
  });

  it("handles fetch failures without crashing", async () => {
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

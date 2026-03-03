import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";
import ThemeSwitch from "../../src/components/Styling/ThemeSwitch.vue";

describe("ThemeSwitch.vue", () => {
  it("initializes from saved localStorage theme", async () => {
    localStorage.setItem("app-theme", "light");

    const wrapper = mount(ThemeSwitch);
    await nextTick();

    const button = wrapper.get("button.theme-switch");
    expect(button.attributes("data-mode")).toBe("light");
    expect(button.attributes("aria-checked")).toBe("false");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("defaults to dark and toggles theme on click", async () => {
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

  it("toggles theme on keyboard enter and space handlers", async () => {
    const wrapper = mount(ThemeSwitch);
    await nextTick();

    const button = wrapper.get("button.theme-switch");
    expect(button.attributes("data-mode")).toBe("dark");

    await button.trigger("keydown.enter");
    expect(button.attributes("data-mode")).toBe("light");

    await button.trigger("keydown.space");
    expect(button.attributes("data-mode")).toBe("dark");
  });
});

<template>
  <section class="query-guide-shell">
    <button class="guide-toggle" type="button" @click="toggleGuideDropdown">
      <div>
        <p class="guide-kicker">Browser Guide</p>
        <h2>How to use Pod Data Browser</h2>
      </div>
      <i class="material-icons dropdown-arrow">
        {{ guideDropdownOpen ? "expand_less" : "chevron_right" }}
      </i>
    </button>

    <div v-if="guideDropdownOpen" class="guide-content">
      <section class="guide-section">
        <h3>Quick start flow</h3>
        <ol>
          <li>
            Connect and choose a pod with
            <span class="guide-control">Choose Pod</span>.
          </li>
          <li>
            Pick a location in <span class="guide-control">Browse containers</span>.
          </li>
          <li>
            Review items under
            <span class="guide-control">Selected container contents</span>.
          </li>
          <li>
            Expand an item with the chevron
            <i class="material-icons guide-inline-icon">chevron_right</i>
            to view details and actions.
          </li>
        </ol>
      </section>

      <section class="guide-section">
        <h3>Container and item browsing</h3>
        <ul>
          <li>
            The header path pill shows the active container being inspected.
          </li>
          <li>
            Items are grouped as <span class="guide-control">Container</span> and
            <span class="guide-control">Resource</span> cards.
          </li>
          <li>
            The item count badge shows filtered items vs total items.
          </li>
          <li>
            Item details include name, type, parent container, full URL, and metadata.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Filtering and search</h3>
        <ul>
          <li>
            Open <span class="guide-control">Filters</span> to refine list results.
          </li>
          <li>
            Use <span class="guide-control">Item type</span> chips to show all,
            containers only, or resources only.
          </li>
          <li>
            Use <span class="guide-control">Search items</span> to match item name or URL.
          </li>
          <li>
            <span class="guide-control">Reset filters</span> returns to the full list.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Item details and metadata links</h3>
        <ul>
          <li>
            <span class="guide-control">Copy URL</span> copies an item’s full source URL.
          </li>
          <li>
            Metadata entries are rendered as links when valid and open in a new tab.
          </li>
          <li>
            File resources include content type, size, and last-modified timestamp.
          </li>
          <li>
            Containers include direct child-item counts.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Move, rename, and delete actions</h3>
        <ul>
          <li>
            <span class="guide-control">Move item</span> is collapsed by default and
            supports <span class="guide-control">Enter Path</span> or
            <span class="guide-control">Browse Containers</span>.
          </li>
          <li>
            <span class="guide-control">Move Item</span> is enabled only for valid
            destination containers in the selected pod.
          </li>
          <li>
            <span class="guide-control">Rename item</span> requires a new item name only
            (no path separators).
          </li>
          <li>
            <span class="guide-control">Delete</span> is a separate destructive action
            with confirmation before removal.
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: "PodBrowserGuide",
  data: () => ({
    guideDropdownOpen: false as boolean,
  }),
  methods: {
    toggleGuideDropdown() {
      this.guideDropdownOpen = !this.guideDropdownOpen;
    },
  },
};
</script>

<style scoped>
.query-guide-shell {
  font-family: "Oxanium", monospace;
  margin: 0 0.5rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--panel) 96%, var(--primary) 4%),
    var(--panel)
  );
  box-shadow: var(--shadow-1);
  overflow: hidden;
}
.guide-toggle {
  width: 100%;
  padding: 0.95rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  text-align: left;
  color: var(--text-primary);
}
.guide-kicker {
  margin: 0 0 0.22rem;
  font-size: var(--font-size-section-kicker);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.guide-toggle h2 {
  margin: 0;
  font-size: var(--font-size-section-title);
  font-weight: 600;
  line-height: 1.25;
}
.dropdown-arrow {
  font-size: 1.2rem;
  color: var(--text-secondary);
}
.guide-content {
  padding: 0.2rem 1rem 1rem;
  border-top: 1px solid var(--border);
  display: grid;
  gap: 0.75rem;
}
.guide-section {
  padding: 0.7rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--border) 80%, var(--primary) 20%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel-elev) 88%, transparent);
}
.guide-section h3 {
  margin: 0 0 0.5rem;
  font-size: var(--font-size-component-title);
  font-weight: 600;
  color: var(--text-primary);
}
.guide-section ul,
.guide-section ol {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.35rem;
}
.guide-section li {
  color: var(--text-secondary);
  font-size: var(--font-size-component-body);
  line-height: 1.45;
}
.guide-control {
  display: inline-flex;
  align-items: center;
  padding: 0.09rem 0.42rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary) 28%, var(--border));
  background: color-mix(in srgb, var(--primary) 10%, var(--panel));
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.83em;
  letter-spacing: 0.01em;
}
.guide-inline-icon {
  font-size: 1rem;
  vertical-align: middle;
  color: var(--text-muted);
}
@media (max-width: 760px) {
  .query-guide-shell {
    border-radius: 16px;
  }
  .guide-toggle {
    padding: 0.85rem 0.9rem;
  }
  .guide-content {
    padding-left: 0.85rem;
    padding-right: 0.85rem;
  }
}
</style>

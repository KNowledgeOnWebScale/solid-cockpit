<template>
  <section class="query-guide-shell">
    <button class="guide-toggle" type="button" @click="toggleGuideDropdown">
      <div>
        <p class="guide-kicker">Upload Guide</p>
        <h2>How to use Data Upload</h2>
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
            Choose destination mode:
            <span class="guide-control">Enter Path</span> or
            <span class="guide-control">Browse Folders</span>.
          </li>
          <li>
            Confirm the destination shown in
            <span class="guide-control">Selected Container</span>.
          </li>
          <li>
            Select files using
            <span class="guide-control">Drag files here or click to choose files</span>.
          </li>
          <li>
            Click <span class="guide-control">Upload Files</span> and review the
            upload result messages.
          </li>
        </ol>
      </section>

      <section class="guide-section">
        <h3>Destination selection features</h3>
        <ul>
          <li>
            <span class="guide-control">Enter Path</span> allows direct folder URL input.
          </li>
          <li>
            URL validation is automatic and shown with success/error status pills.
          </li>
          <li>
            <span class="guide-control">Browse Folders</span> uses the container
            navigator to pick a destination visually.
          </li>
          <li>
            The selected path is normalized as a container path before upload.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>File selection and upload action</h3>
        <ul>
          <li>
            Multi-file selection is supported; selected files appear as chips with count.
          </li>
          <li>
            Upload progress is shown with an inline spinner and
            <span class="guide-control">Uploading...</span> indicator.
          </li>
          <li>
            Upload action uses the current destination shown in the header meta.
          </li>
          <li>
            After completion, file selection is cleared for the next upload batch.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Result feedback and errors</h3>
        <ul>
          <li>
            Success feedback confirms each uploaded filename and destination.
          </li>
          <li>
            Duplicate detection reports when a file already exists in the destination.
          </li>
          <li>
            Error feedback appears for failed uploads and pod/session issues.
          </li>
          <li>
            The info icon
            <i class="material-icons guide-inline-icon">help_outline</i>
            provides recovery guidance for login/session upload failures.
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: "DataUploadGuide",
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

<template>
  <section class="query-guide-shell">
    <button class="guide-toggle" type="button" @click="toggleGuideDropdown">
      <div>
        <p class="guide-kicker">Privacy Guide</p>
        <h2>How to use Privacy Editing</h2>
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
            Pick the working area from the left nav:
            <span class="guide-control">My Pod</span>,
            <span class="guide-control">Shared with me</span>, or
            <span class="guide-control">Shared with others</span>.
          </li>
          <li>
            In <span class="guide-control">My Pod</span>, choose a location with
            <span class="guide-control">Browse containers</span>.
          </li>
          <li>
            Expand a target item using the lock-row chevron
            <i class="material-icons guide-inline-icon">chevron_right</i>.
          </li>
        </ol>
      </section>

      <section class="guide-section">
        <h3>Notifications and shared activity</h3>
        <ul>
          <li>
            The notifications button
            <i class="material-icons guide-inline-icon">notifications</i>
            opens recent sharing changes.
          </li>
          <li>
            <span class="guide-control">Mark Read</span> records the latest seen
            timestamp and clears unread state.
          </li>
          <li>
            Notification cards show target resource, actor, access modes, and date.
          </li>
          <li>
            Shared activity is also available via
            <span class="guide-control">Shared with me</span> and
            <span class="guide-control">Shared with others</span> views.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Inspecting current access rights</h3>
        <ul>
          <li>
            Expand an item row to open
            <span class="guide-control">Current Access Rights</span>.
          </li>
          <li>
            Use refresh
            <i class="material-icons guide-inline-icon">refresh</i>
            to fetch the latest ACL state.
          </li>
          <li>
            Agent identifiers (WebIDs) can be copied with
            <span class="guide-control">content_copy</span>.
          </li>
          <li>
            Permission state is displayed per mode:
            <span class="guide-control">read</span>,
            <span class="guide-control">append</span>,
            <span class="guide-control">write</span>,
            <span class="guide-control">control</span>.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Editing access rights</h3>
        <ul>
          <li>
            Open <span class="guide-control">Add access rights</span> to update ACLs.
          </li>
          <li>
            Select permission checkboxes for
            <span class="guide-control">Read</span>,
            <span class="guide-control">Append</span>,
            <span class="guide-control">Write</span>, and
            <span class="guide-control">Control</span>.
          </li>
          <li>
            Choose target scope with
            <span class="guide-control">Agent</span> or
            <span class="guide-control">Public</span>.
          </li>
          <li>
            For Agent mode, provide the WebID in
            <span class="guide-control">Enter user's WebID:</span> then submit.
          </li>
          <li>
            Use <span class="guide-control">Submit</span> to apply changes and
            <span class="guide-control">Reset Form</span> to clear the editor.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Validation, ACL creation, and write behavior</h3>
        <ul>
          <li>
            Invalid or self-target WebIDs are blocked with clear inline warnings.
          </li>
          <li>
            If no ACL exists, use <span class="guide-control">Generate .acl</span>
            to initialize one for the target item.
          </li>
          <li>
            Write submissions normalize permissions so
            <span class="guide-control">Write</span> implies
            <span class="guide-control">Append</span>.
          </li>
          <li>
            Successful updates are mirrored to the sharing notification ledgers.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Specification references</h3>
        <ul>
          <li>
            Privacy notification ledger spec:
            <a
              class="guide-link"
              href="https://github.com/ecrum19/ldp-permissions-notifications-specification"
              target="_blank"
              rel="noopener noreferrer"
            >
              ldp-permissions-notifications-specification
            </a>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: "PrivacyEditingGuide",
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
.guide-link {
  color: var(--primary);
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--primary) 60%, transparent);
  text-underline-offset: 2px;
}
.guide-link:hover {
  color: var(--text-primary);
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

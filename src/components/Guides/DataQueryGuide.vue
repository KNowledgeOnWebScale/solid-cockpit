<template>
  <section class="query-guide-shell">
    <button class="guide-toggle" type="button" @click="toggleGuideDropdown">
      <div>
        <p class="guide-kicker">Query Guide</p>
        <h2>How to use the Data Query workspace</h2>
      </div>
      <i class="material-icons dropdown-arrow">
        {{ guideDropdownOpen ? "expand_less" : "chevron_right" }}
      </i>
    </button>

    <div v-if="guideDropdownOpen" class="guide-content">
      <!-- Step-by-step quick-start flow for first-time users. -->
      <section class="guide-section">
        <h3>Quick start flow</h3>
        <ol>
          <li>
            Connect your pod and choose a pod with
            <span class="guide-control">Choose Pod</span>.
          </li>
          <li>
            Use <span class="guide-control">Query Views</span> to switch between
            <span class="guide-control">New Query</span> and
            <span class="guide-control">Past Queries</span>.
          </li>
          <li>
            Add data source URLs in <span class="guide-control">Datasources</span>
            and input your SPARQL in the editor.
          </li>
          <li>
            Optionally enable <span class="guide-control">Save Query?</span>, then
            click <span class="guide-control">Execute Query</span>.
          </li>
          <li>
            Review results, then use <span class="guide-control">Copy Query URL</span>
            to share the current executed query state.
          </li>
        </ol>
      </section>

      <!-- Category descriptions mirror the sample-query classifier used in DataQuery.vue. -->
      <section class="guide-section">
        <h3>Sample query categories</h3>
        <ul>
          <li>
            <span class="guide-tag">Single SPARQL endpoint query</span>
            Runs against one SPARQL endpoint only.
          </li>
          <li>
            <span class="guide-tag">Federated query</span>
            Targets multiple SPARQL endpoints in one execution (commonly via SERVICE clauses).
          </li>
          <li>
            <span class="guide-tag">Solid query</span>
            Targets RDF resources from a Solid pod or local server.
          </li>
          <li>
            <span class="guide-tag">Mixed source federated query</span>
            Targets both Solid pod sources and SPARQL endpoint sources.
          </li>
        </ul>
      </section>

      <!-- Detailed descriptions for the concrete demo queries in the Sample Queries picker. -->
      <section class="guide-section">
        <h3>Example queries and what they do</h3>
        <ul class="example-list">
          <li>
            <span class="guide-control">baseline-test</span>
            Quick concept-check query on the Rhea endpoint that returns a small set of predicate IRIs.
          </li>
          <li>
            <span class="guide-control">triple-wikidata-1</span>
            Aggregates toxicity-related compound data in Wikidata and ranks by average LD50.
          </li>
          <li>
            <span class="guide-control">triple-solid-2</span>
            Reads CAS values from a Solid/local RDF source using the demo predicate.
          </li>
          <li>
            <span class="guide-control">triple-idsm-3</span>
            Uses CAS values to find similar compounds and scores via IDSM and ChEBI services.
          </li>
          <li>
            <span class="guide-control">triple-rhea-4</span>
            Resolves Rhea reactions linked to a ChEBI compound and returns equation metadata.
          </li>
          <li>
            <span class="guide-control">triple-uniprot-5</span>
            Joins UniProt catalytic annotations with Rhea reaction details.
          </li>
          <li>
            <span class="guide-control">triple-oma-6</span>
            Retrieves OMA ortholog protein links and organism names for a selected UniProt protein.
          </li>
          <li>
            <span class="guide-control">triple-combined-service</span>
            Full mixed-source federated workflow that chains Solid/local CAS data, IDSM similarity search, and Rhea reactions.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Editor and datasource controls</h3>
        <ul>
          <li>
            Datasource chips can be added, edited, removed, and reset with
            <span class="guide-control">Clear</span>.
          </li>
          <li>
            Invalid datasource URLs are highlighted inline in red with immediate feedback.
          </li>
          <li>
            SPARQL text is entered in the YASQE editor; sample queries auto-fill both editor and datasources.
          </li>
          <li>
            The SPARQL tutorial link is available on the guide icon
            <i class="material-icons guide-inline-icon">help_outline</i>.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Execution, saving, and cache path</h3>
        <ul>
          <li>
            <span class="guide-control">Execute Query</span> runs the query;
            <span class="guide-control">Cancel Query</span> stops an active run.
          </li>
          <li>
            <span class="guide-control">Save Query?</span> stores query and results in
            <span class="guide-control">querycache/</span> metadata files.
          </li>
          <li>
            <span class="guide-control">Custom cache</span> expands advanced options
            for a custom cache URL destination.
          </li>
          <li>
            Results are shown in YASR, including explicit empty-result and error states.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Sharing and query-state persistence</h3>
        <ul>
          <li>
            <span class="guide-control">Copy Query URL</span> is enabled only after
            the current query state has been executed successfully.
          </li>
          <li>
            If you edit query text/sources/options after execution, re-run before sharing again.
          </li>
          <li>
            Query state is serialized in the page URL hash for shareable deep links.
          </li>
          <li>
            Draft state is auto-saved locally so work can be restored when returning to the page.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Past query management</h3>
        <ul>
          <li>
            Open <span class="guide-control">Past Queries</span> to inspect cache entries.
          </li>
          <li>
            <span class="guide-control">Filters</span> supports search, source filters,
            status filters, and sorting.
          </li>
          <li>
            Expand an entry to preview query text and compact result samples.
          </li>
          <li>
            Each entry supports <span class="guide-control">Rename</span>,
            <span class="guide-control">Share</span>, and
            <span class="guide-control">Delete</span>.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Specification references</h3>
        <ul>
          <li>
            Query cache implementation spec:
            <a
              class="guide-link"
              href="https://github.com/ecrum19/sparql-view-materialization-containers"
              target="_blank"
              rel="noopener noreferrer"
            >
              sparql-view-materialization-containers
            </a>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
export default {
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
.guide-tag {
  display: inline-flex;
  margin-right: 0.28rem;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.example-list li {
  line-height: 1.5;
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

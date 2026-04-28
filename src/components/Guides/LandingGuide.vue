<template>
  <section class="query-guide-shell">
    <button class="guide-toggle" type="button" @click="toggleGuideDropdown">
      <div>
        <h2>Solid Cockpit Use Guides</h2>
      </div>
      <i class="material-icons dropdown-arrow">
        {{ guideDropdownOpen ? "expand_less" : "chevron_right" }}
      </i>
    </button>

    <div v-if="guideDropdownOpen" class="guide-content">
      <section class="guide-section video-section">
        <button class="section-toggle" type="button" @click="toggleVideoGuide">
          <div>
            <h3>Video demonstration</h3>
            <p>Watch a recorded walkthrough of some of Solid Cockpit's most unique features.</p>
          </div>
          <i class="material-icons dropdown-arrow">
            {{ videoGuideOpen ? "expand_less" : "chevron_right" }}
          </i>
        </button>

        <div v-if="videoGuideOpen" class="video-frame">
          <iframe
            src="https://www.youtube.com/embed/eKKpJv-1U4s"
            title="Solid Cockpit feature demonstration"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      </section>

      <section class="guide-section">
        <h3>Ways to get a Solid Pod</h3>
        <ul>
          <li>
            <a
              href="https://communitysolidserver.github.io/CommunitySolidServer/latest/"
              target="_blank"
              rel="noopener"
              >Community Solid Server</a
            >
            supports local or self-hosted pod deployments.
          </li>
          <li>
            <a href="https://solidcommunity.net/" target="_blank" rel="noopener"
              >Solidcommunity.net</a
            >
            provides community-hosted Solid Pods.
          </li>
          <li>
            <a
              href="https://solidproject.org/for-developers#hosted-pod-services"
              target="_blank"
              rel="noopener"
              >Solid hosted pod services</a
            >
            lists additional providers.
          </li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>Application workflow</h3>
        <ol>
          <li>
            Start on <span class="guide-control">Home</span> to connect a Solid
            session and select the pod you want to work with.
          </li>
          <li>
            Use <span class="guide-control">Upload</span> and
            <span class="guide-control">Browser</span> to place, inspect, move,
            rename, download, and remove resources.
          </li>
          <li>
            Use <span class="guide-control">Query</span> to run SPARQL over pod
            data, endpoints, or mixed sources, then optionally cache and share
            results.
          </li>
          <li>
            Use <span class="guide-control">Privacy</span> to review ACLs,
            grant access, inspect sharing records, and manage scheduled
            revocations.
          </li>
        </ol>
      </section>

      <section class="guide-section">
        <h3>Page capabilities</h3>
        <ul>
          <li>
            <span class="guide-control">Home</span> authenticates with a Solid
            identity provider, shows session state, lets you choose a registered
            pod, and provides copy controls for current identifiers.
          </li>
          <li>
            <span class="guide-control">Data Upload</span> accepts a typed
            destination URL or a browsed container destination, validates the
            selected path, and uploads selected files into that container.
          </li>
          <li>
            <span class="guide-control">Pod Browser</span> lists containers and
            resources, supports type/search filters, shows resource metadata,
            and provides download, move, rename, and delete actions.
          </li>
          <li>
            <span class="guide-control">Data Query</span> supports editable
            datasource URLs, example queries, SPARQL execution, result previews,
            shareable query URLs, and pod-backed query cache entries.
          </li>
          <li>
            <span class="guide-control">Privacy Editing</span> inspects ACLs,
            grants agent or public access, reads sharing notifications, tracks
            sharing records, and supports scheduled access revocation.
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
    videoGuideOpen: false as boolean,
  }),
  methods: {
    toggleGuideDropdown() {
      this.guideDropdownOpen = !this.guideDropdownOpen;
    },
    toggleVideoGuide() {
      this.videoGuideOpen = !this.videoGuideOpen;
    },
  },
};
</script>

<style scoped>
.query-guide-shell .guide-toggle h2 {
  margin: 0;
  font-size: var(--font-size-section-title);
  font-weight: var(--font-weight-section-title);
  line-height: var(--line-height-section-title);
}
.section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}
.section-toggle {
  padding: 0;
}
.section-toggle p {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--font-size-component-body);
  line-height: 1.45;
}
.video-section {
  display: grid;
  gap: 0.7rem;
}
.video-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  background: var(--main-darker2);
}
.video-frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
a {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
@media (max-width: 760px) {
  .section-toggle {
    align-items: flex-start;
  }
}
</style>

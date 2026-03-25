<template>
  <section class="landing-page">
    <!-- Hero block gives the landing page the same card-first, polished structure as Data Upload. -->
    <section class="hero-card">
      <!-- The logo sits on the left, with supporting text and status details on the right. -->
      <div class="logo-panel">
        <div class="logo-container">
          <img :src="visualUrl" alt="Full Solid Cockpit logo" />
        </div>
      </div>

      <!-- Supporting copy stays beside the logo for a balanced hero layout. -->
      <div class="hero-copy">
        <p class="hero-summary">
          Connect your pod, manage data, and work with Solid resources through
          an intuitive browser-based workspace.
        </p>
        <div class="status-row">
          <div class="status-pill" :class="{ active: loggedIn }">
            <span class="status-dot"></span>
            <span>{{ loggedIn ? "Session active" : "Not connected" }}</span>
          </div>
          <span v-if="loggedIn && selectedPodUrl" class="status-meta">
            Selected pod: {{ selectedPodUrl }}
          </span>
        </div>
      </div>
    </section>

    <!-- Login stays carded; pod registration sits directly on the page without extra framing. -->
    <section class="action-grid">
      <div class="surface-card login-surface">
        <pod-login />
      </div>

      <div v-if="loggedIn" class="pod-surface">
        <PodRegistration />
      </div>
    </section>

    <div class="guide-surface">
      <landing-guide />
    </div>
  </section>
</template>

<script lang="ts">
import PodLogin from "./PodLogin.vue";
import PodRegistration from "./PodRegistration.vue";
import LandingGuide from "./Guides/LandingGuide.vue";
import { useAuthStore } from "../stores/auth";

export default {
  components: {
    PodLogin,
    PodRegistration,
    LandingGuide,
  },
  props: {
    currPod: String,
  },
  data: () => ({
    visualUrl: new URL("../assets/full-sc-logo-nb.png", import.meta.url).href,
  }),
  computed: {
    authStore() {
      return useAuthStore(); // Access the store
    },
    loggedIn() {
      return this.authStore.loggedIn; // Access loggedIn state
    },
    webId() {
      return this.authStore.webId; // Access webId state
    },
    selectedPodUrl() {
      return this.authStore.selectedPodUrl; // Access selected Pod URL
    },
  },
  methods: {
    async credentials(): Promise<void> {
      await this.authStore.initializeAuth();
    },
  },
  async mounted() {
    await this.credentials();
  },
};
</script>

<style scoped>
/* Landing page uses the same polished card system as the upload flow. */
.landing-page {
  display: grid;
  gap: 0.5rem;
}
.hero-card {
  display: grid;
  grid-template-columns: minmax(360px, 1.15fr) minmax(320px, 0.85fr);
  gap: 1.1rem;
  margin: 0.5rem 0.5rem 0 0.5rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 11%, transparent) 0, transparent 32%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--panel) 94%, var(--primary-100) 6%),
      var(--panel)
    );
  box-shadow: var(--shadow-1);
  align-items: center;
}
.hero-copy {
  display: grid;
  gap: 0.8rem;
  font-family: "Oxanium", monospace;
  align-content: center;
}
.hero-copy h1 {
  margin: 0;
  font-size: clamp(2.15rem, 4vw, 3.1rem);
  line-height: 1.08;
  color: var(--text-primary);
  font-weight: 900;
  font-family: "Orbitron", monospace;
}
.hero-summary {
  margin: 0;
  max-width: 34rem;
  font-size: 1.08rem;
  line-height: 1.72;
  font-family: "Oxanium", monospace;
  color: var(--text-muted);
}
.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  background: var(--panel-elev);
  color: var(--text-secondary);
  font-weight: 600;
}
.status-pill.active {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--gray-500);
}
.status-pill.active .status-dot {
  background: var(--success);
}
.status-meta {
  color: var(--text-muted);
  font-size: 0.92rem;
  word-break: break-all;
}
.logo-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 0.15rem 0;
}
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
img {
  display: block;
  width: min(100%, 780px);
  max-width: none;
  height: auto;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.action-grid {
  display: grid;
  gap: 0.5rem;
  margin: 0 0.5rem;
}
.surface-card,
.guide-surface {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow-1);
}
.login-surface,
.pod-surface {
  padding: 0.7rem 0.9rem;
}
.pod-surface {
  padding: 0;
}
.guide-surface {
  margin: 0 0.5rem 0.5rem 0.5rem;
  overflow: hidden;
}
.guide-surface :deep(.container) {
  margin: 0;
}
@media (max-width: 980px) {
  /* Tablet layout stacks the hero areas without losing the visual hierarchy. */
  .hero-card {
    grid-template-columns: 1fr;
  }
  .logo-panel {
    padding: 0.2rem 0 0.35rem 0;
  }
  .hero-copy {
    justify-items: center;
    text-align: center;
  }
  .status-row {
    justify-content: center;
  }
}
@media (max-width: 760px) {
  /* Mobile spacing mirrors the compact card rhythm used elsewhere in the app. */
  .hero-card,
  .action-grid,
  .guide-surface {
    margin-left: 0.35rem;
    margin-right: 0.35rem;
  }
  .hero-card {
    padding: 1rem;
    gap: 0.85rem;
  }
  img {
    width: min(100%, 640px);
  }
  .status-row {
    align-items: stretch;
  }
  .status-pill {
    width: fit-content;
    max-width: 100%;
  }
  .login-surface,
  .pod-surface {
    padding: 0.55rem 0.7rem;
  }
}

</style>

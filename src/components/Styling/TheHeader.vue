<template>
  <header class="header-card">
    <div class="header-container">
      <div class="brand-area">
        <img :src="logoUrl" alt="Solid Cockpit logo" />
        <h1>Solid Cockpit</h1>
      </div>

      <div class="header-right">
        <!-- Keep session status visible as a compact always-on signal. -->
        <div class="session-indicator" :class="{ active: loggedIn }">
          <span class="session-dot"></span>
          <span>{{ loggedIn ? "Connected" : "Signed out" }}</span>
        </div>

        <div class="theme-change">
          <ThemeSwitch />
        </div>

        <!-- Notification menu mirrors Privacy notifications and routes users into Privacy view on click. -->
        <v-menu
          v-model="notificationsMenuOpen"
          :close-on-content-click="false"
          location="bottom end"
        >
          <template #activator="{ props }">
            <button
              class="icon-button notifications-button"
              :class="{ active: hasUnreadNotifications }"
              :aria-label="
                hasUnreadNotifications
                  ? `${unreadNotificationCount} unread privacy notifications`
                  : 'Privacy notifications'
              "
              v-bind="props"
            >
              <i class="material-icons">
                {{ hasUnreadNotifications ? "notifications_active" : "notifications_none" }}
              </i>
              <span v-if="hasUnreadNotifications" class="icon-badge">
                {{ unreadNotificationCount > 99 ? "99+" : unreadNotificationCount }}
              </span>
            </button>
          </template>

          <v-card class="info-menu-card notifications-menu-card">
            <div class="menu-section-header">
              <div>
                <p class="menu-kicker">Privacy notifications</p>
                <h3>Resources shared with you:</h3>
              </div>
              <span class="status-pill" :class="{ active: hasUnreadNotifications }">
                {{ hasUnreadNotifications ? `${unreadNotificationCount} unread` : "No unread" }}
              </span>
            </div>

            <p class="menu-hint">
              {{ notificationStatusMessage }}
            </p>

            <div v-if="notificationsLoading" class="menu-empty-state">
              <span>Loading notifications...</span>
            </div>

            <div v-else-if="notificationLoadError" class="menu-empty-state error">
              <span>{{ notificationLoadError }}</span>
            </div>

            <div v-else-if="!canLoadNotifications" class="menu-empty-state">
              <span>Notifications become available once you are connected and a pod is selected.</span>
            </div>

            <ul v-else-if="unreadNotifications.length > 0" class="share-list">
              <li
                v-for="(item, index) in unreadNotifications"
                :key="`${item.resourceHash}-${index}`"
                class="notification-card"
              >
                <button class="notification-card-button" @click="openNotificationInPrivacy">
                  <div class="notification-card-header">
                    <i class="material-icons not-colored notification-type-icon">
                      {{
                        containerCheck(getNotificationResource(item))
                          ? "folder"
                          : "description"
                      }}
                    </i>
                    <span class="resource-hash mono" :title="getNotificationResource(item)">
                      {{ getNotificationResource(item) }}
                    </span>
                  </div>

                  <ul class="user-rows">
                    <li
                      v-for="(mode, rowIndex) in item.usersSharedWith || []"
                      :key="`${item.resourceHash}-${index}-${rowIndex}`"
                      class="user-row"
                    >
                      <div class="cell-row">
                        <span class="cell user">
                          <i class="material-icons tiny not-colored">person</i>
                          <span class="truncate">
                            {{
                              item.owner === "http://xmlns.com/foaf/0.1/Agent"
                                ? "Public"
                                : item.owner
                            }}
                          </span>
                        </span>
                        <span class="cell date">
                          <i class="material-icons tiny not-colored">schedule</i>
                          <time :datetime="mode.created">{{
                            formatDate(mode.created)
                          }}</time>
                        </span>
                      </div>

                      <span class="cell modes">
                        <i class="material-icons tiny not-colored">lock</i>
                        <span class="notification-mode-chips">
                          <span
                            v-for="(ac, modeIndex) in mode.accessModes"
                            :key="`${item.resourceHash}-${index}-${rowIndex}-${modeIndex}`"
                            class="notification-mode-chip"
                          >
                            {{ getModeLabel(ac) }}
                          </span>
                        </span>
                      </span>
                    </li>
                  </ul>
                </button>
              </li>
            </ul>

            <div v-else class="menu-empty-state">
              <span>No new notifications.</span>
            </div>

            <div class="menu-actions">
              <button class="menu-action-button" @click="openPrivacyNotifications">
                Open Privacy notifications
              </button>
              <button
                class="menu-action-button ghost"
                @click="markNotificationsReadFromHeader"
                :disabled="!hasUnreadNotifications || !canLoadNotifications"
              >
                Mark read
              </button>
            </div>
          </v-card>
        </v-menu>

        <!-- Account details menu now shows richer user/pod context in a compact layout. -->
        <v-menu v-model="accountMenuOpen" :close-on-content-click="false" location="bottom end">
          <template #activator="{ props }">
            <button
              class="icon-button account-button"
              :class="{ active: loggedIn }"
              aria-label="Account information"
              v-bind="props"
            >
              <i class="material-icons">account_circle</i>
            </button>
          </template>

          <v-card class="info-menu-card account-menu-card">
            <div class="menu-section-header">
              <div>
                <p class="menu-kicker">Account</p>
                <h3>Session details</h3>
              </div>
            </div>

            <div class="account-details-grid">
              <div class="detail-row">
                <span class="detail-label">WebID</span>
                <div class="detail-value-group">
                  <span class="detail-value mono" :title="webId || 'Not connected'">
                    {{ webId || "Not connected" }}
                  </span>
                  <button
                    v-if="webId"
                    class="copy-button"
                    aria-label="Copy WebID"
                    @click="copyText(webId)"
                  >
                    <i class="material-icons">content_copy</i>
                  </button>
                </div>
              </div>

              <div class="detail-row">
                <span class="detail-label">Selected pod</span>
                <div class="detail-value-group">
                  <span class="detail-value mono" :title="selectedPodUrl || 'No pod selected'">
                    {{ selectedPodUrl || "No pod selected" }}
                  </span>
                  <button
                    v-if="selectedPodUrl"
                    class="copy-button"
                    aria-label="Copy selected pod URL"
                    @click="copyText(selectedPodUrl)"
                  >
                    <i class="material-icons">content_copy</i>
                  </button>
                </div>
              </div>

              <div class="detail-row compact">
                <span class="detail-label">Pod host</span>
                <span class="detail-value">{{ podHost || "N/A" }}</span>
              </div>

              <div class="detail-row compact">
                <span class="detail-label">Current page</span>
                <span class="detail-value">{{ activeRouteName }}</span>
              </div>
            </div>

            <div class="menu-actions">
              <button v-if="!loggedIn" class="menu-action-button" @click="LoginpageRedir">
                Login
              </button>
              <button v-else class="menu-action-button danger" @click="userLogout">
                Logout
              </button>
              <button class="menu-action-button ghost" @click="accountMenuOpen = false">
                Close
              </button>
            </div>
          </v-card>
        </v-menu>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import ThemeSwitch from "./ThemeSwitch.vue";
import { useAuthStore } from "../../stores/auth";
import {
  handleRedirectAfterPageLoad,
  redirectToLogin,
  logOut,
} from "../../services/solid/login";
import {
  getSharedWithMe,
  getUnreadSharedWithMeNotifications,
  saveNewAccessTime,
  sharedSomething,
  sortSharedNotificationsByNewest,
} from "../../services/solid/privacyEdit";

export default {
  components: {
    ThemeSwitch,
  },
  data() {
    return {
      logoUrl: new URL("../../assets/solid-cockpit-logo.png", import.meta.url)
        .href as string,
      accountMenuOpen: false as boolean,
      notificationsMenuOpen: false as boolean,
      loginStatusIntervalId: null as number | null,
      notificationPollIntervalId: null as number | null,
      notificationRefreshTimerId: null as number | null,
      unreadNotifications: [] as sharedSomething[],
      notificationsLoading: false as boolean,
      notificationLoadError: "" as string,
      lastNotificationSync: null as string | null,
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
    loggedIn() {
      return this.authStore.loggedIn;
    },
    webId() {
      return this.authStore.webId;
    },
    selectedPodUrl() {
      return this.authStore.selectedPodUrl;
    },
    hasUnreadNotifications() {
      return this.unreadNotifications.length > 0;
    },
    unreadNotificationCount() {
      return this.unreadNotifications.length;
    },
    canLoadNotifications() {
      return this.loggedIn && this.selectedPodUrl !== "";
    },
    activeRouteName() {
      return (this.$route?.name as string) || "Unknown";
    },
    podHost() {
      if (!this.selectedPodUrl) {
        return "";
      }
      try {
        return new URL(this.selectedPodUrl).host;
      } catch (err) {
        return this.selectedPodUrl;
      }
    },
    notificationStatusMessage() {
      if (!this.loggedIn) {
        return "Sign in to load privacy notifications.";
      }
      if (!this.selectedPodUrl) {
        return "Select a pod to load privacy notifications.";
      }
      if (this.lastNotificationSync) {
        return `Last checked ${this.formatDate(this.lastNotificationSync)}.`;
      }
      return "Notifications are shown from your sharedWithMe log.";
    },
  },
  methods: {
    async userLogout(): Promise<void> {
      const authStore = useAuthStore();
      authStore.clearAuth();
      await logOut();
      window.location.href = "https://knowledgeonwebscale.github.io/solid-cockpit/";
    },
    LoginpageRedir(): void {
      redirectToLogin();
    },
    async loginCheck(): Promise<void> {
      await handleRedirectAfterPageLoad();
    },
    copyText(text: string) {
      navigator.clipboard.writeText(text);
    },
    formatDate(dateInput: string) {
      const date = new Date(dateInput);
      if (Number.isNaN(date.getTime())) {
        return dateInput;
      }
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    getNotificationResource(item: sharedSomething) {
      return item.usersSharedWith?.[0]?.resourceUrl || item.resourceHash || "Unknown resource";
    },
    containerCheck(itemUrl: string) {
      return itemUrl.endsWith("/");
    },
    getModeLabel(mode: string) {
      return mode.split("#")[1] ?? mode;
    },
    async refreshNotifications() {
      if (!this.canLoadNotifications) {
        this.unreadNotifications = [];
        this.notificationLoadError = "";
        return;
      }

      this.notificationsLoading = true;
      this.notificationLoadError = "";
      try {
        const sharedData = await getSharedWithMe(this.selectedPodUrl);
        this.unreadNotifications = sortSharedNotificationsByNewest(
          getUnreadSharedWithMeNotifications(sharedData)
        );
        this.lastNotificationSync = new Date().toISOString();
      } catch (error) {
        this.unreadNotifications = [];
        this.notificationLoadError =
          "Unable to load notifications right now.";
      } finally {
        this.notificationsLoading = false;
      }
    },
    /**
     * Debounces repeated refresh triggers from auth/pod state changes.
     */
    scheduleRefreshNotifications() {
      if (this.notificationRefreshTimerId !== null) {
        window.clearTimeout(this.notificationRefreshTimerId);
      }
      this.notificationRefreshTimerId = window.setTimeout(() => {
        this.notificationRefreshTimerId = null;
        this.refreshNotifications();
      }, 120);
    },
    async markNotificationsReadFromHeader() {
      if (!this.canLoadNotifications || !this.hasUnreadNotifications) {
        return;
      }

      const success = await saveNewAccessTime(this.selectedPodUrl);
      if (success) {
        await this.refreshNotifications();
      }
    },
    openPrivacyNotifications() {
      this.notificationsMenuOpen = false;
      this.accountMenuOpen = false;
      this.$router.push({
        name: "Data Privacy",
        query: {
          view: "sharedWithMe",
        },
      });
    },
    openNotificationInPrivacy() {
      this.openPrivacyNotifications();
    },
  },
  async mounted() {
    await this.loginCheck();
    await this.refreshNotifications();

    // Keep auth state in sync with external login redirects.
    this.loginStatusIntervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      this.loginCheck();
    }, 30000);

    // Keep unread notification badge fresh across pages.
    this.notificationPollIntervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      this.refreshNotifications();
    }, 45000);
  },
  beforeUnmount() {
    if (this.loginStatusIntervalId !== null) {
      window.clearInterval(this.loginStatusIntervalId);
      this.loginStatusIntervalId = null;
    }
    if (this.notificationPollIntervalId !== null) {
      window.clearInterval(this.notificationPollIntervalId);
      this.notificationPollIntervalId = null;
    }
    if (this.notificationRefreshTimerId !== null) {
      window.clearTimeout(this.notificationRefreshTimerId);
      this.notificationRefreshTimerId = null;
    }
  },
  watch: {
    loggedIn() {
      this.scheduleRefreshNotifications();
    },
    selectedPodUrl() {
      this.scheduleRefreshNotifications();
    },
  },
};
</script>

<style scoped>
.header-card {
  margin: 0;
  background: var(--panel);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 75%, transparent);
}
.header-container {
  margin: 0;
  padding: 0.72rem 1.15rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}
.brand-area {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.brand-area h1 {
  margin: 0;
  color: var(--text-primary);
  font-family: "Orbitron", sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.1;
}
.brand-area img {
  width: 56px;
  height: auto;
}

.header-right {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}
.theme-change {
  display: inline-flex;
  align-items: center;
}

.session-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.34rem 0.64rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--panel-elev);
  color: var(--text-muted);
  font-family: "Oxanium", monospace;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}
.session-indicator.active {
  background: color-mix(in srgb, var(--primary) 12%, var(--panel-elev));
  color: var(--text-secondary);
}
.session-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--gray-500);
}
.session-indicator.active .session-dot {
  background: var(--success);
}

.icon-button {
  position: relative;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 75%, var(--primary) 25%);
  background: color-mix(in srgb, var(--panel-elev) 86%, transparent);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.16s ease, background-color 0.16s ease;
}
.icon-button:hover {
  background: color-mix(in srgb, var(--primary) 16%, var(--panel-elev));
  transform: translateY(-1px);
}
.icon-button .material-icons {
  font-size: 1.38rem;
  line-height: 1;
}
.notifications-button.active,
.account-button.active {
  border-color: color-mix(in srgb, var(--primary) 50%, var(--border));
  background: color-mix(in srgb, var(--primary) 18%, var(--panel-elev));
}
.icon-badge {
  position: absolute;
  top: -0.22rem;
  right: -0.22rem;
  min-width: 1.08rem;
  height: 1.08rem;
  padding: 0 0.2rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--danger) 72%, #a01010 28%);
  color: var(--main-white);
  font-size: 0.62rem;
  font-family: "Oxanium", monospace;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--main-white) 70%, transparent);
}

.info-menu-card {
  width: min(36rem, 92vw);
  padding: 0.72rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: linear-gradient(
    155deg,
    color-mix(in srgb, var(--panel) 96%, var(--primary) 4%),
    var(--panel)
  ) !important;
  color: var(--text-secondary);
}
.menu-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.42rem;
}
.menu-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  font-family: "Oxanium", monospace;
  color: var(--text-muted);
}
.menu-section-header h3 {
  margin: 0.12rem 0 0 0;
  font-size: 1rem;
  font-family: "Oxanium", monospace;
  font-weight: 700;
  color: var(--text-primary);
}
.status-pill {
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
  border: 1px solid var(--border);
  color: var(--text-muted);
  background: color-mix(in srgb, var(--panel-elev) 90%, transparent);
  font-size: 0.72rem;
  font-family: "Oxanium", monospace;
  font-weight: 700;
  white-space: nowrap;
}
.status-pill.active {
  border-color: color-mix(in srgb, var(--primary) 48%, var(--border));
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, var(--panel-elev));
}
.menu-hint {
  margin: 0 0 0.55rem 0;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.4;
  font-family: "Oxanium", monospace;
}
.menu-empty-state {
  border: 1px dashed color-mix(in srgb, var(--border) 82%, var(--primary) 18%);
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-family: "Oxanium", monospace;
}
.menu-empty-state.error {
  border-color: color-mix(in srgb, var(--danger) 45%, var(--border));
  color: color-mix(in srgb, var(--danger) 65%, var(--text-secondary));
}

.share-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.45rem;
  max-height: 16rem;
  overflow: auto;
}
.notification-card {
  border: 1px solid color-mix(in srgb, var(--border) 78%, var(--primary) 22%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--panel-elev) 88%, transparent);
}
.notification-card-button {
  width: 100%;
  text-align: left;
  border: none;
  border-radius: inherit;
  background: transparent;
  padding: 0.7rem 0.78rem;
  display: grid;
  gap: 0.55rem;
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}
.notification-card-button:hover {
  background: color-mix(in srgb, var(--primary) 10%, var(--panel-elev));
}
.notification-card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.notification-type-icon {
  font-size: 1.3rem;
  flex: 0 0 auto;
}
.mono {
  font-family: "Oxanium", ui-monospace, SFMono-Regular, Menlo, Consolas,
    monospace;
}
.resource-hash {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.not-colored {
  color: var(--text-secondary);
}
.user-rows {
  display: grid;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.user-row {
  display: grid;
  gap: 0.35rem;
}
.cell-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.45rem 0.8rem;
}
.cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.35;
}
.user .truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: min(18rem, 48vw);
}
.date {
  color: var(--text-muted);
  white-space: nowrap;
}
.notification-mode-chips {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: 0;
}
.notification-mode-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.45rem;
  border-radius: 999px;
  border: 1px solid
    color-mix(in srgb, var(--accent-700, #6c63ff), transparent 55%);
  background: color-mix(in srgb, var(--accent-700, #6c63ff), transparent 88%);
  font-weight: 700;
  font-size: 0.76rem;
  margin: 0;
  color: var(--yasqe-keyword);
}
.material-icons.tiny {
  font-size: 1rem;
}

.account-details-grid {
  display: grid;
  gap: 0.45rem;
}
.detail-row {
  display: grid;
  gap: 0.2rem;
  padding: 0.5rem 0.58rem;
  border: 1px solid color-mix(in srgb, var(--border) 82%, var(--primary) 18%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--panel-elev) 88%, transparent);
}
.detail-row.compact {
  gap: 0.25rem;
}
.detail-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  font-family: "Oxanium", monospace;
  color: var(--text-muted);
  font-weight: 700;
}
.detail-value-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}
.detail-value {
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 0.84rem;
  line-height: 1.35;
}
.detail-value.mono {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-button {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 75%, var(--primary) 25%);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.copy-button .material-icons {
  font-size: 1rem;
}
.copy-button:hover {
  background: color-mix(in srgb, var(--primary) 12%, var(--panel));
  color: var(--text-primary);
}

.menu-actions {
  margin-top: 0.64rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}
.menu-action-button {
  padding: 0.42rem 0.7rem;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--primary) 40%, var(--border));
  background: color-mix(in srgb, var(--primary) 14%, var(--panel-elev));
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 0.84rem;
  font-weight: 700;
}
.menu-action-button:hover {
  background: color-mix(in srgb, var(--primary) 22%, var(--panel-elev));
}
.menu-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.menu-action-button.ghost {
  background: color-mix(in srgb, var(--panel-elev) 92%, transparent);
}
.menu-action-button.danger {
  border-color: color-mix(in srgb, var(--danger) 48%, var(--border));
  background: color-mix(in srgb, var(--danger) 18%, var(--panel-elev));
}

@media (max-width: 980px) {
  .brand-area h1 {
    font-size: 1.38rem;
  }
  .session-indicator {
    display: none;
  }
}

@media (max-width: 760px) {
  .header-container {
    padding: 0.58rem 0.7rem;
  }
  .brand-area img {
    width: 44px;
  }
  .brand-area h1 {
    font-size: 1.1rem;
  }
  .header-right {
    gap: 0.42rem;
  }
  .icon-button {
    width: 2.15rem;
    height: 2.15rem;
  }
  .info-menu-card {
    width: min(25rem, 94vw);
    padding: 0.65rem;
  }
  .menu-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>

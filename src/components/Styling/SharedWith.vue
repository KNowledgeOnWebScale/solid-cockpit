<template>
  <div class="shared-container">
    <div class="with-me" v-if="currentOperation === 'sharedWithMe'">
      <span class="shared-title">Shared With Me</span>

      <!-- Iterates over list of shared hashes in sharedWithMe.tll -->
      <li v-for="(item, index) in sharedMeItems" :key="index">
        <div class="card-panel folder">
          <div class="folder-header">
            <button @click="toggleItem(index)" class="icon-button full-width">
              <div class="icon-hash">
                <i class="material-icons not-colored">{{
                  containerCheck(item.usersSharedWith[0].resourceUrl)
                    ? "folder"
                    : "description"
                }}</i>
                <span class="resource-hash">{{
                  item.usersSharedWith[0].resourceUrl ===
                  "http://xmlns.com/foaf/0.1/Agent"
                    ? "Public"
                    : item.usersSharedWith[0].resourceUrl
                }}</span>
              </div>
              <i class="material-icons not-colored info-icon">
                {{
                  showItemIndex === index
                    ? "keyboard_arrow_down info"
                    : "chevron_right info"
                }}</i
              >
            </button>
          </div>

          <!-- The Users Resource is shared with -->
          <div class="shared-with" v-if="showItemIndex === index">
            <div class="specific-access">
              <!-- The user that shared the resource -->
              <div class="shared-with-item">
                <span class="shared-with-title">Owner: <br /></span>
                <div class="icon-hash">
                  <i class="material-icons not-colored left">{{ "person" }}</i>
                  <a class="the-user">{{ item.owner }}</a>
                </div>
              </div>

              <!-- The information about this User's access -->
              <div class="shared-with-item">
                <span class="shared-with-title">Access Modes: <br /></span>
                <div class="icon-hash">
                  <i class="material-icons not-colored left">{{ "lock" }}</i>
                  <li v-for="(ac, ind) in item.usersSharedWith[0].accessModes">
                    <a class="the-user">{{ ac }}</a>
                  </li>
                </div>
              </div>

              <!-- When these access rights were given -->
              <div class="shared-with-item">
                <span class="shared-with-title">Date: <br /></span>
                <div class="icon-hash">
                  <i class="material-icons not-colored left">{{
                    "schedule"
                  }}</i>
                  <span class="the-user"
                    ><i>{{ item.usersSharedWith[0].created }}</i></span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </div>

    <div class="with-others" v-if="currentOperation === 'sharedWithOthers'">
      <span class="shared-title">Shared With Others</span>

      <!-- Iterates over list of resources in sharedWithOthers.tll -->
      <li v-for="(item, index) in sharedItems" :key="index">
        <div class="card-panel folder">
          <div class="folder-header">
            <button @click="toggleItem(index)" class="icon-button full-width">
              <div class="icon-hash">
                <i class="material-icons not-colored left">{{
                  containerCheck(item.resourceHash) ? "folder" : "description"
                }}</i>
                <span class="resource-hash">{{ item.resourceHash }}</span>
              </div>
              <i class="material-icons not-colored info-icon">
                {{
                  showItemIndex === index
                    ? "keyboard_arrow_down info"
                    : "chevron_right info"
                }}</i
              >
            </button>
          </div>

          <!-- The Users Resource is shared with -->
          <div class="shared-with" v-if="showItemIndex === index">
            <span class="users-title">Shared with Users: <br /></span>
            <!-- List of all Users -->
            <div class="user-list">
              <li
                class="shared-with-item"
                v-for="(mode, i) in item.usersSharedWith"
                :key="i"
              >
                <!-- The user that shared the resource -->
                <div class="specific-access">
                  <button
                    @click="toggleUser(i)"
                    class="user-icon-button full-width"
                  >
                    <div class="icon-hash">
                      <i class="material-icons not-colored left">{{
                        "person"
                      }}</i>
                      <span class="query-hash">{{
                        mode.sharedWith === "http://xmlns.com/foaf/0.1/Agent"
                          ? "Public"
                          : mode.sharedWith
                      }}</span>
                    </div>
                    <i class="material-icons not-colored info-icon">
                      {{
                        showUserIndex === i
                          ? "keyboard_arrow_down info"
                          : "chevron_right info"
                      }}</i
                    >
                  </button>

                  <!-- The information about this User's access -->
                  <div
                    class="expandable-item"
                    v-if="showUserIndex === i && showItemIndex === index"
                  >
                    <!-- Access modes for this user -->
                    <span class="shared-with-title">Access Modes <br /></span>
                    <div class="shared-with-item">
                      <div class="icon-hash">
                        <i class="material-icons not-colored left">{{
                          "lock"
                        }}</i>
                        <li
                          class="access-modes-items"
                          v-for="(ac, ind) in mode.accessModes"
                          :key="i"
                        >
                          <a class="the-user">{{ ac }}</a>
                        </li>
                      </div>
                    </div>

                    <!-- When these access rights were given -->
                    <span class="shared-with-title">Date: <br /></span>
                    <div class="shared-with-item">
                      <div class="icon-hash">
                        <i class="material-icons not-colored left">{{
                          "schedule"
                        }}</i>
                        <span class="the-user"
                          ><i>{{ mode.created }}</i></span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </div>
          </div>
        </div>
      </li>
    </div>
  </div>
</template>

<script lang="ts">
import { toRaw } from "vue";
import {
  sharedSomething,
  getSharedWithMe,
  getSharedWithOthers,
} from "../privacyEdit";
import { getStoredTtl } from "../queryPod";

export default {
  props: {
    currentOperation: {
      type: String,
      required: true,
    },
    currentPod: {
      type: String,
      required: true,
    },
    currentWebId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      sharedItems: [] as sharedSomething[],
      sharedMeItems: [] as sharedSomething[],
      showItemIndex: null as number | null,
      showUserIndex: null as number | null,
      foundDoc: false as boolean,
      showRetrievedQuery: false,
      showRetrievedResults: false,
      retrievedQuery: null as string | null,
      retrievedResults: null as string | null,
    };
  },
  methods: {
    // details about a specific query
    async toggleItem(index) {
      this.showItemIndex = this.showItemIndex === index ? null : index;
      await this.loadFileTtl();
    },
    // details about a specific user
    toggleUser(indexTwo) {
      this.showUserIndex = this.showUserIndex === indexTwo ? null : indexTwo;
    },
    /*
    Checks if the input item url is a container
    */
    containerCheck(itemUrl: string) {
      return itemUrl.endsWith("/");
    },
    /*
    Fetches the sharedWith data from the user's inbox/
    */
    async loadFileTtl() {
      this.foundDoc = await getStoredTtl(
        this.currentPod + "inbox/" + this.currentOperation + ".ttl"
      );
      if (this.foundDoc) {
        if (this.currentOperation === "sharedWithOthers") {
          try {
            const sharedItemsThings = await getSharedWithOthers(
              this.currentPod,
              this.currentWebId
            );
            this.sharedItems = await toRaw(sharedItemsThings);
          } catch (err) {
            console.error("Error fetching shared items:", err);
          }
        }
      }
      if (this.currentOperation === "sharedWithMe") {
        try {
          const sharedItemsThings = await getSharedWithMe(this.currentPod);
          this.sharedMeItems = await toRaw(sharedItemsThings);
        } catch (err) {
          console.error("Error fetching shared items:", err);
        }
      }
    },
  },
  mounted() {
    this.loadFileTtl();
  },
};
</script>

<style scoped>
/* sharedWithMe and sharedWithOthers Display */
.shared-container {
  width: 100%;
  font-family: "Oxanium", monospace;
  padding: 0.5rem;
}
.shared-container li {
  list-style: none;
  padding: 0;
}
.shared-title {
  font-size: 24px;
  font-weight: bold;
  color: #ede7f6;
  margin-bottom: 20px;
}
/* Query List Items */
ul {
  list-style: none;
  padding: 0;
}
/* Query Card */
.folder {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #28353e;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  transition: all 0.3s ease-in-out;
}
.folder:hover {
  background-color: #37474f;
  cursor: pointer;
}
/* Folder Header */
.folder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: large;
  font-family: "Oxanium", monospace;
}
/* Icon Button */
.icon-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%; /* Make button cover full width */
  padding: 12px 16px; /* Add padding for better click area */
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: "Oxanium", monospace;
  font-size: large;
  font-weight: 600;
  color: white;
  transition: background 0.3s ease-in-out;
}
.user-icon-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%; /* Make button cover full width */
  padding: 0.5rem 0.7rem; /* Add padding for better click area */
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: "Oxanium", monospace;
  font-size: large;
  font-weight: 600;
  color: white;
  transition: background 0.3s ease-in-out;
}
/* Ensure full-width coverage */
.full-width {
  width: 100%;
  height: 100%;
  display: flex;
}
/* Icon & Query Text Layout */
.icon-hash {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
/* Ensures icons align correctly */
.material-icons {
  font-size: 24px;
}
/* Ensures the info icon is at the right */
.info-icon {
  margin-left: auto;
}
/* Query Title */
.query-title {
  flex-grow: 1;
  text-align: left;
  padding-left: 10px;
  color: #ede7f6;
}
.card-panel .not-colored {
  color: #ede7f6;
}
/* Item Details (Hidden by Default) */
.specific-access {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  padding: 0.8rem;
  margin: 1rem 0;
  border-radius: 5px;
  color: white;
}
/* Users Details Spacing */
.specific-access div {
  padding: 8px;
}
.specific-access div:last-child {
  border-bottom: none;
}
.access-modes-items {
  margin-left: 0;
}
/* Query Labels */
.user-tag {
  font-weight: bold;
  color: #ede7f6;
}
/* File Data */
.the-user {
  color: #90caf9;
  font-style: italic;
}
.shared-with-item {
  margin: 0 0 0.3rem 0;
}
.expandable-item {
  margin: 0;
}
.shared-with {
  margin-top: 0.5rem;
}
.user-list {
  margin: 0;
}
/* Query Sources */
.shared-with ul {
  padding-left: 20px;
}
.shared-with-title {
  font-weight: bold;
  font-size: 12pt;
}
.users-title {
  font-weight: bold;
  font-size: 12pt;
  margin-top: 1rem;
}
.shared-with a {
  color: #ffab40;
  text-decoration: none;
}
.shared-with a:hover {
  text-decoration: underline;
}
</style>

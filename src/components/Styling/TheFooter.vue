<template>
  <br>
  <footer class="app-footer">
    <div class="copyright">
      <span class="copyright-item">Copyright</span>
      <span class="copyright-item">©</span>
      <span class="copyright-item">2024 - present</span> 
      <span class="copyright-item">
        <a
          href="https://knows.idlab.ugent.be/"
          target="_blank"
          rel="noopener noreferrer"
        >KNoWS, IDLab - Ghent University, Belgium</a>
      </span>
    </div>
    <div class="footer-content">
      <span class="footer-item" v-if="lastModified">
        Last Modified: {{ lastModified }}
      </span>
      <span class="footer-item">|</span>
      <span class="footer-item">
        <a
          href="https://github.com/KNowledgeOnWebScale/solid-cockpit"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source Code
        </a>
      </span>
      <span class="footer-item">|</span>
      <span class="footer-item">
        <a
          href="https://www.linkedin.com/in/elias-crum-413178142/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact
        </a>
      </span>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AppFooter",
  data() {
    return {
      lastModified: "" as string,
    };
  },
  mounted() {
    // Fetch the last commit info from GitHub
    fetch("https://api.github.com/repos/KNowledgeOnWebScale/solid-cockpit/commits")
      .then((response: Response) => response.json())
      .then((data: Array<{ commit: { committer: { date: string } } }>) => {
        if (data && data.length > 0) {
          // Get the date from the most recent commit
          const lastPushDate = new Date(data[0].commit.committer.date);
          // Format the date as needed (here: local date string)
          this.lastModified = lastPushDate.toISOString().split("T")[0];
        }
      })
      .catch((error: Error) => console.error("Error fetching last commit date:", error));
  },
});
</script>

<style scoped>
.app-footer {
  width: 100%;
  font-size: 0.8rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #445560;
  color: #EDE7F6;
  z-index: 1000;
  font-family: Oxanium;
  font-weight: 700;
  border-radius: 4px;
  margin-top: auto;
}
.copyright {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: 60%;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem 1rem;
}
.copyright-item {
  display: flex;
  justify-content: space-evenly;
}
.copyright-content {
  justify-content: center;
}
.copyright a {
  color: inherit;
  text-decoration: none;
}
.footer-content {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: 70%;
  margin: 0 auto;
}
.footer-item + .footer-item {
  justify-content: center;
}
.footer-content a {
  color: inherit;
  text-decoration: none;
}
</style>

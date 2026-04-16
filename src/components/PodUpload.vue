<template>
  <section class="upload-page">
    <!-- Page header introduces the upload workflow and keeps the guidance short. -->
    <div class="title-container">
      <div>
        <span>Data Upload</span>
        <p class="page-summary">
          Pick a destination folder, review the selected location, and upload
          your files into your pod.
        </p>
      </div>
    </div>

    <div class="pod-chooseContainer">
      <PodRegistration />
    </div>

    <div v-if="selectedPodUrl !== ''" class="path-container">
      <div class="path-shell">
        <!-- Destination mode switch stays visible, but stacks cleanly on smaller screens. -->
        <aside class="path-mode-card">
          <p class="path-mode-title">Choose Destination</p>
          <p class="path-mode-copy">
            Either type a folder address directly or browse folders visually.
          </p>
          <div class="mode-buttons">
            <button
              :class="{ highlight: inputType === 'newPath' }"
              @click="inputType = 'newPath'"
            >
              Enter Path
            </button>
            <button
              :class="{ highlight: inputType === 'existingPath' }"
              @click="inputType = 'existingPath'"
            >
              Browse Folders
            </button>
          </div>
        </aside>

        <section class="path-workspace">
          <!-- Path chooser card adapts between manual entry and folder browsing. -->
          <div class="path-card">
            <div class="path-card-header">
              <div>
                <p class="section-kicker">Upload destination</p>
                <h3>Choose where new files are uploaded</h3>
              </div>
              <div class="path-origin">
                <span class="path-origin-label">Selected Container</span>
                <span class="path-origin-value">{{
                  normalizedUploadPath
                }}</span>
              </div>
            </div>

            <div v-if="inputType === 'newPath'" class="manual-path-layout">
              <v-text-field
                class="input-path"
                v-model="uploadPath"
                :rules="urlRules"
                label="Folder URL inside your pod"
                variant="outlined"
                clearable
                hint="Example: https://example.pod/documents/reports/"
                persistent-hint
              />
              <div class="check-path-row">
                <div class="status-pill" v-if="vaildURL === true">
                  <v-icon size="18" color="var(--success)"
                    >mdi-check-circle</v-icon
                  >
                  <span>Path looks valid and will be used for upload</span>
                </div>
                <div class="status-pill invalid" v-else-if="vaildURL === false">
                  <v-icon size="18" color="var(--error)"
                    >mdi-alert-circle</v-icon
                  >
                  <span>Enter a complete valid URL</span>
                </div>
              </div>
            </div>

            <div v-else class="browser-layout">
              <container-nav
                :currentPod="selectedPodUrl"
                @path-selected="handleSelectedContainer"
              />
            </div>
          </div>
        </section>
      </div>
    </div>

    <div class="upload-container">
      <div
        v-if="selectedPodUrl !== '' && selectedPodUrl !== undefined"
        class="upload-section"
      >
        <!-- Upload card groups file selection, action, and feedback into one flow. -->
        <div class="upload-card-header">
          <div>
            <p class="section-kicker">Files</p>
            <span class="upload-title">Add files to the selected folder</span>
          </div>
          <div class="upload-meta">
            <span>{{ files.length }} selected</span>
            <span>{{ normalizedUploadPath }}</span>
          </div>
        </div>

        <form id="writeForm">
          <v-file-input
            :key="inputKey"
            class="input-box"
            clearable
            label="Drag files here or click to choose files"
            placeholder="Select your files"
            show-size
            type="file"
            @change="uploadFile($event)"
            ref="file"
            counter
            multiple
            variant="outlined"
          >
            <template v-slot:selection="{ fileNames }">
              <template v-for="(fileName, index) in fileNames" :key="fileName">
                <v-chip
                  v-if="index < 2"
                  class="selected-file-chip"
                  color="var(--primary-100)"
                  size="small"
                  label
                >
                  {{ fileName }}
                </v-chip>

                <span v-else-if="index === 2" class="selected-file-count">
                  +{{ files.length - 2 }} more
                </span>
              </template>
            </template>
          </v-file-input>

          <div class="upload-btn-row">
            <v-btn
              class="upload-btn"
              variant="flat"
              rounded="lg"
              @click="submitUpload"
              :disabled="uploading"
            >
              Upload Files
            </v-btn>
            <span class="upload-helper">
              Files will be uploaded into the selected folder above.
            </span>
            <div v-if="uploading" class="spinner-container">
              <div class="spinner"></div>
              <span>Uploading...</span>
            </div>
          </div>

          <div v-if="!uploading" class="upload-result-row">
            <div
              v-if="selectedPodUrl === 'Error: probably not logged in'"
              class="result-message error-message"
            >
              <span>
                There was an error with the file upload.
                <v-tooltip activator="parent" location="top" open-on-click>
                  Try logging out and logging back in. If the problem continues,
                  clear browser cookies and retry.
                </v-tooltip>
                <v-icon small color="var(--primary)" class="result-info-icon">
                  mdi-information
                </v-icon>
              </span>
            </div>
            <div v-else class="result-list">
              <div
                class="check-exists"
                v-for="(f, index) in filesUploaded"
                :key="index"
              >
                <template>
                  {{ checkExists(f) }}
                </template>
                <div
                  v-if="alreadyPresent"
                  class="result-message duplicate-message"
                >
                  <span>
                    <b>{{ uploadedFiles[index].name }}</b> already exists in
                    <b>{{ uploadedPath }}</b>
                  </span>
                </div>
                <div
                  v-else-if="!uploadSuccessful"
                  class="result-message error-message"
                >
                  <span>
                    There was an error uploading
                    <b>{{ uploadedFiles[index].name }}</b> to
                    <b>{{ uploadedPath }}</b>
                  </span>
                </div>
                <div v-else class="result-message success-message">
                  <span>
                    <b>{{ uploadedFiles[index].name }}</b> was uploaded to
                    <b>{{ uploadedPath }}</b>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="use-guide">
      <DataUploadGuide />
    </div>
  </section>
</template>

<script lang="ts">
import { handleFiles, uploadSuccess, alreadyExistsCheck } from "./fileUpload";
import ContainerNav from "./ContainerNav.vue";
import PodRegistration from "./PodRegistration.vue";
import DataUploadGuide from "./Guides/DataUploadGuide.vue";
import { useAuthStore } from "../stores/auth";

export default {
  components: {
    ContainerNav,
    PodRegistration,
    DataUploadGuide,
  },
  data() {
    return {
      uploadPath: "" as string,
      filesUploaded: [],
      uploadedFiles: [] as File[],
      uploadedPath: "" as string,
      files: [] as File[],
      uploadSuccessful: false,
      alreadyPresent: false,
      uploading: false,
      inputType: "newPath",
      urlRules: [
        // Check that a value exists
        (v: string) => !!v || "URL is required",
        // Validate if the input is a proper URL using the URL constructor
        (v: string) => {
          if (this.validUrlCheck(v)) {
            return true;
          } else {
            return "Invalid URL Path";
          }
        },
      ],
      vaildURL: null as boolean | null,
      inputKey: 0,
    };
  },
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
    normalizedUploadPath() {
      if (!this.uploadPath) {
        return "No folder selected yet";
      }
      return this.uploadPath.endsWith("/")
        ? this.uploadPath
        : `${this.uploadPath}/`;
    },
  },
  methods: {
    /*
    checks if the value 'already exists' is present in this.fileUploaded
    */
    checkExists(inString: string) {
      this.alreadyPresent = alreadyExistsCheck(inString);
    },

    /*
    checks to see if an input URL is valid
    */
    validUrlCheck(u: string) {
      try {
        new URL(u);
        return true;
      } catch (e) {
        return false;
      }
    },
    /*
    Calls uploadFile() from fileUpload.ts to upload a file to the user's pod.
    obtains 'files' variable (a FileList that contains references to all files selected using the upload UI).
    */
    uploadFile(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        this.files = target.files;
      }
    },

    /*
    Calls handleFiles() from fileUpload.ts parse the files selected for upload + uploads the to the pod using the overwriteFile() method from @inrupt/solid-client.
    'files' variable is a FileList that contains references to all files selected using the upload UI.

    Method also checks if the files uploaded from submitUpload() have .name properties (which proves upload was success).
    Results in update of the uploadSuccess variable if files do have names.
    */
    async submitUpload() {
      if (!this.uploadPath.endsWith("/")) {
        this.uploadPath = this.uploadPath + "/";
      }
      if (this.files.length === 0) {
        alert("Please select a file to upload.");
        return;
      }
      this.uploadedFiles = [...this.files];
      this.uploadedPath = this.uploadPath;
      this.uploading = true;
      this.filesUploaded = await handleFiles(
        this.files,
        this.uploadPath,
        this.selectedPodUrl,
      );
      this.uploadSuccessful = uploadSuccess(this.filesUploaded);
      this.uploading = false;

      this.clearFiles();
    },

    clearFiles() {
      this.files = [];
      this.$nextTick(() => {
        this.inputKey++;
      });
    },

    /* Takes in the emitted value from ContainerNav.vue */
    handleSelectedContainer(selectedContainer: string) {
      this.uploadPath = selectedContainer;
    },
  },
  watch: {
    // Keep validation feedback in sync with manual path entry without extra clicks.
    uploadPath(newValue) {
      if (!newValue) {
        this.vaildURL = null;
        return;
      }
      this.vaildURL = this.validUrlCheck(newValue);
    },
    selectedPodUrl(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.uploadPath = this.selectedPodUrl;
      }
    },
  },
  mounted() {
    // Set initial upload path to the selected Pod URL
    if (this.selectedPodUrl !== "") {
      this.uploadPath = this.selectedPodUrl;
    }
  },
};
</script>

<style scoped>
/* Page layout: cards and spacing scale down progressively for tablet/mobile use. */
.upload-page {
  display: grid;
  gap: 0.5rem;
}
.title-container {
  background: radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--primary) 11%, transparent) 0,
      transparent 32%
    ),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--panel) 94%, var(--primary-100) 6%),
      var(--panel)
    );
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
  border-radius: 18px;
  margin: 0.5rem 0.5rem 0 0.5rem;
  padding: 1.4rem 1.5rem;
  color: var(--text-secondary);
}
.page-kicker {
  margin: 0 0 0.35rem 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-muted);
}
.title-container span {
  display: block;
  font-size: var(--font-size-page-title);
  font-family: "Oxanium", monospace;
  font-weight: var(--font-weight-page-title);
  line-height: var(--line-height-page-title);
  color: var(--text-primary);
}
.page-summary {
  margin: 0.65rem 0 0 0;
  font-size: var(--font-size-page-summary);
  max-width: 48rem;
  line-height: 1.5;
  color: var(--text-muted);
  font-family: "Oxanium", monospace;
}

.pod-chooseContainer {
  margin: 0rem 0.5rem;
}

.path-container {
  margin: 0rem 0.5rem 0.5rem 0.5rem;
}
.path-shell {
  display: grid;
  grid-template-columns: minmax(220px, 260px) 1fr;
  gap: 0.85rem;
  align-items: start;
}
.path-mode-card,
.path-card {
  background: var(--panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
  border-radius: 18px;
}
.path-mode-card {
  padding: 1rem;
  position: sticky;
  top: 1rem;
}
.path-mode-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: "Oxanium", monospace;
}
.path-mode-copy {
  margin: 0.45rem 0 0.8rem 0;
  color: var(--text-muted);
  line-height: 1.4;
  font-size: 0.94rem;
  font-family: "Oxanium", monospace;
}
.mode-buttons {
  display: grid;
  gap: 0.55rem;
}
.mode-buttons button {
  display: block;
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel-elev);
  color: var(--text-secondary);
  font-family: "Oxanium", monospace;
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
}
.mode-buttons button:hover {
  background: var(--hover);
}
.mode-buttons .highlight {
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  border-color: transparent;
  color: var(--main-white);
}
.path-workspace {
  display: grid;
  gap: 0.85rem;
}
.path-card {
  padding: 1rem 1.05rem;
  font-family: "Oxanium", monospace;
}
.path-card-header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.85rem;
  font-family: "Oxanium", monospace;
}
.section-kicker {
  margin: 0 0 0.3rem 0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
}
.path-card-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--text-primary);
}
.path-origin {
  display: grid;
  gap: 0.2rem;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--panel-elev);
  font-family: "Oxanium", monospace;
}
.path-origin-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--text-muted);
}
.path-origin-value {
  color: var(--text-secondary);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-all;
}
.manual-path-layout {
  display: grid;
  gap: 0.65rem;
}
.input-path {
  width: 100%;
}
.check-path-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.85rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--success) 16%, transparent);
  color: var(--text-secondary);
  font-weight: 600;
}
.status-pill.invalid {
  background: color-mix(in srgb, var(--error) 14%, transparent);
}
.browser-layout {
  margin-top: 0.1rem;
}

.upload-container {
  margin: 0rem 0.5rem 0.5rem 0.5rem;
  background-color: transparent;
}
.upload-section {
  font-family: "Oxanium", monospace;
  border-radius: 18px;
  background-color: var(--panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-1);
  padding: 1rem 1.05rem 1.1rem 1.05rem;
}
.upload-card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 0.8rem;
  margin-bottom: 0.85rem;
}
.upload-title {
  font-size: 1.15rem;
  font-family: "Oxanium", monospace;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}
.upload-meta {
  display: grid;
  gap: 0.2rem;
  max-width: 22rem;
  color: var(--text-muted);
  text-align: right;
  font-size: 0.9rem;
}
#writeForm {
  color: var(--text-secondary);
}
.input-box {
  width: 100%;
}
.check-exists {
  list-style-type: none;
}
.upload-btn-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.7rem;
  padding: 0.15rem 0 0.4rem 0;
}
.upload-btn {
  margin: 0;
  background: linear-gradient(135deg, var(--primary), var(--primary-600));
  color: var(--main-white);
}
.upload-helper {
  color: var(--text-muted);
  font-size: 0.92rem;
}
.spinner-container {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-left: auto;
  color: var(--text-muted);
}
.spinner {
  border: 4px solid rgba(63, 1, 117, 0.3);
  border-top: 4px solid #754ff6;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  animation: spin 1s linear infinite;
}
.upload-result-row {
  display: grid;
  gap: 0.6rem;
  margin-top: 0.45rem;
}
.upload-result-row b {
  color: var(--yasqe-operator);
}
.result-list {
  display: grid;
  gap: 0.6rem;
}
.result-message {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  font-family: "Oxanium", monospace;
  padding: 0.8rem 0.9rem;
  border-radius: 12px;
  color: var(--text-secondary);
  background: var(--panel);
}
.error-message {
  border: 1px solid color-mix(in srgb, var(--error) 50%, var(--border) 50%);
  background: color-mix(in srgb, var(--error) 10%, var(--panel) 90%);
}
.duplicate-message {
  border: 1px solid color-mix(in srgb, var(--warning) 48%, var(--border) 52%);
  background: color-mix(in srgb, var(--warning) 18%, var(--panel) 82%);
}
.success-message {
  border: 1px solid color-mix(in srgb, var(--success) 48%, var(--border) 52%);
  background: color-mix(in srgb, var(--success) 10%, var(--panel) 90%);
}
.result-info-icon {
  margin-left: 0.45rem;
  vertical-align: middle;
  cursor: pointer;
}
.selected-file-chip {
  margin-right: 0.45rem;
}
.selected-file-count {
  color: var(--text-muted);
  margin-left: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.use-guide {
  margin: 0;
}
@media (max-width: 980px) {
  /* Tablet: switch to a single-column workflow while keeping cards distinct. */
  .path-shell {
    grid-template-columns: 1fr;
  }
  .path-mode-card {
    position: static;
  }
}
@media (max-width: 760px) {
  /* Mobile: stack controls vertically and expand tap targets to full width. */
  .title-container {
    padding: 1.15rem;
  }
  .title-container span {
    font-size: var(--font-size-page-title-mobile);
  }
  .pod-chooseContainer,
  .path-container,
  .upload-container {
    margin-left: 0.35rem;
    margin-right: 0.35rem;
  }
  .path-mode-card,
  .path-card,
  .upload-section {
    border-radius: 16px;
  }
  .path-card-header,
  .upload-card-header {
    flex-direction: column;
  }
  .mode-buttons {
    grid-template-columns: 1fr;
  }
  .mode-buttons button,
  .upload-btn {
    width: 100%;
  }
  .path-origin,
  .upload-meta {
    max-width: none;
    width: 100%;
    text-align: left;
  }
  .check-path-row,
  .upload-btn-row {
    align-items: stretch;
  }
  .status-pill {
    width: 100%;
    justify-content: center;
  }
  .upload-helper {
    width: 100%;
  }
  .spinner-container {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
  .path-origin-value,
  .upload-meta span {
    word-break: break-word;
  }
}
</style>

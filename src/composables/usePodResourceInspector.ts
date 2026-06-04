import { computed, ref, watch, type Ref } from "vue";
import {
  analyzeResourceStructure,
  buildCsvPreviewTable,
  fetchResourceFullText,
  fetchResourcePreview,
  saveResourceContent,
  validateResourceContent,
  type CsvPreviewTable,
  type ResourceFormatInfo,
  type ResourceStructureSummary,
  type ResourceValidationResult,
} from "../services/solid/resourceInspector";

export function usePodResourceInspector(
  resourceUrl: Ref<string>,
  contentType: Ref<string | null>
) {
  const isOpen = ref(false);
  const previewLoaded = ref(false);
  const isLoadingPreview = ref(false);
  const isLoadingFull = ref(false);
  const isEditing = ref(false);
  const isSaving = ref(false);
  const previewExpanded = ref(false);
  const previewText = ref("");
  const fullText = ref("");
  const editedText = ref("");
  const previewTruncated = ref(false);
  const previewBytes = ref(0);
  const errorMessage = ref("");
  const saveMessage = ref("");
  const formatInfo = ref<ResourceFormatInfo>({
    format: null,
    label: "Unknown",
    contentType: null,
    editable: false,
    supported: false,
  });
  const validation = ref<ResourceValidationResult | null>(null);
  const csvPreview = ref<CsvPreviewTable | null>(null);
  const structureSummary = ref<ResourceStructureSummary | null>(null);
  // Debounced validation avoids reparsing larger files on every keystroke.
  let validationTimer: ReturnType<typeof setTimeout> | null = null;

  function resetState() {
    if (validationTimer !== null) {
      clearTimeout(validationTimer);
      validationTimer = null;
    }
    isOpen.value = false;
    previewLoaded.value = false;
    isLoadingPreview.value = false;
    isLoadingFull.value = false;
    isEditing.value = false;
    isSaving.value = false;
    previewExpanded.value = false;
    previewText.value = "";
    fullText.value = "";
    editedText.value = "";
    previewTruncated.value = false;
    previewBytes.value = 0;
    errorMessage.value = "";
    saveMessage.value = "";
    validation.value = null;
    csvPreview.value = null;
    structureSummary.value = null;
  }

  async function runValidation(text: string) {
    validation.value = await validateResourceContent(formatInfo.value, text);
    csvPreview.value =
      formatInfo.value.format === "csv" ? buildCsvPreviewTable(text) : null;
    structureSummary.value = analyzeResourceStructure(formatInfo.value, text);
  }

  async function loadPreview() {
    isLoadingPreview.value = true;
    errorMessage.value = "";
    saveMessage.value = "";
    try {
      const preview = await fetchResourcePreview(resourceUrl.value);
      previewLoaded.value = true;
      previewText.value = preview.text;
      previewTruncated.value = preview.truncated;
      previewBytes.value = preview.byteLength;
      formatInfo.value = {
        ...preview.formatInfo,
        contentType: preview.formatInfo.contentType || contentType.value,
      };
      await runValidation(preview.text);
      previewExpanded.value = false;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "Could not load file preview.";
    } finally {
      isLoadingPreview.value = false;
    }
  }

  async function toggleOpen() {
    isOpen.value = !isOpen.value;
    if (isOpen.value && !previewLoaded.value && !isLoadingPreview.value) {
      await loadPreview();
    }
  }

  async function enterEditMode() {
    if (!previewLoaded.value) {
      await loadPreview();
    }
    isLoadingFull.value = true;
    errorMessage.value = "";
    try {
      const full = await fetchResourceFullText(resourceUrl.value);
      fullText.value = full.text;
      editedText.value = full.text;
      previewBytes.value = full.byteLength;
      previewTruncated.value = false;
      formatInfo.value = {
        ...full.formatInfo,
        contentType: full.formatInfo.contentType || contentType.value,
      };
      isEditing.value = true;
      await runValidation(full.text);
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "Could not load full file for editing.";
    } finally {
      isLoadingFull.value = false;
    }
  }

  function cancelEdit() {
    isEditing.value = false;
    previewExpanded.value = false;
    editedText.value = fullText.value;
    saveMessage.value = "";
    errorMessage.value = "";
    void runValidation(fullText.value || previewText.value);
  }

  function togglePreviewExpansion() {
    previewExpanded.value = !previewExpanded.value;
  }

  function scheduleValidation() {
    if (validationTimer !== null) {
      clearTimeout(validationTimer);
    }

    validationTimer = setTimeout(() => {
      void runValidation(editedText.value);
    }, 450);
  }

  async function saveEdits() {
    if (!isEditing.value) {
      return;
    }

    isSaving.value = true;
    errorMessage.value = "";
    saveMessage.value = "";

    try {
      const currentValidation = await validateResourceContent(
        formatInfo.value,
        editedText.value
      );
      validation.value = currentValidation;
      if (!currentValidation.valid) {
        errorMessage.value = "Fix validation issues before saving this file.";
        return;
      }

      await saveResourceContent(resourceUrl.value, editedText.value, formatInfo.value);
      fullText.value = editedText.value;
      previewText.value = editedText.value;
      previewTruncated.value = false;
      saveMessage.value = "Saved changes to the pod resource.";
      isEditing.value = false;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "Could not save resource changes.";
    } finally {
      isSaving.value = false;
    }
  }

  watch(resourceUrl, () => {
    resetState();
  });

  const displayText = computed(() =>
    isEditing.value ? editedText.value : previewText.value
  );

  return {
    isOpen,
    previewLoaded,
    isLoadingPreview,
    isLoadingFull,
    isEditing,
    isSaving,
    previewExpanded,
    previewText,
    previewTruncated,
    previewBytes,
    displayText,
    editedText,
    errorMessage,
    saveMessage,
    formatInfo,
    validation,
    csvPreview,
    structureSummary,
    toggleOpen,
    loadPreview,
    enterEditMode,
    cancelEdit,
    togglePreviewExpansion,
    scheduleValidation,
    saveEdits,
  };
}

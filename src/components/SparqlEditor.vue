<template>
  <div class="sparql-editor-container">
    <!-- Main controls and Yasgui container -->
    <div style="width: 100%;">
      <a id="status-link" href="" target="_blank" title="Loading..." 
         style="display: inline-flex; width: 16px; height: 16px;">
        <div id="status-light" 
             style="width: 10px; height: 10px; background-color: purple; border-radius: 50%; margin: 0 auto;"></div>
      </a>
      <button id="sparql-add-prefixes-btn" class="btn top-btn" 
              title="Add prefixes commonly used in the selected endpoint to the query">
        Add common prefixes
      </button>
      <button id="sparql-save-example-btn" class="btn top-btn" 
              title="Save the current query as example">
        Save query as example
      </button>
      <button id="sparql-examples-top-btn" class="btn top-btn" 
              title="Browse examples available for the selected endpoint">
        Browse examples
      </button>
      <button id="sparql-cls-overview-btn" class="btn top-btn" 
              title="Overview of classes and their relations in the endpoint">
        Classes overview
      </button>
      <button id="sparql-clear-cache-btn" class="btn top-btn" 
              title="Clear and update the endpoints metadata stored in the cache">
        Clear cache
      </button>
      <button id="sparql-toggle-examples-btn" class="btn top-btn" 
              title="Toggle display of the examples panel">
        Toggle examples
      </button>
      <div id="yasgui" ref="yasguiContainer"></div>
    </div>

    <!-- Overview dialog rendered via Vue -->
    <dialog v-if="overviewDialogVisible" open class="overview-dialog" style="width: 100%; height: 100%;">
      <div style="height: 100%;">
        <!-- Pass the current endpoint URL to the overview component -->
        <Sparql-overview id="sparql-overview-component" :endpoint="endpoint" />
      </div>
      <button class="btn" @click="closeOverview" 
              style="position: fixed; top: 1.5em; right: 2em;">Close</button>
    </dialog>

    <!-- Save Example dialog rendered via Vue -->
    <dialog v-if="saveExampleDialogVisible" open class="save-example-dialog" 
            style="max-width: 600px; padding: 1em; border-radius: 8px; border: 1px solid #cccccc;">
      <form id="example-form" @submit.prevent="onSaveExampleSubmit">
        <h3>Save query as example</h3>
        <p>
          Download the current query as an example in a Turtle file that you can then submit to the repository.
        </p>
        <label for="description">Description:</label><br>
        <input type="text" v-model="exampleForm.description" id="description" name="description" required
               style="width: 100%;" maxlength="200"><br><br>
        <label for="example-uri">
          Query example filename and URI (no spaces):
        </label><br>
        <input type="text" v-model="exampleForm.exampleUri" id="example-uri" name="example-uri" required
               pattern="^[a-zA-Z0-9_\-]+$"
               title="Only alphanumeric characters, underscores, or hyphens are allowed."
               style="width: 100%;" placeholder="Enter a valid filename"><br><br>
        <label for="keywords">Keywords (optional, comma separated):</label><br>
        <input type="text" v-model="exampleForm.keywords" id="keywords" name="keywords" style="width: 100%;"><br><br>
        <div align="center">
          <button type="submit" class="btn">Download example file</button>
          <button v-if="examplesRepoAddUrl" type="button" class="btn" @click="onAddToRepo">
            Add example to repository
          </button>
          <button type="button" class="btn" @click="onCopyToClipboard">
            Copy to clipboard
          </button>
          <button type="button" class="btn" @click="closeSaveExampleDialog">
            Cancel
          </button>
        </div>
      </form>
    </dialog>

    <!-- Examples dialog rendered via Vue -->
    <dialog v-if="examplesDialogVisible" open class="examples-dialog" 
            style="width: 100%; height: 100%; background-color: #f5f5f5; border-radius: 10px;">
      <input type="text" placeholder="Search examples..." class="sparql-search-examples-input" 
            v-model="examplesSearch" @input="onExamplesSearch">
      <button class="btn closeBtn" @click="closeExamplesDialog" 
              style="position: fixed; top: 1.5em; right: 2em;">Close</button>
      <div v-for="example in filteredExamplesList" :key="example.index" class="example-item">
        <p style="font-size: 0.9em;" v-html="example.index + '. ' + example.comment"></p>
        <button class="btn" @click="useExample(example)">Use</button>
        <pre style="border-radius: 10px; background-color: #cccccc; padding: 0.1em;">
          <code class="language-sparql hljs" v-html="highlightSparql(example.query)"></code>
        </pre>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, nextTick } from 'vue';
import Yasgui from "@zazuko/yasgui";
import { AutocompletionToken } from "@zazuko/yasqe/build/ts/src/autocompleters";
import hljs from "highlight.js/lib/core";
import { hljsDefineTurtle, hljsDefineSparql } from "./SIB-sparql-editor/sparql-editor/highlight-sparql";
import { editorCss, yasguiCss, yasguiGripInlineCss, highlightjsCss } from "./SIB-sparql-editor/sparql-editor/styles";
import {
  extractAllSubjectsAndTypes,
  getSubjectForCursorPosition,
  getExampleQueries,
  getPrefixes,
  getVoidDescription,
  EndpointsMetadata,
  getServiceUriForCursorPosition,
  compressUri,
  defaultPrefixes,
  generateTabLabel,
  getClassesFallback,
  getPredicatesFallback,
  createUseButton,
} from "./SIB-sparql-editor/sparql-editor/utils";
import SparqlOverview from "../sparql-overview/sparql-overview.vue";

export default defineComponent({
  name: "SparqlEditor",
  props: {
    // The SPARQL endpoint(s) (comma-separated if more than one)
    endpoint: { type: String, required: true },
    defaultMethod: { type: String, default: "GET" },
    addLimit: { type: Number, default: null },
    examplesOnMainPage: { type: Number, default: 8 },
    examplesRepoAddUrl: { type: String, default: "" },
    examplesRepository: { type: String, default: "" },
    examplesNamespace: { type: String, default: "" }
  },
  setup(props) {
    // Refs for DOM elements
    const yasguiContainer = ref<HTMLElement | null>(null);
    let yasgui: any = null;

    // Reactive state for metadata and endpoints
    const meta = reactive<EndpointsMetadata>({});
    const endpoints = ref<string[]>(props.endpoint.split(",").map(e => e.trim()));

    // Dialog visibility state
    const overviewDialogVisible = ref(false);
    const saveExampleDialogVisible = ref(false);
    const examplesDialogVisible = ref(false);

    // State for the save-example form
    const exampleForm = reactive({
      description: "",
      exampleUri: (currentEndpointCount() + 1).toString().padStart(3, "0"),
      keywords: ""
    });

    // State for examples filtering
    const examplesSearch = ref("");
    const filteredExamplesList = ref<any[]>([]);

    // Helper functions
    const addSlashAtEnd = (str: string) => str.endsWith("/") ? str : `${str}/`;
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    // Helper to compute current endpoint count (number of saved examples)
    function currentEndpointCount(): number {
      const ep = endpointUrl();
      return meta[ep]?.examples?.length || 0;
    }
    // Return the first endpoint (for simplicity)
    const endpointUrl = () => endpoints.value[0];

    // Return metadata for current endpoint (or default structure)
    const currentEndpoint = () => meta[endpointUrl()] || {
      prefixes: {},
      examples: [],
      void: {},
      classes: [],
      predicates: []
    };

    // Load metadata from localStorage
    const loadMetaFromLocalStorage = (): EndpointsMetadata => {
      const metaString = localStorage.getItem("sparql-editor-metadata");
      try {
        return metaString ? JSON.parse(metaString) : {};
      } catch (error) {
        console.warn("Error parsing metadata from local storage", error);
        localStorage.removeItem("sparql-editor-metadata");
        return {};
      }
    };

    // Save metadata to localStorage
    const saveMetaToLocalStorage = () => {
      localStorage.setItem("sparql-editor-metadata", JSON.stringify(meta));
    };

    // Fetch metadata (examples, prefixes, VoID, classes, predicates) for an endpoint
    const getMetadata = async (ep?: string) => {
      const endpoint = ep || endpointUrl();
      if (!endpoint) return;
      if (!meta[endpoint]) {
        meta[endpoint] = {
          void: {},
          classes: [],
          predicates: [],
          prefixes: {},
          examples: []
        };
      }
      if (!meta[endpoint].retrievedAt) {
        const [examples, prefixes, voidResult] = await Promise.all([
          getExampleQueries(endpoint),
          getPrefixes(endpoint),
          getVoidDescription(endpoint)
        ]);
        meta[endpoint].examples = examples;
        meta[endpoint].prefixes = prefixes;
        meta[endpoint].retrievedAt = new Date().toISOString();
        if (Object.keys(meta[endpoint].prefixes).length === 0) {
          meta[endpoint].prefixes = defaultPrefixes;
        }
        if (Object.keys(meta[endpoint].void).length === 0) {
          const [classes, predicates] = await Promise.all([
            getClassesFallback(endpoint),
            getPredicatesFallback(endpoint)
          ]);
          meta[endpoint].classes = classes;
          meta[endpoint].predicates = predicates;
        }
        saveMetaToLocalStorage();
      }
    };

    // Add prefixes to a given query string if the prefix is used but not declared
    const addPrefixesToQuery = (query: string) => {
      const prefixes = currentEndpoint().prefixes;
      Object.keys(prefixes).sort().forEach(key => {
        const value = prefixes[key];
        const prefixPattern = new RegExp(`PREFIX\\s+${key}:\\s+<${value}>`, 'i');
        const usagePattern = new RegExp(`(\\s|^|\\W)${key}:`, 'i');
        if (!prefixPattern.test(query) && usagePattern.test(query)) {
          query = `PREFIX ${key}: <${value}>\n` + query;
        }
      });
      return query;
    };

    // Load current endpoint into the Yasgui editor
    const loadCurrentEndpoint = async (ep?: string) => {
      const endpoint = ep || endpointUrl();
      const statusLight = document.getElementById("status-light") as HTMLElement;
      const statusLink = document.getElementById("status-link") as HTMLAnchorElement;
      if (statusLight) statusLight.style.backgroundColor = "purple";
      if (statusLink) statusLink.title = "Loading...";
      await getMetadata(endpoint);
      if (yasgui) {
        const tab = yasgui.getTab();
        if (tab) {
          // If there is an example query available, add its prefixes
          const exampleQuery = currentEndpoint().examples[0]?.query;
          tab.getYasqe().setValue(addPrefixesToQuery(exampleQuery || tab.getYasqe().getValue()));
        }
      }
      Yasgui.Yasr.defaults.prefixes = currentEndpoint().prefixes;
      // Update status light based on metadata (for demo purposes)
      let metaScore = 0;
      let statusMsg = `📡 Endpoint ${endpoint}\n\n`;
      if (Object.keys(currentEndpoint().void).length > 0) {
        metaScore += 1;
        statusMsg += `✅ Found VoID-based autocomplete for ${currentEndpoint().classes.length} classes and ${currentEndpoint().predicates.length} properties\n`;
      } else {
        statusMsg += `❌ VoID description not found for autocomplete\n`;
        if (currentEndpoint().classes.length > 0) {
          statusMsg += `  Found ${currentEndpoint().classes.length} classes\n`;
        }
        if (currentEndpoint().predicates.length > 2) {
          statusMsg += `  Found ${currentEndpoint().predicates.length} predicates\n`;
        }
      }
      if (currentEndpoint().examples.length > 0) {
        metaScore += 1;
        statusMsg += `✅ Found ${currentEndpoint().examples.length} query examples\n`;
      } else {
        statusMsg += `❌ Query examples not found\n`;
      }
      if (Object.keys(currentEndpoint().prefixes).length === Object.keys(defaultPrefixes).length) {
        statusMsg += `⚠️ Using ${Object.keys(currentEndpoint().prefixes).length} default prefixes`;
      } else if (Object.keys(currentEndpoint().prefixes).length > 0) {
        metaScore += 1;
        statusMsg += `✅ Found ${Object.keys(currentEndpoint().prefixes).length} prefixes`;
      } else {
        statusMsg += `❌ Prefixes not found`;
      }
      if (statusLight) {
        statusLight.style.backgroundColor = metaScore === 3 ? "green" : metaScore > 0 ? "orange" : "red";
      }
      if (statusLink) {
        statusLink.title = statusMsg;
        statusLink.href = `https://sib-swiss.github.io/sparql-editor/check?url=${endpoint}`;
      }
    };

    // ---------------------------
    // Autocompletion functions
    // ---------------------------
    const prefixesCompleter = {
      name: "shaclPrefixes",
      persistenceId: null,
      bulk: false,
      get: (_yasqe: any, token: AutocompletionToken) => {
        const prefixToAutocomplete = token?.autocompletionString?.split(":")[0];
        if (prefixToAutocomplete && currentEndpoint().prefixes[prefixToAutocomplete]) {
          return [`${prefixToAutocomplete}: <${currentEndpoint().prefixes[prefixToAutocomplete]}>`];
        }
        return [];
      }
    };

    const postProcessSuggestion = (token: AutocompletionToken, suggestedString: string) => {
      if (token.tokenPrefix && token.autocompletionString && token.tokenPrefixUri) {
        return token.tokenPrefix + suggestedString.substring(token.tokenPrefixUri.length);
      } else {
        return compressUri(currentEndpoint().prefixes, suggestedString) || `<${suggestedString}>`;
      }
    };

    const voidClassCompleter = {
      name: "voidClass",
      bulk: false,
      get: (_yasqe: any, token: AutocompletionToken) => {
        if (token?.autocompletionString !== undefined)
          return currentEndpoint().classes.filter((iri: string) =>
            iri.indexOf(token.autocompletionString!) === 0
          );
        return currentEndpoint().classes;
      },
      postProcessSuggestion: (_yasqe: any, token: AutocompletionToken, suggestedString: string) => {
        return postProcessSuggestion(token, suggestedString);
      }
    };

    const voidPropertyCompleter = {
      name: "voidProperty",
      bulk: false,
      get: async (yasqe: any, token: AutocompletionToken) => {
        const cursor = yasqe.getCursor();
        const subj = getSubjectForCursorPosition(yasqe.getValue(), cursor.line, cursor.ch);
        const subjTypes = extractAllSubjectsAndTypes(yasqe.getValue());
        const cursorEndpoint = getServiceUriForCursorPosition(yasqe.getValue(), cursor.line, cursor.ch) || endpointUrl();
        await getMetadata(cursorEndpoint);
        if (subj && subjTypes.has(subj) && Object.keys(meta[cursorEndpoint].void).length > 0) {
          const types = subjTypes.get(subj);
          if (types) {
            const suggestPreds = new Set<string>();
            try {
              if (token?.autocompletionString !== undefined) {
                types.forEach((typeCurie: string) => {
                  const voidObj = meta[cursorEndpoint].void[
                    // Convert CURIE to URI if possible
                    currentEndpoint().prefixes[typeCurie] || typeCurie
                  ] || {};
                  Object.keys(voidObj)
                    .filter(prop => prop.indexOf(token.autocompletionString!) === 0)
                    .forEach(prop => suggestPreds.add(prop));
                });
              }
            } catch (error) {
              console.warn("Error getting properties for autocomplete:", error);
            }
            if (suggestPreds.size > 0) return Array.from(suggestPreds).sort();
          }
        }
        if (token?.autocompletionString !== undefined)
          return meta[cursorEndpoint].predicates.filter((iri: string) =>
            iri.indexOf(token.autocompletionString!) === 0
          );
        return meta[cursorEndpoint].predicates;
      },
      isValidCompletionPosition: (yasqe: any) => {
        const token: any = yasqe.getCompleteToken();
        if (token.string[0] === "?" || token.string[0] === "$") return false;
        if (token.state.possibleCurrent.indexOf("a") >= 0) return true;
        return false;
      },
      postProcessSuggestion: (_yasqe: any, token: AutocompletionToken, suggestedString: string) => {
        return postProcessSuggestion(token, suggestedString);
      }
    };

    // Add prefixes to the query loaded in the editor
    const addPrefixesToQueryInEditor = () => {
      const tab = yasgui?.getTab();
      if (!tab) return;
      const query = tab.getYasqe().getValue();
      Object.keys(currentEndpoint().prefixes).sort().forEach(key => {
        const value = currentEndpoint().prefixes[key];
        const prefixPattern = new RegExp(`PREFIX\\s+${key}:\\s+<${value}>`, 'i');
        const usagePattern = new RegExp(`(\\s|^|\\W)${key}:`, 'i');
        if (!prefixPattern.test(query) && usagePattern.test(query)) {
          tab.getYasqe().addPrefixes({ [key]: value });
        }
      });
    };

    // Add a new query tab to Yasgui
    const addTab = (query: string, label: string) => {
      if (yasgui) {
        yasgui.addTab(true, {
          ...Yasgui.Tab.getDefaults(),
          name: generateTabLabel(label),
          requestConfig: {
            ...Yasgui.defaults.requestConfig,
            endpoint: endpointUrl(),
          },
          yasqe: { value: query }
        });
        addPrefixesToQueryInEditor();
      }
    };

    // Create a URL to “DESCRIBE” a resource
    const createDescribeUrl = (resourceUrl: string) => {
      return `?query=${encodeURIComponent(`DESCRIBE <${resourceUrl}>`)}&endpoint=${endpointUrl()}`;
    };

    // Convert a CURIE to a full URI using the prefix map
    const curieToUri = (curie: string) => {
      if (/^[a-zA-Z][\w.-]*:[\w.-]+$/.test(curie)) {
        const [prefix, local] = curie.split(":");
        const namespace = currentEndpoint().prefixes[prefix];
        return namespace ? `${namespace}${local}` : curie;
      } else {
        return curie;
      }
    };

    // ---------------------------
    // Dialog-related functions
    // ---------------------------
    const showOverview = async () => {
      overviewDialogVisible.value = true;
      await nextTick();
      // Dispatch an event to force the overview component to re-render if needed
      const overviewEl = document.getElementById("sparql-overview-component");
      overviewEl?.dispatchEvent(new Event("render"));
    };
    const closeOverview = () => { overviewDialogVisible.value = false; };

    const showSaveExampleDialog = () => { saveExampleDialogVisible.value = true; };
    const closeSaveExampleDialog = () => { saveExampleDialogVisible.value = false; };

    const openExamplesDialog = () => {
      examplesDialogVisible.value = true;
      filteredExamplesList.value = currentEndpoint().examples;
    };
    const closeExamplesDialog = () => { examplesDialogVisible.value = false; };

    const onExamplesSearch = () => {
      const term = examplesSearch.value.toLowerCase();
      filteredExamplesList.value = currentEndpoint().examples.filter(example =>
        example.comment.toLowerCase().includes(term) ||
        example.query.toLowerCase().includes(term)
      );
    };

    const useExample = (example: any) => {
      addTab(example.query, example.comment);
      closeExamplesDialog();
    };

    // Highlight a SPARQL query using highlight.js
    const highlightSparql = (query: string) => {
      try {
        return hljs.highlight(query.trim(), { language: "sparql" }).value;
      } catch (e) {
        return query;
      }
    };

    // ---------------------------
    // Save Example (SHACL generation) functions
    // ---------------------------
    const generateShacl = (): [string, string] => {
      const description = exampleForm.description;
      const keywordsStr = exampleForm.keywords
        .split(",")
        .map(kw => `"${kw.trim()}"`)
        .join(", ");
      const tab = yasgui?.getTab();
      const queryType = capitalize(tab?.getYasqe().getQueryType() || "Select");
      const keywordsBit = keywordsStr.length > 2 ? `schema:keywords ${keywordsStr} ;\n  ` : "";
      const exampleUri = exampleForm.exampleUri;
      const shacl = `@prefix ex: <${props.examplesNamespace || addSlashAtEnd(endpointUrl()) + ".well-known/sparql-examples/"}> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix schema: <https://schema.org/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .

ex:${exampleUri} a sh:SPARQLExecutable${["Select", "Construct", "Ask"].includes(queryType) ? `, sh:SPARQL${queryType}Executable` : ""} ;
  rdfs:comment "${description}"@en ;
  sh:prefixes _:sparql_examples_prefixes ;
  sh:${queryType.toLowerCase()} """${tab?.getYasqe().getValue()}""" ;
  ${keywordsBit}schema:target <${endpointUrl()}> .`;
      return [shacl, exampleUri];
    };

    const onSaveExampleSubmit = () => {
      const [shaclStr, exampleUri] = generateShacl();
      const dataStr = `data:text/turtle;charset=utf-8,${encodeURIComponent(shaclStr)}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${exampleUri}.ttl`);
      downloadAnchor.click();
      closeSaveExampleDialog();
    };

    const onCopyToClipboard = () => {
      const [shaclStr] = generateShacl();
      navigator.clipboard.writeText(shaclStr);
    };

    const onAddToRepo = () => {
      const [shaclStr, exampleUri] = generateShacl();
      const uploadExampleUrl = `${props.examplesRepoAddUrl}?filename=${exampleUri}.ttl&value=${encodeURIComponent(shaclStr)}`;
      window.open(uploadExampleUrl, "_blank");
    };

    // ---------------------------
    // Yasgui initialization and event listeners
    // ---------------------------
    onMounted(async () => {
      // Register highlight.js languages
      hljs.registerLanguage("ttl", hljsDefineTurtle);
      hljs.registerLanguage("sparql", hljsDefineSparql);
      // Append styles (from imported CSS strings) to document head
      const styleEl = document.createElement("style");
      styleEl.textContent = `
        ${yasguiCss}
        ${yasguiGripInlineCss}
        ${highlightjsCss}
        ${editorCss}
      `;
      if (endpoints.value.length === 1) {
        styleEl.textContent += `.yasgui .controlbar { display: none !important; }`;
      }
      document.head.appendChild(styleEl);

      // Load metadata from localStorage
      Object.assign(meta, loadMetaFromLocalStorage());

      // Initialize Yasgui if the container exists
      if (yasguiContainer.value) {
        yasgui = new Yasgui(yasguiContainer.value, {
          persistenceId: `yasgui_${window.location.pathname.replace(/\//g, "")}`,
          copyEndpointOnNewTab: true
        });
        // Remove default autocompleters and add our forks
        Yasgui.Yasqe.defaults.autocompleters = Yasgui.Yasqe.defaults.autocompleters.filter((ac: any) =>
          !["prefixes", "class", "property"].includes(ac)
        );
        Yasgui.Yasqe.forkAutocompleter("prefixes", prefixesCompleter);
        Yasgui.Yasqe.forkAutocompleter("class", voidClassCompleter);
        Yasgui.Yasqe.forkAutocompleter("property", voidPropertyCompleter);
        Yasgui.defaults.requestConfig = {
          ...Yasgui.defaults.requestConfig,
          endpoint: endpointUrl(),
          method: props.defaultMethod.toUpperCase()
        };
        Yasgui.defaults.endpointCatalogueOptions = {
          ...Yasgui.defaults.endpointCatalogueOptions,
          getData: () => endpoints.value.map(ep => ({ endpoint: ep })),
          renderItem: (data: any, source: HTMLElement) => {
            const contentDiv = document.createElement("div");
            contentDiv.innerText = data.value.endpoint;
            source.appendChild(contentDiv);
          }
        };
        await loadCurrentEndpoint();
        // Also show examples on the main page (if applicable)
        // (For simplicity the examples dialog is opened via the “Browse examples” button)
      }

      // Attach event listeners for the various buttons
      document.getElementById("sparql-clear-cache-btn")?.addEventListener("click", async () => {
        localStorage.removeItem("sparql-editor-metadata");
        for (const key in meta) { delete meta[key]; }
        await loadCurrentEndpoint();
      });
      document.getElementById("sparql-add-prefixes-btn")?.addEventListener("click", () => {
        const sortedPrefixes: { [key: string]: string } = {};
        Object.keys(currentEndpoint().prefixes).sort().forEach(key => {
          sortedPrefixes[key] = currentEndpoint().prefixes[key];
        });
        const tab = yasgui?.getTab();
        tab?.getYasqe().addPrefixes(sortedPrefixes);
        tab?.getYasqe().collapsePrefixes(true);
      });
      document.getElementById("sparql-save-example-btn")?.addEventListener("click", () => {
        showSaveExampleDialog();
      });
      document.getElementById("sparql-cls-overview-btn")?.addEventListener("click", () => {
        showOverview();
      });
      document.getElementById("sparql-examples-top-btn")?.addEventListener("click", () => {
        openExamplesDialog();
      });
      document.getElementById("sparql-toggle-examples-btn")?.addEventListener("click", () => {
        examplesDialogVisible.value = !examplesDialogVisible.value;
      });
      // Add a “queryBefore” event listener to inject a LIMIT if needed
      yasgui.on("queryBefore", (_y: any, tab: any) => {
        const ye = tab.getYasqe();
        tab.getYasr().config.prefixes = { ...Yasgui.Yasr.defaults.prefixes, ...ye.getPrefixesFromQuery() };
        if (props.addLimit) {
          const limitPattern = /LIMIT\s+\d+\s*$/i;
          if (
            (ye.getQueryType() === "SELECT" || ye.getQueryType() === "CONSTRUCT") &&
            !limitPattern.test(ye.getValue().trim())
          ) {
            ye.setValue(`${ye.getValue().trim()} LIMIT ${props.addLimit}`);
          }
        }
      });
      // Add a “queryResponse” listener to add “DESCRIBE” links
      yasgui.on("queryResponse", async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        const iriCells = document.querySelectorAll(".dataTable a.iri") as NodeListOf<HTMLAnchorElement>;
        iriCells.forEach(iriCell => {
          if (iriCell.href.startsWith("http://www.w3.org/2001/XMLSchema#")) return;
          const describeBtn = document.createElement("a");
          describeBtn.href = createDescribeUrl(iriCell.href);
          describeBtn.textContent = "🔍️";
          describeBtn.style.marginLeft = "0.3em";
          describeBtn.style.textDecoration = "none";
          iriCell.parentElement?.appendChild(describeBtn);
        });
      });
      // If URL search parameters contain a query, add prefixes and run the query
      if (window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("query")) {
          addPrefixesToQueryInEditor();
          yasgui.getTab()?.getYasqe().query();
        }
      }
    });

    return {
      yasguiContainer,
      overviewDialogVisible,
      closeOverview,
      saveExampleDialogVisible,
      closeSaveExampleDialog,
      examplesDialogVisible,
      closeExamplesDialog,
      examplesSearch,
      filteredExamplesList,
      onExamplesSearch,
      useExample,
      highlightSparql,
      onSaveExampleSubmit,
      onCopyToClipboard,
      onAddToRepo,
      exampleForm,
      examplesRepoAddUrl: props.examplesRepoAddUrl,
      endpoint: endpointUrl(),
      addPrefixesToQueryInEditor,
      addTab,
    };
  }
});
</script>

<style scoped>
.sparql-editor-container {
  /* Your container styling */
  padding: 1em;
}
.btn {
  margin: 4px;
  padding: 0.4em 0.8em;
  cursor: pointer;
}
.top-btn {
  font-size: 0.9em;
}
/* Additional styles for dialogs, examples, etc. */
.overview-dialog,
.save-example-dialog,
.examples-dialog {
  border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
</style>

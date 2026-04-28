import { QueryEngine as SparqlEngineCache } from "query-sparql-remote-cache";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { KeyRemoteCache } from "actor-query-process-remote-cache";
self.global = self;

self.onmessage = async function (e) {
  const engine = new SparqlEngineCache();
  // Try to use the cache
  try {
    // Query executor using Comunica
    const bindingsStream = await engine.queryBindings(e.data.query, {
      sources: e.data.sources,
      lenient: true,
      fetch: fetch,
      [KeyRemoteCache.location.name]: e.data.cachepath,
      failOnCacheMiss: true,
    });

    let provenance;
    // Extract provenance information to display in the UI
    bindingsStream.getProperty("provenance", (val) => {
      if (val && typeof val === "object" && "algorithm" in val && "id" in val) {
        provenance = {
          algorithm: val.algorithm,
          id: {
            termType: val.id.termType,
            value: val.id.value,
          },
        };
      } else {
        provenance = null;
      }
    });

    // get results
    const bindingsArray = [];
    let firstBinding = undefined;
    for await (const binding of bindingsStream) {
      if (!firstBinding) firstBinding = binding;
      const bindingObj = {};
      binding.forEach((term, variable) => {
        let termType;
        switch (term.termType) {
          case "Literal":
            termType = "literal";
            break;
          case "NamedNode":
            termType = "uri";
            break;
          case "BlankNode":
            termType = "bnode";
            break;
          default:
            termType = term.termType.toLowerCase();
        }
        bindingObj[variable.value] = { type: termType, value: term.value };
      });
      bindingsArray.push(bindingObj);
    }
    const vars = firstBinding
      ? Array.from(firstBinding.keys()).map((variable) => variable.value)
      : [];

    const resultsOutput = {
      head: { vars },
      results: { bindings: bindingsArray },
    };

    const returnVal = {
      provenanceOutput: provenance,
      resultsOutput: resultsOutput,
    };
    self.postMessage({
      returnVal
    });
  } catch (err) {
    self.postMessage({ error: err });
  }
};

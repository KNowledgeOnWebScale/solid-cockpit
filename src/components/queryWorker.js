import { QueryEngine as QueryEngineSparql } from "@comunica/query-sparql";
self.global = self;
let controller = null;
let stopCpu = false;

/**
 * Executes a SPARQL query over one or many SPARQL endpoints.
 *
 * @param inputQuery The string representation of a SPARQL query to be executed.
 * @param sources a ComunicaSources[] that provides the sources for executing the specified query
 * @returns A Promise that resolves to a string of JSON results if results were found, or `null` if there were no results or an error.
 */
self.onmessage = async (e) => {
  const { data } = e;
  if (!data) return;

  if (data.type === "run") {
    const { query, sources } = data;
    stopCpu = false;
    controller = new AbortController();
    const { signal } = controller;
    const engine = new QueryEngineSparql();
    // console.log(query, sources);
    try {
      // execute query using Comunica engine
      const bindingsStream = await engine.queryBindings(query, {
        sources,
        lenient: true,
      });

      // stream results in bindings array
      const bindingsArray = [];
      let firstBinding = undefined;
      for await (const binding of bindingsStream) {
        if (stopCpu || signal.aborted) throw new DOMException("Aborted", "AbortError");
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
      // If there were no results, use an empty array of variables.
      const vars = firstBinding
        ? Array.from(firstBinding.keys()).map((variable) => variable.value)
        : [];

      // Return results.
      self.postMessage({
        type: "result",
        payload: {
          head: { vars },
          results: { bindings: bindingsArray },
        },
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        self.postMessage({ type: "cancelled" });
      } else {
        self.postMessage({
          type: "error",
          error: { name: err?.name, message: err?.message },
        });
      }
    } finally {
      controller = null;
      stopCpu = false;
    }
  } else if (data.type === "cancel") {
    if (controller) controller.abort();
    stopCpu = true;
  }
};

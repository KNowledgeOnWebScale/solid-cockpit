import { QueryEngine as QueryEngineSparql } from "@comunica/query-sparql";
self.global = self;

/**
 * @param rules a set of rules to determine when to strip auth headers
 * @param opts a set of options to customize the fetch behavior
 * @returns A fetch that removes auth headers only when a request matches any rule.
 */
function makeSelectiveFetch(rules, opts) {
  opts = opts || {};
  var stripHeaders = opts.stripHeaders || ["authorization", "proxy-authorization", "Access-Control-Allow-Origin"];
  var forceOmitCredentials = opts.forceOmitCredentials !== undefined ? opts.forceOmitCredentials : true;
  var ruleList = Array.isArray(rules) ? rules : [rules];

  function matches(req) {
    return ruleList.some(function(rule) {
      if (typeof rule === "string") return req.url.startsWith(rule);
      if (rule instanceof RegExp) return rule.test(req.url);
      return rule(req);
    });
  }

  function cleanRequest(req) {
    var headers = new Headers(req.headers);
    stripHeaders.forEach(function(h) { headers.delete(h); });
    var url = new URL(req.url);
    url.username = "";
    url.password = "";
    var hasBody = !(req.method === "GET" || req.method === "HEAD");
    var options = {
    method: req.method,
    headers: headers,
    credentials: forceOmitCredentials ? "omit" : req.credentials,
    mode: req.mode,
    redirect: req.redirect,
    referrer: req.referrer,
    referrerPolicy: req.referrerPolicy,
    integrity: req.integrity,
    keepalive: req.keepalive,
    signal: req.signal,
    };
    if (hasBody) {
      options.body = req.clone().body;
      options.duplex = "half";
    }
    return new Request(url.toString(), options);
  }

  return function(input, init) {
    var baseReq = input instanceof Request ? input : new Request(input, init);
    var req = matches(baseReq) ? cleanRequest(baseReq) : baseReq;
    return fetch(req);
  };
}

/**
 * Executes a SPARQL query over one or many SPARQL endpoints.
 *
 * @param inputQuery The string representation of a SPARQL query to be executed.
 * @param sources a ComunicaSources[] that provides the sources for executing the specified query
 * @returns A Promise that resolves to a string of JSON results if results were found, or `null` if there were no results or an error.
 */
self.onmessage = async function (e) {
  const { query, sources } = e.data;
  const engine = new QueryEngineSparql();
  const noAuthFetch = makeSelectiveFetch((req) => req.url.includes("/sparql"));
  try {
    // execute query using Comunica engine
    const bindingsStream = await engine.queryBindings(query, {
      sources,
      lenient: true,
      fetch: noAuthFetch
    });

    console.log(await engine.explain(query, {
      sources,
      lenient: true,
      fetch: noAuthFetch
    }));
    // stream results in bindings array
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
    // If there were no results, use an empty array of variables.
    const vars = firstBinding
      ? Array.from(firstBinding.keys()).map((variable) => variable.value)
      : [];

    // Return results.
    self.postMessage({
      head: { vars },
      results: { bindings: bindingsArray },
    });
  } catch (err) {
    self.postMessage({ error: err.message || "Query error" });
  }
};

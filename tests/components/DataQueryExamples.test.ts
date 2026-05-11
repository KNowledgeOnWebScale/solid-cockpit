import { describe, expect, it, vi } from "vitest";
import DataQuery from "../../src/components/DataQuery.vue";

const componentOptions = DataQuery as unknown as {
  methods: Record<string, (...args: any[]) => any>;
  watch: Record<string, (this: any, ...args: any[]) => void>;
};

describe("DataQuery sample query editing flow", () => {
  it("applies a selected sample query by ID and keeps datasource arrays decoupled", () => {
    const editor = {
      setValue: vi.fn(),
      setCursor: vi.fn(),
      focus: vi.fn(),
    };

    const sample = {
      id: "federated-example",
      name: "Federated Example",
      mode: "endpoint",
      category: "Federated query",
      description: "desc",
      query: "SELECT * WHERE { ?s ?p ?o } LIMIT 10",
      sources: ["<https://example.org/sparql>"],
    };

    const vm = {
      yasqe: editor,
      exampleQueries: [sample],
      availableExampleQueries: [sample],
      queryMode: "endpoint",
      currentQuery: {
        query: "",
        sources: [] as string[],
      },
      syncYasqeFromExternalQuery: (query: string) => {
        editor.setValue(query);
        editor.setCursor({ line: 0, ch: 0 });
        editor.focus();
      },
    };

    componentOptions.methods.onSelectExample.call(vm, sample.id);

    expect(vm.currentQuery.query).toBe(sample.query);
    expect(vm.queryMode).toBe("endpoint");
    expect(vm.currentQuery.sources).toEqual(sample.sources);
    expect(vm.currentQuery.sources).not.toBe(sample.sources);
    expect(editor.setValue).toHaveBeenCalledWith(sample.query);
    expect(editor.setCursor).toHaveBeenCalledWith({ line: 0, ch: 0 });
    expect(editor.focus).toHaveBeenCalledTimes(1);
  });

  it("keeps one-way sync by never writing query watcher changes back to YASQE", () => {
    const editor = {
      setValue: vi.fn(),
    };
    const handleEditableQueryStateChanged = vi.fn();

    const vm = {
      yasqe: editor,
      handleEditableQueryStateChanged,
    };

    componentOptions.watch["currentQuery.query"].call(
      vm,
      "SELECT * WHERE { ?s ?p ?o }",
    );

    expect(editor.setValue).not.toHaveBeenCalled();
    expect(handleEditableQueryStateChanged).toHaveBeenCalledTimes(1);
  });
});

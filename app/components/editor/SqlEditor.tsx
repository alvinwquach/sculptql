"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { EditorView, keymap, drawSelection } from "@codemirror/view";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";

import {
  Braces,
  Database,
  Loader2,
  History,
  Download,
  Maximize2,
  Minimize2,
  ListTree,
  Table,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ViewToggle from "../view/ViewToggle";
import StatsPanel from "../panel/StatsPanel";
import QueryHistory from "../history/QueryHistory";
import {
  QueryResult,
  ViewMode,
  ChartDataItem,
  TableSchema,
  TableDescription,
} from "../../types/query";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "../../utils/localStorageUtils";
import { useSqlCompletion } from "@/app/hooks/useTableAutocomplete";

interface QueryHistoryItem {
  query: string;
  timestamp: string;
}

export default function SqlEditor() {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<QueryResult | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [table, setTable] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableDescription, setTableDescription] =
    useState<TableDescription | null>(null);
  const [fullScreenEditor, setFullScreenEditor] = useState<boolean>(false);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setFullScreenEditor((prev) => !prev);
  }, []);

  const loadHistory = useCallback(() => {
    const stored = getLocalStorageItem<QueryHistoryItem[]>(
      "sculptql_history",
      []
    );
    setHistory(stored);
  }, []);

  const saveQueryToHistory = useCallback(
    (q: string) => {
      const newItem: QueryHistoryItem = {
        query: q,
        timestamp: new Date().toISOString(),
      };
      const updated = [newItem, ...history].slice(0, 200);
      setHistory(updated);
      setLocalStorageItem("sculptql_history", updated);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    removeLocalStorageItem("sculptql_history");
  }, []);

  const loadQueryFromHistory = useCallback((q: string) => {
    setQuery(q);
    if (editorRef.current) {
      const transaction = editorRef.current.state.update({
        changes: { from: 0, to: editorRef.current.state.doc.length, insert: q },
      });
      editorRef.current.dispatch(transaction);
      editorRef.current.focus();
    }
  }, []);

  const runQueryFromHistory = useCallback(
    (q: string) => {
      loadQueryFromHistory(q);
      setShowHistory(false);
      runQuery();
    },
    [loadQueryFromHistory]
  );

  const fetchTableDescription = useCallback(async (tableName: string) => {
    try {
      const res = await fetch(`/api/describe-table?table=${tableName}`);
      const data = await res.json();
      if (res.ok) {
        setTableDescription(data);
        return data as TableDescription;
      } else {
        setError(data.error || "Failed to fetch table description");
        setTableDescription(null);
        return null;
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
      setTableDescription(null);
      return null;
    }
  }, []);

  const fetchTables = useCallback(async (tableName: string) => {
    if (!tableName) return;
    try {
      const res = await fetch(`/api/show-table?table=${tableName}`);
      const data = await res.json();
      if (res.ok) {
        setTable(data.tables);
      } else {
        setError(data.error || "Failed to fetch table metadata");
        setTable([]);
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
      setTable([]);
    }
  }, []);

  const fetchTableNames = useCallback(async () => {
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      if (res.ok) {
        const newTableNames = data.tables as string[];
        setTableNames((prev) =>
          JSON.stringify(prev) === JSON.stringify(newTableNames)
            ? prev
            : newTableNames
        );
        return newTableNames;
      } else {
        console.error("Failed to fetch table names:", data.error);
        return [];
      }
    } catch (e: unknown) {
      console.error("Error fetching table names:", (e as Error).message);
      return [];
    }
  }, []);

  const runQuery = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    setTableDescription(null);
    setTable([]);
    setSelectedTable("");

    const currentQuery = editorRef.current?.state.doc.toString() || "";
    if (!currentQuery.trim()) {
      setError("Query cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResult(data as QueryResult);
        saveQueryToHistory(currentQuery);
        const match = currentQuery.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        if (match && match[1]) {
          const tableName = match[1].toLowerCase();
          setSelectedTable(tableName);
          await Promise.all([
            fetchTables(tableName),
            fetchTableDescription(tableName),
          ]);
        }
        setViewMode("table");
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [saveQueryToHistory, fetchTables, fetchTableDescription]);

  const exportToCsv = useCallback(() => {
    if (!result || !result.rows || !result.fields) return;
    const headers = result.fields.join(",");
    const rows = result.rows.map((row) =>
      result.fields
        .map((field) => {
          const value = row[field] !== null ? String(row[field]) : "";
          if (value.includes(",") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `query_results_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  const exportToJson = useCallback(() => {
    if (!result || !result.rows) return;
    const jsonContent = JSON.stringify(result.rows, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `query_results_${new Date().toISOString()}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  const completion = useSqlCompletion(tableNames);

  useEffect(() => {
    loadHistory();
    fetchTableNames();
  }, [loadHistory, fetchTableNames]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const customTheme = EditorView.theme(
      {
        "&": {
          backgroundColor: "#0f172a",
          color: "#f8f9fa",
          fontSize: "14px",
        },
        ".cm-content": {
          caretColor: "#22c55e",
          paddingRight: "30px",
        },
        ".cm-line": {
          backgroundColor: "transparent",
        },
        ".cm-keyword": {
          color: "#f8f9fa !important",
        },
        ".cm-operator": {
          color: "#f8f9fa !important",
        },
        ".cm-variableName": {
          color: "#f8f9fa !important",
        },
        ".cm-string": {
          color: "#f8f9fa",
        },
        ".cm-comment": {
          color: "#4a4a4a",
          fontStyle: "italic",
        },
        ".cm-attribute": {
          color: "#f8f9fa",
        },
        ".cm-property": {
          color: "#f8f9fa",
        },
        ".cm-atom": {
          color: "#f8f9fa",
        },
        ".cm-number": {
          color: "#f8f9fa",
        },
        ".cm-def": {
          color: "#f8f9fa",
        },
        ".cm-variable-2": {
          color: "#f8f9fa",
        },
        ".cm-tag": {
          color: "#f8f9fa", 
        },
        "&.cm-focused .cm-cursor": {
          borderLeftColor: "#22c55e",
        },
        "&.cm-focused .cm-selectionBackground, ::selection": {
          backgroundColor: "rgba(34, 197, 94, 0.1)",
        },
        ".cm-gutters": {
          backgroundColor: "#0f172a",
          color: "#22c55e",
          border: "none",
        },
        ".cm-gutter": {
          backgroundColor: "#0f172a",
          border: "none",
        },
        ".cm-active-line": {
          backgroundColor: "rgba(34, 197, 94, 0.05)",
        },
      },
      { dark: true }
    );
    const state = EditorState.create({
      doc: query,
      extensions: [
        keymap.of([
          indentWithTab,
          {
            key: "Mod-Enter",
            run: () => {
              runQuery();
              return true;
            },
          },
          { key: "Ctrl-Space", run: startCompletion },
          ...defaultKeymap,
        ]),
        sql(),
        autocompletion({
          override: [completion],
          activateOnTyping: true,
        }),
        drawSelection(),
        customTheme,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }), // ✅ Syntax highlighting
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [completion, runQuery]);

  useEffect(() => {
    if (
      editorRef.current &&
      query &&
      editorRef.current.state.doc.toString() !== query
    ) {
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: query,
        },
      });
    }
  }, [query]);

  const chartData: ChartDataItem[] = useMemo(
    () =>
      result
        ? [
            { name: "Parsing", value: result.parsingTime ?? 0, unit: "ms" },
            { name: "Execution", value: result.executionTime ?? 0, unit: "ms" },
            { name: "Response", value: result.responseTime ?? 0, unit: "ms" },
            {
              name: "Locks Wait",
              value: result.locksWaitTime ?? 0,
              unit: "ms",
            },
          ]
        : [],
    [result]
  );

  return (
    <div
      className={`flex flex-col bg-[#0f172a] text-white ${
        fullScreenEditor ? "fixed inset-0 z-50" : "h-screen"
      }`}
    >
      <div className="flex flex-wrap justify-between items-center gap-4 px-4 pt-12 pb-6 border-b border-slate-700 bg-[#0f172a] shadow-sm">
        <div className="flex items-center space-x-3 min-w-[150px]">
          <Database className="w-6 h-6 text-green-400" />
          <h1 className="text-xl font-mono font-bold tracking-wide text-green-300 whitespace-nowrap">
            SculptQL
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory((prev) => !prev)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out border-2 shadow-sm ${
                showHistory
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-md"
                  : "text-white bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white"
              }`}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? "Hide History" : "Show History"}
            </Button>
          </div>
          <div className="relative group flex flex-col items-center">
            <Button
              onClick={() => editorRef.current && runQuery()}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold rounded-lg transition duration-200 shadow-sm min-w-[100px]"
            >
              Run
            </Button>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
              {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"}
              <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
            </div>
          </div>
        </div>
      </div>
      <div
        className={`flex flex-1 flex-col lg:flex-row overflow-hidden ${
          fullScreenEditor ? "h-full" : ""
        }`}
      >
        <div className="flex flex-1 min-w-0">
          <QueryHistory
            showHistory={showHistory}
            history={history}
            clearHistory={clearHistory}
            loadQueryFromHistory={loadQueryFromHistory}
            runQueryFromHistory={runQueryFromHistory}
          />
          <div
            className={`flex-1 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-700 relative ${
              fullScreenEditor ? "h-full" : "h-full"
            }`}
          >
            <div className="relative group">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="absolute -top-1 -right-2 text-green-300 hover:bg-transparent hover:text-green-400 transition-all duration-300 z-50"
                aria-label={
                  fullScreenEditor
                    ? "Exit editor fullscreen"
                    : "Enter editor fullscreen"
                }
              >
                {fullScreenEditor ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button>
              <div className="absolute -top-1 right-6 z-30 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg transition-opacity duration-150 whitespace-nowrap">
                {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
                <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
              </div>
            </div>
            <div ref={containerRef} className="h-full" />
          </div>
        </div>
        <div
          className={`flex-1 lg:w-1/2 p-6 overflow-auto ${
            fullScreenEditor ? "hidden" : "h-1/2 lg:h-full"
          } space-y-6`}
        >
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-4 rounded-lg shadow-md">
              {error}
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
              <Loader2 className="w-12 h-12 mb-4 animate-spin text-green-400" />
              <p className="text-lg">Loading query results…</p>
            </div>
          )}
          {!loading && (
            <>
              {(result || viewMode === "show" || viewMode === "describe") && (
                <ViewToggle
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                />
              )}
              {viewMode === "show" && selectedTable && table.length > 0 && (
                <div className="bg-[#1e293b] p-6 rounded-lg shadow-md border border-slate-600">
                  <div className="flex items-center mb-4">
                    <Database className="w-5 h-5 text-green-400 mr-2" />
                    <h2 className="text-xl font-semibold text-green-300">
                      Show Table
                    </h2>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Displays metadata for the queried table, including its name,
                    database, schema, and type.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#111827] text-green-400 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Name
                          </th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Database
                          </th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Schema
                          </th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Type
                          </th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Comment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.map((table, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-600 hover:bg-slate-700 transition-colors duration-200"
                          >
                            <td className="px-4 py-3 text-green-300">
                              {table.table_name}
                            </td>
                            <td className="px-4 py-3 text-green-300">
                              {table.table_catalog}
                            </td>
                            <td className="px-4 py-3 text-green-300">
                              {table.table_schema}
                            </td>
                            <td className="px-4 py-3 text-green-300">
                              {table.table_type}
                            </td>
                            <td className="px-4 py-3 text-green-300">
                              {table.comment ?? "null"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {viewMode === "show" &&
                (!selectedTable || table.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1e293b] p-6 rounded-lg shadow-md border border-slate-600">
                    <Database className="w-12 h-12 mb-4 text-green-400" />
                    <p className="text-lg">
                      Run a query to view table metadata.
                    </p>
                  </div>
                )}
              {viewMode === "describe" && selectedTable && tableDescription && (
                <div className="bg-[#1e293b] p-6 rounded-lg shadow-md border border-slate-600">
                  <div className="flex items-center mb-4">
                    <ListTree className="w-5 h-5 text-green-400 mr-2" />
                    <h2 className="text-xl font-semibold text-green-300">
                      Description for {selectedTable}
                    </h2>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Shows the structure of the queried table, including column
                    names, data types, nullability, and default values.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#111827] text-green-400 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Column
                          </th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Type
                          </th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Nullable
                          </th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-600">
                            Default
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableDescription.columns.map((col, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-600 hover:bg-slate-700 transition-colors duration-200"
                          >
                            <td className="px-4 py-3 text-green-300">
                              {col.column_name}
                            </td>
                            <td className="px-4 py-3 text-green-300">
                              {col.data_type}
                            </td>
                            <td className="px-4 py-3 text-green-300">
                              {col.is_nullable}
                            </td>
                            <td className="px-4 py-3 text-green-300">
                              {col.column_default ?? "null"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {viewMode === "describe" &&
                (!selectedTable || !tableDescription) && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1e293b] p-6 rounded-lg shadow-md border border-slate-600">
                    <ListTree className="w-12 h-12 mb-4 text-green-400" />
                    <p className="text-lg">
                      {selectedTable
                        ? "Loading table description..."
                        : "Run a query to select a table to describe."}
                    </p>
                  </div>
                )}
              {result && viewMode === "table" && (
                <>
                  <div className="flex justify-end mb-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCsv}
                      className="px-4 py-2 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-300 rounded-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToJson}
                      className="px-4 py-2 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-300 rounded-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to JSON
                    </Button>
                  </div>
                  <div className="bg-[#1e293b] p-6 rounded-lg shadow-md border border-slate-600">
                    <h2 className="text-xl font-semibold text-green-300 mb-4 flex items-center">
                      <Table className="w-5 h-5 text-green-400 mr-2" />
                      Query Results
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#111827] text-green-400 sticky top-0">
                          <tr>
                            {result.fields.map((field) => (
                              <th
                                key={field}
                                className="px-4 py-3 font-semibold border-b border-slate-600"
                              >
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, i) => (
                            <tr
                              key={i}
                              className="border-b border-slate-600 hover:bg-slate-700 transition-colors duration-200"
                            >
                              {result.fields.map((field) => (
                                <td
                                  key={field}
                                  className="px-4 py-3 text-green-300 break-words"
                                >
                                  {row[field] !== null
                                    ? String(row[field])
                                    : "null"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              {result && viewMode === "json" && (
                <div className="bg-[#1e293b] p-6 rounded-lg shadow-md border border-slate-600">
                  <h2 className="text-xl font-semibold text-green-300 mb-4 flex items-center">
                    <Braces className="w-5 h-5 text-green-400 mr-2" />
                    JSON Results
                  </h2>
                  <pre className="bg-[#111827] text-green-400 p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-words">
                    {JSON.stringify(result.rows, null, 2)}
                  </pre>
                </div>
              )}
              {result && viewMode === "stats" && (
                <StatsPanel result={result} chartData={chartData} />
              )}
              {!result &&
                viewMode !== "show" &&
                viewMode !== "describe" &&
                !loading && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1e293b] p-6 rounded-lg shadow-md border border-slate-600">
                    <Database className="w-12 h-12 mb-4 text-green-400" />
                    <p className="text-lg">
                      The results of your query will appear here.
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
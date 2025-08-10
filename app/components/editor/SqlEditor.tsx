"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { sql } from "@codemirror/lang-sql";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { Database, Loader2, History, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ViewToggle from "../view/ViewToggle";
import StatsPanel from "../panel/StatsPanel";
import QueryHistory from "../history/QueryHistory";
import {
  QueryResult,
  ViewMode,
  ChartDataItem,
  TableSchema,
} from "../../types/query";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "../../utils/localStorageUtils";

interface QueryHistoryItem {
  query: string;
  timestamp: string;
}

export default function SqlEditor() {
  const [query, setQuery] = useState("SELECT * FROM users;");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<QueryResult | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleViewModeChange = (mode: ViewMode) => setViewMode(mode);

  const loadHistory = useCallback(() => {
    const stored = getLocalStorageItem<QueryHistoryItem[]>(
      "sculptql_history",
      []
    );
    setHistory(stored);
  }, []);

  const saveQueryToHistory = useCallback(
    (q: string) => {
      const newItem = { query: q, timestamp: new Date().toISOString() };
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

  const runQuery = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    setResult(undefined);

    if (!query.trim()) {
      setError("Query cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResult(data as QueryResult);
        saveQueryToHistory(query);
        const match = query.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        if (match && match[1]) {
          const tableName = match[1].toLowerCase();
          if (tables.some((table) => table.table_name === tableName)) {
            setSelectedTable(tableName);
          }
        }
        setViewMode("table");
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [query, saveQueryToHistory, tables]);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/show-table");
      const data = await res.json();
      if (res.ok) {
        setTables(data.tables);
      } else {
        setError(data.error || "Failed to fetch table schemas");
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
    }
  }, []);

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

  useEffect(() => {
    loadHistory();
    fetchTables();
  }, [loadHistory, fetchTables]);

  useEffect(() => {
    if (!containerRef.current) return;

    const customTheme = EditorView.theme(
      {
        "&": { backgroundColor: "#1e293b", color: "white", fontSize: "14px" },
        ".cm-content": { caretColor: "#ffffff" },
        ".cm-keyword": { color: "#a78bfa" },
        ".cm-operator": { color: "#60a5fa" },
        ".cm-variableName": { color: "#f87171" },
        ".cm-string": { color: "#34d399" },
        ".cm-comment": { color: "#9ca3af", fontStyle: "italic" },
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
        autocompletion(),
        highlightSpecialChars(),
        drawSelection(),
        highlightActiveLine(),
        customTheme,
        EditorView.updateListener.of(
          (u) => u.docChanged && setQuery(u.state.doc.toString())
        ),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;
    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [runQuery]);

  const chartData: ChartDataItem[] = result
    ? [
        { name: "Parsing", value: result.parsingTime ?? 0, unit: "ms" },
        { name: "Execution", value: result.executionTime ?? 0, unit: "ms" },
        { name: "Response", value: result.responseTime ?? 0, unit: "ms" },
        { name: "Locks Wait", value: result.locksWaitTime ?? 0, unit: "ms" },
      ]
    : [];

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white">
      <div className="flex flex-wrap justify-between items-center gap-4 px-4 py-12 border-b border-slate-700 bg-[#0f172a] relative">
        <div className="flex items-center space-x-3 min-w-[150px]">
          <Database className="w-6 h-6 text-green-400" />
          <h1 className="text-xl font-mono font-bold tracking-wide text-green-300 whitespace-nowrap">
            SculptQL
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory((prev) => !prev)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ease-in-out border-2 
    ${
      showHistory
        ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-lg"
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
              className="px-3 py-1 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold rounded-md transition duration-200 min-w-[90px]"
            >
              ▶ Run
            </Button>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
              {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"}
              <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <div className="flex flex-1 min-w-0">
          <QueryHistory
            showHistory={showHistory}
            history={history}
            clearHistory={clearHistory}
            loadQueryFromHistory={loadQueryFromHistory}
            runQueryFromHistory={runQueryFromHistory}
          />
          <div className="flex-1 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-700 h-full">
            <div ref={containerRef} className="h-full" />
          </div>
        </div>
        <div className="flex-1 lg:w-1/2 p-4 overflow-auto h-1/2 lg:h-full space-y-4">
          {error && (
            <div className="text-red-500 bg-red-100/10 border border-red-400/50 p-3 rounded-md">
              {error}
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Loader2 className="w-16 h-16 mb-4 animate-spin" />
              <p>Loading query results…</p>
            </div>
          )}
          {!loading && (
            <>
              {result && (
                <ViewToggle
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  schemaLabel="Table Schema"
                />
              )}
              {viewMode === "schema" && tables.length > 0 && selectedTable && (
                <div className="overflow-x-auto border border-slate-700 rounded">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111827] sticky top-0 text-green-500">
                      <tr>
                        <th className="px-2 py-2 border-b border-slate-700">
                          Column
                        </th>
                        <th className="px-2 py-2 border-b border-slate-700">
                          Type
                        </th>
                        <th className="px-2 py-2 border-b border-slate-700">
                          Nullable
                        </th>
                        <th className="px-2 py-2 border-b border-slate-700">
                          Default
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables
                        .find((table) => table.table_name === selectedTable)
                        ?.columns.map((col, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-700 bg-[#1e293b]"
                          >
                            <td className="px-2 py-2 text-green-300">
                              {col.column_name}
                            </td>
                            <td className="px-2 py-2 text-green-300">
                              {col.data_type}
                            </td>
                            <td className="px-2 py-2 text-green-300">
                              {col.is_nullable}
                            </td>
                            <td className="px-2 py-2 text-green-300">
                              {col.column_default ?? "null"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {viewMode === "schema" &&
                (tables.length === 0 || !selectedTable) && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Database className="w-16 h-16 mb-4" />
                    <p>
                      {tables.length === 0
                        ? "No tables available."
                        : "Run a query to select a table schema."}
                    </p>
                  </div>
                )}
              {result && viewMode === "table" && (
                <>
                  <div className="flex justify-end mb-2 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCsv}
                      className="px-4 py-2 text-green-300 border-slate-700 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToJson}
                      className="px-4 py-2 text-green-300 border-slate-700 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to JSON
                    </Button>
                  </div>
                  <div className="overflow-x-auto border border-slate-700 rounded">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#111827] sticky top-0 text-green-500">
                        <tr>
                          {result.fields.map((field) => (
                            <th
                              key={field}
                              className="px-2 py-2 border-b border-slate-700"
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
                            className="border-b border-slate-700 bg-[#1e293b]"
                          >
                            {result.fields.map((field) => (
                              <td
                                key={field}
                                className="px-2 py-2 text-green-300 break-words"
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
                  {tables.length > 0 && selectedTable && (
                    <div className="mt-4">
                      <h2 className="text-lg font-bold text-green-300 mb-2">
                        Schema for {selectedTable}
                      </h2>
                      <div className="overflow-x-auto border border-slate-700 rounded">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#111827] sticky top-0 text-green-500">
                            <tr>
                              <th className="px-2 py-2 border-b border-slate-700">
                                Column
                              </th>
                              <th className="px-2 py-2 border-b border-slate-700">
                                Type
                              </th>
                              <th className="px-2 py-2 border-b border-slate-700">
                                Nullable
                              </th>
                              <th className="px-2 py-2 border-b border-slate-700">
                                Default
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tables
                              .find(
                                (table) => table.table_name === selectedTable
                              )
                              ?.columns.map((col, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-slate-700 bg-[#1e293b]"
                                >
                                  <td className="px-2 py-2 text-green-300">
                                    {col.column_name}
                                  </td>
                                  <td className="px-2 py-2 text-green-300">
                                    {col.data_type}
                                  </td>
                                  <td className="px-2 py-2 text-green-300">
                                    {col.is_nullable}
                                  </td>
                                  <td className="px-2 py-2 text-green-300">
                                    {col.column_default ?? "null"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
              {result && viewMode === "json" && (
                <pre className="bg-[#1e293b] text-green-500 p-4 rounded-md whitespace-pre-wrap break-words">
                  {JSON.stringify(result.rows, null, 2)}
                </pre>
              )}
              {result && viewMode === "stats" && (
                <StatsPanel result={result} chartData={chartData} />
              )}
              {!result && viewMode !== "schema" && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Database className="w-16 h-16 mb-4" />
                  <p>The results of your query will appear here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
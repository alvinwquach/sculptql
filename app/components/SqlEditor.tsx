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
import { Database, Loader2 } from "lucide-react";

import ViewToggle from "./ViewToggle";
import StatsPanel from "./StatsPanel";
import { QueryResult, ViewMode, ChartDataItem } from "../types/query";

export default function SqlEditor() {
  const [query, setQuery] = useState("SELECT * FROM users;");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<QueryResult | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

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

      if (!res.ok) setError(data.error || "Unknown error");
      else setResult(data as QueryResult);
    } catch (e: unknown) {
      setError((e as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (!containerRef.current) return;

    const customTheme = EditorView.theme(
      {
        "&": {
          backgroundColor: "#1e293b",
          color: "white",
          fontSize: "14px",
        },
        ".cm-content": {
          caretColor: "#ffffff",
        },
        ".cm-keyword": { color: "#a78bfa" },
        ".cm-operator": { color: "#60a5fa" },
        ".cm-variableName": { color: "#f87171" },
        ".cm-string": { color: "#34d399" },
        ".cm-comment": {
          color: "#9ca3af",
          fontStyle: "italic",
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
        autocompletion(),
        highlightSpecialChars(),
        drawSelection(),
        highlightActiveLine(),
        customTheme,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            setQuery(u.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [runQuery]);

  const chartData: Array<ChartDataItem> = result
    ? [
        { name: "Parsing", value: result.parsingTime ?? 0, unit: "ms" },
        { name: "Execution", value: result.executionTime ?? 0, unit: "ms" },
        { name: "Response", value: result.responseTime ?? 0, unit: "ms" },
        { name: "Locks Wait", value: result.locksWaitTime ?? 0, unit: "ms" },
      ]
    : [];

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white">
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-green-400" />
          <h1 className="text-2xl font-mono font-bold tracking-wide text-green-300">
            SculptQL
          </h1>
        </div>
        <div className="relative group flex items-center">
          <div className="absolute right-full mr-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-1.5 shadow-lg z-10 whitespace-nowrap">
            {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"}
          </div>
          <button
            onClick={() => editorRef.current && runQuery()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold rounded-xl transition duration-200"
          >
            ▶ Run Query
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-700 h-1/2 lg:h-full">
          <div ref={containerRef} className="h-full" />
        </div>
        <div className="w-full lg:w-1/2 p-4 overflow-auto h-1/2 lg:h-full space-y-4">
          {error && (
            <div className="text-red-500 bg-red-100/10 border border-red-400/50 p-3 rounded-md">
              {error}
            </div>
          )}
          {loading && !result && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Loader2 className="w-16 h-16 mb-4 animate-spin" />
              <p>Loading query results...</p>
            </div>
          )}
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Database className="w-16 h-16 mb-4" />
              <p>The results of your query will appear here.</p>
            </div>
          )}
          {result && !loading && (
            <>
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
              />
              {viewMode === "table" && (
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
                      {result.rows.map((row, index) => (
                        <tr
                          key={index}
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
              )}
              {viewMode === "json" && (
                <pre className="bg-[#1e293b] text-green-500 p-4 rounded-md whitespace-pre-wrap break-words">
                  {JSON.stringify(result.rows, null, 2)}
                </pre>
              )}
              {viewMode === "stats" && (
                <StatsPanel result={result} chartData={chartData} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

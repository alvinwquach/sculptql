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
import { Database } from "lucide-react";
import ViewToggle from "./ViewToggle";

interface QueryResult {
  rows: Record<string, string | number | boolean | null>[];
  rowCount?: number;
  fields: string[];
}

type ViewMode = "table" | "json";

export default function SqlEditor() {
  const [query, setQuery] = useState("SELECT * FROM users;");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

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
      else setResult(data);
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
        ".cm-content": { caretColor: "#ffffff" },
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
          if (u.docChanged) setQuery(u.state.doc.toString());
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [runQuery]);

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white">
      <div className="flex justify-between items-center px-4 pt-10 pb-4 border-b border-slate-700">
        <h1 className="text-lg font-bold">SculptQL</h1>
        <div className="relative group inline-block">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-1.5 whitespace-nowrap shadow-lg z-10">
            {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"}
          </div>
          <button
            onClick={() => editorRef.current && runQuery()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 font-bold rounded-xl transition"
          >
            ▶ Run Query
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-700 h-1/2 lg:h-full">
          <div ref={containerRef} className="h-full" />
        </div>
        <div className="w-full lg:w-1/2 p-4 overflow-auto h-1/2 lg:h-full">
          {error && (
            <div className="text-red-500 bg-red-100 p-2 rounded mb-4">
              {error}
            </div>
          )}
          {loading && (
            <div className="text-yellow-400 font-semibold mb-4">
              Running query...
            </div>
          )}
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Database className="w-16 h-16 mb-4" />
              <p>The results of your query will appear here.</p>
            </div>
          )}
          {result && (
            <>
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              {viewMode === "table" && (
                <div className="overflow-x-auto overflow-y-auto border border-slate-700 rounded">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-[#111827] sticky top-0 text-green-500">
                      <tr>
                        {result.fields.map((field) => (
                          <th
                            key={field}
                            className="px-2 py-2 border-b border-slate-700 whitespace-nowrap"
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
                              className="px-2 py-2 whitespace-normal break-words text-green-300"
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
                <pre className="bg-[#1e293b] text-green-500 p-4 rounded-md overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words">
                  {JSON.stringify(result.rows, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

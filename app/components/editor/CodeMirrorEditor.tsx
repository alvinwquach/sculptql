"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView, keymap, drawSelection } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { format as formatSQL } from "sql-formatter";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Wand2 } from "lucide-react";
import { useSqlCompletion } from "@/app/hooks/useSqlCompletion";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { TableColumn, SelectOption } from "@/app/types/query";
import { SingleValue } from "react-select";

interface CodeMirrorEditorProps {
  query: string;
  tableNames: string[];
  tableColumns: TableColumn;
  selectedColumns: SelectOption[]; 
  uniqueValues: Record<string, SelectOption[]>;
  onQueryChange: (query: string) => void;
  onTableSelect?: (value: SelectOption | null) => void;
  onWhereColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void;
  onLogicalOperatorSelect?: (value: SingleValue<SelectOption>) => void;
}

export default function CodeMirrorEditor({
  query,
  tableNames,
  tableColumns,
  selectedColumns, 
  uniqueValues,
  onQueryChange,
  onTableSelect,
  onWhereColumnSelect,
  onOperatorSelect,
  onValueSelect,
  onLogicalOperatorSelect,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const languageCompartment = useRef(new Compartment());
  const isInitialRender = useRef(true);
  const [fullScreenEditor, setFullScreenEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const sqlCompletion = useSqlCompletion(
    tableNames,
    tableColumns,
    selectedColumns, 
    uniqueValues,
    stripQuotes,
    needsQuotes,
    onTableSelect,
    onWhereColumnSelect,
    onOperatorSelect,
    onValueSelect,
    onLogicalOperatorSelect
  );

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const customTheme = EditorView.theme(
      {
        "&": {
          backgroundColor: "#1e293b",
          borderRadius: "0.75rem",
          border: "1px solid #334155",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          color: "#f8f9fa",
          fontSize: "clamp(12px, 3vw, 14px)",
          height: "100%",
        },
        ".cm-content": {
          caretColor: "#22c55e",
          paddingRight: "1.5rem",
          minHeight: "400px",
        },
        ".cm-line": { backgroundColor: "transparent" },
        ".cm-keyword": { color: "#f8f9fa !important" },
        ".cm-operator": { color: "#f8f9fa !important" },
        ".cm-variableName": { color: "#f8f9fa !important" },
        ".cm-string": { color: "#f8f9fa" },
        ".cm-comment": { color: "#4a4a4a", fontStyle: "italic" },
        ".cm-attribute": { color: "#f8f9fa" },
        ".cm-property": { color: "#f8f9fa" },
        ".cm-atom": { color: "#f8f9fa" },
        ".cm-number": { color: "#f8f9fa" },
        ".cm-def": { color: "#f8f9fa" },
        ".cm-variable-2": { color: "#f8f9fa" },
        ".cm-tag": { color: "#f8f9fa" },
        "&.cm-focused .cm-cursor": { borderLeftColor: "#22c55e" },
        "&.cm-focused .cm-selectionBackground, ::selection": {
          backgroundColor: "rgba(34, 197, 94, 0.1)",
        },
        ".cm-gutters": {
          backgroundColor: "#0f172a",
          color: "#22c55e",
          border: "none",
        },
        ".cm-gutter": { background: "#0f172a", border: "none" },
        ".cm-active-line": { backgroundColor: "rgba(34, 197, 94, 0.05)" },
      },
      { dark: true }
    );

    const state = EditorState.create({
      doc: query,
      extensions: [
        keymap.of([
          {
            key: isMac ? "Cmd-Shift-f" : "Ctrl-Shift-f",
            run: () => {
              if (!editorRef.current) return true;
              const currentText = editorRef.current.state.doc.toString();
              if (!currentText) return true;
              try {
                const formatted = formatSQL(currentText, {
                  language: "postgresql",
                  keywordCase: "upper",
                });
                editorRef.current.dispatch({
                  changes: {
                    from: 0,
                    to: editorRef.current.state.doc.length,
                    insert: formatted,
                  },
                });
                onQueryChange(formatted);
              } catch (err) {
                console.error("SQL formatting failed:", err);
              }
              return true;
            },
          },
          { key: "Ctrl-Space", run: startCompletion },
          indentWithTab,
          ...defaultKeymap,
        ]),
        languageCompartment.current.of(sql()),
        autocompletion({ override: [sqlCompletion], activateOnTyping: true }),
        drawSelection(),
        customTheme,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;

    isInitialRender.current = false;

    return () => {
      view.destroy();
      editorRef.current = null;
      isInitialRender.current = true;
    };
  }, [
    query,
    sqlCompletion,
    tableNames,
    tableColumns,
    selectedColumns, 
    uniqueValues,
    onQueryChange,
    onTableSelect,
    onWhereColumnSelect,
    onOperatorSelect,
    onValueSelect,
    onLogicalOperatorSelect,
    isMac,
  ]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.state.doc.toString() !== query) {
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: query,
        },
      });
      editorRef.current.focus();
    }
  }, [query]);

  return (
    <div
      className={`border border-slate-700/50 rounded-md relative ${
        fullScreenEditor ? "fixed inset-0 z-50 bg-[#0f172a] p-4" : ""
      }`}
    >
      <div ref={containerRef} className="flex-1" />
      {error && <p className="text-red-300 mt-2">{error}</p>}
      <div className="absolute top-2 right-2 z-50 flex flex-col gap-2">
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullScreenEditor(!fullScreenEditor)}
            className="text-green-300 hover:bg-transparent hover:text-green-400 transition-all duration-300"
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
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
            {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!editorRef.current) return;
              const currentText = editorRef.current.state.doc.toString();
              if (!currentText) return;
              try {
                const formatted = formatSQL(currentText, {
                  language: "postgresql",
                  keywordCase: "upper",
                });
                editorRef.current.dispatch({
                  changes: {
                    from: 0,
                    to: editorRef.current.state.doc.length,
                    insert: formatted,
                  },
                });
                onQueryChange(formatted);
              } catch (err) {
                console.error("SQL formatting failed:", err);
              }
            }}
            className="text-blue-300 hover:bg-transparent hover:text-blue-400 transition-all duration-300"
            aria-label="Format SQL"
          >
            <Wand2 className="w-5 h-5" />
          </Button>
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
            Format SQL ({isMac ? "⌘+⇧+F" : "Ctrl+Shift+F"})
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
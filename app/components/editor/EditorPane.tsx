"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import QueryTabs from "./QueryTabs";
import { Tab } from "@/app/types/query";
import { EditorView, keymap, drawSelection } from "@codemirror/view";
import {
  autocompletion,
  startCompletion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState, Compartment } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

interface EditorPaneProps {
  queryTabs: Tab[];
  activeTab: number;
  fullScreenEditor: boolean;
  onToggleFullscreen: () => void;
  onTabClick: (id: number) => void;
  onTabClose: (id: number) => void;
  onQueryChange: (query: string) => void;
  completion: (context: CompletionContext) => CompletionResult | null;
  metadataLoading: boolean;
  runQuery: () => void;
}

export default function EditorPane({
  queryTabs,
  activeTab,
  fullScreenEditor,
  onToggleFullscreen,
  onTabClick,
  onTabClose,
  onQueryChange,
  completion,
  metadataLoading,
  runQuery,
}: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());

  useEffect(() => {
    if (!containerRef.current || editorRef.current || metadataLoading) return;

    const updateQueryOnChange = ViewPlugin.define((view) => ({
      update: (update) => {
        if (!update.docChanged) return;
        const newQuery = update.state.doc.toString();
        onQueryChange(newQuery);
      },
    }));

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
        ".cm-gutter": { backgroundColor: "#0f172a", border: "none" },
        ".cm-active-line": { backgroundColor: "rgba(34, 197, 94, 0.05)" },
      },
      { dark: true }
    );

    const state = EditorState.create({
      doc: queryTabs.find((tab) => tab.id === activeTab)?.query || "",
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
        languageCompartment.current.of(sql()),
        autocompletion({ override: [completion], activateOnTyping: true }),
        drawSelection(),
        customTheme,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        updateQueryOnChange,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [
    completion,
    runQuery,
    metadataLoading,
    activeTab,
    queryTabs,
    onQueryChange,
  ]);

  useEffect(() => {
    if (editorRef.current) {
      const currentTab = queryTabs.find((tab) => tab.id === activeTab);
      const currentQuery = currentTab?.query || "";
      if (editorRef.current.state.doc.toString() !== currentQuery) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: currentQuery,
          },
        });
        editorRef.current.focus();
      }
    }
  }, [activeTab, queryTabs]);

  return (
    <div className="flex-1 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-700 relative">
      <QueryTabs
        queryTabs={queryTabs}
        activeTab={activeTab}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
      />
      <div ref={containerRef} className="h-[calc(100%-40px)]" />
      <div className="absolute top-10 -right-2 z-50">
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
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
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg transition-opacity duration-150 whitespace-nowrap">
            {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

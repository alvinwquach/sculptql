"use client";

import { useEffect, useRef, RefObject } from "react";
import { EditorView, keymap, drawSelection } from "@codemirror/view";
import { autocompletion, startCompletion } from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState, Compartment } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import { format as formatSQL } from "sql-formatter";
import { Tab, TableColumn, SelectOption } from "@/app/types/query";
import { CompletionSource } from "@codemirror/autocomplete";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { containsRestrictedKeywords } from "../../utils/restrictedKeywords";

interface UseEditorSyncProps {
  editorRef: RefObject<EditorView | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  queryTabs: Tab[];
  activeTab: number;
  onQueryChange: (query: string) => void;
  onError?: (error: string) => void;
  completion: CompletionSource;
  metadataLoading: boolean;
  runQuery: () => void;
  tableNames: string[];
  tableColumns: TableColumn;
  updateQueryState: (query: string) => void;
}

export const useEditorSync = ({
  editorRef,
  containerRef,
  queryTabs,
  activeTab,
  onQueryChange,
  onError,
  completion,
  metadataLoading,
  runQuery,
  tableNames,
  tableColumns,
  updateQueryState,
}: UseEditorSyncProps) => {
  const isInitialRender = useRef(true);
  const languageCompartment = useRef(new Compartment());
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  useEffect(() => {
    if (!containerRef.current || editorRef.current || metadataLoading) return;

    const updateQueryOnChange = ViewPlugin.define(
      () => ({
        update: (update) => {
          if (!update.docChanged || isInitialRender.current) return;
          let newQuery = update.state.doc.toString();

          if (newQuery) {
            // Extract and validate table name
            const tableMatch = newQuery.match(
              /FROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i
            );
            let normalizedTable: string | null = null;
            if (tableMatch && tableMatch[1]) {
              normalizedTable = stripQuotes(tableMatch[1]);
              if (!tableNames.includes(normalizedTable)) {
                onError?.(`Invalid table name: ${normalizedTable}`);
                return;
              }
              newQuery = newQuery.replace(tableMatch[1], normalizedTable);
            }

            // Extract and validate column names
            const columnMatch = newQuery.match(/SELECT\s+(.+?)\s+FROM/i);
            if (columnMatch && columnMatch[1] && normalizedTable) {
              const columns = columnMatch[1]
                .split(",")
                .map((col) => stripQuotes(col.trim()))
                .filter((col) => col);
              const invalidColumns = columns.filter(
                (col) => !tableColumns[normalizedTable ?? ""].includes(col)
              );
              if (invalidColumns.length > 0) {
                onError?.(
                  `Invalid column(s): ${invalidColumns.join(
                    ", "
                  )} in table ${normalizedTable}`
                );
                return;
              }
              const normalizedColumns = columns.join(", ");
              newQuery = newQuery.replace(columnMatch[1], normalizedColumns);
            }

            onQueryChange(newQuery);
            updateQueryState(newQuery);
          }
        },
      }),
      {
        eventHandlers: {
          mount: () => {
            isInitialRender.current = false;
          },
        },
      }
    );

    const customTheme = EditorView.theme(
      {
        "&": {
          backgroundColor: "#0f172a",
          color: "#f8f9fa",
          fontSize: "clamp(12px, 3vw, 14px)",
          height: "100%",
        },
        ".cm-content": {
          caretColor: "#22c55e",
          paddingRight: "1.5rem",
          minHeight: "150px",
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
      doc: queryTabs.find((tab) => tab.id === activeTab)?.query || "",
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
          {
            key: isMac ? "Cmd-Enter" : "Ctrl-Enter",
            run: () => {
              const currentQuery =
                editorRef.current?.state.doc.toString() || "";
              if (!currentQuery.trim()) {
                onError?.("Query cannot be empty.");
                return true;
              }
              if (containsRestrictedKeywords(currentQuery)) {
                onError?.(
                  "Query contains restricted keywords that could modify the database."
                );
                return true;
              }
              runQuery();
              return true;
            },
          },
          { key: "Ctrl-Space", run: startCompletion },
          indentWithTab,
          ...defaultKeymap,
        ]),
        languageCompartment.current.of(sql()),
        autocompletion({ override: [completion], activateOnTyping: true }),
        drawSelection(),
        customTheme,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        updateQueryOnChange,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
      isInitialRender.current = true;
    };
  }, [
    runQuery,
    metadataLoading,
    activeTab,
    queryTabs,
    onQueryChange,
    onError,
    completion,
    containerRef,
    isMac,
    tableNames,
    tableColumns,
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
  }, [activeTab, queryTabs, editorRef]);
};

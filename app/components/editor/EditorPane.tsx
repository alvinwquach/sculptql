"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Select, { MultiValue } from "react-select";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Wand2 } from "lucide-react";
import QueryTabs from "./QueryTabs";
import { Tab, TableColumn } from "@/app/types/query";
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
import { format as formatSQL } from "sql-formatter";

interface EditorPaneProps {
  queryTabs: Tab[];
  activeTab: number;
  fullScreenEditor: boolean;
  onToggleFullscreen: () => void;
  onTabClick: (id: number) => void;
  onTabClose: (id: number) => void;
  onQueryChange: (query: string) => void;
  onTabReorder: (newTabs: Tab[]) => void;
  completion: (context: CompletionContext) => CompletionResult | null;
  metadataLoading: boolean;
  runQuery: () => void;
  tableNames: string[];
  tableColumns: TableColumn;
}

interface SelectOption {
  value: string;
  label: string;
}

export default function EditorPane({
  queryTabs,
  activeTab,
  fullScreenEditor,
  onToggleFullscreen,
  onTabClick,
  onTabClose,
  onQueryChange,
  onTabReorder,
  completion,
  metadataLoading,
  runQuery,
  tableNames,
  tableColumns,
}: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<SelectOption[]>([]);
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  const tableOptions: SelectOption[] = tableNames.map((name) => ({
    value: name,
    label: name,
  }));

  const columnOptions: SelectOption[] = selectedTable
    ? [
        { value: "*", label: "* (All Columns)" },
        ...(tableColumns[selectedTable.value]?.map((col) => ({
          value: col,
          label: col,
        })) || []),
      ]
    : [];

  const handleTableSelect = useCallback(
    (option: SelectOption | null) => {
      setSelectedTable(option);
      setSelectedColumns([]);
      const query = option ? `SELECT * FROM ${option.value}` : "";
      onQueryChange(query);
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
    },
    [onQueryChange]
  );

  const handleColumnSelect = useCallback(
    (newValue: MultiValue<SelectOption>) => {
      if (!selectedTable) {
        setSelectedColumns([]);
        onQueryChange("");
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: "",
            },
          });
        }
        return;
      }

      const includesStar = newValue.some((option) => option.value === "*");
      let columnsToSelect: SelectOption[] = [];
      if (includesStar) {
        columnsToSelect =
          tableColumns[selectedTable.value]?.map((col) => ({
            value: col,
            label: col,
          })) || [];
      } else {
        columnsToSelect = newValue as SelectOption[];
      }

      setSelectedColumns(columnsToSelect);

      const columns = includesStar
        ? "*"
        : columnsToSelect.length > 0
        ? columnsToSelect.map((opt) => opt.value).join(", ")
        : "";
      const query = columns
        ? `SELECT ${columns} FROM ${selectedTable.value}`
        : `SELECT FROM ${selectedTable.value}`;
      onQueryChange(query);
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
    },
    [selectedTable, onQueryChange, tableColumns]
  );

  const formatQuery = useCallback(() => {
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
  }, [onQueryChange]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current || metadataLoading) return;

    const updateQueryOnChange = ViewPlugin.define(() => ({
      update: (update) => {
        if (!update.docChanged) return;
        const newQuery = update.state.doc.toString();
        onQueryChange(newQuery);
        const match = newQuery.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        if (match && match[1]) {
          const tableName = match[1];
          if (tableNames.includes(tableName)) {
            setSelectedTable({ value: tableName, label: tableName });
            const columnMatch = newQuery.match(/SELECT\s+(.+?)\s+FROM/i);
            if (columnMatch && columnMatch[1]) {
              const columns = columnMatch[1]
                .split(",")
                .map((col) => col.trim())
                .filter((col) => col !== "*");
              if (columns.length > 0) {
                setSelectedColumns(
                  columns.map((col) => ({ value: col, label: col }))
                );
              } else if (columnMatch[1] === "*") {
                setSelectedColumns(
                  tableColumns[tableName]?.map((col) => ({
                    value: col,
                    label: col,
                  })) || []
                );
              } else {
                setSelectedColumns([]);
              }
            } else {
              setSelectedColumns([]);
            }
          }
        } else {
          setSelectedTable(null);
          setSelectedColumns([]);
        }
      },
    }));

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
          {
            key: isMac ? "Cmd-Shift-f" : "Ctrl-Shift-f",
            run: () => {
              formatQuery();
              return true;
            },
          },
          {
            key: isMac ? "Cmd-Enter" : "Ctrl-Enter",
            run: () => {
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
    };
  }, [
    completion,
    runQuery,
    metadataLoading,
    activeTab,
    queryTabs,
    onQueryChange,
    formatQuery,
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
  }, [activeTab, queryTabs]);

  return (
    <div
      className={`flex-1 ${
        fullScreenEditor ? "fixed inset-0 z-50" : "lg:w-1/2"
      } flex flex-col bg-[#0f172a] border-b lg:border-b-0 lg:border-r border-slate-700`}
    >
      <QueryTabs
        queryTabs={queryTabs}
        activeTab={activeTab}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        onTabReorder={onTabReorder}
      />

      <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-slate-700">
        <Select
          options={tableOptions}
          value={selectedTable}
          onChange={handleTableSelect}
          placeholder="Select a table..."
          className="flex-1 min-w-0"
          isClearable
          isDisabled={metadataLoading}
          styles={{
            control: (base, state) => ({
              ...base,
              backgroundColor: "#1e293b",
              borderColor: state.isFocused ? "#3b82f6" : "#334155",
              boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
              "&:hover": {
                borderColor: "#3b82f6",
              },
              color: "#f8f9fa",
              borderRadius: "0.5rem",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              minHeight: "36px",
              padding: "0.25rem",
            }),
            singleValue: (base) => ({
              ...base,
              color: "#f8f9fa",
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
              marginTop: "0.25rem",
              zIndex: 20,
              width: "100%",
              maxHeight: "200px",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected
                ? "#3b82f6"
                : state.isFocused
                ? "#334155"
                : "#1e293b",
              color: "#f8f9fa",
              "&:active": {
                backgroundColor: "#2563eb",
              },
              padding: "0.5rem 0.75rem",
              fontSize: "clamp(12px, 2.5vw, 14px)",
            }),
            placeholder: (base) => ({
              ...base,
              color: "#94a3b8",
            }),
            input: (base) => ({
              ...base,
              color: "#f8f9fa",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              color: "#94a3b8",
              "&:hover": {
                color: "#3b82f6",
              },
            }),
            clearIndicator: (base) => ({
              ...base,
              color: "#94a3b8",
              "&:hover": {
                color: "#3b82f6",
              },
            }),
          }}
        />

        <Select
          options={columnOptions}
          value={selectedColumns}
          onChange={handleColumnSelect}
          placeholder="Select columns..."
          isMulti
          isDisabled={!selectedTable || metadataLoading}
          className="flex-1 min-w-0"
          styles={{
            control: (base, state) => ({
              ...base,
              backgroundColor: "#1e293b",
              borderColor: state.isFocused ? "#3b82f6" : "#334155",
              boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
              "&:hover": {
                borderColor: "#3b82f6",
              },
              color: "#f8f9fa",
              borderRadius: "0.5rem",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              minHeight: "36px",
              padding: "0.25rem",
            }),
            multiValue: (base) => ({
              ...base,
              backgroundColor: "#3b82f6",
              borderRadius: "0.25rem",
              margin: "0.125rem",
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: "#f8f9fa",
              fontSize: "clamp(12px, 2.5vw, 14px)",
              padding: "0.125rem 0.25rem",
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: "#f8f9fa",
              borderRadius: "0.25rem",
              "&:hover": {
                backgroundColor: "#2563eb",
                color: "#fff",
              },
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
              marginTop: "0.25rem",
              zIndex: 20,
              width: "100%",
              overflowY: "auto",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected
                ? "#3b82f6"
                : state.isFocused
                ? "#334155"
                : "#1e293b",
              color: "#f8f9fa",
              "&:active": {
                backgroundColor: "#2563eb",
              },
              padding: "0.5rem 0.75rem",
              fontSize: "clamp(12px, 2.5vw, 14px)",
            }),
            placeholder: (base) => ({
              ...base,
              color: "#94a3b8",
            }),
            input: (base) => ({
              ...base,
              color: "#f8f9fa",
            }),
            dropdownIndicator: (base) => ({
              ...base,
              color: "#94a3b8",
              "&:hover": {
                color: "#3b82f6",
              },
            }),
            clearIndicator: (base) => ({
              ...base,
              color: "#94a3b8",
              "&:hover": {
                color: "#3b82f6",
              },
            }),
          }}
        />
      </div>
      <div ref={containerRef} />
      <div className="absolute top-10 -right-2 z-50 flex flex-col gap-2">
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
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
            {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            onClick={formatQuery}
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
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
import { TableColumn, SelectOption, Tab } from "@/app/types/query";
import { MultiValue, SingleValue } from "react-select";
import QueryTabs from "./QueryTabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "@/app/utils/localStorageUtils";

// Props for the CodeMirrorEditor component
interface CodeMirrorEditorProps {
  query: string;
  tableNames: string[];
  tableColumns: TableColumn;
  selectedColumns: SelectOption[];
  uniqueValues: Record<string, SelectOption[]>;
  runQuery: (query: string) => Promise<void>;
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
  onOrderBySelect?: (
    column: SingleValue<SelectOption>,
    direction: SingleValue<SelectOption> | null
  ) => void;
  onColumnSelect?: (value: MultiValue<SelectOption>) => void;
  onDistinctSelect?: (value: boolean) => void;
  onGroupByColumnSelect: (value: MultiValue<SelectOption>) => void;
  onAggregateColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onHavingOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onHavingValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void;
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
  onOrderBySelect,
  onColumnSelect,
  onDistinctSelect,
  onGroupByColumnSelect,
  onAggregateColumnSelect,
  onHavingOperatorSelect,
  onHavingValueSelect,
  runQuery,
}: CodeMirrorEditorProps) {
  // Get the editor ref, container ref
  const editorRef = useRef<EditorView | null>(null);
  // Get the container ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Get the language compartment
  const languageCompartment = useRef(new Compartment());
  // Get the full screen editor 
  const [fullScreenEditor, setFullScreenEditor] = useState(false);
  // Get the error state
  const [error, setError] = useState<string | null>(null);
  // Get the is mac state
  const isMac =
    // If the navigator is not undefined and the platform is Mac
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  const queryState =  { id: 1, title: "Query 1", query: query || "" }
  // Get the query tabs state
  const [queryTabs, setQueryTabs] = useState<Tab[]>([
    // If the query is not null, set the query to the query state
    queryState,
  ]);

  // Get the active tab state
  const [activeTab, setActiveTab] = useState<number>(1);

  useEffect(() => {
    // Get the saved tabs
    const savedTabs = getLocalStorageItem<Tab[]>("queryTabs", [
      queryState,
    ]);
    // Get the saved active tab
    const savedActiveTab = getLocalStorageItem<number>("activeTab", 1);
    // Get the valid active tab
    const validActiveTab = savedTabs.some((tab) => tab.id === savedActiveTab)
      ? savedActiveTab
      : savedTabs[0].id;
    // Set the query tabs
    setQueryTabs(savedTabs);
    // Set the active tab
    setActiveTab(validActiveTab);
  }, []);

  // Use effect to set the query tabs to the local storage
  useEffect(() => {
    // Set the query tabs to the local storage
    setLocalStorageItem("queryTabs", queryTabs);
  }, [queryTabs]);

  // Use effect to set the active tab to the local storage
  useEffect(() => {
    // Set the active tab to the local storage
    setLocalStorageItem("activeTab", activeTab);
  }, [activeTab]);

  // Use effect to set the query tabs to the active tab
  useEffect(() => {
    // Set the query tabs to the active tab
    setQueryTabs((prevTabs) =>
      // Map the query tabs to the active tab
      prevTabs.map((tab) => (tab.id === activeTab ? { ...tab, query } : tab))
    );
    // If the editor ref is not null
    if (editorRef.current) {
      // Get the current editor content
      const currentEditorContent = editorRef.current.state.doc.toString();
      // If the current editor content is not the query
      if (currentEditorContent !== query) {
        // Dispatch the changes to the editor
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
    }
  }, [query, activeTab]);

  // Use effect to set the query tabs to the active tab
  useEffect(() => {
    // Get the current tab
    const currentTab = queryTabs.find((tab) => tab.id === activeTab);
    // If the current tab is not null and the editor ref is not null
    if (currentTab && editorRef.current) {
      // Get the current editor content
      const currentEditorContent = editorRef.current.state.doc.toString();
      // If the current editor content is not the query
      if (currentTab.query !== currentEditorContent) {
        // Dispatch the changes to the editor
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: currentTab.query,
          },
        });
        // Dispatch the changes to the query
        onQueryChange(currentTab.query);
      }
    }
  }, [activeTab, queryTabs, onQueryChange]);

  // Get the handle query change function
  const handleQueryChange = (newQuery: string) => {
    // Set the query tabs
    setQueryTabs((prevTabs) =>
      // Map the query tabs to the active tab and set the query to the new query
      prevTabs.map((tab) =>
        // If the tab id is the active tab, set the query to the new query
        tab.id === activeTab ? { ...tab, query: newQuery } : tab
      )
    );
    // Dispatch the changes to the query
    onQueryChange(newQuery);
  };

  // Get the handle tab click function
  const handleTabClick = (id: number) => {
    // Set the active tab to the id
    setActiveTab(id);
  };

  // Get the handle tab close function
  const handleTabClose = (id: number) => {
    // If the query tabs length is 1, return
    if (queryTabs.length === 1) return;
    // Get the new tabs
    const newTabs = queryTabs.filter((tab) => tab.id !== id);
    // Set the query tabs to the new tabs
    setQueryTabs(newTabs);
    // If the active tab is the id
    if (activeTab === id) {
      // Set the active tab to the first tab id
      setActiveTab(newTabs[0].id);
    }
  };

  // Get the handle tab reorder function
  const handleTabReorder = (newTabs: Tab[]) => {
    // Set the query tabs to the new tabs
    setQueryTabs(newTabs);
  };

  // Get the handle add new tab function
  const addNewTab = () => {
    // Get the new id
    const newId = Math.max(...queryTabs.map((tab) => tab.id), 0) + 1;
    // Get the new tab
    const newTab = { id: newId, title: `Query ${newId}`, query: "" };
    // Set the query tabs to the new tabs
    setQueryTabs([...queryTabs, newTab]);
    // Set the active tab to the new id
    setActiveTab(newId);
  };

  // Get the handle format sql function
  const handleFormatSQL = () => {
    // Get the editor
    const editor = editorRef.current;
    // If the editor is not null
    if (!editor) return;

    const currentText = editor.state.doc.toString();
    if (!currentText) return;

    try {
      // Try to detect database dialect from environment or default to postgresql
      const dialect = (typeof window !== 'undefined' && (window as { DB_DIALECT?: string }).DB_DIALECT) || "postgresql";
      // Format the current text
      const formatted = formatSQL(currentText, {
        language: dialect === "sqlite" ? "sqlite" : dialect === "mysql" ? "mysql" : dialect === "mssql" ? "transactsql" : "postgresql",
        keywordCase: "upper",
      });
      // Dispatch the changes to the editor
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: formatted,
        },
      });
      // Dispatch the changes to the query
      handleQueryChange(formatted);
    } catch (err) {
      console.error("SQL formatting failed:", err);
      // Set the error to failed to format SQL
      setError("Failed to format SQL");
    }
  };

  // Get the sql completion function
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
    onLogicalOperatorSelect,
    onOrderBySelect,
    onColumnSelect,
    onDistinctSelect,
    onGroupByColumnSelect,
    onAggregateColumnSelect,
    onHavingOperatorSelect,
    onHavingValueSelect
  );

  // Get the update listener function
  const updateListener = EditorView.updateListener.of((update) => {
    // If the update doc changed
    if (update.docChanged) {
      // Get the new query
      const newQuery = update.state.doc.toString();
      // Set the query tabs to the new query
      setQueryTabs((prevTabs) =>
        // Map the query tabs to the active tab and set the query to the new query
        prevTabs.map((tab) =>
          // If the tab id is the active tab, set the query to the new query
          tab.id === activeTab ? { ...tab, query: newQuery } : tab
        )
      );
      // Dispatch the changes to the query
      onQueryChange(newQuery);
    }
  });
  
  useEffect(() => {
    // If the container ref is not null and the editor ref is not null
    if (!containerRef.current || editorRef.current) return;
    // Get the custom theme
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
    // Get the state
    const state = EditorState.create({
      // Get the doc
      doc: queryTabs.find((tab) => tab.id === activeTab)?.query || query || "",
      // Get the extensions
      extensions: [
        // Get the keymap
        keymap.of([
          // Get the format sql key
          {
            key: isMac ? "Cmd-Shift-f" : "Ctrl-Shift-f",
            // Get the run function
            run: () => {
              // If the editor ref is not null
              if (!editorRef.current) return true;
              // Get the current text
              const currentText = editorRef.current.state.doc.toString();
              // If the current text is not null
              if (!currentText) return true;
              try {
                // Get the dialect from the window
                const dialect = (typeof window !== 'undefined' && (window as { DB_DIALECT?: string }).DB_DIALECT) || "postgresql";
                // Format the current text
                const formatted = formatSQL(currentText, {
                  // Get the language from the dialect
                  language: dialect === "sqlite" ? "sqlite" : dialect === "mysql" ? "mysql" : dialect === "mssql" ? "transactsql" : "postgresql",
                  // Get the keyword case from the dialect
                  keywordCase: "upper",
                });
                // Dispatch the changes to the editor
                editorRef.current.dispatch({
                  // Get the changes
                  changes: {
                    from: 0,
                    to: editorRef.current.state.doc.length,
                    insert: formatted,
                  },
                });
                // Dispatch the changes to the query
                handleQueryChange(formatted);
              } catch (err) {
                // Log the error
                console.error("SQL formatting failed:", err);
                // Set the error to failed to format SQL
                setError("Failed to format SQL");
              }
              // Return true
              return true;
            },
          },
          // Get the ctrl space key
          { key: "Ctrl-Space", run: startCompletion },
          // Get the indent with tab key
          indentWithTab,
          // Get the mod enter key
          {
            key: "Mod-Enter",
            run: () => {
              // If the editor ref is not null
              if (!editorRef.current) return true;
              // Get the current query
              const currentQuery = editorRef.current.state.doc.toString();
              // Run the query
              runQuery(currentQuery);
              // Return true
              return true;
            },
          },
          // Get the default keymap
          ...defaultKeymap,
        ]),
        // Get the language compartment
        languageCompartment.current.of(sql()),
        // Get the autocompletion
        autocompletion({ override: [sqlCompletion], activateOnTyping: true }),
        // Get the draw selection
        drawSelection(),
        // Get the custom theme
        customTheme,
        // Get the syntax highlighting
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        // Get the line wrapping
        EditorView.lineWrapping,
        // Get the update listener
        updateListener,
      ],
    });

    // Get the view
    const view = new EditorView({ state, parent: containerRef.current });
    // Set the editor ref to the view
    editorRef.current = view;

    return () => {
      // Destroy the view
      view.destroy();
      // Set the editor ref to null
      editorRef.current = null;
    };
  }, [
    tableNames,
    tableColumns,
    selectedColumns,
    uniqueValues,
    onTableSelect,
    onWhereColumnSelect,
    onOperatorSelect,
    onValueSelect,
    onLogicalOperatorSelect,
    onOrderBySelect,
    onColumnSelect,
    onDistinctSelect,
    onGroupByColumnSelect,
    onAggregateColumnSelect,
    onHavingOperatorSelect,
    onHavingValueSelect,
    isMac,
    sqlCompletion,
  ]);

  return (
    <div
      className={`border border-slate-700/50 rounded-md relative ${
        fullScreenEditor ? "fixed inset-0 z-50 bg-[#0f172a] p-4" : ""
      }`}
    >
      <TooltipProvider delayDuration={150}>
        <div className="flex items-center justify-between p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={addNewTab}
            className="text-green-300 hover:bg-transparent hover:text-green-400"
          >
            + New Tab
          </Button>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFormatSQL}
                  className="text-blue-300 hover:bg-transparent hover:text-blue-400 transition-all duration-300"
                  aria-label="Format SQL"
                >
                  <Wand2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Format SQL ({isMac ? "⌘+⇧+F" : "Ctrl+Shift+F"})
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
      <div className="rounded-lg flex items-center bg-[#1e293b] border-slate-700">
        <QueryTabs
          queryTabs={queryTabs}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onTabReorder={handleTabReorder}
        />
      </div>
      <div ref={containerRef} className="flex-1" />
      {error && <p className="text-red-300 mt-2">{error}</p>}
      <div className="absolute top-2 right-2 z-50 flex flex-col gap-2">
        <div className="relative group">
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
            {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
        <div className="relative group">
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
            Format SQL ({isMac ? "⌘+⇧+F" : "Ctrl+Shift+F"})
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
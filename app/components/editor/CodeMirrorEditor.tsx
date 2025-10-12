"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { Button } from "@/components/ui/button";
import { useSqlCompletion } from "@/app/hooks/useSqlCompletion";
import { useQueryTabs } from "@/app/hooks/useQueryTabs";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { TableColumn, SelectOption } from "@/app/types/query";
import { MultiValue, SingleValue } from "react-select";
import QueryTabs from "./QueryTabs";
import { stripQuotes } from "@/app/utils/helpers";
import { getEditorExtensions } from "@/app/utils/editor/editorExtensions";
import { formatSqlQuery } from "@/app/utils/editor/sqlFormatter";
import {
  parseSelectedTable,
  parseSelectedColumns,
} from "@/app/utils/queryParser";
import { toast } from "react-toastify";
import {
  validateSqlForToast,
  getClientPermissionMode,
} from "@/app/utils/editor/sqlPermissionLinter";

interface CodeMirrorEditorProps {
  query: string;
  tableNames: string[];
  tableColumns: TableColumn;
  selectedColumns: SelectOption[];
  selectedTable: SelectOption | null;
  runQuery: (query: string) => Promise<void>;
  onQueryChange: (query: string) => void;
  loading?: boolean;
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
  logQueryResultAsJson?: () => void;
  exposeQueryResultsToConsole?: () => void;
  hasResults?: boolean;
  onFormatSqlHandlerReady?: (handler: (() => void) | null) => void;
  isFullscreen?: boolean;
}

export default function CodeMirrorEditor({
  query,
  tableNames,
  tableColumns,
  selectedColumns,
  selectedTable,
  onQueryChange,
  loading = false,
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
  logQueryResultAsJson,
  exposeQueryResultsToConsole,
  hasResults = false,
  onFormatSqlHandlerReady,
  isFullscreen = false,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const languageCompartment = useRef(new Compartment());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTabSwitchingRef = useRef(false);
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastShownErrorRef = useRef<string | null>(null);

  const {
    queryTabs,
    activeTab,
    handleTabClick,
    handleTabClose,
    handleTabReorder,
    addNewTab,
    updateTabQuery,
    updateTabState,
    getCurrentTab,
  } = useQueryTabs(query, selectedTable, selectedColumns);

  const [error, setError] = useState<string | null>(null);
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  const handleFormatSQL = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentText = editor.state.doc.toString();
    if (!currentText) return;

    const formatted = formatSqlQuery(currentText);
    if (formatted) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: formatted,
        },
      });
      handleQueryChange(formatted);
    } else {
      setError("Failed to format SQL");
    }
  }, []);

  useEffect(() => {
    if (onFormatSqlHandlerReady) {
      onFormatSqlHandlerReady(handleFormatSQL);
    }
    return () => {
      if (onFormatSqlHandlerReady) {
        onFormatSqlHandlerReady(null);
      }
    };
  }, [handleFormatSQL, onFormatSqlHandlerReady]);

  const sqlCompletion = useSqlCompletion(
    tableNames,
    tableColumns,
    selectedColumns,
    stripQuotes,
    needsQuotes,
    {
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
    }
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      updateTabQuery(activeTab, newQuery);
      onQueryChange(newQuery);
    },
    [activeTab, updateTabQuery, onQueryChange]
  );

  // Handle permission violations with debounced toast
  const handlePermissionViolation = useCallback((message: string) => {
    // Clear any existing validation timer
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    // Debounce the toast
    validationTimerRef.current = setTimeout(() => {
      // Only show toast if it's a different error than last time
      if (message !== lastShownErrorRef.current) {
        toast.error(message, {
          toastId: "sql-permission-violation",
          autoClose: 5000,
          position: "top-right",
        });
        lastShownErrorRef.current = message;

        // Reset the last shown error after a delay
        setTimeout(() => {
          lastShownErrorRef.current = null;
        }, 6000);
      }
    }, 300);
  }, []);

  const queryCallbacksRef = useRef({
    handleQueryChange,
    runQuery,
    logQueryResultAsJson,
    exposeQueryResultsToConsole,
    updateTabQuery,
    updateTabState,
    onQueryChange,
    onTableSelect,
    onColumnSelect,
    getCurrentTab,
    query,
    selectedTable,
    selectedColumns,
    activeTab,
  });

  queryCallbacksRef.current = {
    handleQueryChange,
    runQuery,
    logQueryResultAsJson,
    exposeQueryResultsToConsole,
    updateTabQuery,
    updateTabState,
    onQueryChange,
    onTableSelect,
    onColumnSelect,
    getCurrentTab,
    query,
    selectedTable,
    selectedColumns,
    activeTab,
  };

  // Handle tab switching - update editor content and sync global state
  useEffect(() => {
    isTabSwitchingRef.current = true;

    // Find the current tab directly to avoid closure issues
    const currentTab = queryTabs.find((tab) => tab.id === activeTab);
    if (currentTab && editorRef.current) {
      const currentEditorContent = editorRef.current.state.doc.toString();
      const tabQuery = currentTab.query || "";
      // When switching tabs, load the tab's saved query into the editor
      if (tabQuery !== currentEditorContent) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: tabQuery,
          },
        });
      }
      // Always update the parent's query state to match the active tab
      queryCallbacksRef.current.onQueryChange(tabQuery);

      // Parse query to extract table and columns if not already saved in tab
      let tableToSync = currentTab.selectedTable;
      let columnsToSync = currentTab.selectedColumns;

      // Always parse query if it exists to ensure syncing
      if (tabQuery) {
        const parsedTable = parseSelectedTable(tabQuery);
        const parsedColumns = parseSelectedColumns(tabQuery);

        // Use parsed table if we don't have one saved or if it's different
        if (
          parsedTable &&
          (!tableToSync || tableToSync.value !== parsedTable.value)
        ) {
          tableToSync = parsedTable;
        }
        // Use parsed columns if we don't have any saved or if they're different
        if (
          parsedColumns.length > 0 &&
          (columnsToSync.length === 0 ||
            JSON.stringify(columnsToSync) !== JSON.stringify(parsedColumns))
        ) {
          columnsToSync = parsedColumns;
        }
      }

      // Sync table and column selections
      if (queryCallbacksRef.current.onTableSelect) {
        queryCallbacksRef.current.onTableSelect(tableToSync);
      }
      if (queryCallbacksRef.current.onColumnSelect) {
        queryCallbacksRef.current.onColumnSelect(columnsToSync);
      }
    }

    // Reset flag after a short delay to allow state updates to propagate
    setTimeout(() => {
      isTabSwitchingRef.current = false;
    }, 100);
  }, [activeTab, queryTabs]);

  // Save table and column changes to the current tab
  useEffect(() => {
    const currentTab = queryTabs.find((tab) => tab.id === activeTab);
    if (!currentTab) return;

    const tableChanged =
      currentTab.selectedTable?.value !== selectedTable?.value;
    const columnsChanged =
      JSON.stringify(currentTab.selectedColumns) !==
      JSON.stringify(selectedColumns);

    if (tableChanged || columnsChanged) {
      updateTabState(activeTab, { selectedTable, selectedColumns });
    }
  }, [selectedTable, selectedColumns, activeTab, queryTabs, updateTabState]);

  // Sync query prop changes from parent (generated by dropdown selections) to editor
  // This handles when dropdowns generate a new query
  useEffect(() => {
    // Don't sync during tab switching to avoid conflicts
    if (!editorRef.current || isTabSwitchingRef.current) return;

    const currentEditorContent = editorRef.current.state.doc.toString();
    const currentTab = queryTabs.find((tab) => tab.id === activeTab);
    const currentTabQuery = currentTab?.query || "";

    // Only update if:
    // 1. Query prop exists and is different from current editor content
    // 2. Query prop is different from the current tab's saved query
    const shouldUpdate =
      query && query !== currentEditorContent && query !== currentTabQuery;

    if (shouldUpdate) {
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: query,
        },
      });
      // Update the tab's query to match
      updateTabQuery(activeTab, query);
    }
  }, [query, activeTab, queryTabs, updateTabQuery]);

  const updateListener = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newQuery = update.state.doc.toString();

          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          // Use the ref to get the current activeTab
          queryCallbacksRef.current.updateTabQuery(
            queryCallbacksRef.current.activeTab,
            newQuery
          );
          queryCallbacksRef.current.onQueryChange(newQuery);
        }
      }),
    []
  );

  useEffect(() => {
    if (!editorMountRef.current || editorRef.current) return;

    const extensions = getEditorExtensions({
      languageCompartment: languageCompartment.current,
      isMac,
      sqlCompletion,
      updateListener,
      onFormatSql: (formatted: string) =>
        queryCallbacksRef.current.handleQueryChange(formatted),
      onRunQuery: (query: string) => queryCallbacksRef.current.runQuery(query),
      onLogJson: () => queryCallbacksRef.current.logQueryResultAsJson?.(),
      onExposeConsole: () =>
        queryCallbacksRef.current.exposeQueryResultsToConsole?.(),
      hasResults,
      onPermissionViolation: handlePermissionViolation,
    });

    const state = EditorState.create({
      doc:
        queryCallbacksRef.current.getCurrentTab()?.query ||
        queryCallbacksRef.current.query ||
        "",
      extensions,
    });

    const view = new EditorView({ state, parent: editorMountRef.current });
    editorRef.current = view;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
      view.destroy();
      editorRef.current = null;
    };
  }, [
    isMac,
    sqlCompletion,
    updateListener,
    hasResults,
    handlePermissionViolation,
  ]);

  return (
    <div
      className={`flex flex-col h-full ${
        isFullscreen ? "fixed inset-0 z-[100]" : "relative z-0"
      }`}
    >
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-2xl">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <div className="text-center">
              <span className="font-mono text-sm text-cyan-300 font-medium">
                Loading database schema...
              </span>
              <div className="mt-2 w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center flex-shrink-0">
        <QueryTabs
          queryTabs={queryTabs}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onTabReorder={handleTabReorder}
          onAddTab={addNewTab}
        />
      </div>
      <div ref={editorMountRef} className="flex-1 overflow-auto" />
      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-50">
          <div className="bg-red-900/90 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm shadow-lg">
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

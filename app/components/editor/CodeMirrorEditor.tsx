"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Wand2 } from "lucide-react";
import { useSqlCompletion } from "@/app/hooks/useSqlCompletion";
import { useFullscreen } from "@/app/hooks/useFullscreen";
import { useQueryTabs } from "@/app/hooks/useQueryTabs";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { TableColumn, SelectOption } from "@/app/types/query";
import { MultiValue, SingleValue } from "react-select";
import QueryTabs from "./QueryTabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { stripQuotes } from "@/app/utils/helpers";
import { getEditorExtensions } from "@/app/utils/editor/editorExtensions";
import { formatSqlQuery } from "@/app/utils/editor/sqlFormatter";

interface CodeMirrorEditorProps {
  query: string;
  tableNames: string[];
  tableColumns: TableColumn;
  selectedColumns: SelectOption[];
  selectedTable: SelectOption | null;
  uniqueValues: Record<string, SelectOption[]>;
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
}

export default function CodeMirrorEditor({
  query,
  tableNames,
  tableColumns,
  selectedColumns,
  uniqueValues,
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
}: CodeMirrorEditorProps) {
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorMountRef = useRef<HTMLDivElement | null>(null);
  const languageCompartment = useRef(new Compartment());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const {
    queryTabs,
    activeTab,
    handleTabClick,
    handleTabClose,
    handleTabReorder,
    addNewTab,
    updateTabQuery,
    getCurrentTab,
  } = useQueryTabs(query);

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
    onLogicalOperatorSelect,
    onOrderBySelect,
    onColumnSelect,
    onDistinctSelect,
    onGroupByColumnSelect,
    onAggregateColumnSelect,
    onHavingOperatorSelect,
    onHavingValueSelect
  );

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

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      updateTabQuery(activeTab, newQuery);
      onQueryChange(newQuery);
    },
    [activeTab, updateTabQuery, onQueryChange]
  );

  useEffect(() => {
    updateTabQuery(activeTab, query);
    if (editorRef.current) {
      const currentEditorContent = editorRef.current.state.doc.toString();
      if (currentEditorContent !== query) {
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

  useEffect(() => {
    const currentTab = getCurrentTab();
    if (currentTab && editorRef.current) {
      const currentEditorContent = editorRef.current.state.doc.toString();
      if (currentTab.query !== currentEditorContent) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: currentTab.query,
          },
        });
        onQueryChange(currentTab.query);
      }
    }
  }, [activeTab, queryTabs, onQueryChange]);

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const newQuery = update.state.doc.toString();

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      updateTabQuery(activeTab, newQuery);
      onQueryChange(newQuery);
    }
  });

  useEffect(() => {
    if (!editorMountRef.current || editorRef.current) return;

    const extensions = getEditorExtensions({
      languageCompartment: languageCompartment.current,
      isMac,
      sqlCompletion,
      updateListener,
      onFormatSql: handleQueryChange,
      onRunQuery: runQuery,
      onLogJson: logQueryResultAsJson,
      onExposeConsole: exposeQueryResultsToConsole,
      hasResults,
    });

    const state = EditorState.create({
      doc: getCurrentTab()?.query || query || "",
      extensions,
    });

    const view = new EditorView({ state, parent: editorMountRef.current });
    editorRef.current = view;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      view.destroy();
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
    logQueryResultAsJson,
    exposeQueryResultsToConsole,
    hasResults,
  ]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full ${
        isFullscreen ? "fixed inset-0 z-50 bg-[#0f172a] p-4" : ""
      }`}
      style={
        !isFullscreen
          ? {
              background: "linear-gradient(135deg, #0a0a0f, #1a1a2e)",
              boxShadow: "inset 0 0 60px rgba(139, 92, 246, 0.08)",
            }
          : undefined
      }
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
      <TooltipProvider delayDuration={150}>
        <div
          className="flex items-center justify-between p-4 backdrop-blur-sm border-b flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(26, 26, 46, 0.6), rgba(15, 15, 35, 0.6))",
            borderColor: "rgba(139, 92, 246, 0.2)",
            boxShadow: "0 1px 20px rgba(139, 92, 246, 0.1)",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={addNewTab}
            className="text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-200 transition-all duration-300 font-medium px-4 py-2 rounded-lg border border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            <span className="text-lg mr-2">+</span>
            New Tab
          </Button>
          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-pink-300 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 hover:text-pink-200 transition-all duration-300 w-10 h-10 rounded-lg border border-pink-500/30 hover:border-pink-400/50 hover:shadow-lg hover:shadow-pink-500/20"
                  aria-label={
                    isFullscreen
                      ? "Exit editor fullscreen"
                      : "Enter editor fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">
                {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFormatSQL}
                  className="text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-teal-500/20 hover:text-emerald-200 transition-all duration-300 w-10 h-10 rounded-lg border border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20"
                  aria-label="Format SQL"
                >
                  <Wand2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">
                Format SQL ({isMac ? "⌘+⇧+F" : "Ctrl+Shift+F"})
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
      <div className="flex items-center flex-shrink-0">
        <QueryTabs
          queryTabs={queryTabs}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onTabReorder={handleTabReorder}
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

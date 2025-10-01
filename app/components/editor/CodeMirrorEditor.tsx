"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
} from "@/app/utils/localStorageUtils";
import { stripQuotes } from "@/app/utils/helpers";

// Props for the CodeMirrorEditor component
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
}: CodeMirrorEditorProps) {
  // Get the editor ref, container ref
  const editorRef = useRef<EditorView | null>(null);
  // Get the container ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Get the language compartment
  const languageCompartment = useRef(new Compartment());
  // Get the full screen editor 
  const [fullScreenEditor, setFullScreenEditor] = useState(false);
  // Handle fullscreen toggle with proper browser fullscreen API
  const toggleFullscreen = useCallback(() => {
    if (!fullScreenEditor) {
      // Enter fullscreen
      if (containerRef.current?.requestFullscreen) {
        // Request fullscreen
        containerRef.current.requestFullscreen();
        // Set the full screen editor state to true
        setFullScreenEditor(true);


      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (containerRef.current as any).webkitRequestFullscreen();
        setFullScreenEditor(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((containerRef.current as any)?.mozRequestFullScreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (containerRef.current as any).mozRequestFullScreen();
        setFullScreenEditor(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((containerRef.current as any)?.msRequestFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (containerRef.current as any).msRequestFullscreen();
        setFullScreenEditor(true);
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreenEditor(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).webkitExitFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).webkitExitFullscreen();
        setFullScreenEditor(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).mozCancelFullScreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).mozCancelFullScreen();
        setFullScreenEditor(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((document as any).msExitFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).msExitFullscreen();
        setFullScreenEditor(false);
      }
    }
  }, [fullScreenEditor]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).webkitFullscreenElement || 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).mozFullScreenElement || 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).msFullscreenElement);
      setFullScreenEditor(isFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
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

  // Debounce timer for query parsing to prevent race conditions
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the update listener function
  const updateListener = EditorView.updateListener.of((update) => {
    // If the update doc changed
    if (update.docChanged) {
      // Get the new query
      const newQuery = update.state.doc.toString();
      
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Update query tabs immediately for UI responsiveness
      setQueryTabs((prevTabs) =>
        // Map the query tabs to the active tab and set the query to the new query
        prevTabs.map((tab) =>
          // If the tab id is the active tab, set the query to the new query
          tab.id === activeTab ? { ...tab, query: newQuery } : tab
        )
      );
      
      // Dispatch the changes to the query immediately (this will set isManualEdit to true)
      onQueryChange(newQuery);
      
      // requestAnimationFrame(() => {
      //   try {
      //     const parsedColumns = parseSelectedColumns(newQuery);
      //     const parsedTable = parseSelectedTable(newQuery);          
      
      //     if (parsedColumns.length > 0 && JSON.stringify(parsedColumns) !== JSON.stringify(selectedColumns)) {
      //     }
          
      //     if (parsedTable && JSON.stringify(parsedTable) !== JSON.stringify(selectedTable)) {
        
      //     }
          
      //   } catch (error) {
      //     console.error('Error parsing query for state sync:', error);
      //   }
      // });
    }
  });
  
  useEffect(() => {
    // If the container ref is not null and the editor ref is not null
    if (!containerRef.current || editorRef.current) return;
    // Premium retro wave theme with enhanced visual appeal
    const customTheme = EditorView.theme(
      {
        "&": {
          backgroundColor: "#0a0a0f",
          color: "#e0e6ed",
          fontSize: "clamp(14px, 2.5vw, 16px)",
          height: "100%",
          border: "none",
          borderRadius: "16px",
          background: "#0a0a0f",
          position: "relative",
          overflow: "hidden",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(244, 114, 182, 0.05), rgba(16, 185, 129, 0.05))",
          pointerEvents: "none",
          zIndex: 0,
        },
        ".cm-content": {
          caretColor: "#f472b6",
          padding: "1rem",
          minHeight: "450px",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
          lineHeight: "1.7",
          position: "relative",
          zIndex: 1,
          background: "transparent",
        },
        ".cm-line": { 
          backgroundColor: "transparent",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
        },
        ".cm-keyword": { 
          color: "#f472b6 !important",
          fontWeight: "700",
          textShadow: "0 0 12px rgba(244, 114, 182, 0.6)",
          background: "linear-gradient(135deg, #f472b6, #ec4899)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },
        ".cm-operator": { 
          color: "#8b5cf6 !important",
          fontWeight: "600",
          textShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
        },
        ".cm-variableName": { 
          color: "#fbbf24 !important",
          textShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
          fontWeight: "600",
        },
        ".cm-string": { 
          color: "#10b981",
          textShadow: "0 0 8px rgba(16, 185, 129, 0.4)",
          fontWeight: "500",
        },
        ".cm-comment": { 
          color: "#6b7280",
          fontStyle: "italic",
          opacity: 0.8,
        },
        ".cm-attribute": { 
          color: "#f472b6",
          fontWeight: "600",
        },
        ".cm-property": { 
          color: "#10b981",
          fontWeight: "600",
        },
        ".cm-atom": { 
          color: "#f472b6",
          fontWeight: "600",
        },
        ".cm-number": { 
          color: "#f59e0b",
          fontWeight: "700",
          textShadow: "0 0 6px rgba(245, 158, 11, 0.4)",
        },
        ".cm-def": { 
          color: "#fbbf24",
          fontWeight: "600",
        },
        ".cm-variable-2": { 
          color: "#8b5cf6",
          fontWeight: "600",
        },
        ".cm-tag": { 
          color: "#8b5cf6",
          fontWeight: "600",
        },
        "&.cm-focused .cm-cursor": { 
          borderLeftColor: "#f472b6",
          borderLeftWidth: "3px",
          boxShadow: "0 0 20px rgba(244, 114, 182, 0.8), 0 0 40px rgba(244, 114, 182, 0.4)",
          animation: "pulse 2s infinite",
        },
        "&.cm-focused .cm-selectionBackground, ::selection": {
          backgroundColor: "rgba(244, 114, 182, 0.25)",
          border: "1px solid rgba(244, 114, 182, 0.5)",
          borderRadius: "4px",
        },
        ".cm-gutters": {
          backgroundColor: "#1a1a2e",
          color: "#8b5cf6",
          border: "none",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
          boxShadow: "2px 0 15px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(139, 92, 246, 0.2)",
        },
        ".cm-gutter": { 
          background: "transparent", 
          border: "none",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
        },
        ".cm-lineNumbers": {
          color: "#8b5cf6",
          textShadow: "0 0 5px rgba(139, 92, 246, 0.4)",
        },
        ".cm-active-line": { 
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)",
          borderLeft: "3px solid #8b5cf6",
        },
        ".cm-completionInfo": {
          backgroundColor: "#1a1a2e",
          border: "2px solid #8b5cf6",
          borderRadius: "16px",
          color: "#e0e6ed",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
          boxShadow: "0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          backdropFilter: "blur(10px)",
        },
        ".cm-completionIcon": {
          color: "#f472b6",
          filter: "drop-shadow(0 0 4px rgba(244, 114, 182, 0.6))",
        },
        ".cm-completionMatchedText": {
          color: "#fbbf24",
          fontWeight: "700",
          textShadow: "0 0 6px rgba(251, 191, 36, 0.6)",
        },
        ".cm-completionDetail": {
          color: "#6b7280",
          fontStyle: "italic",
        },
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
        // Get the autocompletion - optimized for instant response
        autocompletion({ 
          override: [sqlCompletion], 
          activateOnTyping: true,
          // closeOnBlur: false,
          // maxRenderedOptions: 15,
          defaultKeymap: true,
    
        }),
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
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
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
      ref={containerRef}
      className={`relative h-full ${
        fullScreenEditor ? "fixed inset-0 z-50 bg-[#0f172a] p-4" : ""
      }`}
      style={
        !fullScreenEditor ? {
          background: "linear-gradient(135deg, #0a0a0f, #1a1a2e)",
          boxShadow: "inset 0 0 60px rgba(139, 92, 246, 0.08)"
        } : undefined
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
              <span className="font-mono text-sm text-cyan-300 font-medium">Loading database schema...</span>
              <div className="mt-2 w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <TooltipProvider delayDuration={150}>
        <div 
          className="flex items-center justify-between p-4 backdrop-blur-sm border-b"
          style={{
            background: "linear-gradient(135deg, rgba(26, 26, 46, 0.6), rgba(15, 15, 35, 0.6))",
            borderColor: "rgba(139, 92, 246, 0.2)",
            boxShadow: "0 1px 20px rgba(139, 92, 246, 0.1)"
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
              <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">
                {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
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
      <div className="flex items-center">
        <QueryTabs
          queryTabs={queryTabs}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onTabReorder={handleTabReorder}
        />
      </div>
      <div className="flex-1" />
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
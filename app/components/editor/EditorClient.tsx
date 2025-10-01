"use client";

import { useEditorContext } from "@/app/context/EditorContext";
import { memo, useState, Suspense, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Braces, Database, LucideHistory, LucidePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiValue, SingleValue } from "react-select";
import { SelectOption, TableSchema } from "../../types/query";
import EditorSkeleton from "./EditorSkeleton";
import NoDatabaseConnected from "./NoDatabaseConnected";
import TableSelect from "./TableSelect";
import ColumnSelect from "./ColumnSelect";
import WhereClauseSelect from "./WhereClauseSelect";
import OrderByLimitSelect from "./OrderByLimitSelect";
import GroupBySelect from "./GroupBySelect";
import HavingSelect from "./HavingSelect";
import CodeMirrorEditor from "./CodeMirrorEditor";
import QueryHistory from "../history/QueryHistory";
import ResultsPane from "./ResultsPane";
import Sidebar from "../common/Sidebar";
import ResizablePane from "../common/ResizablePane";
import NaturalLanguageInput from "./input/NaturalLanguageInput";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";


// Props for the EditorClient component
interface EditorClientProps {
  schema: TableSchema[];
  error: string | null;
  isMySQL?: boolean;
  metadataLoading: boolean;
}

const EditorClient = memo(function EditorClient({
  schema,
  error,
  isMySQL = false,
  metadataLoading,
}: EditorClientProps) {
  // Get the show history, query, selected columns, unique values, table names, table columns, query error, run query, handle table select, handle where column select, handle operator select, handle value select, handle logical operator select, handle group by column select, handle aggregate column select, handle having operator select, handle having value select, and handle query change from the editor context
  const {
    showHistory,
    setShowHistory,
    query,
    selectedColumns,
    selectedTable,
    uniqueValues,
    tableNames,
    tableColumns,
    queryError,
    dialect,
    runQuery,
    handleTableSelect,
    handleWhereColumnSelect,
    handleOperatorSelect,
    handleValueSelect,
    handleLogicalOperatorSelect,
    handleColumnSelect,
    handleDistinctChange,
    handleGroupByColumnSelect,
    handleAggregateColumnSelect,
    handleHavingOperatorSelect,
    handleHavingValueSelect,
    handleQueryChange,
  } = useEditorContext();

  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false);

  useEffect(() => {
    if (metadataLoading && (!schema || schema.length === 0)) {
      const timer = setTimeout(() => {
        setShowConnectionPrompt(true);
      }, 3000); 
      return () => clearTimeout(timer);
    } else {
      setShowConnectionPrompt(false);
    }
  }, [metadataLoading, schema]);

  if (!metadataLoading && (!schema || schema.length === 0)) {
    return (
      <div className="flex flex-col bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] text-white min-h-screen">
        <ToastContainer />
        <div className="flex-shrink-0 border-b border-purple-500/30 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] px-2 sm:px-4 py-2 sm:py-3 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
          <EditorControls showHistory={showHistory} setShowHistory={setShowHistory} loading={false} />
        </div>
        <div className="flex-1 flex">
          <div className="hidden sm:block sm:w-72 md:w-80 lg:w-96 xl:w-[28rem] flex-shrink-0 border-r border-purple-500/30 bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] overflow-y-auto shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                    Query Builder
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 ml-4">Connect a database to start building queries</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <NoDatabaseConnected />
          </div>
        </div>
      </div>
    );
  }

  if (metadataLoading && !showConnectionPrompt) {
    return <EditorSkeleton />;
  }

  if (showConnectionPrompt) {
    return (
      <div className="flex flex-col bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] text-white min-h-screen">
        <ToastContainer />
        <div className="flex-shrink-0 border-b border-purple-500/30 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] px-2 sm:px-4 py-2 sm:py-3 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
          <EditorControls showHistory={showHistory} setShowHistory={setShowHistory} loading={false} />
        </div>
        <div className="flex-1 flex">
          <div className="hidden sm:block sm:w-72 md:w-80 lg:w-96 xl:w-[28rem] flex-shrink-0 border-r border-purple-500/30 bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] overflow-y-auto shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                    Query Builder
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 ml-4">Connect a database to start building queries</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <NoDatabaseConnected />
          </div>
        </div>
      </div>
    );
  }

  const handleColumnSelectWrapper = (value: MultiValue<SelectOption>) => {
    handleColumnSelect(Array.isArray(value) ? value : []);
  };

  const handleGroupByColumnSelectWrapper = (value: MultiValue<SelectOption>) => {
    handleGroupByColumnSelect(Array.isArray(value) ? value : []);
  };

  const handleWhereColumnSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleWhereColumnSelect(value, conditionIndex);
  };

  const handleOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleOperatorSelect(value, conditionIndex);
  };

  // Function to handle value select
  const handleValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleValueSelect(value, conditionIndex);
  };

  const handleLogicalOperatorSelectWrapper = (value: SingleValue<SelectOption>) => {
    handleLogicalOperatorSelect(value, 0);
  };

  const handleAggregateColumnSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleAggregateColumnSelect(value, conditionIndex);
  };

  const handleHavingOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleHavingOperatorSelect(value, conditionIndex);
  };

  const handleHavingValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleHavingValueSelect(value, conditionIndex);
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] text-white min-h-screen">
      <ToastContainer />
            <div className="flex-shrink-0 border-b border-purple-500/30 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] px-2 sm:px-4 py-2 sm:py-3 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
        <EditorControls showHistory={showHistory} setShowHistory={setShowHistory} loading={metadataLoading} />
      </div>

      <div className={`flex flex-1 w-full min-w-0 overflow-hidden transition-all duration-300 ${
        showHistory ? "ml-0 sm:ml-72 md:ml-80 lg:ml-96 xl:ml-[28rem]" : ""
      }`}>
        <div className={`hidden sm:block sm:w-72 md:w-80 lg:w-96 xl:w-[28rem] flex-shrink-0 border-r border-purple-500/30 bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] overflow-y-auto shadow-[0_0_20px_rgba(139,92,246,0.15)] ${
          showHistory ? "hidden" : ""
        }`}>
          {/* Query builder content for larger screens */}
          <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
            {error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <>
                <div className="space-y-3 pb-4 border-b border-purple-500/20">
                  <div>
                    <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
                      Natural Language
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Describe your query in plain English</p>
                  </div>
                  <NaturalLanguageInput
                    schema={schema}
                    onSqlGenerated={handleQueryChange}
                    dialect={dialect}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                      Query Builder
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Select tables and columns to build your SQL query</p>
                  </div>
                  <div className="space-y-3">
                    <TableSelect metadataLoading={metadataLoading} />
                    <ColumnSelect metadataLoading={metadataLoading} isMySQL={isMySQL} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                      Filters
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Add WHERE conditions to filter your data</p>
                  </div>
                  <WhereClauseSelect metadataLoading={metadataLoading} joinClauses={[]} />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
                      Grouping & Sorting
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Group data and sort results</p>
                  </div>
                  <div className="space-y-3">
                    <GroupBySelect metadataLoading={metadataLoading} joinClauses={[]} />
                    <HavingSelect metadataLoading={metadataLoading} joinClauses={[]} isMySQL={isMySQL} />
                    <OrderByLimitSelect metadataLoading={metadataLoading} joinClauses={[]} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Query Builder - shown only on mobile when sidebar is hidden */}
        <div className={`sm:hidden ${showHistory ? "hidden" : "block"}`}>
          <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
            {error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <>
                <div className="space-y-3 pb-4 border-b border-purple-500/20">
                  <div>
                    <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
                      Natural Language
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Describe your query in plain English</p>
                  </div>
                  <NaturalLanguageInput
                    schema={schema}
                    onSqlGenerated={handleQueryChange}
                    dialect={dialect}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                      Query Builder
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Select tables and columns to build your SQL query</p>
                  </div>
                  <div className="space-y-3">
                    <TableSelect metadataLoading={metadataLoading} />
                    <ColumnSelect metadataLoading={metadataLoading} isMySQL={isMySQL} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                      Filters
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Add WHERE conditions to filter your data</p>
                  </div>
                  <WhereClauseSelect metadataLoading={metadataLoading} joinClauses={[]} />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
                      Grouping & Sorting
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 ml-4">Group data and sort results</p>
                  </div>
                  <div className="space-y-3">
                    <GroupBySelect metadataLoading={metadataLoading} joinClauses={[]} />
                    <HavingSelect metadataLoading={metadataLoading} joinClauses={[]} isMySQL={isMySQL} />
                    <OrderByLimitSelect metadataLoading={metadataLoading} joinClauses={[]} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b]">
          <ResizablePane
            initialSize={45}
            minSize={25}
            maxSize={70}
            direction="vertical"
            className="p-2 sm:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] overflow-hidden"
          >
            <div className="h-full w-full rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
              <CodeMirrorEditor
                selectedColumns={selectedColumns}
                selectedTable={selectedTable}
                uniqueValues={uniqueValues}
                query={query}
                tableNames={tableNames}
                tableColumns={tableColumns}
                onQueryChange={handleQueryChange}
                loading={metadataLoading}
                onTableSelect={handleTableSelect}
                onWhereColumnSelect={handleWhereColumnSelectWrapper}
                onOperatorSelect={handleOperatorSelectWrapper}
                onValueSelect={handleValueSelectWrapper}
                onLogicalOperatorSelect={handleLogicalOperatorSelectWrapper}
                onOrderBySelect={() => {}}
                onColumnSelect={handleColumnSelectWrapper}
                onDistinctSelect={handleDistinctChange}
                onGroupByColumnSelect={handleGroupByColumnSelectWrapper}
                onAggregateColumnSelect={handleAggregateColumnSelectWrapper}
                onHavingOperatorSelect={handleHavingOperatorSelectWrapper}
                onHavingValueSelect={handleHavingValueSelectWrapper}
                runQuery={runQuery}
              />
            </div>
          </ResizablePane>
          <ResizablePane
            initialSize={55}
            minSize={30}
            maxSize={75}
            direction="vertical"
            className="p-2 sm:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[350px] overflow-hidden"
          >
            <div className="h-full w-full rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b]">
              <ResultsPane error={queryError ?? ""} loading={false} />
            </div>
          </ResizablePane>
        </div>
      </div>
      <Sidebar
        isOpen={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
        title="Query History"
      >
        <Suspense fallback={<LoadingSkeleton height="h-32" />}>
          <QueryHistory />
        </Suspense>
      </Sidebar>
    </div>
  );
});

const EditorControls = memo(function EditorControls({ 
  showHistory, 
  setShowHistory,
  loading = false
}: { 
  showHistory: boolean; 
  setShowHistory: (show: boolean) => void;
  loading?: boolean;
}) {
  // Get the log query result as json, run query, 
  // and query from the editor context
  const {
    logQueryResultAsJson,
    exposeQueryResultsToConsole,
    runQuery,
    query,
  } = useEditorContext();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
        SQL EDITOR
        </h1>
        <span className="hidden md:inline text-xs sm:text-sm text-cyan-300/80 font-mono tracking-wider">
          [SYNTHWAVE MODE]
        </span>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="font-mono">LOADING DATABASE...</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={logQueryResultAsJson}
          disabled={loading}
          className="hidden md:flex items-center px-2 sm:px-3 py-1 sm:py-2 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 transition-all duration-200 border border-purple-500/30 hover:border-purple-400/60 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Log query result as JSON"
        >
          <Braces className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden lg:inline">Log JSON</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={exposeQueryResultsToConsole}
          disabled={loading}
          className="hidden md:flex items-center px-2 sm:px-3 py-1 sm:py-2 text-green-300 hover:text-green-100 hover:bg-green-500/20 transition-all duration-200 border border-green-500/30 hover:border-green-400/60 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Expose query results to console for filtering"
        >
          <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden lg:inline">Console Filter</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          disabled={loading}
          className="flex items-center px-2 sm:px-3 py-1 sm:py-2 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Toggle query history"
        >
          <LucideHistory className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden lg:inline">{showHistory ? "Hide" : "Show"} History</span>
        </Button>
        <Button
          onClick={() => runQuery(query)}
          disabled={loading}
          className="flex items-center px-2 sm:px-4 lg:px-6 py-1 sm:py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-lg font-bold transition-all duration-300 shadow-[0_0_20px_rgba(244,114,182,0.4)] hover:shadow-[0_0_30px_rgba(244,114,182,0.6)] border border-pink-400/30 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Run query"
        >
          <LucidePlay className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline font-mono tracking-wider">EXECUTE</span>
          <span className="sm:hidden font-mono">RUN</span>
          <kbd className="hidden xl:inline ml-2 sm:ml-3 px-1 sm:px-2 py-0.5 sm:py-1 text-xs bg-black/40 rounded border border-white/20 font-mono">
            {navigator.platform.includes("Mac") ? "⌘+ENTER" : "CTRL+ENTER"}
          </kbd>
        </Button>
      </div>
    </div>
  );
});

export default EditorClient;

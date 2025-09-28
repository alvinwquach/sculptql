"use client";

import { useEditorContext } from "@/app/context/EditorContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Braces, Database, LucideHistory, LucidePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiValue, SingleValue } from "react-select";
import { SelectOption, TableSchema } from "../../types/query";
import { memo, useState, Suspense } from "react";
import EditorSkeleton from "./EditorSkeleton";

const LoadingSkeleton = ({ height = "h-10", className = "" }: { height?: string; className?: string }) => (
  <div className={`${height} bg-slate-700 rounded animate-pulse ${className}`} />
);

// Import components directly instead of dynamic imports to avoid timing issues
import TableSelectRefactored from "./TableSelect";
import ColumnSelect from "./ColumnSelect";
import WhereClauseSelect from "./WhereClauseSelect";
import OrderByLimitSelect from "./OrderByLimitSelect";
import GroupBySelect from "./GroupBySelect";
import HavingSelect from "./HavingSelect";
import WithSelect from "./WithSelect";
import JoinSelect from "./JoinSelect";
import UnionSelect from "./UnionSelect";
import CodeMirrorEditor from "./CodeMirrorEditor";
import QueryHistory from "../history/QueryHistory";
import ResultsPane from "./ResultsPane";
import Sidebar from "../common/Sidebar";
import ResizablePane from "../common/ResizablePane";

// const ChartsPanel = dynamic(() => import("../panel/ChartsPanel"), {
//   loading: () => <LoadingSkeleton height="h-64" />,
//   ssr: false
// });

// const StatsPanel = dynamic(() => import("../panel/StatsPanel"), {
//   loading: () => <LoadingSkeleton height="h-64" />,
//   ssr: false
// });


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
    operatorOptions,
    logicalOperatorOptions,
    joinClauses,
    unionClauses,
    cteClauses,
    onJoinTableSelect,
    onJoinTypeSelect,
    onJoinOnColumn1Select,
    onJoinOnColumn2Select,
    onAddJoinClause,
    onRemoveJoinClause,
    onUnionTableSelect,
    onAddUnionClause,
    onRemoveUnionClause,
    onCteAliasChange,
    onCteTableSelect,
    onCteColumnSelect,
    onCteLogicalOperatorSelect,
    onCteWhereColumnSelect,
    onCteOperatorSelect,
    onCteValueSelect,
    onAddCteClause,
    onRemoveCteClause,
  } = useEditorContext();
  // State for showing advanced options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Show loading skeleton while database is loading
  if (metadataLoading || !schema || schema.length === 0) {
    return <EditorSkeleton />;
  }

  // Function to handle column select
  const handleColumnSelectWrapper = (value: MultiValue<SelectOption>) => {
    // If the value is an array, handle the column select
    handleColumnSelect(Array.isArray(value) ? value : []);
  };

  // Function to handle group by column select
  const handleGroupByColumnSelectWrapper = (value: MultiValue<SelectOption>) => {
    // If the value is an array, handle the group by column select
    handleGroupByColumnSelect(Array.isArray(value) ? value : []);
  };

  // Function to handle where column select
  const handleWhereColumnSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleWhereColumnSelect(value, conditionIndex);
  };

  // Function to handle operator select
  const handleOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleOperatorSelect(value, conditionIndex);
  };

  // Function to handle value select
  const handleValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleValueSelect(value, conditionIndex);
  };

  // Function to handle logical operator select
  const handleLogicalOperatorSelectWrapper = (value: SingleValue<SelectOption>) => {
    handleLogicalOperatorSelect(value, 0);
  };

  // Function to handle aggregate column select
  const handleAggregateColumnSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleAggregateColumnSelect(value, conditionIndex);
  };

  // Function to handle having operator select
  const handleHavingOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleHavingOperatorSelect(value, conditionIndex);
  };

  // Function to handle having value select
  const handleHavingValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleHavingValueSelect(value, conditionIndex);
  };

  // Function to handle CTE column select - convert MultiValue to SelectOption[]
  const handleCteColumnSelectWrapper = (cteIndex: number, value: MultiValue<SelectOption>) => {
    // Convert MultiValue to SelectOption[]
    const columnArray = Array.isArray(value) ? value : [];
    // On cte column select
    onCteColumnSelect(cteIndex, columnArray);
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] text-white min-h-screen">
      <ToastContainer />
            <div className="flex-shrink-0 border-b border-purple-500/30 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] px-2 sm:px-4 py-2 sm:py-3 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
        <EditorControls showHistory={showHistory} setShowHistory={setShowHistory} loading={metadataLoading} />
      </div>

      <div className={`flex flex-1 w-full min-w-0 overflow-hidden transition-all duration-300 ${
        showHistory ? "ml-0 sm:ml-96 lg:ml-[32rem] xl:ml-[36rem]" : ""
      }`}>
        <div className={`w-full sm:w-96 lg:w-[32rem] xl:w-[36rem] flex-shrink-0 border-r border-purple-500/30 bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] overflow-y-auto shadow-[0_0_20px_rgba(139,92,246,0.15)] ${
          showHistory ? "hidden sm:block" : ""
        }`}>
          <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
            {error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <>
                <div className="space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 cursor-help">
                        <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                        Query Builder
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent className="bg-purple-900/90 border border-purple-500/50 text-purple-100">
                      <p>Select tables and columns to build your SQL query</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="space-y-3">
                    <TableSelectRefactored metadataLoading={metadataLoading} />
                    <ColumnSelect metadataLoading={metadataLoading} isMySQL={isMySQL} />
                  </div>
                </div>
                <div className="space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 cursor-help">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                        Filters
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent className="bg-cyan-900/90 border border-cyan-500/50 text-cyan-100">
                      <p>Add WHERE conditions to filter your data</p>
                    </TooltipContent>
                  </Tooltip>
                  <WhereClauseSelect metadataLoading={metadataLoading} joinClauses={[]} />
                </div>
                                <div className="space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2 cursor-help">
                        <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
                        Grouping & Sorting
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent className="bg-pink-900/90 border border-pink-500/50 text-pink-100">
                      <p>Group data and sort results</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="space-y-3">
                    <GroupBySelect metadataLoading={metadataLoading} joinClauses={[]} />
                    <HavingSelect metadataLoading={metadataLoading} joinClauses={[]} isMySQL={isMySQL} />
                    <OrderByLimitSelect metadataLoading={metadataLoading} joinClauses={[]} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2 cursor-help">
                          <div className="w-2 h-2 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                          Advanced Options
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent className="bg-violet-900/90 border border-violet-500/50 text-violet-100">
                        <p>Add CTEs, JOINs, and UNIONs to your query</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className={`relative overflow-hidden transition-all duration-300 px-4 py-2 text-sm font-medium rounded-lg border ${
                        showAdvancedOptions 
                          ? "text-violet-200 bg-violet-500/20 border-violet-400/50 hover:bg-violet-500/30 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                          : "text-cyan-300 bg-cyan-500/20 border-cyan-400/50 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2 text-white">
                        {showAdvancedOptions ? (
                          <>
                            <span className="text-white">Hide Advanced</span>
                            <span className="text-violet-300">▲</span>
                          </>
                        ) : (
                          <>
                            <span className="text-white">Show More</span>
                            <span className="text-cyan-300">▼</span>
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                  {showAdvancedOptions && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <WithSelect 
                        selectedTable={selectedTable}
                        tableNames={tableNames}
                        tableColumns={tableColumns}
                        cteClauses={cteClauses}
                        uniqueValues={uniqueValues}
                        operatorOptions={operatorOptions}
                        logicalOperatorOptions={logicalOperatorOptions}
                        onCteAliasChange={onCteAliasChange}
                        onCteTableSelect={onCteTableSelect}
                        onCteColumnSelect={handleCteColumnSelectWrapper}
                        onCteLogicalOperatorSelect={onCteLogicalOperatorSelect}
                        onCteWhereColumnSelect={onCteWhereColumnSelect}
                        onCteOperatorSelect={onCteOperatorSelect}
                        onCteValueSelect={onCteValueSelect}
                        onAddCteClause={onAddCteClause}
                        onRemoveCteClause={onRemoveCteClause}
                        metadataLoading={metadataLoading}
                      />
                      <JoinSelect 
                        selectedTable={selectedTable}
                        tableNames={tableNames}
                        tableColumns={tableColumns}
                        joinClauses={joinClauses}
                        onJoinTableSelect={onJoinTableSelect}
                        onJoinTypeSelect={onJoinTypeSelect}
                        onJoinOnColumn1Select={onJoinOnColumn1Select}
                        onJoinOnColumn2Select={onJoinOnColumn2Select}
                        onAddJoinClause={onAddJoinClause}
                        onRemoveJoinClause={onRemoveJoinClause}
                        metadataLoading={metadataLoading}
                      />
                      <UnionSelect 
                        selectedTable={selectedTable}
                        tableNames={tableNames}
                        unionClauses={unionClauses}
                        onUnionTableSelect={onUnionTableSelect}
                        onAddUnionClause={onAddUnionClause}
                        onRemoveUnionClause={onRemoveUnionClause}
                        metadataLoading={metadataLoading}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <ResizablePane
            initialSize={45}
            minSize={25}
            maxSize={70}
            direction="vertical"
            className="p-2 sm:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] overflow-hidden"
          >
            <div className="h-full w-full">
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
            className="border-t border-purple-500/30 bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] p-2 sm:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[350px] overflow-hidden"
          >
            <div className="h-full w-full">
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
          <QueryHistory showHistory={true} />
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
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-pink-900/90 border border-pink-500/50 text-pink-100">
            <p>Execute query ({navigator.platform.includes("Mac") ? "⌘+ENTER" : "CTRL+ENTER"})</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});

export default EditorClient;

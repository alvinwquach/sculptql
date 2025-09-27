"use client";

import { useEditorContext } from "@/app/context/EditorContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TableSelectRefactored from "./TableSelect";
import ColumnSelect from "./ColumnSelect";
import WhereClauseSelect from "./WhereClauseSelect";
import OrderByLimitSelect from "./OrderByLimitSelect";
import GroupBySelect from "./GroupBySelect";
import HavingSelect from "./HavingSelect";
import CodeMirrorEditor from "./CodeMirrorEditor";
import QueryHistory from "../history/QueryHistory";
import ResultsPaneRefactored from "./ResultsPane";
import { Braces, LucideHistory, LucidePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiValue, SingleValue } from "react-select";
import { Column, SelectOption } from "../../types/query";

// Props for the EditorClient component
interface EditorClientProps {
  schema: Column[];  
  error: string | null;
  isMySQL?: boolean;
}

export default function EditorClient({
  schema,
  error,
  isMySQL = false,
}: EditorClientProps) {
  // Get the show history, query, selected columns, unique values, table names, table columns, query error, run query, handle table select, handle where column select, handle operator select, handle value select, handle logical operator select, handle group by column select, handle aggregate column select, handle having operator select, handle having value select, and handle query change from the editor context
  const {
    showHistory,
    query,
    selectedColumns,
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
  } = useEditorContext();

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
    // If the value is not null, handle the where column select
    if (value) {
      handleWhereColumnSelect(value, conditionIndex);
    }
  };

  // Function to handle operator select
  const handleOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    // If the value is not null, handle the operator select
    if (value) {
      handleOperatorSelect(value, conditionIndex);
    }
  };

  // Function to handle value select
  const handleValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number, isValue2: boolean) => {
    // If the value is not null, handle the value select
    if (value) {
      handleValueSelect(value, conditionIndex);
    }
  };

  // Function to handle logical operator select
  const handleLogicalOperatorSelectWrapper = (value: SingleValue<SelectOption>) => {
    // If the value is not null, handle the logical operator select
    if (value) {
      handleLogicalOperatorSelect(value, 0);
    }
  };

  // Function to handle aggregate column select
  const handleAggregateColumnSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    // If the value is not null, handle the aggregate column select
    if (value) {
      handleAggregateColumnSelect(value, conditionIndex);
    }
  };

  // Function to handle having operator select
  const handleHavingOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    // If the value is not null, handle the having operator select
    if (value) {
      handleHavingOperatorSelect(value, conditionIndex);
    }
  };

  // Function to handle having value select
  const handleHavingValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number, isValue2: boolean) => {
    // If the value is not null, handle the having value select
    if (value) {
      handleHavingValueSelect(value, conditionIndex);
    }
  };

  return (
    <div className="flex flex-col bg-[#0f172a] text-white h-screen">
      <div className="flex flex-1 w-full min-w-0 overflow-hidden flex-col lg:flex-row">
        <ToastContainer />
        {showHistory && (
          <div className="w-full lg:w-52 flex-shrink-0 h-[500px] lg:h-auto overflow-y-auto overflow-x-hidden bg-[#0f172a] border-r border-slate-700/50">
            <QueryHistory showHistory={showHistory} />
          </div>
        )}
        <div className="flex flex-1 flex-col lg:flex-row w-full min-w-0 overflow-hidden">
          <div className="flex-1 w-full p-4 overflow-y-auto space-y-4 sm:space-y-6 min-h-0">
            {error ? (
              <p className="text-red-300">{error}</p>
            ) : (
              <>
                <EditorControls />
                <TableSelectRefactored metadataLoading={false} />
                <ColumnSelect metadataLoading={false} isMySQL={isMySQL} />
                <WhereClauseSelect metadataLoading={false} joinClauses={[]} />
                <OrderByLimitSelect metadataLoading={false} joinClauses={[]} />
                <GroupBySelect metadataLoading={false} joinClauses={[]} />
                <HavingSelect metadataLoading={false} joinClauses={[]} isMySQL={isMySQL} />
                <CodeMirrorEditor
                  selectedColumns={selectedColumns}
                  uniqueValues={uniqueValues}
                  query={query}
                  tableNames={tableNames}
                  tableColumns={tableColumns}
                  onQueryChange={handleQueryChange}
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
              </>
            )}
          </div>
          <div className="flex-1 w-full p-4 overflow-y-auto space-y-4 sm:space-y-6 min-h-0">
            <ResultsPaneRefactored error={queryError ?? ""} loading={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorControls() {
  // Get the show history, set show history, log query result as json, run query, and query from the editor context
  const {
    showHistory,
    setShowHistory,
    logQueryResultAsJson,
    runQuery,
    query,
  } = useEditorContext();

  return (
    <div className="flex flex-wrap justify-end gap-3 mt-10 lg:mt-6">
      <div className="flex items-center gap-3">
        <div className="relative group">
          <Button
            variant="outline"
            size="sm"
            onClick={logQueryResultAsJson}
            className="flex items-center px-4 py-2 rounded-full transition duration-200 border border-green-700 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-2 focus:ring-emerald-400"
            aria-label="Log query result as JSON"
          >
            <Braces className="w-4 h-4 mr-2 text-white" /> Log JSON
          </Button>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
            Log query as JSON
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
          </div>
        </div>
        <div className="relative group">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center px-4 py-2 rounded-full transition duration-200 border border-green-700 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-2 focus:ring-emerald-400"
            aria-label={
              showHistory
                ? "Hide query history"
                : "Show query history"
            }
          >
            <LucideHistory className="w-4 h-4 mr-2 text-white" />
            {showHistory ? "Hide History" : "Show History"}
          </Button>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
            {navigator.platform.includes("Mac") ? "⌘+H" : "Ctrl+H"}
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
          </div>
        </div>
      </div>
      <div className="relative group">
        <Button
          variant="outline"
          size="sm"
          onClick={() => runQuery(query)}
          className="flex items-center px-5 py-2 rounded-full transition duration-200 border border-green-700 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-2 focus:ring-emerald-400"
          aria-label="Run query"
        >
          <LucidePlay className="w-4 h-4 mr-2 text-white" />
          Run Query
        </Button>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
          {navigator.platform.includes("Mac")
            ? "⌘+Enter"
            : "Ctrl+Enter"}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
        </div>
      </div>
    </div>
  );
}

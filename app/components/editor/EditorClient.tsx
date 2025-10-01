"use client";

import { useEditorContext } from "@/app/context/EditorContext";
import { memo, useState, Suspense, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Braces,
  Database,
  LucideHistory,
  LucidePlay,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import JoinSelect from "./JoinSelect";
import UnionSelect from "./UnionSelect";
import CaseSelect from "./CaseSelect";
import WithSelect from "./WithSelect";
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
    // Join handlers
    joinClauses,
    onJoinTableSelect,
    onJoinTypeSelect,
    onJoinOnColumn1Select,
    onJoinOnColumn2Select,
    onAddJoinClause,
    onRemoveJoinClause,
    unionClauses,
    onUnionTableSelect,
    onUnionTypeSelect,
    onAddUnionClause,
    onRemoveUnionClause,
    caseClause,
    onCaseColumnSelect,
    onCaseOperatorSelect,
    onCaseValueSelect,
    onCaseResultSelect,
    onElseResultSelect,
    onCaseAliasChange,
    onAddCaseCondition,
    onRemoveCaseCondition,
    operatorOptions,
    // CTE/WITH handlers
    cteClauses,
    onCteAliasChange,
    onCteTableSelect,
    onCteColumnSelect,
    onCteLogicalOperatorSelect,
    onCteWhereColumnSelect,
    onCteOperatorSelect,
    onCteValueSelect,
    onAddCteClause,
    onRemoveCteClause,
    onCteGroupBySelect,
    onCteHavingAggregateSelect,
    onCteHavingOperatorSelect,
    onCteHavingValueSelect,
    logicalOperatorOptions,
  } = useEditorContext();
  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState({
    naturalLanguage: true,
    queryBuilder: true,
    filters: true,
    grouping: true,
    advanced: true,
  });

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
          <EditorControls
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onToggleMobileSidebar={() => {}}
            loading={false}
          />
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
                  <p className="text-xs text-slate-400 mt-1 ml-4">
                    Connect a database to start building queries
                  </p>
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
          <EditorControls
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onToggleMobileSidebar={() => {}}
            loading={false}
          />
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
                  <p className="text-xs text-slate-400 mt-1 ml-4">
                    Connect a database to start building queries
                  </p>
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

  const handleGroupByColumnSelectWrapper = (
    value: MultiValue<SelectOption>
  ) => {
    handleGroupByColumnSelect(Array.isArray(value) ? value : []);
  };

  const handleWhereColumnSelectWrapper = (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => {
    handleWhereColumnSelect(value, conditionIndex);
  };

  const handleOperatorSelectWrapper = (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => {
    handleOperatorSelect(value, conditionIndex);
  };

  const handleValueSelectWrapper = (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => {
    handleValueSelect(value, conditionIndex);
  };

  const handleLogicalOperatorSelectWrapper = (
    value: SingleValue<SelectOption>
  ) => {
    handleLogicalOperatorSelect(value, 0);
  };

  const handleAggregateColumnSelectWrapper = (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => {
    handleAggregateColumnSelect(value, conditionIndex);
  };

  const handleHavingOperatorSelectWrapper = (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => {
    handleHavingOperatorSelect(value, conditionIndex);
  };

  const handleHavingValueSelectWrapper = (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => {
    handleHavingValueSelect(value, conditionIndex);
  };

  const handleQueryChangeWithDrawerClose = (sql: string) => {
    handleQueryChange(sql);
    if (showMobileSidebar) {
      setTimeout(() => setShowMobileSidebar(false), 300);
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#16003b] text-white min-h-screen">
      <ToastContainer />
      <div className="flex-shrink-0 border-b border-pink-500/20 bg-gradient-to-r from-gray-900/90 via-purple-900/90 to-gray-900/90 backdrop-blur-md px-3 sm:px-5 py-3 shadow-2xl shadow-purple-500/20">
        <EditorControls
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onToggleMobileSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
          loading={metadataLoading}
        />
      </div>
      <div
        className={`flex flex-1 w-full min-w-0 overflow-hidden transition-all duration-300 ${
          showHistory ? "ml-0 sm:ml-72 md:ml-80 lg:ml-96 xl:ml-[28rem]" : ""
        }`}
      >
        <div
          className={`hidden sm:block sm:w-80 md:w-96 lg:w-[26rem] xl:w-[30rem] 2xl:w-[34rem] flex-shrink-0 border-r border-purple-500/20 bg-gradient-to-b from-gray-900/50 via-purple-900/30 to-gray-900/50 backdrop-blur-md overflow-y-auto shadow-[5px_0_30px_rgba(139,92,246,0.15)] scroll-smooth ${
            showHistory ? "hidden" : ""
          }`}
        >
          <div className="p-3 sm:p-5 space-y-0">
            {error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <>
                <CollapsibleSection
                  title="Natural Language"
                  description="Describe your query in plain English"
                  color="pink"
                  isExpanded={sectionsExpanded.naturalLanguage}
                  onToggle={() => toggleSection("naturalLanguage")}
                >
                  <NaturalLanguageInput
                    schema={schema}
                    onSqlGenerated={handleQueryChangeWithDrawerClose}
                    dialect={dialect}
                  />
                </CollapsibleSection>
                <CollapsibleSection
                  title="Query Builder"
                  description="Select tables and columns to build your SQL query"
                  color="purple"
                  isExpanded={sectionsExpanded.queryBuilder}
                  onToggle={() => toggleSection("queryBuilder")}
                >
                  <div className="space-y-3">
                    <TableSelect metadataLoading={metadataLoading} />
                    <ColumnSelect
                      metadataLoading={metadataLoading}
                      isMySQL={isMySQL}
                    />
                    <CaseSelect
                      selectedTable={selectedTable}
                      tableColumns={tableColumns}
                      caseClause={caseClause}
                      uniqueValues={uniqueValues}
                      joinClauses={joinClauses}
                      operatorOptions={operatorOptions}
                      onCaseColumnSelect={onCaseColumnSelect}
                      onCaseOperatorSelect={onCaseOperatorSelect}
                      onCaseValueSelect={onCaseValueSelect}
                      onCaseResultSelect={onCaseResultSelect}
                      onElseResultSelect={onElseResultSelect}
                      onCaseAliasChange={onCaseAliasChange}
                      onAddCaseCondition={onAddCaseCondition}
                      onRemoveCaseCondition={onRemoveCaseCondition}
                      metadataLoading={metadataLoading}
                    />
                  </div>
                </CollapsibleSection>
                <CollapsibleSection
                  title="Filters"
                  description="Add WHERE conditions to filter your data"
                  color="cyan"
                  isExpanded={sectionsExpanded.filters}
                  onToggle={() => toggleSection("filters")}
                >
                  <WhereClauseSelect
                    metadataLoading={metadataLoading}
                    joinClauses={joinClauses}
                  />
                </CollapsibleSection>
                <CollapsibleSection
                  title="Grouping & Sorting"
                  description="Group data and sort results"
                  color="pink"
                  isExpanded={sectionsExpanded.grouping}
                  onToggle={() => toggleSection("grouping")}
                >
                  <div className="space-y-3">
                    <GroupBySelect
                      metadataLoading={metadataLoading}
                      joinClauses={joinClauses}
                    />
                    <HavingSelect
                      metadataLoading={metadataLoading}
                      joinClauses={joinClauses}
                      isMySQL={isMySQL}
                    />
                    <OrderByLimitSelect
                      metadataLoading={metadataLoading}
                      joinClauses={joinClauses}
                    />
                  </div>
                </CollapsibleSection>
                <CollapsibleSection
                  title="Advanced"
                  description="Joins, unions, and complex operations"
                  color="purple"
                  isExpanded={sectionsExpanded.advanced}
                  onToggle={() => toggleSection("advanced")}
                >
                  <div className="space-y-3">
                    <JoinSelect
                      selectedTable={selectedTable}
                      tableNames={tableNames}
                      tableColumns={tableColumns}
                      joinClauses={joinClauses}
                      schema={schema}
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
                      onUnionTypeSelect={onUnionTypeSelect}
                      onAddUnionClause={onAddUnionClause}
                      onRemoveUnionClause={onRemoveUnionClause}
                      metadataLoading={metadataLoading}
                    />
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
                      onCteColumnSelect={onCteColumnSelect}
                      onCteLogicalOperatorSelect={onCteLogicalOperatorSelect}
                      onCteWhereColumnSelect={onCteWhereColumnSelect}
                      onCteOperatorSelect={onCteOperatorSelect}
                      onCteValueSelect={onCteValueSelect}
                      onAddCteClause={onAddCteClause}
                      onRemoveCteClause={onRemoveCteClause}
                      onCteGroupBySelect={onCteGroupBySelect}
                      onCteHavingAggregateSelect={onCteHavingAggregateSelect}
                      onCteHavingOperatorSelect={onCteHavingOperatorSelect}
                      onCteHavingValueSelect={onCteHavingValueSelect}
                      metadataLoading={metadataLoading}
                    />
                  </div>
                </CollapsibleSection>
              </>
            )}
          </div>
        </div>
        <div
          className={`sm:hidden fixed inset-0 z-50 transform transition-transform duration-300 ${
            showMobileSidebar ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
              showMobileSidebar
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-full h-full bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] shadow-2xl overflow-y-auto scroll-smooth">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] border-b border-purple-500/30 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Query Builder
              </h2>
              <Button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-all duration-200"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-0">
              {error ? (
                <p className="text-red-400">{error}</p>
              ) : (
                <>
                  <CollapsibleSection
                    title="Natural Language"
                    description="Describe your query in plain English"
                    color="pink"
                    isExpanded={sectionsExpanded.naturalLanguage}
                    onToggle={() => toggleSection("naturalLanguage")}
                  >
                    <NaturalLanguageInput
                      schema={schema}
                      onSqlGenerated={handleQueryChangeWithDrawerClose}
                      dialect={dialect}
                    />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Query Builder"
                    description="Select tables and columns to build your SQL query"
                    color="purple"
                    isExpanded={sectionsExpanded.queryBuilder}
                    onToggle={() => toggleSection("queryBuilder")}
                  >
                    <div className="space-y-3">
                      <TableSelect metadataLoading={metadataLoading} />
                      <ColumnSelect
                        metadataLoading={metadataLoading}
                        isMySQL={isMySQL}
                      />
                      <CaseSelect
                        selectedTable={selectedTable}
                        tableColumns={tableColumns}
                        caseClause={caseClause}
                        uniqueValues={uniqueValues}
                        joinClauses={joinClauses}
                        operatorOptions={operatorOptions}
                        onCaseColumnSelect={onCaseColumnSelect}
                        onCaseOperatorSelect={onCaseOperatorSelect}
                        onCaseValueSelect={onCaseValueSelect}
                        onCaseResultSelect={onCaseResultSelect}
                        onElseResultSelect={onElseResultSelect}
                        onCaseAliasChange={onCaseAliasChange}
                        onAddCaseCondition={onAddCaseCondition}
                        onRemoveCaseCondition={onRemoveCaseCondition}
                        metadataLoading={metadataLoading}
                      />
                    </div>
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Filters"
                    description="Add WHERE conditions to filter your data"
                    color="cyan"
                    isExpanded={sectionsExpanded.filters}
                    onToggle={() => toggleSection("filters")}
                  >
                    <WhereClauseSelect
                      metadataLoading={metadataLoading}
                      joinClauses={joinClauses}
                    />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Grouping & Sorting"
                    description="Group data and sort results"
                    color="pink"
                    isExpanded={sectionsExpanded.grouping}
                    onToggle={() => toggleSection("grouping")}
                  >
                    <div className="space-y-3">
                      <GroupBySelect
                        metadataLoading={metadataLoading}
                        joinClauses={joinClauses}
                      />
                      <HavingSelect
                        metadataLoading={metadataLoading}
                        joinClauses={joinClauses}
                        isMySQL={isMySQL}
                      />
                      <OrderByLimitSelect
                        metadataLoading={metadataLoading}
                        joinClauses={joinClauses}
                      />
                    </div>
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Advanced"
                    description="Joins, unions, and complex operations"
                    color="purple"
                    isExpanded={sectionsExpanded.advanced}
                    onToggle={() => toggleSection("advanced")}
                  >
                    <div className="space-y-3">
                      <JoinSelect
                        selectedTable={selectedTable}
                        tableNames={tableNames}
                        tableColumns={tableColumns}
                        joinClauses={joinClauses}
                        schema={schema}
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
                        onUnionTypeSelect={onUnionTypeSelect}
                        onAddUnionClause={onAddUnionClause}
                        onRemoveUnionClause={onRemoveUnionClause}
                        metadataLoading={metadataLoading}
                      />
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
                        onCteColumnSelect={onCteColumnSelect}
                        onCteLogicalOperatorSelect={onCteLogicalOperatorSelect}
                        onCteWhereColumnSelect={onCteWhereColumnSelect}
                        onCteOperatorSelect={onCteOperatorSelect}
                        onCteValueSelect={onCteValueSelect}
                        onAddCteClause={onAddCteClause}
                        onRemoveCteClause={onRemoveCteClause}
                        onCteGroupBySelect={onCteGroupBySelect}
                        onCteHavingAggregateSelect={onCteHavingAggregateSelect}
                        onCteHavingOperatorSelect={onCteHavingOperatorSelect}
                        onCteHavingValueSelect={onCteHavingValueSelect}
                        metadataLoading={metadataLoading}
                      />
                    </div>
                  </CollapsibleSection>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col min-w-0 max-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b]">
          <ResizablePane
            initialSize={50}
            minSize={30}
            maxSize={70}
            direction="vertical"
            className="p-2 sm:p-3 md:p-4 min-h-[200px] max-h-[50vh] overflow-hidden"
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
            initialSize={50}
            minSize={30}
            maxSize={70}
            direction="vertical"
            className="p-2 sm:p-3 md:p-4 min-h-[200px] max-h-[50vh] overflow-hidden"
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
  onToggleHistory,
  onToggleMobileSidebar,
  loading = false,
}: {
  showHistory: boolean;
  onToggleHistory: () => void;
  onToggleMobileSidebar: () => void;
  loading?: boolean;
}) {
  // Get the log query result as json, run query,
  // and query from the editor context
  const { logQueryResultAsJson, exposeQueryResultsToConsole, runQuery, query } =
    useEditorContext();

  return (
    <div className="flex items-center justify-between backdrop-blur-sm bg-gradient-to-r from-gray-900/80 via-purple-900/80 to-gray-900/80">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMobileSidebar}
          className="sm:hidden p-2.5 rounded-xl bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50"
          aria-label="Toggle query builder"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-xl lg:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
            SculptQL
          </h1>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
            <span className="text-xs font-semibold text-cyan-300">EDITOR</span>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
            <span className="text-xs font-mono text-yellow-300 hidden sm:inline">
              Loading...
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={logQueryResultAsJson}
          disabled={loading}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-500/10"
          aria-label="Log query result as JSON"
        >
          <Braces className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">JSON</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={exposeQueryResultsToConsole}
          disabled={loading}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 text-green-300 hover:text-white hover:bg-green-500/30 transition-all duration-200 border border-green-500/30 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-500/10"
          aria-label="Expose query results to console for filtering"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Console</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cyan-500/10"
          aria-label="Toggle query history"
        >
          <LucideHistory className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {showHistory ? "Hide" : "History"}
          </span>
        </Button>
        <Button
          onClick={() => runQuery(query)}
          disabled={loading}
          className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 hover:from-pink-400 hover:via-purple-500 hover:to-pink-400 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/70 border border-pink-400/40 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-pink-500/50 hover:scale-105 active:scale-95"
          aria-label="Run query"
        >
          <LucidePlay className="w-4 h-4" fill="currentColor" />
          <span className="hidden sm:inline font-mono tracking-wider">
            RUN QUERY
          </span>
          <span className="sm:hidden font-mono">RUN</span>
          <kbd className="hidden lg:inline ml-2 px-2 py-1 text-[10px] bg-black/30 rounded border border-white/20 font-mono">
            {navigator.platform.includes("Mac") ? "⌘↵" : "Ctrl+↵"}
          </kbd>
        </Button>
      </div>
    </div>
  );
});

const CollapsibleSection = memo(function CollapsibleSection({
  title,
  description,
  color,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colorClasses = {
    pink: {
      text: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/30",
      hoverBg: "hover:bg-pink-500/20",
      hoverBorder: "hover:border-pink-400/50",
      shadow: "shadow-[0_0_10px_rgba(244,114,182,0.3)]",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(244,114,182,0.5)]",
      dot: "bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]",
    },
    purple: {
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      hoverBg: "hover:bg-purple-500/20",
      hoverBorder: "hover:border-purple-400/50",
      shadow: "shadow-[0_0_10px_rgba(139,92,246,0.3)]",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]",
      dot: "bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]",
    },
    cyan: {
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      hoverBg: "hover:bg-cyan-500/20",
      hoverBorder: "hover:border-cyan-400/50",
      shadow: "shadow-[0_0_10px_rgba(6,182,212,0.3)]",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]",
      dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <div className={`mb-4 rounded-xl border ${colors.border} ${colors.bg} ${isExpanded ? colors.shadow : ''} transition-all duration-300 overflow-hidden backdrop-blur-sm`}>
      <Button
        onClick={onToggle}
        className={`w-full ${colors.hoverBg} ${colors.hoverBorder} ${colors.hoverShadow} rounded-xl transition-all duration-300 p-0 border-none`}
      >
        <div className="flex items-center justify-between w-full px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
            <div className="text-left flex-1">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-normal normal-case tracking-normal">
                {description}
              </p>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className={`w-4 h-4 ${colors.text} transition-transform duration-300`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${colors.text} transition-transform duration-300`} />
            )}
          </div>
        </div>
      </Button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
});


export default EditorClient;

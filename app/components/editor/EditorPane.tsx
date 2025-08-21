"use client";

import { useRef } from "react";
import { AlertCircle } from "lucide-react";
import { CompletionSource } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { useQueryBuilder } from "./useQueryBuilder";
import { useEditorSync } from "./useEditorSync";
import CodeMirrorSetup from "./CodeMirrorSetup";
import QueryTabs from "./QueryTabs";
import TableSelector from "./TableSelector";
import WithSelector from "./WithSelector";
import AggregateSelector from "./AggregateSelector";
import ColumnSelector from "./ColumnSelector";
import WhereClauseSelector from "./WhereClauseSelector";
import OrderByLimitSelector from "./OrderByLimitSelector";
import JoinSelector from "./JoinSelector";
import UnionSelector from "./UnionSelector";
import CaseSelector from "./CaseSelector";
import HavingClauseSelector from "./HavingClauseSelector";
import { Tab, TableColumn } from "@/app/types/query";
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
  completion: CompletionSource;
  metadataLoading: boolean;
  runQuery: () => void;
  tableNames: string[];
  tableColumns: TableColumn;
  onError?: (error: string) => void;
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
  onError,
}: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  const {
    queryState,
    queryError,
    fetchError,
    updateQueryState,
    handleTableSelect,
    handleColumnSelect,
    handleAggregateSelect,
    handleAggregateColumnSelect,
    handleDecimalPlacesSelect,
    handleGroupByColumnsSelect,
    handleLogicalOperatorSelect,
    handleWhereColumnSelect,
    handleOperatorSelect,
    handleValueSelect,
    handleHavingAggregateSelect,
    handleHavingColumnSelect,
    handleHavingOperatorSelect,
    handleHavingValueChange,
    handleOrderByColumnSelect,
    handleOrderByDirectionSelect,
    handleLimitSelect,
    handleJoinTypeSelect,
    handleJoinTableSelect,
    handleJoinOnColumn1Select,
    handleJoinOnColumn2Select,
    addJoinClause,
    removeJoinClause,
    handleUnionTableSelect,
    addUnionClause,
    removeUnionClause,
    handleCaseColumnSelect,
    handleCaseOperatorSelect,
    handleCaseValueSelect,
    handleCaseResultSelect,
    handleElseResultSelect,
    handleCaseAliasChange,
    addCaseCondition,
    removeCaseCondition,
    operatorOptions,
    logicalOperatorOptions,
    handleCteAliasChange,
    handleCteTableSelect,
    handleCteColumnSelect,
    handleCteLogicalOperatorSelect,
    handleCteWhereColumnSelect,
    handleCteOperatorSelect,
    handleCteValueSelect,
    addCteClause,
    removeCteClause,
  } = useQueryBuilder(tableNames, tableColumns, onQueryChange, editorRef);

  useEditorSync({
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
  });

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
      <div className="flex flex-col gap-2 p-2 border-b border-slate-700">
        {(fetchError || queryError) && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{fetchError || queryError}</span>
          </div>
        )}
        <WithSelector
          selectedTable={queryState.selectedTable}
          tableNames={tableNames}
          tableColumns={tableColumns}
          cteClauses={queryState.cteClauses}
          uniqueValues={queryState.uniqueValues}
          operatorOptions={operatorOptions}
          logicalOperatorOptions={logicalOperatorOptions}
          onCteAliasChange={handleCteAliasChange}
          onCteTableSelect={handleCteTableSelect}
          onCteColumnSelect={handleCteColumnSelect}
          onCteLogicalOperatorSelect={handleCteLogicalOperatorSelect}
          onCteWhereColumnSelect={handleCteWhereColumnSelect}
          onCteOperatorSelect={handleCteOperatorSelect}
          onCteValueSelect={handleCteValueSelect}
          onAddCteClause={addCteClause}
          onRemoveCteClause={removeCteClause}
          metadataLoading={metadataLoading}
        />
        <TableSelector
          tableNames={tableNames}
          selectedTable={queryState.selectedTable}
          onTableSelect={handleTableSelect}
          metadataLoading={metadataLoading}
        />
        <UnionSelector
          selectedTable={queryState.selectedTable}
          tableNames={tableNames}
          unionClauses={queryState.unionClauses}
          onUnionTableSelect={handleUnionTableSelect}
          onAddUnionClause={addUnionClause}
          onRemoveUnionClause={removeUnionClause}
          metadataLoading={metadataLoading}
        />
        <JoinSelector
          selectedTable={queryState.selectedTable}
          tableNames={tableNames}
          tableColumns={tableColumns}
          joinClauses={queryState.joinClauses}
          onJoinTypeSelect={handleJoinTypeSelect}
          onJoinTableSelect={handleJoinTableSelect}
          onJoinOnColumn1Select={handleJoinOnColumn1Select}
          onJoinOnColumn2Select={handleJoinOnColumn2Select}
          onAddJoinClause={addJoinClause}
          onRemoveJoinClause={removeJoinClause}
          metadataLoading={metadataLoading}
        />
        <AggregateSelector
          selectedTable={queryState.selectedTable}
          tableColumns={tableColumns}
          selectedAggregate={queryState.selectedAggregate}
          aggregateColumn={queryState.aggregateColumn}
          decimalPlaces={queryState.decimalPlaces}
          joinClauses={queryState.joinClauses}
          onAggregateSelect={handleAggregateSelect}
          onAggregateColumnSelect={handleAggregateColumnSelect}
          onDecimalPlacesSelect={handleDecimalPlacesSelect}
          metadataLoading={metadataLoading}
        />
        <ColumnSelector
          selectedTable={queryState.selectedTable}
          tableColumns={tableColumns}
          selectedColumns={queryState.selectedColumns}
          groupByColumns={queryState.groupByColumns}
          onColumnSelect={handleColumnSelect}
          joinClauses={queryState.joinClauses}
          onGroupByColumnsSelect={handleGroupByColumnsSelect}
          metadataLoading={metadataLoading}
        />
        <CaseSelector
          selectedTable={queryState.selectedTable}
          tableColumns={tableColumns}
          caseClause={queryState.caseClause}
          uniqueValues={queryState.uniqueValues}
          joinClauses={queryState.joinClauses}
          operatorOptions={operatorOptions}
          onCaseColumnSelect={handleCaseColumnSelect}
          onCaseOperatorSelect={handleCaseOperatorSelect}
          onCaseValueSelect={handleCaseValueSelect}
          onCaseResultSelect={handleCaseResultSelect}
          onElseResultSelect={handleElseResultSelect}
          onCaseAliasChange={handleCaseAliasChange}
          onAddCaseCondition={addCaseCondition}
          onRemoveCaseCondition={removeCaseCondition}
          metadataLoading={metadataLoading}
        />
        <WhereClauseSelector
          selectedTable={queryState.selectedTable}
          tableColumns={tableColumns}
          whereClause={queryState.whereClause}
          uniqueValues={queryState.uniqueValues}
          onLogicalOperatorSelect={handleLogicalOperatorSelect}
          onWhereColumnSelect={handleWhereColumnSelect}
          onOperatorSelect={handleOperatorSelect}
          onValueSelect={handleValueSelect}
          metadataLoading={metadataLoading}
          operatorOptions={operatorOptions}
          logicalOperatorOptions={logicalOperatorOptions}
          joinClauses={queryState.joinClauses}
        />
        <HavingClauseSelector
          tableColumns={tableColumns}
          selectedTable={queryState.selectedTable}
          joinClauses={queryState.joinClauses}
          havingClause={queryState.havingClause}
          uniqueValues={queryState.uniqueValues}
          onHavingAggregateSelect={handleHavingAggregateSelect}
          onHavingColumnSelect={handleHavingColumnSelect}
          onHavingOperatorSelect={handleHavingOperatorSelect}
          onHavingValueChange={handleHavingValueChange}
          metadataLoading={metadataLoading}
          operatorOptions={operatorOptions}
        />
        <OrderByLimitSelector
          selectedTable={queryState.selectedTable}
          tableColumns={tableColumns}
          orderByClause={queryState.orderByClause}
          limit={queryState.limit}
          onOrderByColumnSelect={handleOrderByColumnSelect}
          onOrderByDirectionSelect={handleOrderByDirectionSelect}
          onLimitSelect={handleLimitSelect}
          metadataLoading={metadataLoading}
          joinClauses={queryState.joinClauses}
        />
      </div>
      <CodeMirrorSetup
        containerRef={containerRef}
        onToggleFullscreen={onToggleFullscreen}
        fullScreenEditor={fullScreenEditor}
        formatQuery={() => {
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
        }}
      />
    </div>
  );
}
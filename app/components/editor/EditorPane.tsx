"use client";

import { useRef } from "react";
import { EditorView } from "@codemirror/view";
import QueryTabs from "./QueryTabs";
import TableSelector from "./TableSelector";
import AggregateSelector from "./AggregateSelector";
import ColumnSelector from "./ColumnSelector";
import WhereClauseSelector from "./WhereClauseSelector";
import OrderByLimitSelector from "./OrderByLimitSelector";
import JoinSelector from "./JoinSelector";
import CodeMirrorSetup from "./CodeMirrorSetup";
import { Tab, TableColumn } from "@/app/types/query";
import { CompletionSource } from "@codemirror/autocomplete";
import { useQueryBuilder } from "./useQueryBuilder";
import { useEditorSync } from "./useEditorSync";
import { AlertCircle } from "lucide-react";
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
    handleOrderByColumnSelect,
    handleOrderByDirectionSelect,
    handleLimitSelect,
    handleJoinTypeSelect, 
    handleJoinTableSelect,
    handleJoinOnColumn1Select,
    handleJoinOnColumn2Select,
    addJoinClause,
    removeJoinClause,
    operatorOptions,
    logicalOperatorOptions,
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
        <TableSelector
          tableNames={tableNames}
          selectedTable={queryState.selectedTable}
          onTableSelect={handleTableSelect}
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
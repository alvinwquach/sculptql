"use client";

import { memo, useCallback, useMemo, Suspense } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MultiValue, SingleValue } from "react-select";
import {
  SelectOption,
  TableSchema,
  QueryResult,
  QueryTemplate,
  ViewMode,
  ChartDataItem,
} from "../../types/query";
import EditorSkeleton from "./EditorSkeleton";
import NoDatabaseConnected from "./NoDatabaseConnected";
import ResultsPane from "./ResultsPane";
import Sidebar from "../common/Sidebar";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { useQueryStore } from "@/app/stores/useQueryStore";
import { useUIStore } from "@/app/stores/useUIStore";
import { useResultsStore } from "@/app/stores/useResultsStore";
import { useHistoryStore } from "@/app/stores/useHistoryStore";
import { useQueryActionsStore } from "@/app/stores/useQueryActionsStore";
import { useComputedValues } from "@/app/context/hooks/useComputedValues";
import { useExportFunctions } from "@/app/context/hooks/useExportFunctions";
import { RUN_QUERY } from "@/app/graphql/mutations/runQuery";
import { GET_DIALECT } from "@/app/graphql/queries/getSchema";
import EditorControls from "./controls/EditorControls";
import QueryHistory from "../history/QueryHistory";
import CodeMirrorEditor from "./CodeMirrorEditor";
import HorizontalResizablePanel from "../common/HorizontalResizablePanel";
import VerticalResizablePanel from "../common/VerticalResizablePanel";
import QueryBuilderSidebar from "./QueryBuilderSidebar";
import {
  getClientPermissionMode,
  validateSqlForToast,
} from "@/app/utils/editor/sqlPermissionLinter";

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
  const query = useQueryStore((state) => state.query);
  const selectedColumns = useQueryStore((state) => state.selectedColumns);
  const selectedTable = useQueryStore((state) => state.selectedTable);
  const showHistory = useUIStore((state) => state.showHistory);
  const setShowHistory = useUIStore((state) => state.setShowHistory);
  const isEditorFullscreen = useUIStore((state) => state.isEditorFullscreen);
  const setIsEditorFullscreen = useUIStore(
    (state) => state.setIsEditorFullscreen
  );
  const showQueryBuilder = useUIStore((state) => state.showQueryBuilder);
  const setShowQueryBuilder = useUIStore((state) => state.setShowQueryBuilder);
  const queryError = useResultsStore((state) => state.queryError);
  const queryResult = useResultsStore((state) => state.queryResult);
  const setQueryResult = useResultsStore((state) => state.setQueryResult);
  const setQueryError = useResultsStore((state) => state.setQueryError);
  const addToHistory = useHistoryStore((state) => state.addToHistory);
  const setViewMode = useResultsStore((state) => state.setViewMode);
  const setCurrentPage = useResultsStore((state) => state.setCurrentPage);
  const setPageSize = useResultsStore((state) => state.setPageSize);

  const {
    handleQueryChange,
    handleTableSelect,
    handleColumnSelect,
    handleDistinctChange,
    handleGroupByColumnSelect,
    handleWhereColumnSelect,
    handleOperatorSelect,
    handleValueSelect,
    handleLogicalOperatorSelect,
    handleAggregateColumnSelect,
    handleHavingOperatorSelect,
    handleHavingValueSelect,
  } = useQueryActionsStore();

  const { tableNames, tableColumns, table, tableDescription } =
    useComputedValues(schema, selectedTable);

  const { exportToCsv, exportToJson, exportToMarkdown } = useExportFunctions(
    queryResult,
    query
  );

  const [runQueryMutation] = useMutation<
    { runQuery: QueryResult },
    { query: string }
  >(RUN_QUERY);
  const { data: dialectData } = useQuery<{ dialect: string }>(GET_DIALECT);
  const dialect = dialectData?.dialect || "postgres";

  const statsChartData: ChartDataItem[] = [];
  const resultChartData: ChartDataItem[] = [];

  const runQuery = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        toast.error("Please enter a query");
        return;
      }

      const permissionMode = getClientPermissionMode();
      const validation = validateSqlForToast(query, permissionMode);

      if (!validation.allowed) {
        toast.error(validation.message || "Query not allowed");
        setQueryError(validation.message || "Query not allowed in current permission mode");
        return;
      }

      try {
        setQueryError(null);
        const { data } = await runQueryMutation({
          variables: { query: query.trim() },
        });
        if (data?.runQuery) {
          setQueryResult(data.runQuery);
        }
        addToHistory(query.trim());
      } catch (error) {
        console.error("Query execution error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Query execution failed";
        setQueryError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [runQueryMutation, setQueryError, setQueryResult, addToHistory]
  );

  const handleTemplateSelect = useCallback(
    (template: QueryTemplate) => {
      handleQueryChange(template.query);
      toast.success(`Template "${template.name}" loaded into editor`);
    },
    [handleQueryChange]
  );

  const handleTemplateResult = useCallback(
    (result: QueryResult) => {
      setQueryResult(result);
    },
    [setQueryResult]
  );

  const formatSqlHandlerRef = useCallback((handler: (() => void) | null) => {
    if (handler) {
      (
        window as Window & { __formatSqlHandler?: () => void }
      ).__formatSqlHandler = handler;
    }
  }, []);

  const handleFormatSql = useCallback(() => {
    const handler = (window as Window & { __formatSqlHandler?: () => void })
      .__formatSqlHandler;
    if (handler) {
      handler();
    }
  }, []);

  const handleToggleEditorFullscreen = useCallback(() => {
    setIsEditorFullscreen(!isEditorFullscreen);
  }, [isEditorFullscreen, setIsEditorFullscreen]);

  const handleToggleHistory = useCallback(() => {
    setShowHistory(!showHistory);
  }, [showHistory, setShowHistory]);

  const handleToggleQueryBuilder = useCallback(() => {
    setShowQueryBuilder(!showQueryBuilder);
  }, [showQueryBuilder, setShowQueryBuilder]);

  const logQueryResultAsJson = useCallback(() => {
    if (queryResult) {
      console.log("Query Result:", JSON.stringify(queryResult, null, 2));
      toast.success("Query result logged to console");
    } else {
      toast.error("No query result to log");
    }
  }, [queryResult]);

  const exposeQueryResultsToConsole = useCallback(() => {
    if (queryResult && queryResult.rows) {
      (window as Window & { QueryResults?: unknown }).QueryResults = {
        data: queryResult.rows,
        fields: queryResult.fields,
        rowCount: queryResult.rowCount,
        filter: (predicate: (row: Record<string, unknown>) => boolean) => {
          return queryResult!.rows.filter(predicate);
        },
        map: (mapper: (row: Record<string, unknown>) => unknown) => {
          return queryResult!.rows.map(mapper);
        },
        find: (predicate: (row: Record<string, unknown>) => boolean) => {
          return queryResult!.rows.find(predicate);
        },
        getColumnValues: (columnName: string) => {
          return queryResult!.rows.map((row) => row[columnName]);
        },
        getUniqueValues: (columnName: string) => {
          return [...new Set(queryResult!.rows.map((row) => row[columnName]))];
        },
        count: () => {
          return queryResult!.rows.length;
        },
        fullResult: queryResult,
      };
      console.log("QueryResults exposed to console!");
      toast.success(
        "Query results exposed to console! Check console for usage instructions."
      );
    } else {
      toast.error("No query result available to expose");
    }
  }, [queryResult]);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => setViewMode(mode),
    [setViewMode]
  );

  const handlePageChange = useCallback(
    (page: number) => setCurrentPage(page),
    [setCurrentPage]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
    },
    [setPageSize, setCurrentPage]
  );

  const operatorOptions: SelectOption[] = useMemo(
    () => [
      { value: "=", label: "=" },
      { value: "!=", label: "!=" },
      { value: ">", label: ">" },
      { value: "<", label: "<" },
      { value: ">=", label: ">=" },
      { value: "<=", label: "<=" },
      { value: "LIKE", label: "LIKE" },
      { value: "IS NULL", label: "IS NULL" },
      { value: "IS NOT NULL", label: "IS NOT NULL" },
      { value: "BETWEEN", label: "BETWEEN" },
    ],
    []
  );

  const logicalOperatorOptions: SelectOption[] = useMemo(
    () => [
      { value: "AND", label: "AND" },
      { value: "OR", label: "OR" },
    ],
    []
  );

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

  if (metadataLoading) {
    return <EditorSkeleton />;
  }

  if (!metadataLoading && (!schema || schema.length === 0)) {
    return (
      <div className="flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white min-h-screen">
        <ToastContainer
          position="top-right"
          style={{ zIndex: 99999999 }}
          toastStyle={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            color: "#e2e8f0",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)",
            backdropFilter: "blur(10px)",
            fontWeight: 500,
          }}
        />
        <div className="flex-shrink-0 border-b border-purple-500/20 bg-gradient-to-r from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-sm px-4 py-3 shadow-[0_4px_20px_rgba(139,92,246,0.1)] relative w-full h-full z-[100000]">
          <EditorControls
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onToggleMobileSidebar={() => {}}
            loading={false}
            runQuery={runQuery}
            query={query}
            hasDatabase={false}
            onTemplateSelect={handleTemplateSelect}
            onTemplateResult={handleTemplateResult}
            schema={[]}
            metadataLoading={false}
            isMySQL={false}
          />
        </div>
        <div className="flex-1 flex">
          <div className="hidden lg:block lg:w-80 border-r border-purple-500/20 bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e]">
            <div className="p-4">
              <p className="text-sm text-slate-400">
                Connect a database to start
              </p>
            </div>
          </div>
          <div className="flex-1">
            <NoDatabaseConnected />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white h-screen font-sans">
      <ToastContainer
        position="top-right"
        style={{ zIndex: 99999999 }}
        toastStyle={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          color: "#e2e8f0",
          border: "1px solid rgba(139, 92, 246, 0.4)",
          boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)",
          backdropFilter: "blur(10px)",
          fontWeight: 500,
        }}
      />
      <div className="flex-shrink-0 border-b border-purple-500/20 bg-gradient-to-r from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-sm px-4 py-3 shadow-[0_4px_20px_rgba(139,92,246,0.1)] relative z-[100000]">
        <EditorControls
          showHistory={showHistory}
          onToggleHistory={handleToggleHistory}
          onToggleMobileSidebar={handleToggleQueryBuilder}
          loading={metadataLoading}
          runQuery={runQuery}
          query={query}
          onTemplateSelect={handleTemplateSelect}
          onTemplateResult={handleTemplateResult}
          schema={schema}
          metadataLoading={metadataLoading}
          isMySQL={isMySQL}
          onFormatSql={handleFormatSql}
          isEditorFullscreen={isEditorFullscreen}
          onToggleEditorFullscreen={handleToggleEditorFullscreen}
        />
      </div>
      <div className="flex-1 w-full min-w-0 overflow-hidden flex relative">
        <div className="hidden lg:block w-80 flex-shrink-0 border-r border-purple-500/20">
          <QueryBuilderSidebar
            schema={schema}
            metadataLoading={metadataLoading}
            isMySQL={isMySQL}
          />
        </div>
        {showQueryBuilder && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
              onClick={() => setShowQueryBuilder(false)}
            />
            <div className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] border-r border-purple-500/20 z-[100000] overflow-y-auto">
              <QueryBuilderSidebar
                schema={schema}
                metadataLoading={metadataLoading}
                isMySQL={isMySQL}
              />
            </div>
          </>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <VerticalResizablePanel
            defaultTopHeight={50}
            minTopHeight={30}
            minBottomHeight={30}
            localStorageKey="editor-results-vertical-split"
            topPanel={
              <div className="p-2 h-full flex flex-col">
                <div className="flex-1 rounded-lg border border-purple-500/20 bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden">
                  <CodeMirrorEditor
                    selectedColumns={selectedColumns}
                    selectedTable={selectedTable}
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
                    logQueryResultAsJson={logQueryResultAsJson}
                    exposeQueryResultsToConsole={exposeQueryResultsToConsole}
                    hasResults={!!queryResult}
                    onFormatSqlHandlerReady={formatSqlHandlerRef}
                    isFullscreen={isEditorFullscreen}
                  />
                </div>
              </div>
            }
            bottomPanel={
              <div className="p-2 h-full flex flex-col">
                <div className="flex-1 rounded-lg border border-purple-500/20 bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden">
                  <ResultsPane
                    error={queryError ?? ""}
                    loading={false}
                    table={table}
                    tableDescription={tableDescription}
                    statsChartData={statsChartData}
                    resultChartData={resultChartData}
                    handleViewModeChange={handleViewModeChange}
                    exportToCsv={exportToCsv}
                    exportToJson={exportToJson}
                    exportToMarkdown={exportToMarkdown}
                    handlePageChange={handlePageChange}
                    handlePageSizeChange={handlePageSizeChange}
                    logQueryResultAsJson={logQueryResultAsJson}
                    exposeQueryResultsToConsole={exposeQueryResultsToConsole}
                  />
                </div>
              </div>
            }
          />
        </div>
      </div>
      <Sidebar
        isOpen={showHistory}
        onToggle={handleToggleHistory}
        title="Query History"
      >
        <Suspense fallback={<LoadingSkeleton height="h-32" />}>
          <QueryHistory />
        </Suspense>
      </Sidebar>
    </div>
  );
});

export default EditorClient;
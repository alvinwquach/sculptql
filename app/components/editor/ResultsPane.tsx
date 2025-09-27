"use client";

import { useEditorContext } from "@/app/context/EditorContext";
import ChartsPanel from "../panel/ChartsPanel";
import StatsPanel from "../panel/StatsPanel";
import DescribeTableView from "../results/DescribeTableView";
import EmptyState from "../results/EmptyState";
import JsonView from "../results/JsonView";
import ShowTableView from "../results/ShowTableView";
import TableView from "../results/TableView";
import ViewToggle from "../view/ViewToggle";
import { Loader2 } from "lucide-react";

// Props for the ResultsPane component
interface ResultsPaneProps {
  error: string | undefined;
  loading: boolean;
}

export default function ResultsPane({
  error,
  loading,
}: ResultsPaneProps) {
  // Get the query result, view mode, selected table, table, table description, stats chart data, result chart data, handle view mode change, export to csv, export to json, export to markdown, current page, page size, handle page change, and handle page size change from the editor context
  const {
    queryResult,
    viewMode,
    selectedTable,
    table,
    tableDescription,
    statsChartData,
    resultChartData,
    handleViewModeChange,
    exportToCsv,
    exportToJson,
    exportToMarkdown,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useEditorContext();

  return (
    <div className={`flex-1 p-6 overflow-auto bg-[#0f172a]`}>
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-xl shadow-lg transition-all duration-200">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-300 animate-pulse">
          <Loader2 className="w-12 h-12 mb-4 animate-spin text-green-400" />
          <p className="text-lg font-medium">Loading query results...</p>
        </div>
      )}
      {!loading && (
        <>
          {(queryResult ||
            viewMode === "show" ||
            viewMode === "describe" ||
            viewMode === "bar" ||
            viewMode === "pie" ||
            viewMode === "line") && (
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          )}
          {viewMode === "show" && (
            <ShowTableView selectedTable={selectedTable?.value || ""} table={table} />
          )}
          {viewMode === "describe" && (
            <DescribeTableView
              selectedTable={selectedTable?.value || ""}
              tableDescription={tableDescription}
            />
          )}
          {queryResult && viewMode === "table" && (
            <TableView
              result={queryResult}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onExportToCsv={exportToCsv}
              onExportToJson={exportToJson}
              onExportToMarkdown={exportToMarkdown}
            />
          )}
          {queryResult && viewMode === "json" && (
            <JsonView
              result={queryResult}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onExportToCsv={exportToCsv}
              onExportToJson={exportToJson}
              onExportToMarkdown={exportToMarkdown}
            />
          )}
          {queryResult && viewMode === "stats" && (
            <StatsPanel result={queryResult} chartData={statsChartData} />
          )}
          {queryResult &&
            (viewMode === "bar" ||
              viewMode === "pie" ||
              viewMode === "line") && (
              <ChartsPanel
                viewMode={viewMode}
                chartData={resultChartData}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          {!queryResult &&
            !["show", "describe", "bar", "pie", "line"].includes(viewMode) && (
              <EmptyState viewMode={viewMode} />
            )}
          {["bar", "pie", "line"].includes(viewMode) && !queryResult && (
            <EmptyState viewMode={viewMode} />
          )}
        </>
      )}
    </div>
  );
}

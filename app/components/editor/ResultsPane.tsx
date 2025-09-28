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
    <div className={`h-full p-4 sm:p-6 overflow-auto bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81]`}>
      {error && (
        <div className="bg-red-900/30 border-2 border-red-500/50 text-red-200 p-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-200 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="font-bold">ERROR:</span>
          </div>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center h-full text-purple-300 animate-pulse">
          <div className="relative">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-purple-500/30 rounded-full animate-ping"></div>
          </div>
          <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Loading query results...
          </p>
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

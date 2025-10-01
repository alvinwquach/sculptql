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
    <div 
      className="h-full p-4 sm:p-6 overflow-auto relative"
      style={{
        background: "linear-gradient(135deg, #0a0a0f, #1a1a2e)",
        boxShadow: "inset 0 0 60px rgba(139, 92, 246, 0.08)"
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(244, 114, 182, 0.08), rgba(16, 185, 129, 0.08))",
        }}
      />
      
      {error && (
        <div 
          className="relative border-2 text-red-200 p-4 rounded-xl transition-all duration-200 font-mono mb-4 animate-in fade-in slide-in-from-top-2"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))",
            borderColor: "#ef4444",
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ boxShadow: "0 0 8px rgba(239, 68, 68, 0.8)" }}></div>
            <span className="font-bold">ERROR:</span>
          </div>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center h-full relative z-10">
          <div className="relative">
            <Loader2 
              className="w-12 h-12 mb-4 animate-spin"
              style={{ 
                color: "#10b981",
                filter: "drop-shadow(0 0 15px rgba(16, 185, 129, 0.6))"
              }} 
            />
            <div 
              className="absolute inset-0 w-12 h-12 border-2 rounded-full animate-ping"
              style={{ 
                borderColor: "rgba(139, 92, 246, 0.4)"
              }}
            ></div>
          </div>
          <p 
            className="text-lg font-medium"
            style={{
              background: "linear-gradient(135deg, #10b981, #8b5cf6, #f472b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Loading query results...
          </p>
        </div>
      )}
      {!loading && (
        <div className="relative z-10">
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
        </div>
      )}
    </div>
  );
}

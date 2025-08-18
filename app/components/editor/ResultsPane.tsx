"use client";

import { Loader2 } from "lucide-react";
import {
  QueryResult,
  ViewMode,
  ChartDataItem,
  TableSchema,
  TableDescription,
} from "@/app/types/query";
import ChartsPanel from "../panel/ChartsPanel";
import StatsPanel from "../panel/StatsPanel";
import DescribeTableView from "../results/DescribeTableView";
import EmptyState from "../results/EmptyState";
import JsonView from "../results/JsonView";
import ShowTableView from "../results/ShowTableView";
import TableView from "../results/TableView";
import ViewToggle from "../view/ViewToggle";

interface ResultsPaneProps {
  error: string | undefined;
  loading: boolean;
  result: QueryResult | undefined;
  viewMode: ViewMode;
  selectedTable: string;
  table: TableSchema[];
  tableDescription: TableDescription | null;
  chartData: ChartDataItem[];
  resultChartData: ChartDataItem[];
  onViewModeChange: (mode: ViewMode) => void;
  onExportToCsv: (
    exportAll: boolean,
    startIndex: number,
    endIndex: number
  ) => void;
  onExportToJson: (
    exportAll: boolean,
    startIndex: number,
    endIndex: number
  ) => void;
  fullScreenEditor: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function ResultsPane({
  error,
  loading,
  result,
  viewMode,
  selectedTable,
  table,
  tableDescription,
  chartData,
  resultChartData,
  onViewModeChange,
  onExportToCsv,
  onExportToJson,
  fullScreenEditor,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ResultsPaneProps) {
  return (
    <div
      className={`flex-1 p-4 overflow-auto ${
        fullScreenEditor ? "hidden" : "h-full"
      } space-y-6 bg-[#0f172a]`}
    >
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
          {(result ||
            viewMode === "show" ||
            viewMode === "describe" ||
            viewMode === "bar" ||
            viewMode === "pie" ||
            viewMode === "line") && (
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          )}
          {viewMode === "show" && (
            <ShowTableView selectedTable={selectedTable} table={table} />
          )}
          {viewMode === "describe" && (
            <DescribeTableView
              selectedTable={selectedTable}
              tableDescription={tableDescription}
            />
          )}
          {result && viewMode === "table" && (
            <TableView
              result={result}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              onExportToCsv={onExportToCsv}
              onExportToJson={onExportToJson}
            />
          )}
          {result && viewMode === "json" && (
            <JsonView
              result={result}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              onExportToCsv={onExportToCsv}
              onExportToJson={onExportToJson}
            />
          )}
          {result && viewMode === "stats" && (
            <StatsPanel result={result} chartData={chartData} />
          )}
          {result &&
            (viewMode === "bar" ||
              viewMode === "pie" ||
              viewMode === "line") && (
              <ChartsPanel
                viewMode={viewMode}
                chartData={resultChartData}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          {!result &&
            !["show", "describe", "bar", "pie", "line"].includes(viewMode) && (
              <EmptyState viewMode={viewMode} />
            )}
          {["bar", "pie", "line"].includes(viewMode) && !result && (
            <EmptyState viewMode={viewMode} />
          )}
        </>
      )}
    </div>
  );
}

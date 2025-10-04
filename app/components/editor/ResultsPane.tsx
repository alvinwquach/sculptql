"use client";

import ChartsPanel from "../panel/ChartsPanel";
import StatsPanel from "../panel/StatsPanel";
import DescribeTableView from "../results/DescribeTableView";
import JsonView from "../results/JsonView";
import ShowTableView from "../results/ShowTableView";
import TableView from "../results/TableView";
import ViewToggle from "../view/ViewToggle";
// import ResultsToolbar from "../view/ResultsToolbar";
import { Loader2 } from "lucide-react";
import { useQueryStore } from "@/app/stores/useQueryStore";
import { useResultsStore } from "@/app/stores/useResultsStore";
import {
  ViewMode,
  TableSchema,
  TableDescription,
  ChartDataItem,
} from "@/app/types/query";

interface ResultsPaneProps {
  error: string | undefined;
  loading: boolean;
  table: TableSchema[];
  tableDescription: TableDescription | null;
  statsChartData: ChartDataItem[];
  resultChartData: ChartDataItem[];
  handleViewModeChange: (mode: ViewMode) => void;
  exportToCsv: () => void;
  exportToJson: () => void;
  exportToMarkdown: () => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
  logQueryResultAsJson: () => void;
  exposeQueryResultsToConsole: () => void;
}

export default function ResultsPane({
  error,
  loading,
  table,
  tableDescription,
  statsChartData,
  resultChartData,
  handleViewModeChange,
  exportToCsv,
  exportToJson,
  exportToMarkdown,
  handlePageChange,
  handlePageSizeChange,
  logQueryResultAsJson,
  exposeQueryResultsToConsole,
}: ResultsPaneProps) {
  const selectedTable = useQueryStore((state) => state.selectedTable);
  const queryResult = useResultsStore((state) => state.queryResult);
  const viewMode = useResultsStore((state) => state.viewMode);
  const currentPage = useResultsStore((state) => state.currentPage);
  const pageSize = useResultsStore((state) => state.pageSize);

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]">
      {error && (
        <div className="p-4">
          <div className="border-2 text-red-200 p-4 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2 bg-red-900/30 border-red-800/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              <span className="font-bold">ERROR:</span>
            </div>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-green-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            <div className="absolute inset-0 w-12 h-12 border-2 rounded-full animate-ping border-green-400/50"></div>
          </div>
          <p className="text-lg font-medium text-green-400">
            Loading query results...
          </p>
        </div>
      )}
      {!loading &&
        !error &&
        !queryResult &&
        !["show", "describe"].includes(viewMode) && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="mb-6 relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-purple-500/10 animate-ping"></div>
              </div>
              <h3 className="text-xl font-semibold text-purple-300 mb-3">
                No Results Yet
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The results of your query will appear here. Write a query in the
                editor and press{" "}
                <kbd className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs font-mono">
                  Cmd+Enter
                </kbd>{" "}
                to run it.
              </p>
            </div>
          </div>
        )}
      {!loading && (queryResult || ["show", "describe"].includes(viewMode)) && (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* <ResultsToolbar
            hasResults={!!queryResult}
            exportToCsv={exportToCsv}
            exportToJson={exportToJson}
            exportToMarkdown={exportToMarkdown}
            logQueryResultAsJson={logQueryResultAsJson}
            exposeQueryResultsToConsole={exposeQueryResultsToConsole}
          /> */}
          {(queryResult ||
            ["show", "describe", "bar", "pie", "line"].includes(viewMode)) && (
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          )}
          <div className="flex-1 min-h-0 overflow-auto">
            {viewMode === "show" && (
              <div className="h-full min-h-[400px]">
                <ShowTableView
                  selectedTable={selectedTable?.value || ""}
                  table={table}
                />
              </div>
            )}
            {viewMode === "describe" && (
              <div className="h-full min-h-[400px]">
                <DescribeTableView
                  selectedTable={selectedTable?.value || ""}
                  tableDescription={tableDescription}
                />
              </div>
            )}
            {queryResult && viewMode === "table" && (
              <div className="h-full min-h-[400px]">
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
              </div>
            )}
            {queryResult && viewMode === "json" && (
              <div className="h-full min-h-[400px]">
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
              </div>
            )}
            {queryResult && viewMode === "stats" && (
              <div className="h-full min-h-[400px]">
                <StatsPanel result={queryResult} chartData={statsChartData} />
              </div>
            )}
            {queryResult && ["bar", "pie", "line"].includes(viewMode) && (
              <div className="h-full min-h-[400px]">
                <ChartsPanel
                  viewMode={viewMode}
                  chartData={resultChartData}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
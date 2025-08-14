"use client";

import {
  Braces,
  Database,
  Download,
  ListTree,
  Loader2,
  Table,
  BarChart2,
  PieChart,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ViewToggle from "../view/ViewToggle";
import StatsPanel from "../panel/StatsPanel";
import ChartsPanel from "../panel/ChartsPanel";
import {
  QueryResult,
  ViewMode,
  ChartDataItem,
  TableSchema,
  TableDescription,
} from "../../types/query";

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
  onExportToCsv: () => void;
  onExportToJson: () => void;
  fullScreenEditor: boolean;
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
}: ResultsPaneProps) {
  return (
    <div
      className={`flex-1 lg:w-1/2 p-4 overflow-auto ${
        fullScreenEditor ? "hidden" : "h-full"
      } space-y-4 sm:space-y-6`}
    >
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 sm:p-4 rounded-lg shadow-md">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
          <Loader2 className="w-12 h-12 mb-4 animate-spin text-green-400" />
          <p className="text-lg">Loading query results...</p>
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
          {viewMode === "show" && selectedTable && table.length > 0 && (
            <div className="bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
              <div className="flex items-center mb-2 sm:mb-4">
                <Database className="w-5 h-5 text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-green-300">
                  Show Table
                </h2>
              </div>
              <p className="text-gray-400 mb-2 sm:mb-4 text-sm sm:text-base">
                Displays metadata for the queried table, including its name,
                database, schema, and type.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111827] text-green-400 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Name
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Database
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Schema
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Type
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((table, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-600 hover:bg-slate-700 transition-colors duration-200"
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {table.table_name}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {table.table_catalog}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {table.table_schema}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {table.table_type}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {table.comment ?? "null"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {viewMode === "show" && (!selectedTable || table.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
              <Database className="w-12 h-12 mb-4 text-green-400" />
              <p className="text-lg">Run a query to view table metadata.</p>
            </div>
          )}
          {viewMode === "describe" && selectedTable && tableDescription && (
            <div className="bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
              <div className="flex items-center mb-2 sm:mb-4">
                <ListTree className="w-5 h-5 text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-green-300">
                  Description for {selectedTable}
                </h2>
              </div>
              <p className="text-gray-400 mb-2 sm:mb-4 text-sm sm:text-base">
                Shows the structure of the queried table, including column
                names, data types, nullability, and default values.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111827] text-green-400 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Column
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Type
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Nullable
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableDescription.columns.map((col, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-600 hover:bg-slate-700 transition-colors duration-200"
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {col.column_name}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {col.data_type}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {col.is_nullable}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-300">
                          {col.column_default ?? "null"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {viewMode === "describe" && (!selectedTable || !tableDescription) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
              <ListTree className="w-12 h-12 mb-4 text-green-400" />
              <p className="text-lg">
                {selectedTable
                  ? "Loading table description..."
                  : "Run a query to select a table to describe."}
              </p>
            </div>
          )}
          {result && viewMode === "table" && (
            <>
              <div className="flex justify-end mb-2 sm:mb-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportToCsv}
                  className="px-2 sm:px-4 py-1 sm:py-2 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-300 rounded-md text-sm sm:text-base"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportToJson}
                  className="px-2 sm:px-4 py-1 sm:py-2 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-300 rounded-md text-sm sm:text-base"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to JSON
                </Button>
              </div>
              <div className="bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
                <h2 className="text-xl font-semibold text-green-300 mb-2 sm:mb-4 flex items-center">
                  <Table className="w-5 h-5 text-green-400 mr-2" />
                  Query Results
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111827] text-green-400 sticky top-0">
                      <tr>
                        {result.fields.map((field) => (
                          <th
                            key={field}
                            className="px-2 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600"
                          >
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-600 hover:bg-slate-700 transition-colors duration-200"
                        >
                          {result.fields.map((field) => (
                            <td
                              key={field}
                              className="px-2 sm:px-4 py-2 sm:py-3 text-green-300 break-words"
                            >
                              {row[field] !== null
                                ? String(row[field])
                                : "null"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {result && viewMode === "json" && (
            <div className="bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
              <h2 className="text-xl font-semibold text-green-300 mb-2 sm:mb-4 flex items-center">
                <Braces className="w-5 h-5 text-green-400 mr-2" />
                JSON Results
              </h2>
              <pre className="bg-[#111827] text-green-400 p-2 sm:p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(result.rows, null, 2)}
              </pre>
            </div>
          )}
          {result && viewMode === "stats" && (
            <StatsPanel result={result} chartData={chartData} />
          )}
          {result &&
            (viewMode === "bar" ||
              viewMode === "pie" ||
              viewMode === "line") && (
              <ChartsPanel viewMode={viewMode} chartData={resultChartData} />
            )}
          {!result &&
            !["show", "describe", "bar", "pie", "line"].includes(viewMode) &&
            !loading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
                <Database className="w-12 h-12 mb-4 text-green-400" />
                <p className="text-lg">
                  The results of your query will appear here.
                </p>
              </div>
            )}
          {["bar", "pie", "line"].includes(viewMode) && !result && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#1e293b] p-3 sm:p-6 rounded-lg shadow-md border border-slate-600">
              {viewMode === "bar" && (
                <BarChart2 className="w-12 h-12 mb-4 text-green-400" />
              )}
              {viewMode === "pie" && (
                <PieChart className="w-12 h-12 mb-4 text-green-400" />
              )}
              {viewMode === "line" && (
                <LineChart className="w-12 h-12 mb-4 text-green-400" />
              )}
              <p className="text-lg">
                Run a query to visualize results as a {viewMode} chart.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

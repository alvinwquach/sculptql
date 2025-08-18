"use client";

import {
  Braces,
  Database,
  ListTree,
  Loader2,
  Table,
  BarChart2,
  PieChart,
  LineChart,
  Download,
  Key,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const totalRows = result?.rows?.length || 0;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const paginatedRows = result?.rows?.slice(startIndex, endIndex) || [];

  const getPageNumbers = () => {
    const maxPagesToShow = 10;
    const half = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - half);
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

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
          {viewMode === "show" && selectedTable && table.length > 0 && (
            <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
              <div className="flex items-center mb-4">
                <Database className="w-5 h-5 text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-green-300">
                  Show Table
                </h2>
              </div>
              <p className="text-gray-400 mb-4 text-sm">
                Displays metadata for the queried table, including its name,
                database, schema, and type.
              </p>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold border-b border-slate-600">
                        Name
                      </th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-600">
                        Database
                      </th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-600">
                        Schema
                      </th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-600">
                        Type
                      </th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-600">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((table, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
                      >
                        <td className="px-4 py-3 text-green-300">
                          {table.table_name}
                        </td>
                        <td className="px-4 py-3 text-green-300">
                          {table.table_catalog}
                        </td>
                        <td className="px-4 py-3 text-green-300">
                          {table.table_schema}
                        </td>
                        <td className="px-4 py-3 text-green-300">
                          {table.table_type}
                        </td>
                        <td className="px-4 py-3 text-green-300">
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
            <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
              <Database className="w-12 h-12 mb-4 text-green-400" />
              <p className="text-lg font-medium">
                Run a query to view table metadata.
              </p>
            </div>
          )}
          {viewMode === "describe" && selectedTable && tableDescription && (
            <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
              <div className="flex items-center mb-4">
                <ListTree className="w-5 h-5 text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-green-300">
                  Description for {selectedTable}
                </h2>
              </div>
              <p className="text-gray-400 mb-4 text-sm">
                Shows the structure of the queried table, including column
                names, data types, nullability, default values, and constraints.
              </p>
              <div className="space-y-8">
                {/* Columns Table */}
                <div className="overflow-x-auto max-w-full">
                  <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center">
                    <Table className="w-5 h-5 text-green-400 mr-2" />
                    Columns
                  </h3>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-semibold border-b border-slate-600">
                          Column
                        </th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-600">
                          Type
                        </th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-600">
                          Nullable
                        </th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-600">
                          Default
                        </th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-600">
                          Primary Key
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableDescription.columns.map((col, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
                        >
                          <td className="px-4 py-3 text-green-300">
                            {col.column_name}
                          </td>
                          <td className="px-4 py-3 text-green-300">
                            {col.data_type}
                          </td>
                          <td className="px-4 py-3 text-green-300">
                            {col.is_nullable}
                          </td>
                          <td className="px-4 py-3 text-green-300">
                            {col.column_default ?? "null"}
                          </td>
                          <td className="px-4 py-3 text-green-300">
                            {col.is_primary_key ? (
                              <Key className="w-4 h-4 text-green-400 inline" />
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tableDescription.primary_keys &&
                  tableDescription.primary_keys.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center">
                        <Key className="w-5 h-5 text-green-400 mr-2" />
                        Primary Keys
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {tableDescription.primary_keys.join(", ")}
                      </p>
                    </div>
                  )}
                {tableDescription.foreign_keys &&
                  tableDescription.foreign_keys.length > 0 && (
                    <div className="overflow-x-auto max-w-full">
                      <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center">
                        <Key className="w-5 h-5 text-green-400 mr-2" />
                        Foreign Keys
                      </h3>
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold border-b border-slate-600">
                              Column
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-600">
                              Referenced Table
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-600">
                              Referenced Column
                            </th>
                            <th className="px-4 py-3 font-semibold border-b border-slate-600">
                              Constraint Name
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableDescription.foreign_keys.map((fk, i) => (
                            <tr
                              key={i}
                              className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
                            >
                              <td className="px-4 py-3 text-green-300">
                                {fk.column_name}
                              </td>
                              <td className="px-4 py-3 text-green-300">
                                {fk.referenced_table}
                              </td>
                              <td className="px-4 py-3 text-green-300">
                                {fk.referenced_column}
                              </td>
                              <td className="px-4 py-3 text-green-300">
                                {fk.constraint_name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </div>
          )}
          {viewMode === "describe" && (!selectedTable || !tableDescription) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
              <ListTree className="w-12 h-12 mb-4 text-green-400" />
              <p className="text-lg font-medium">
                {selectedTable
                  ? "Loading table description..."
                  : "Run a query to select a table to describe."}
              </p>
            </div>
          )}
          {result && viewMode === "table" && (
            <div className="bg-[#1e293b] p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50 min-h-[200px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-green-300 flex items-center">
                  <Table className="w-5 h-5 text-green-400 mr-2" />
                  Query Results
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onExportToCsv(false, startIndex, endIndex)
                          }
                          className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm w-24 sm:w-auto"
                        >
                          <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                          Page CSV
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Export current page as CSV
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExportToCsv(true, 0, totalRows)}
                          className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm w-24 sm:w-auto"
                        >
                          <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                          All CSV
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export all data as CSV</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onExportToJson(false, startIndex, endIndex)
                          }
                          className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm w-24 sm:w-auto"
                        >
                          <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                          Page JSON
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Export current page as JSON
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExportToJson(true, 0, totalRows)}
                          className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm w-24 sm:w-auto"
                        >
                          <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                          All JSON
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export all data as JSON</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
                    <tr>
                      {result.fields.map((field) => (
                        <th
                          key={field}
                          className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-slate-600 whitespace-nowrap"
                        >
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={result.fields.length}
                          className="px-3 sm:px-4 py-2 sm:py-3 text-center text-gray-400"
                        >
                          No data available for this page.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
                        >
                          {result.fields.map((field) => (
                            <td
                              key={field}
                              className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs"
                            >
                              {row[field] !== null
                                ? String(row[field])
                                : "null"}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalRows > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                      <SelectTrigger className="w-28 sm:w-32 bg-slate-800 text-green-300 border-slate-600 rounded-full text-xs sm:text-sm">
                        <SelectValue placeholder="Rows per page" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 text-green-300 border-slate-600">
                        {[5, 10, 20].map((size) => (
                          <SelectItem
                            key={size}
                            value={size.toString()}
                            className="text-xs sm:text-sm"
                          >
                            {size} per page
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs sm:text-sm text-gray-300">
                      Showing {startIndex + 1}–{endIndex} of {totalRows} rows
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm"
                    >
                      Previous
                    </Button>
                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className={`px-2 sm:px-3 py-1 text-green-300 border-slate-600 ${
                          page === currentPage
                            ? "bg-green-500 text-white"
                            : "bg-slate-800 hover:bg-green-500 hover:text-white"
                        } transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm`}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {result && viewMode === "json" && (
            <div className="bg-[#1e293b] p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
              <h2 className="text-lg sm:text-xl font-semibold text-green-300 mb-4 flex items-center">
                <Braces className="w-5 h-5 text-green-400 mr-2" />
                JSON Results
              </h2>
              <pre className="bg-[#111827] text-green-400 p-4 rounded-md font-mono text-xs sm:text-sm whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">
                {JSON.stringify(paginatedRows, null, 2)}
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
            !["show", "describe", "bar", "pie", "line"].includes(viewMode) &&
            !loading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
                <Database className="w-12 h-12 mb-4 text-green-400" />
                <p className="text-xs sm:text-lg font-medium">
                  The results of your query will appear here.
                </p>
              </div>
            )}
          {["bar", "pie", "line"].includes(viewMode) && !result && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
              {viewMode === "bar" && (
                <BarChart2 className="w-12 h-12 mb-4 text-green-400" />
              )}
              {viewMode === "pie" && (
                <PieChart className="w-12 h-12 mb-4 text-green-400" />
              )}
              {viewMode === "line" && (
                <LineChart className="w-12 h-12 mb-4 text-green-400" />
              )}
              <p className="text-lg font-medium">
                Run a query to visualize results as a {viewMode} chart.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
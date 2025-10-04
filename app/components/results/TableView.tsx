"use client";

import { Table } from "lucide-react";
import { QueryResult } from "@/app/types/query";
import { getPaginatedRows } from "@/app/utils/resultsUtils";
import PaginationControls from "./PaginationControls";
// import ExportButtons from "./ExportButtons";

interface TableViewProps {
  result: QueryResult;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
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
  onExportToMarkdown: (
    exportAll: boolean,
    startIndex: number,
    endIndex: number
  ) => void;
}

export default function TableView({
  result,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onExportToCsv,
  onExportToJson,
  onExportToMarkdown,
}: TableViewProps) {
  // Create the total rows by the result rows length
  // by getting the length of the result rows
  const totalRows = result.rows.length;
  // Create the paginated rows by the result rows and the current page and the page size
  // by getting the paginated rows from the result rows
  const paginatedRows = getPaginatedRows(result.rows, currentPage, pageSize);

  return (
    <div className="h-full bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-4 sm:p-6 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.15)] border border-purple-500/30 flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-green-300 flex items-center">
          <Table className="w-5 h-5 text-green-400 mr-2" />
          Query Results
        </h2>
        {/* <ExportButtons
          onExportToCsv={onExportToCsv}
          onExportToJson={onExportToJson}
          onExportToMarkdown={onExportToMarkdown}
          totalRows={totalRows}
          currentPage={currentPage}
          pageSize={pageSize}
        /> */}
      </div>
      <div className="flex-1 overflow-x-auto max-w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-gradient-to-r from-[#0f0f23] to-[#1e1b4b] text-cyan-400 sticky top-0 z-10 border-b-2 border-purple-500/30">
            <tr>
              {result.fields.map((field, index) => (
                <th
                  key={`field-${field}-${index}`}
                  className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]"
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
                  className="px-3 sm:px-4 py-2 sm:py-3 text-center text-purple-300"
                >
                  No data available for this page.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className="border-b border-purple-500/20 hover:bg-purple-500/10 transition-colors duration-200"
                >
                  {result.fields.map((field, fieldIndex) => (
                    <td
                      key={`cell-${field}-${fieldIndex}`}
                      className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200"
                    >
                      {row[field] !== null ? String(row[field]) : "null"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalRows > 0 && (
        <div className="mt-4">
          <PaginationControls
            totalRows={totalRows}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}

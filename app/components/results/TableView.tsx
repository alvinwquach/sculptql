import { Table } from "lucide-react";
import { QueryResult } from "@/app/types/query";
import { getPaginatedRows } from "@/app/utils/resultsUtils";
import PaginationControls from "./PaginationControls";
import ExportButtons from "./ExportButtons";

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
}

export default function TableView({
  result,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onExportToCsv,
  onExportToJson,
}: TableViewProps) {
  const totalRows = result.rows.length;
  const paginatedRows = getPaginatedRows(result.rows, currentPage, pageSize);

  return (
    <div className="bg-[#1e293b] p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50 min-h-[200px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-green-300 flex items-center">
          <Table className="w-5 h-5 text-green-400 mr-2" />
          Query Results
        </h2>
        <ExportButtons
          onExportToCsv={onExportToCsv}
          onExportToJson={onExportToJson}
          totalRows={totalRows}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </div>
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
            <tr>
              {result.fields.map((field, index) => (
                <th
                  key={`field-${field}-${index}`}
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
              paginatedRows.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
                >
                  {result.fields.map((field, fieldIndex) => (
                    <td
                      key={`cell-${field}-${fieldIndex}`}
                      className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs"
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
        <PaginationControls
          totalRows={totalRows}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

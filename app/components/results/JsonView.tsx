"use client";

import { useState } from "react";
import { Braces } from "lucide-react";
import { QueryResult, JsonFilter } from "@/app/types/query";
import { filterJsonData, getPaginatedRows } from "@/app/utils/resultsUtils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PaginationControls from "./PaginationControls";
import ExportButtons from "./ExportButtons";

// Props for the JsonView component
interface JsonViewProps {
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

export default function JsonView({
  result,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onExportToCsv,
  onExportToJson,
  onExportToMarkdown,
}: JsonViewProps) {
  // Create the filter by the field and the value
  const [filter, setFilter] = useState<JsonFilter>({
    field: undefined,
    value: undefined,
  });

  // Create the filtered rows by the result rows and the filter 
  // by filtering the rows by the field and the value
  const filteredRows = filterJsonData(result.rows, filter);
  // Create the paginated rows by the filtered rows and the current page and the page size
  // by getting the paginated rows from the filtered rows
  const paginatedRows = getPaginatedRows(filteredRows, currentPage, pageSize);


  // Function to handle the field change
  const handleFieldChange = (value: string) => {
    // Set the filter by the previous filter and the field
    setFilter((prev) => ({ ...prev, field: value || undefined }));
    // On page change by the page 1
    onPageChange(1);
  };

  // Function to handle the value change
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set the filter by the previous filter and the value
    setFilter((prev) => ({ ...prev, value: e.target.value || undefined }));
    // On page change by the page 1
    onPageChange(1);
  };

  // Function to clear the filter
  const clearFilter = () => {
    // Set the filter by the field and the value
    setFilter({ field: undefined, value: undefined });
    // On page change by the page 1
    onPageChange(1);
  };

  return (
    <div className="bg-[#1e293b] p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-green-300 flex items-center">
          <Braces className="w-5 h-5 text-green-400 mr-2" />
          JSON Results
        </h2>
        <ExportButtons
          onExportToCsv={onExportToCsv}
          onExportToJson={onExportToJson}
          onExportToMarkdown={onExportToMarkdown}
          totalRows={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Select value={filter.field || ""} onValueChange={handleFieldChange}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-800 text-green-300 border-slate-600 rounded-full text-xs sm:text-sm">
            <SelectValue placeholder="Select field to filter" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 text-green-300 border-slate-600">
            {result.fields.map((field) => (
              <SelectItem
                key={field}
                value={field}
                className="text-xs sm:text-sm"
              >
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Enter filter value"
          value={filter.value || ""}
          onChange={handleValueChange}
          className="bg-slate-800 text-green-300 border-slate-600 rounded-full text-xs sm:text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilter}
          disabled={!filter.field && !filter.value}
          className="px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm"
        >
          Clear Filter
        </Button>
      </div>
      <pre className="bg-[#111827] text-green-400 p-4 rounded-md font-mono text-xs sm:text-sm whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">
        {JSON.stringify(paginatedRows, null, 2)}
      </pre>
      {filteredRows.length > 0 && (
        <PaginationControls
          totalRows={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
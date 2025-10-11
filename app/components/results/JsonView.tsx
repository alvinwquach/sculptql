"use client";

import { useState, useRef, useEffect } from "react";
import { Braces, Copy } from "lucide-react";
import { toast } from "react-toastify";
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

  // Ref for the JSON pre element
  const jsonPreRef = useRef<HTMLPreElement>(null);

  // Create the filtered rows by the result rows and the filter
  // by filtering the rows by the field and the value
  const filteredRows = filterJsonData(result.rows, filter);

  // Create the paginated rows by the filtered rows and the current page and the page size
  // by getting the paginated rows from the filtered rows
  const paginatedRows = getPaginatedRows(filteredRows, currentPage, pageSize);

  // Handle Ctrl+A/Cmd+A to select all JSON text
  useEffect(() => {
    const handleSelectAll = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        if (
          jsonPreRef.current &&
          document.activeElement === jsonPreRef.current
        ) {
          e.preventDefault();
          const range = document.createRange();
          range.selectNodeContents(jsonPreRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    };

    document.addEventListener("keydown", handleSelectAll);
    return () => document.removeEventListener("keydown", handleSelectAll);
  }, []);

  const copyToClipboard = async () => {
    const jsonString = JSON.stringify(paginatedRows, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("JSON copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy JSON");
    }
  };

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
    <div className="h-full bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-4 sm:p-6 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.15)] border border-purple-500/30 flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-green-300 flex items-center">
          <Braces className="w-5 h-5 text-green-400 mr-2" />
          JSON Results
        </h2>
        <Button
          onClick={copyToClipboard}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-300 border-emerald-500/50 bg-gradient-to-r from-emerald-950/50 to-teal-950/50 hover:emerald-700 hover:text-emerald-200 hover:border-emerald-400/70 transition-all duration-200 rounded-full shadow-md text-xs sm:text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy JSON
        </Button>
        {/* <ExportButtons
          onExportToCsv={onExportToCsv}
          onExportToJson={onExportToJson}
          onExportToMarkdown={onExportToMarkdown}
          totalRows={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
        /> */}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Select value={filter.field || ""} onValueChange={handleFieldChange}>
          <SelectTrigger className="w-full sm:w-48 !bg-[#1e293b] text-cyan-300 border-cyan-500/40 rounded-full text-xs sm:text-sm">
            <SelectValue placeholder="Select field to filter" />
          </SelectTrigger>
          <SelectContent className="!bg-[#1e293b] text-cyan-300 border-cyan-500/40">
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
          className="!bg-[#1e293b] text-cyan-300 border-cyan-500/40 rounded-full text-xs sm:text-sm placeholder:text-slate-400"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilter}
          disabled={!filter.field && !filter.value}
          className="px-3 py-1 text-emerald-300 border-emerald-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-emerald-500/20 hover:to-teal-500/20 hover:text-emerald-200 hover:border-emerald-400/60 transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm"
        >
          Clear Filter
        </Button>
      </div>
      <pre
        ref={jsonPreRef}
        tabIndex={0}
        className="flex-1 bg-gradient-to-r from-[#0f0f23] to-[#1e1b4b] text-green-400 p-4 rounded-md font-mono text-xs sm:text-sm whitespace-pre-wrap break-words overflow-y-auto focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
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
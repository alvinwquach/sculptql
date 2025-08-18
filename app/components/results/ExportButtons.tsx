import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download } from "lucide-react";

interface ExportButtonsProps {
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
  totalRows: number;
  currentPage: number;
  pageSize: number;
}

export default function ExportButtons({
  onExportToCsv,
  onExportToJson,
  totalRows,
  currentPage,
  pageSize,
}: ExportButtonsProps) {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportToCsv(false, startIndex, endIndex)}
              className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm w-24 sm:w-auto"
            >
              <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              Page CSV
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export current page as CSV</TooltipContent>
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
              onClick={() => onExportToJson(false, startIndex, endIndex)}
              className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm w-24 sm:w-auto"
            >
              <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              Page JSON
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export current page as JSON</TooltipContent>
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
  );
}

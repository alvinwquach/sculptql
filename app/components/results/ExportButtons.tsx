import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, Braces, FileText } from "lucide-react";

// Props for the ExportButtons component
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
  onExportToMarkdown: (
    exportAll: boolean,
    startIndex: number,
    endIndex: number
  ) => void;
  totalRows: number;
  currentPage: number;
  pageSize: number;
}

const baseButtonStyles = `
px-3 py-2
text-cyan-300 border-cyan-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80
hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-200 hover:border-cyan-400/60
hover:shadow-lg hover:shadow-cyan-500/20
transition-all duration-300 rounded-lg font-medium
`;

const iconStyles = "w-4 h-4";

export default function ExportButtons({
  onExportToCsv,
  onExportToJson,
  onExportToMarkdown,
  totalRows,
  currentPage,
  pageSize,
}: ExportButtonsProps) {
  // Create the start index by the current page and the page size and the total rows 
  // by subtracting 1 and multiplying by the page size
  const startIndex = (currentPage - 1) * pageSize;
  // Create the end index by the start index and the page size and the total rows 
  // by adding the page size and the total rows and the minimum of the start index and the end index
  const endIndex = Math.min(startIndex + pageSize, totalRows);

  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 p-4 bg-gradient-to-r from-slate-900/30 to-slate-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl">
      <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
        <span>Export:</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToCsv(false, startIndex, endIndex)}
              className="text-emerald-300 border-emerald-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-emerald-500/20 hover:to-teal-500/20 hover:text-emerald-200 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 rounded-lg font-medium w-10 h-10"
            >
              <Sheet className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">Export current page as CSV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToCsv(true, 0, totalRows)}
              className="text-emerald-300 border-emerald-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-emerald-500/20 hover:to-teal-500/20 hover:text-emerald-200 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 rounded-lg font-medium w-10 h-10"
            >
              <Sheet className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">Export all data as CSV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToJson(false, startIndex, endIndex)}
              className="text-pink-300 border-pink-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-pink-500/20 hover:to-purple-500/20 hover:text-pink-200 hover:border-pink-400/60 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 rounded-lg font-medium w-10 h-10"
            >
              <Braces className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">Export current page as JSON</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToJson(true, 0, totalRows)}
              className="text-pink-300 border-pink-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-pink-500/20 hover:to-purple-500/20 hover:text-pink-200 hover:border-pink-400/60 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 rounded-lg font-medium w-10 h-10"
            >
              <Braces className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">Export all data as JSON</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToMarkdown(false, startIndex, endIndex)}
              className="text-yellow-300 border-yellow-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-yellow-500/20 hover:to-orange-500/20 hover:text-yellow-200 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 rounded-lg font-medium w-10 h-10"
            >
              <FileText className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">Export current page as Markdown</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToMarkdown(true, 0, totalRows)}
              className="text-yellow-300 border-yellow-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-yellow-500/20 hover:to-orange-500/20 hover:text-yellow-200 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 rounded-lg font-medium w-10 h-10"
            >
              <FileText className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 border-purple-500/50 text-cyan-200">Export all data as Markdown</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
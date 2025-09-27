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
px-2 py-1
text-green-300 border-slate-600 bg-slate-800
hover:bg-green-500 hover:text-white
transition-all duration-200 rounded-full shadow-sm
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
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToCsv(false, startIndex, endIndex)}
              className={`${baseButtonStyles} w-8 h-8`}
            >
              <Sheet className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export current page as CSV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToCsv(true, 0, totalRows)}
              className={`${baseButtonStyles} w-8 h-8`}
            >
              <Sheet className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export all data as CSV</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToJson(false, startIndex, endIndex)}
              className={`${baseButtonStyles} w-8 h-8`}
            >
              <Braces className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export current page as JSON</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToJson(true, 0, totalRows)}
              className={`${baseButtonStyles} w-8 h-8`}
            >
              <Braces className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export all data as JSON</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToMarkdown(false, startIndex, endIndex)}
              className={`${baseButtonStyles} w-8 h-8`}
            >
              <FileText className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export current page as Markdown</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onExportToMarkdown(true, 0, totalRows)}
              className={`${baseButtonStyles} w-8 h-8`}
            >
              <FileText className={iconStyles} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export all data as Markdown</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
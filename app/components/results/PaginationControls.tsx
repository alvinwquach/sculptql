import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPageNumbers } from "@/app/utils/resultsUtils";

interface PaginationControlsProps {
  totalRows: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function PaginationControls({
  totalRows,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  // Create the total pages by the total rows and the page size
  // by rounding up the total rows and the page size
  const totalPages = Math.ceil(totalRows / pageSize);
  // Create the start index by the current page and the page size
  // by subtracting 1 and multiplying by the page size and adding 1
  const startIndex = (currentPage - 1) * pageSize + 1;
  // Create the end index by the current page and the page size and the total rows
  // by multiplying the current page and the page size and the minimum of the current page and the total rows
  const endIndex = Math.min(currentPage * pageSize, totalRows);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4 sm:gap-6 p-4 bg-gradient-to-r from-[#0f0f23]/50 to-[#1e1b4b]/50 backdrop-blur-sm border border-purple-500/30 rounded-xl">
      <div className="flex items-center space-x-3 flex-wrap">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-32 sm:w-36 !bg-[#1e293b] text-green-300 border-green-500/40 rounded-lg text-xs sm:text-sm font-medium hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent className="!bg-[#1e293b] text-green-300 border-green-500/40">
            {[5, 10, 20].map((size) => (
              <SelectItem
                key={`page-size-${size}`}
                value={size.toString()}
                className="text-xs sm:text-sm hover:bg-green-500/20 hover:text-green-200"
              >
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs sm:text-sm text-green-200 font-medium">
          Showing <span className="text-green-300 font-semibold">{startIndex}</span>–<span className="text-green-300 font-semibold">{endIndex}</span> of <span className="text-green-400 font-semibold">{totalRows}</span> rows
        </span>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 sm:px-4 py-2 text-purple-300 border-purple-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-purple-500/20 hover:to-purple-600/20 hover:text-purple-200 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 rounded-lg font-medium text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:from-slate-800/80 disabled:hover:to-slate-700/80"
        >
          Previous
        </Button>
        {getPageNumbers(totalRows, currentPage, pageSize).map((page) => (
          <Button
            key={`page-${page}`}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-all duration-300 rounded-lg ${
              page === currentPage
                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400/60 shadow-lg shadow-purple-500/40"
                : "text-green-300 border-green-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-green-500/20 hover:to-green-600/20 hover:text-green-200 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20"
            }`}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 sm:px-4 py-2 text-purple-300 border-purple-500/40 bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-purple-500/20 hover:to-purple-600/20 hover:text-purple-200 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 rounded-lg font-medium text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:from-slate-800/80 disabled:hover:to-slate-700/80"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

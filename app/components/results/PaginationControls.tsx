import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPageNumbers } from "@/app/utils/resultsUtils";

// Props for the PaginationControls component
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
                key={`page-size-${size}`}
                value={size.toString()}
                className="text-xs sm:text-sm"
              >
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs sm:text-sm text-gray-300">
          Showing {startIndex}–{endIndex} of {totalRows} rows
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
        {getPageNumbers(totalRows, currentPage, pageSize).map((page) => (
          <Button
            key={`page-${page}`}
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
  );
}

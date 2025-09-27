import { JsonFilter } from "../types/query";

// Function to get the paginated rows
export const getPaginatedRows = (
  rows: Record<string, unknown>[] | undefined,
  currentPage: number,
  pageSize: number
): Record<string, unknown>[] => {
  // If the rows are undefined, return an empty array
  if (!rows) return [];
  // Calculate the start index by the current page and the page size
  const startIndex = (currentPage - 1) * pageSize;
  // Calculate the end index by the start index,
  // the page size and the rows length
  const endIndex = Math.min(startIndex + pageSize, rows.length);
  // Return the rows sliced by the start index and the end index
  return rows.slice(startIndex, endIndex);
};

// Function to get the page numbers
export const getPageNumbers = (
  totalRows: number,
  currentPage: number,
  pageSize: number
): number[] => {
  // Calculate the total pages by the total rows and the page size
  const totalPages = Math.ceil(totalRows / pageSize);
  // Set the maximum pages to show to 10
  const maxPagesToShow = 10;
  // Calculate the half of the maximum pages to show
  const half = Math.floor(maxPagesToShow / 2);
  // Calculate the start page by the current page and the half
  let startPage = Math.max(1, currentPage - half);
  // Calculate the end page by the total pages,the start page 
  // and the maximum pages to show
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  // If the end page minus the start page plus 1 
  // is less than the maximum pages to show
  if (endPage - startPage + 1 < maxPagesToShow) {
    // Set the start page to the maximum of 1, the end page 
    // minus the maximum pages to show plus 1
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // Create the pages array
  const pages: number[] = [];
  // For each page from the start page to the end page
  for (let i = startPage; i <= endPage; i++) {
    // Push the page to the pages array
    pages.push(i);
  }
  // Return the pages array
  return pages;
};

// Function to filter the json data
export const filterJsonData = (
  rows: Record<string, unknown>[] | undefined,
  filter: JsonFilter
): Record<string, unknown>[] => {
  // If the rows are undefined, the field is undefined,
  //  or the value is undefined, return the rows
  if (!rows || !filter.field || !filter.value) return rows || [];
  // Set the field to the filter field
  const field = filter.field;
  // Set the value to the filter value and the to lowercase
  const value = filter.value.toLowerCase();
  // Return the rows filtered by the field and the value
  return rows.filter((row) =>
    // Convert the row field to a string and the to lowercase
    // and the includes the value
    String(row[field] ?? "")
      .toLowerCase()
      .includes(value)
  );
};

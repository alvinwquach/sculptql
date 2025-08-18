import { JsonFilter } from "../types/query";

export const getPaginatedRows = (
  rows: Record<string, unknown>[] | undefined,
  currentPage: number,
  pageSize: number
): Record<string, unknown>[] => {
  if (!rows) return [];
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, rows.length);
  return rows.slice(startIndex, endIndex);
};

export const getPageNumbers = (
  totalRows: number,
  currentPage: number,
  pageSize: number
): number[] => {
  const totalPages = Math.ceil(totalRows / pageSize);
  const maxPagesToShow = 10;
  const half = Math.floor(maxPagesToShow / 2);
  let startPage = Math.max(1, currentPage - half);
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
};

export const filterJsonData = (
  rows: Record<string, unknown>[] | undefined,
  filter: JsonFilter
): Record<string, unknown>[] => {
  if (!rows || !filter.field || !filter.value) return rows || [];

  const field = filter.field;
  const value = filter.value.toLowerCase();

  return rows.filter((row) =>
    String(row[field] ?? "")
      .toLowerCase()
      .includes(value)
  );
};

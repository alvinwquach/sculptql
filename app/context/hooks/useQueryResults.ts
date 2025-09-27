"use client";

import { useState, useCallback } from "react";
import { QueryResult, ViewMode, ChartDataItem } from "@/app/types/query";

export interface QueryResultsState {
  queryResult: QueryResult | null;
  setQueryResult: (result: QueryResult | null) => void;
  queryError: string | null;
  setQueryError: (error: string | null) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  statsChartData: ChartDataItem[];
  resultChartData: ChartDataItem[];
  handleViewModeChange: (mode: ViewMode) => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
}

export function useQueryResults(): QueryResultsState {
  // State for the query result
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  // State for the query error
  const [queryError, setQueryError] = useState<string | null>(null);
  // State for the view mode
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  // State for the current page
  const [currentPage, setCurrentPage] = useState<number>(1);
  // State for the page size 
  const [pageSize, setPageSize] = useState<number>(50);
  // Initialize the stats chart data and the result chart data as empty arrays
  const statsChartData: ChartDataItem[] = [];
  const resultChartData: ChartDataItem[] = [];
  
  // Function to handle the view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    // Set the view mode
    setViewMode(mode);
  }, []);

  // Function to handle the page change
  const handlePageChange = useCallback((page: number) => {
    // Set the current page
    setCurrentPage(page);
  }, []);

  // Function to handle the page size change
  const handlePageSizeChange = useCallback((size: number) => {
    // Set the page size
    setPageSize(size);
    // Set the current page to 1
    setCurrentPage(1); 
  }, []);

  return {
    queryResult,
    setQueryResult,
    queryError,
    setQueryError,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    statsChartData,
    resultChartData,
    handleViewModeChange,
    handlePageChange,
    handlePageSizeChange,
  };
}

import { create } from 'zustand';
import { QueryResult, ViewMode, ChartDataItem } from '@/app/types/query';

interface ResultsState {
  // State
  queryResult: QueryResult | null;
  queryError: string | null;
  viewMode: ViewMode;
  currentPage: number;
  pageSize: number;
  statsChartData: ChartDataItem[];
  resultChartData: ChartDataItem[];

  // Actions
  setQueryResult: (result: QueryResult | null) => void;
  setQueryError: (error: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

const initialState = {
  queryResult: null,
  queryError: null,
  viewMode: 'table' as ViewMode,
  currentPage: 1,
  pageSize: 50,
  statsChartData: [],
  resultChartData: [],
};

export const useResultsStore = create<ResultsState>((set) => ({
  ...initialState,

  setQueryResult: (queryResult) => set({ queryResult }),
  setQueryError: (queryError) => set({ queryError }),
  setViewMode: (viewMode) => set({ viewMode }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
  reset: () => set(initialState),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SelectOption, WhereClause, OrderByClause, HavingClause, JoinClause, UnionClause, CteClause, CaseClause } from '@/app/types/query';

interface QueryState {
  // State
  query: string;
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  isDistinct: boolean;
  whereClause: WhereClause;
  orderByClause: OrderByClause;
  havingClause: HavingClause;
  selectedGroupByColumns: SelectOption[];
  limit: SelectOption | null;
  joinClauses: JoinClause[];
  unionClauses: UnionClause[];
  cteClauses: CteClause[];
  caseClause: CaseClause;

  // Actions
  setQuery: (query: string) => void;
  setSelectedTable: (table: SelectOption | null) => void;
  setSelectedColumns: (columns: SelectOption[]) => void;
  setIsDistinct: (distinct: boolean) => void;
  setWhereClause: (clause: WhereClause) => void;
  setOrderByClause: (clause: OrderByClause) => void;
  setHavingClause: (clause: HavingClause) => void;
  setSelectedGroupByColumns: (columns: SelectOption[]) => void;
  setLimit: (limit: SelectOption | null) => void;
  setJoinClauses: (clauses: JoinClause[]) => void;
  setUnionClauses: (clauses: UnionClause[]) => void;
  setCteClauses: (clauses: CteClause[]) => void;
  setCaseClause: (clause: CaseClause) => void;
  reset: () => void;
}

const initialState = {
  query: '',
  selectedTable: null,
  selectedColumns: [],
  isDistinct: false,
  whereClause: {
    conditions: [
      { column: null, operator: null, value: null, value2: null },
    ],
  },
  orderByClause: {
    column: null,
    direction: null,
  },
  havingClause: {
    condition: { aggregateColumn: null, operator: null, value: null },
  },
  selectedGroupByColumns: [],
  limit: null,
  joinClauses: [],
  unionClauses: [],
  cteClauses: [],
  caseClause: {
    conditions: [],
    elseValue: null,
    alias: null,
  },
};

export const useQueryStore = create<QueryState>()(
  persist(
    (set) => ({
      ...initialState,

      setQuery: (query) => set({ query }),
      setSelectedTable: (selectedTable) => set({ selectedTable }),
      setSelectedColumns: (selectedColumns) => set({ selectedColumns }),
      setIsDistinct: (isDistinct) => set({ isDistinct }),
      setWhereClause: (whereClause) => set({ whereClause }),
      setOrderByClause: (orderByClause) => set({ orderByClause }),
      setHavingClause: (havingClause) => set({ havingClause }),
      setSelectedGroupByColumns: (selectedGroupByColumns) => set({ selectedGroupByColumns }),
      setLimit: (limit) => set({ limit }),
      setJoinClauses: (joinClauses) => set({ joinClauses }),
      setUnionClauses: (unionClauses) => set({ unionClauses }),
      setCteClauses: (cteClauses) => set({ cteClauses }),
      setCaseClause: (caseClause) => set({ caseClause }),
      reset: () => set(initialState),
    }),
    {
      name: 'sculptql-query-store',
      partialize: (state) => ({
        query: state.query,
        selectedTable: state.selectedTable,
        selectedColumns: state.selectedColumns,
        isDistinct: state.isDistinct,
        whereClause: state.whereClause,
      }),
    }
  )
);

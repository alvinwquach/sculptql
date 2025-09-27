"use client";

import { useState, useCallback } from "react";
import { SelectOption, WhereClause, OrderByClause, HavingClause } from "@/app/types/query";

// Interface for the query state
export interface QueryState {
  query: string;
  setQuery: (query: string) => void;
    selectedTable: SelectOption | null;
  setSelectedTable: (table: SelectOption | null) => void;
  selectedColumns: SelectOption[];
  setSelectedColumns: (columns: SelectOption[]) => void;
  isDistinct: boolean;
  setIsDistinct: (distinct: boolean) => void;
    whereClause: WhereClause;
  setWhereClause: (clause: WhereClause) => void;
  orderByClause: OrderByClause;
  setOrderByClause: (clause: OrderByClause) => void;
  havingClause: HavingClause;
  setHavingClause: (clause: HavingClause) => void;
  selectedGroupByColumns: SelectOption[];
  setSelectedGroupByColumns: (columns: SelectOption[]) => void;
  limit: SelectOption | null;
  setLimit: (limit: SelectOption | null) => void;
}

export function useQueryState(): QueryState {
  // State for the query
  const [query, setQuery] = useState<string>("");
  // State for the selected table
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(null);
  // State for the selected columns
  const [selectedColumns, setSelectedColumns] = useState<SelectOption[]>([]);
  // State for the distinct
  const [isDistinct, setIsDistinct] = useState<boolean>(false);
  // State for the where clause
  const [whereClause, setWhereClause] = useState<WhereClause>({
    conditions: [
      { column: null, operator: null, value: null, value2: null },
    ],
  });
  // State for the order by clause
  const [orderByClause, setOrderByClause] = useState<OrderByClause>({
    column: null,
    direction: null,
  });
  // State for the having clause
  const [havingClause, setHavingClause] = useState<HavingClause>({
    condition: { aggregateColumn: null, operator: null, value: null },
  });
  // State for the selected group by columns
  const [selectedGroupByColumns, setSelectedGroupByColumns] = useState<SelectOption[]>([]);
  // State for the limit
  const [limit, setLimit] = useState<SelectOption | null>(null);

  return {
    query,
    setQuery,
        selectedTable,
    setSelectedTable,
    selectedColumns,
    setSelectedColumns,
    isDistinct,
    setIsDistinct,
    whereClause,
    setWhereClause,
    orderByClause,
    setOrderByClause,
    havingClause,
    setHavingClause,
    selectedGroupByColumns,
    setSelectedGroupByColumns,
    limit,
    setLimit,
  };
}

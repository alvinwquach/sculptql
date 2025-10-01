"use client";

import { useState, useEffect } from "react";
import { SelectOption, WhereClause, OrderByClause, HavingClause, JoinClause, UnionClause, CteClause, CaseClause } from "@/app/types/query";

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
  joinClauses: JoinClause[];
  setJoinClauses: (clauses: JoinClause[]) => void;
  unionClauses: UnionClause[];
  setUnionClauses: (clauses: UnionClause[]) => void;
  cteClauses: CteClause[];
  setCteClauses: (clauses: CteClause[]) => void;
  caseClause: CaseClause;
  setCaseClause: (clause: CaseClause) => void;
}

export function useQueryState(): QueryState {
  // State for the query - initialize from localStorage if available
  const [query, setQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sculptql-query') || "";
    }
    return "";
  });
  // State for the selected table
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sculptql-selectedTable');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  // State for the selected columns
  const [selectedColumns, setSelectedColumns] = useState<SelectOption[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sculptql-selectedColumns');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  // State for the distinct - initialize from localStorage if available
  const [isDistinct, setIsDistinct] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sculptql-isDistinct');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });
  // State for the where clause - initialize from localStorage if available
  const [whereClause, setWhereClause] = useState<WhereClause>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sculptql-whereClause');
      return stored ? JSON.parse(stored) : {
        conditions: [
          { column: null, operator: null, value: null, value2: null },
        ],
      };
    }
    return {
      conditions: [
        { column: null, operator: null, value: null, value2: null },
      ],
    };
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
  // State for the join clauses
  const [joinClauses, setJoinClauses] = useState<JoinClause[]>([]);
  // State for the union clauses
  const [unionClauses, setUnionClauses] = useState<UnionClause[]>([]);
  // State for the CTE clauses
  const [cteClauses, setCteClauses] = useState<CteClause[]>([]);
  // State for the CASE clause
  const [caseClause, setCaseClause] = useState<CaseClause>({
    conditions: [],
    elseValue: null,
    alias: null,
  });

  // Persist query state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sculptql-query', query);
    }
  }, [query]);

  // Persist selected table state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sculptql-selectedTable', JSON.stringify(selectedTable));
    }
  }, [selectedTable]);

  // Persist selected columns state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sculptql-selectedColumns', JSON.stringify(selectedColumns));
    }
  }, [selectedColumns]);

  // Persist where clause state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sculptql-whereClause', JSON.stringify(whereClause));
    }
  }, [whereClause]);

  // Persist is distinct state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sculptql-isDistinct', JSON.stringify(isDistinct));
    }
  }, [isDistinct]);

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
    joinClauses,
    setJoinClauses,
    unionClauses,
    setUnionClauses,
    cteClauses,
    setCteClauses,
    caseClause,
    setCaseClause,
  };
}

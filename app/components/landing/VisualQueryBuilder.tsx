"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectStyles } from "@/app/utils/selectStyles";
import {  SelectOption, WhereCondition } from "@/app/types/query";

// Props for the VisualQueryBuilder component
interface VisualQueryBuilderProps {
  className?: string;
}

// Type for JOIN clause
type JoinClause = {
  table: SelectOption | null;
  type: SelectOption | null;
  onColumn1: SelectOption | null;
  onColumn2: SelectOption | null;
};

// Type for UNION clause
type UnionClause = {
  table: SelectOption | null;
  type: SelectOption | null;
};

// Type for CASE condition
type CaseCondition = {
  column: SelectOption | null;
  operator: SelectOption | null;
  value: SelectOption | null;
  result: SelectOption | null;
};

// Type for WITH clause (CTE)
type WithClause = {
  alias: string;
  table: SelectOption | null;
};

// Interface for the query state
interface QueryState {
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  whereConditions: WhereCondition[];
  orderBy: SelectOption | null;
  groupBy: SelectOption[];
  havingConditions: WhereCondition[];
  joinClauses: JoinClause[];
  unionClauses: UnionClause[];
  caseConditions: CaseCondition[];
  withClauses: WithClause[];
}

type DemoView = "joins" | "case" | "having" | "union" | "with";

export default function VisualQueryBuilder({ className = "" }: VisualQueryBuilderProps) {
  const [activeView, setActiveView] = useState<DemoView>("joins");
  const containerRef = useRef<HTMLDivElement>(null);

  // Table options
  const tableOptions: SelectOption[] = [
    { value: "users", label: "users" },
    { value: "orders", label: "orders" },
    { value: "products", label: "products" },
    { value: "categories", label: "categories" },
    { value: "archived_users", label: "archived_users" },
  ];

  // Column options
  const columnOptions: SelectOption[] = [
    { value: "id", label: "id" },
    { value: "user_name", label: "user_name" },
    { value: "email", label: "email" },
    { value: "created_at", label: "created_at" },
    { value: "status", label: "status" },
    { value: "last_login", label: "last_login" },
    { value: "users.id", label: "users.id" },
    { value: "orders.user_id", label: "orders.user_id" },
    { value: "COUNT(*)", label: "COUNT(*)" },
    { value: "SUM(amount)", label: "SUM(amount)" },
  ];

  // Operator options
  const operatorOptions: SelectOption[] = [
    { value: "=", label: "=" },
    { value: "!=", label: "!=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
  ];

  // Value options
  const valueOptions: SelectOption[] = [
    { value: "'active'", label: "'active'" },
    { value: "'inactive'", label: "'inactive'" },
    { value: "'premium'", label: "'premium'" },
    { value: "'VIP'", label: "'VIP'" },
    { value: "1", label: "1" },
    { value: "5", label: "5" },
    { value: "10", label: "10" },
  ];

  // Join type options
  const joinTypeOptions: SelectOption[] = [
    { value: "INNER JOIN", label: "INNER JOIN" },
    { value: "LEFT JOIN", label: "LEFT JOIN" },
    { value: "RIGHT JOIN", label: "RIGHT JOIN" },
    { value: "FULL OUTER JOIN", label: "FULL OUTER JOIN" },
  ];

  // Union type options
  const unionTypeOptions: SelectOption[] = [
    { value: "UNION", label: "UNION" },
    { value: "UNION ALL", label: "UNION ALL" },
  ];

  // Order by options
  const orderByOptions: SelectOption[] = [
    { value: "created_at ASC", label: "created_at ASC" },
    { value: "created_at DESC", label: "created_at DESC" },
    { value: "user_name ASC", label: "user_name ASC" },
    { value: "user_name DESC", label: "user_name DESC" },
  ];

  // Define different query states for each view
  const getQueryStateForView = (view: DemoView): QueryState => {
    const baseState = {
      selectedTable: { value: "users", label: "users" },
      selectedColumns: [
        { value: "user_name", label: "user_name" },
        { value: "email", label: "email" }
      ],
      whereConditions: [
        {
          column: { value: "status", label: "status" },
          operator: { value: "=", label: "=" },
          value: { value: "'active'", label: "'active'" },
        },
      ],
      orderBy: { value: "created_at DESC", label: "created_at DESC" },
      groupBy: [],
      havingConditions: [],
      joinClauses: [],
      unionClauses: [],
      caseConditions: [],
      withClauses: [],
    };

    switch (view) {
      case "joins":
        return {
          ...baseState,
          joinClauses: [
            {
              table: { value: "orders", label: "orders" },
              type: { value: "INNER JOIN", label: "INNER JOIN" },
              onColumn1: { value: "users.id", label: "users.id" },
              onColumn2: { value: "orders.user_id", label: "orders.user_id" },
            }
          ],
        };
      case "case":
        return {
          ...baseState,
          selectedColumns: [
            { value: "user_name", label: "user_name" },
            { value: "email", label: "email" },
            { value: "status", label: "status" }
          ],
          caseConditions: [
            {
              column: { value: "status", label: "status" },
              operator: { value: "=", label: "=" },
              value: { value: "'premium'", label: "'premium'" },
              result: { value: "'VIP'", label: "'VIP'" },
            }
          ],
        };
      case "having":
        return {
          ...baseState,
          selectedColumns: [
            { value: "user_name", label: "user_name" },
            { value: "email", label: "email" },
            { value: "COUNT(*)", label: "COUNT(*)" }
          ],
          groupBy: [{ value: "user_name", label: "user_name" }, { value: "email", label: "email" }],
          havingConditions: [
            {
              column: { value: "COUNT(*)", label: "COUNT(*)" },
              operator: { value: ">", label: ">" },
              value: { value: "5", label: "5" },
            }
          ],
        };
      case "union":
        return {
          ...baseState,
          unionClauses: [
            {
              table: { value: "archived_users", label: "archived_users" },
              type: { value: "UNION", label: "UNION" },
            }
          ],
        };
      case "with":
        return {
          ...baseState,
          withClauses: [
            {
              alias: "active_users",
              table: { value: "users", label: "users" },
            }
          ],
        };
      default:
        return baseState;
    }
  };

  const [queryState, setQueryState] = useState<QueryState>(getQueryStateForView("joins"));

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  // Update query state when view changes
  useEffect(() => {
    setQueryState(getQueryStateForView(activeView));
  }, [activeView]);

  // Function to generate the query
  const generateQuery = (queryState: QueryState) => {
    const joinConditions = (
      conditions: WhereCondition[],
      operator: string,
      format: (c: WhereCondition) => string
    ): string => {
      const validConditions = conditions.filter((c) => c.column && c.operator && c.value);
      return validConditions.length > 0 ? `\n${operator} ${validConditions.map(format).join(" AND ")}` : "";
    };

    let query = "";

    // Add WITH clauses (CTEs) if present
    if (queryState.withClauses.length > 0) {
      const validCtes = queryState.withClauses.filter(cte => cte.alias && cte.table);
      if (validCtes.length > 0) {
        query += "WITH ";
        query += validCtes.map(cte => `${cte.alias} AS (SELECT * FROM ${cte.table!.value})`).join(", ");
        query += "\n";
      }
    }

    query += "SELECT ";

    // Add CASE expressions if present
    if (queryState.caseConditions.length > 0) {
      const validCases = queryState.caseConditions.filter(c => c.column && c.operator && c.value && c.result);
      if (validCases.length > 0) {
        query += "CASE ";
        validCases.forEach(c => {
          query += `WHEN ${c.column!.value} ${c.operator!.value} ${c.value!.value} THEN ${c.result!.value} `;
        });
        query += "END AS case_result";
        if (queryState.selectedColumns.length > 0) {
          query += ", ";
        }
      }
    }

    query += queryState.selectedColumns.length > 0
      ? queryState.selectedColumns.map((col) => col.value).join(", ")
      : "*";

    if (queryState.selectedTable) {
      query += `\nFROM ${queryState.selectedTable.value}`;
    }

    // Add JOIN clauses
    if (queryState.joinClauses.length > 0) {
      queryState.joinClauses.forEach(join => {
        if (join.table && join.type && join.onColumn1 && join.onColumn2) {
          query += `\n${join.type.value} ${join.table.value} ON ${join.onColumn1.value} = ${join.onColumn2.value}`;
        }
      });
    }

    if (queryState.whereConditions.length > 0) {
      query += joinConditions(
        queryState.whereConditions,
        "WHERE",
        (c) => `${c.column!.value} ${c.operator!.value} ${c.value!.value}`
      );
    }

    if (queryState.groupBy.length > 0) {
      query += `\nGROUP BY ${queryState.groupBy.map((g) => g.value).join(", ")}`;
    }

    if (queryState.havingConditions.length > 0) {
      query += joinConditions(
        queryState.havingConditions,
        "HAVING",
        (c) => `${c.column!.value} ${c.operator!.value} ${c.value!.value}`
      );
    }

    // Add UNION clauses
    if (queryState.unionClauses.length > 0) {
      queryState.unionClauses.forEach(union => {
        if (union.table && union.type) {
          query += `\n${union.type.value}\nSELECT * FROM ${union.table.value}`;
        }
      });
    }

    if (queryState.orderBy) {
      query += `\nORDER BY ${queryState.orderBy.value}`;
    }

    query += ";";
    return query;
  };

  const tabs = [
    { id: "joins" as DemoView, label: "JOINs", description: "Multi-table queries" },
    { id: "case" as DemoView, label: "CASE", description: "Conditional logic" },
    { id: "having" as DemoView, label: "HAVING", description: "Aggregate filters" },
    { id: "union" as DemoView, label: "UNION", description: "Combine results" },
    { id: "with" as DemoView, label: "WITH", description: "CTEs" },
  ];

  const updateJoinClause = (index: number, field: keyof JoinClause, value: SelectOption | null) => {
    setQueryState(prev => ({
      ...prev,
      joinClauses: prev.joinClauses.map((join, i) =>
        i === index ? { ...join, [field]: value } : join
      )
    }));
  };

  const updateCaseCondition = (index: number, field: keyof CaseCondition, value: SelectOption | null) => {
    setQueryState(prev => ({
      ...prev,
      caseConditions: prev.caseConditions.map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      )
    }));
  };

  const updateHavingCondition = (index: number, field: "column" | "operator" | "value", value: SelectOption | null) => {
    setQueryState(prev => ({
      ...prev,
      havingConditions: prev.havingConditions.map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      )
    }));
  };

  const updateUnionClause = (index: number, field: keyof UnionClause, value: SelectOption | null) => {
    setQueryState(prev => ({
      ...prev,
      unionClauses: prev.unionClauses.map((union, i) =>
        i === index ? { ...union, [field]: value } : union
      )
    }));
  };

  const renderFeatureContent = () => {
    switch (activeView) {
      case "joins":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
              JOIN Configuration
            </h3>
            {queryState.joinClauses.map((join, index) => (
              <div key={index} className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-purple-200 mb-1">Join Type</Label>
                    <Select
                      options={joinTypeOptions}
                      value={join.type}
                      onChange={(value) => updateJoinClause(index, "type", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-purple-200 mb-1">Table</Label>
                    <Select
                      options={tableOptions}
                      value={join.table}
                      onChange={(value) => updateJoinClause(index, "table", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-purple-200 mb-1">Left Column</Label>
                    <CreatableSelect
                      options={columnOptions}
                      value={join.onColumn1}
                      onChange={(value) => updateJoinClause(index, "onColumn1", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-purple-200 mb-1">Right Column</Label>
                    <CreatableSelect
                      options={columnOptions}
                      value={join.onColumn2}
                      onChange={(value) => updateJoinClause(index, "onColumn2", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-purple-200/70 italic">
              JOINs allow you to combine data from multiple tables based on related columns.
            </p>
          </div>
        );
      case "case":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
              CASE Statement
            </h3>
            {queryState.caseConditions.map((condition, index) => (
              <div key={index} className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 space-y-3">
                <div className="text-xs text-amber-300 font-semibold mb-2">WHEN condition:</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-amber-200 mb-1">Column</Label>
                    <CreatableSelect
                      options={columnOptions}
                      value={condition.column}
                      onChange={(value) => updateCaseCondition(index, "column", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-amber-200 mb-1">Operator</Label>
                    <Select
                      options={operatorOptions}
                      value={condition.operator}
                      onChange={(value) => updateCaseCondition(index, "operator", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-amber-200 mb-1">Value</Label>
                    <CreatableSelect
                      options={valueOptions}
                      value={condition.value}
                      onChange={(value) => updateCaseCondition(index, "value", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-amber-200 mb-1">THEN Result</Label>
                  <CreatableSelect
                    options={valueOptions}
                    value={condition.result}
                    onChange={(value) => updateCaseCondition(index, "result", value)}
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-amber-200/70 italic">
              CASE statements add conditional logic to your queries, transforming data based on conditions.
            </p>
          </div>
        );
      case "having":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              HAVING Clause
            </h3>
            <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
              <Label className="text-xs text-pink-200 mb-2">GROUP BY Columns</Label>
              <CreatableSelect
                isMulti
                options={columnOptions}
                value={queryState.groupBy}
                onChange={(value) => setQueryState(prev => ({ ...prev, groupBy: value as SelectOption[] }))}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            {queryState.havingConditions.map((condition, index) => (
              <div key={index} className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 space-y-3">
                <div className="text-xs text-emerald-300 font-semibold mb-2">HAVING condition:</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-emerald-200 mb-1">Aggregate</Label>
                    <CreatableSelect
                      options={columnOptions}
                      value={condition.column}
                      onChange={(value) => updateHavingCondition(index, "column", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-200 mb-1">Operator</Label>
                    <Select
                      options={operatorOptions}
                      value={condition.operator}
                      onChange={(value) => updateHavingCondition(index, "operator", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-200 mb-1">Value</Label>
                    <CreatableSelect
                      options={valueOptions}
                      value={condition.value}
                      onChange={(value) => updateHavingCondition(index, "value", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-emerald-200/70 italic">
              HAVING filters grouped data using aggregate functions like COUNT, SUM, AVG, etc.
            </p>
          </div>
        );
      case "union":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
              UNION Operation
            </h3>
            {queryState.unionClauses.map((union, index) => (
              <div key={index} className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-cyan-200 mb-1">Union Type</Label>
                    <Select
                      options={unionTypeOptions}
                      value={union.type}
                      onChange={(value) => updateUnionClause(index, "type", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-cyan-200 mb-1">Combine With Table</Label>
                    <Select
                      options={tableOptions}
                      value={union.table}
                      onChange={(value) => updateUnionClause(index, "table", value)}
                      styles={selectStyles}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-cyan-200/70 italic">
              UNION combines results from multiple queries. Use UNION ALL to keep duplicates.
            </p>
          </div>
        );
      case "with":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
              WITH Clause (CTE)
            </h3>
            {queryState.withClauses.map((cte, index) => (
              <div key={index} className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30 space-y-3">
                <div>
                  <Label className="text-xs text-pink-200 mb-1">CTE Alias Name</Label>
                  <input
                    type="text"
                    value={cte.alias}
                    onChange={(e) => {
                      const newAlias = e.target.value;
                      setQueryState(prev => ({
                        ...prev,
                        withClauses: prev.withClauses.map((c, i) =>
                          i === index ? { ...c, alias: newAlias } : c
                        )
                      }));
                    }}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-pink-500/30 rounded text-pink-200 text-sm"
                    placeholder="e.g., active_users"
                  />
                </div>
                <div>
                  <Label className="text-xs text-pink-200 mb-1">Source Table</Label>
                  <Select
                    options={tableOptions}
                    value={cte.table}
                    onChange={(value) => {
                      setQueryState(prev => ({
                        ...prev,
                        withClauses: prev.withClauses.map((c, i) =>
                          i === index ? { ...c, table: value } : c
                        )
                      }));
                    }}
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-pink-200/70 italic">
              WITH creates temporary named result sets (CTEs) for complex queries.
            </p>
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className={`bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl p-4 sm:p-6 lg:p-8 border border-pink-500/30 shadow-2xl ${className}`}>
      {/* Tab Navigation */}
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-4">
          Advanced Query Features
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeView === tab.id
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50"
                  : "bg-gray-800/50 text-pink-200 hover:bg-gray-700/50 border border-pink-500/20"
              }`}
            >
              <span className="text-sm sm:text-base">{tab.label}</span>
              <span className="hidden lg:inline text-xs ml-2 opacity-70">· {tab.description}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Feature Configuration */}
        <div className="space-y-6">
          {/* Base Query Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
              Base Query
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-300 mb-1">Table</Label>
                <Select
                  options={tableOptions}
                  value={queryState.selectedTable}
                  onChange={(value) => setQueryState(prev => ({ ...prev, selectedTable: value }))}
                  styles={selectStyles}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300 mb-1">Columns</Label>
                <CreatableSelect
                  isMulti
                  options={columnOptions}
                  value={queryState.selectedColumns}
                  onChange={(value) => setQueryState(prev => ({ ...prev, selectedColumns: value as SelectOption[] }))}
                  styles={selectStyles}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300 mb-1">WHERE Condition</Label>
                <div className="grid grid-cols-3 gap-2">
                  <CreatableSelect
                    options={columnOptions}
                    value={queryState.whereConditions[0]?.column}
                    onChange={(value) => setQueryState(prev => ({
                      ...prev,
                      whereConditions: [{ ...prev.whereConditions[0], column: value }]
                    }))}
                    styles={selectStyles}
                    className="text-sm"
                    placeholder="Column"
                  />
                  <Select
                    options={operatorOptions}
                    value={queryState.whereConditions[0]?.operator}
                    onChange={(value) => setQueryState(prev => ({
                      ...prev,
                      whereConditions: [{ ...prev.whereConditions[0], operator: value }]
                    }))}
                    styles={selectStyles}
                    className="text-sm"
                    placeholder="="
                  />
                  <CreatableSelect
                    options={valueOptions}
                    value={queryState.whereConditions[0]?.value}
                    onChange={(value) => setQueryState(prev => ({
                      ...prev,
                      whereConditions: [{ ...prev.whereConditions[0], value: value }]
                    }))}
                    styles={selectStyles}
                    className="text-sm"
                    placeholder="Value"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-300 mb-1">ORDER BY</Label>
                <Select
                  options={orderByOptions}
                  value={queryState.orderBy}
                  onChange={(value) => setQueryState(prev => ({ ...prev, orderBy: value }))}
                  styles={selectStyles}
                  className="text-sm"
                  isClearable
                />
              </div>
            </div>
          </div>

          {/* Dynamic Feature Content */}
          {renderFeatureContent()}
        </div>

        {/* Right Column - Generated Query */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50 h-fit lg:sticky lg:top-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h4 className="text-cyan-400 font-semibold">Generated SQL</h4>
          </div>
          <pre className="text-pink-200 text-xs sm:text-sm font-mono whitespace-pre-wrap bg-gray-900/50 p-4 rounded border border-gray-700/50 max-h-[500px] overflow-y-auto">
            {generateQuery(queryState)}
          </pre>
        </div>
      </div>
    </div>
  );
}

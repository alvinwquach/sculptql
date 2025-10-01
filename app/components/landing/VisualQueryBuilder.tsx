"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectStyles } from "@/app/utils/selectStyles";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Database } from "lucide-react";
import {  SelectOption, WhereCondition } from "@/app/types/query";

// Props for the VisualQueryBuilder component
interface VisualQueryBuilderProps {
  className?: string;
}

// Interface for the query state
interface QueryState {
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  whereConditions: WhereCondition[];
  orderBy: SelectOption | null;
  groupBy: SelectOption[];
}


// Type for the query builder state
type QueryBuilderState = {
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  whereConditions: Array<{
    column: SelectOption | null;
    operator: SelectOption | null;
    value: SelectOption | null;
  }>;
  orderBy: SelectOption | null;
  groupBy: SelectOption[];
};

export default function VisualQueryBuilder({ className = "" }: VisualQueryBuilderProps) {
  // State for the query builder
  const [queryState, setQueryState] = useState<QueryBuilderState>({
    selectedTable: null,
    selectedColumns: [],
    whereConditions: [
      {
        column: null,
        operator: null,
        value: null,
      },
    ],
    orderBy: null,
    groupBy: [],
  });
  // Ref for the container
  const containerRef = useRef<HTMLDivElement>(null);

  // Table options for the query builder
  const tableOptions: SelectOption[] = [
    { value: "users", label: "users" },
    { value: "orders", label: "orders" },
    { value: "products", label: "products" },
    { value: "categories", label: "categories" },
  ];

  // Column options for the query builder
  const columnOptions: SelectOption[] = queryState.selectedTable
    ? [
        { value: "user_name", label: "user_name" },
        { value: "email", label: "email" },
        { value: "created_at", label: "created_at" },
        { value: "status", label: "status" },
        { value: "last_login", label: "last_login" },
      ]
    : [];

  // Operator options for the query builder
  const operatorOptions: SelectOption[] = [
    { value: "=", label: "=" },
    { value: "!=", label: "!=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
    { value: "LIKE", label: "LIKE" },
    { value: "IN", label: "IN" },
    { value: "NOT IN", label: "NOT IN" },
  ];

  // Value options for the query builder
  const valueOptions: SelectOption[] = [
    { value: "'active'", label: "'active'" },
    { value: "'inactive'", label: "'inactive'" },
    { value: "'pending'", label: "'pending'" },
    { value: "1", label: "1" },
    { value: "0", label: "0" },
  ];

  // Order by options for the query builder
  const orderByOptions: SelectOption[] = [
    { value: "created_at ASC", label: "created_at ASC" },
    { value: "created_at DESC", label: "created_at DESC" },
    { value: "user_name ASC", label: "user_name ASC" },
    { value: "user_name DESC", label: "user_name DESC" },
  ];

  // Group by options for the query builder
  const groupByOptions: SelectOption[] = columnOptions;


  useEffect(() => {
    // If the container ref is not found, return
    if (containerRef.current) {
      // Animate the container
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  // Function to update the where condition
  const updateWhereCondition = (index: number, field: "column" | "operator" | "value", value: SelectOption | null) => {
    // Set the query state
    setQueryState((prevState) => {
      // Create a new where conditions
      const newWhereConditions = prevState.whereConditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      );
      // Return the new query state
      return { ...prevState, whereConditions: newWhereConditions };
    });
  };

  // Function to generate the query
  const generateQuery = (queryState: QueryState) => {
    // Function to join the conditions
    const joinConditions = (
      conditions: WhereCondition[],
      operator: string,
      format: (c: WhereCondition) => string
    ): string => {
      // Create a new valid conditions array
      const validConditions = conditions.filter((c) => c.column && c.operator && c.value);
      // Return the valid conditions
      return validConditions.length > 0 ? `\n${operator} ${validConditions.map(format).join(" AND ")}` : "";
    };
  
    // Initialize the query
    let query = "SELECT ";

    // Initialize the query parts
    const queryParts: {
      condition: boolean;
      action: () => string;
      default: () => string;
    }[] = [
      {
        // If the selected columns are not empty, add the selected columns to the query
        condition: queryState.selectedColumns.length > 0,
        action: () => queryState.selectedColumns.map((col) => col.value).join(", "),
        default: () => "*"
      },
      {
        // If the selected table is not empty, add the selected table to the query
        condition: queryState.selectedTable !== null,
        action: () => `FROM ${queryState.selectedTable!.value}`,
        default: () => ""
      },
      {
        // If the where conditions are not empty, add the where conditions to the query
        condition: queryState.whereConditions.length > 0,
        action: () => joinConditions(
          queryState.whereConditions, 
          "WHERE", 
          (c) => `${c.column!.value} ${c.operator!.value} ${c.value!.value}`
        ),
        default: () => ""
      },
      {
        // If the group by are not empty, add the group by to the query
        condition: queryState.groupBy.length > 0,
        action: () => `\nGROUP BY ${queryState.groupBy.map((g) => g.value).join(", ")}`,
        default: () => ""
      },
      {
        // If the order by is not empty, add the order by to the query
        condition: queryState.orderBy !== null,
        action: () => `\nORDER BY ${queryState.orderBy!.value}`,
        default: () => ""
      }
    ];
  
    // Iterate over each query part and append to the query if the condition is met
    queryParts.forEach(part => {
      // Append the query part if the condition is met
      query += part.condition ? part.action() : part.default();
    });
    
    // End the query with a semicolon
    query += ";";
    // Return the query
    return query;
  };
  


  return (
    <div ref={containerRef} className={`bg-gradient-to-br from-gray-900 to-purple-900 rounded-xl p-8 border border-pink-500/30 ${className}`}>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 cursor-help">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div> Select
                </h3>
              </TooltipTrigger>
              <TooltipContent className="bg-cyan-900/90 border border-cyan-500/50 text-cyan-100">
                <p>Choose table and columns to query</p>
              </TooltipContent>
            </Tooltip>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-white text-opacity-80 font-semibold"> Select </div>
                <label htmlFor="table-selector" className="text-xs text-[#f8f9fa] mb-1"> Table </label>
                <Select
                  inputId="table-selector"
                  instanceId="table-selector"
                  options={tableOptions}
                  value={queryState.selectedTable}
                  onChange={(value) => setQueryState((prevState) => ({ ...prevState, selectedTable: value }))}
                  placeholder="Select a table"
                  isClearable
                  styles={selectStyles}
                  className="min-w-0 w-full"
                  aria-label="Select table"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="column-selector" className="text-xs text-[#f8f9fa] mb-1"> Column </label>
                <CreatableSelect
                  inputId="column-selector"
                  instanceId="column-selector"
                  isMulti
                  options={columnOptions}
                  value={queryState.selectedColumns}
                  onChange={(value) => setQueryState((prevState) => ({ ...prevState, selectedColumns: value as SelectOption[] }))}
                  placeholder="Select column(s) or aggregate(s)"
                  isClearable
                  styles={selectStyles}
                  className="min-w-0 w-full"
                  aria-label="Select columns"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 cursor-help">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div> Filters
                </h3>
              </TooltipTrigger>
              <TooltipContent className="bg-cyan-900/90 border border-cyan-500/50 text-cyan-100">
                <p>Add WHERE conditions to filter your data</p>
              </TooltipContent>
            </Tooltip>
            <div className="space-y-3">
            {queryState.whereConditions.map((condition, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="text-xs text-white text-opacity-80 font-semibold"> Where </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor={`where-column-${index}`} className="text-xs text-[#f8f9fa]">
                        Column
                      </Label>
                      <CreatableSelect
                        inputId={`where-column-${index}`}
                        instanceId={`where-column-${index}`}
                        options={columnOptions}
                        value={condition.column}
                        onChange={(value) => updateWhereCondition(index, "column", value)}
                        placeholder="Select column"
                        isClearable
                        styles={selectStyles}
                        className="min-w-0 w-full"
                        aria-label={`Select column for condition ${index + 1}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor={`where-operator-${index}`} className="text-xs text-[#f8f9fa]">
                        Operator
                      </Label>
                      <Select
                        inputId={`where-operator-${index}`}
                        instanceId={`where-operator-${index}`}
                        options={operatorOptions}
                        value={condition.operator}
                        onChange={(value) => updateWhereCondition(index, "operator", value)}
                        placeholder="Select operator"
                        isClearable
                        styles={selectStyles}
                        className="min-w-0 w-full"
                        aria-label={`Select operator for condition ${index + 1}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor={`where-value-${index}`} className="text-xs text-[#f8f9fa]">
                        Value
                      </Label>
                      <CreatableSelect
                        inputId={`where-value-${index}`}
                        instanceId={`where-value-${index}`}
                        options={valueOptions}
                        value={condition.value}
                        onChange={(value) => updateWhereCondition(index, "value", value)}
                        placeholder="Select value"
                        isClearable
                        styles={selectStyles}
                        className="min-w-0 w-full"
                        aria-label={`Select value for condition ${index + 1}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2 cursor-help">
                  <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div> Grouping & Sorting
                </h3>
              </TooltipTrigger>
              <TooltipContent className="bg-pink-900/90 border border-pink-500/50 text-pink-100">
                <p>Group data and sort results</p>
              </TooltipContent>
            </Tooltip>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="group-by-selector" className="text-xs text-[#f8f9fa]">
                  Group By
                </Label>
                <CreatableSelect
                  inputId="group-by-selector"
                  instanceId="group-by-selector"
                  isMulti
                  options={groupByOptions}
                  value={queryState.groupBy}
                  onChange={(value) => setQueryState((prevState) => ({ ...prevState, groupBy: value as SelectOption[] }))}
                  placeholder="Select column(s) to group by"
                  isClearable
                  styles={selectStyles}
                  className="min-w-0 w-full"
                  aria-label="Select group by columns"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="order-by-selector" className="text-xs text-[#f8f9fa]">
                  Order By
                </Label>
                <Select
                  inputId="order-by-selector"
                  instanceId="order-by-selector"
                  options={orderByOptions}
                  value={queryState.orderBy}
                  onChange={(value) => setQueryState((prevState) => ({ ...prevState, orderBy: value }))}
                  placeholder="Select column to order by"
                  isClearable
                  styles={selectStyles}
                  className="min-w-0 w-full"
                  aria-label="Select order by column"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h4 className="text-cyan-400 font-semibold">Generated Query</h4>
          </div>
          <pre className="text-pink-200 text-sm font-mono whitespace-pre-wrap bg-gray-900/50 p-4 rounded border border-gray-700/50">
            {generateQuery(queryState)}
          </pre>
        </div>
      </div>
    </div>
  );
}


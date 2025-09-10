"use client";

import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState, useCallback, useEffect, useMemo } from "react";
import TableSelect from "./TableSelect";
import ColumnSelect from "./ColumnSelect";
import WhereClauseSelect from "./WhereClauseSelect";
import OrderByLimitSelect from "./OrderByLimitSelect";
import GroupBySelect from "./GroupBySelect";
import CodeMirrorEditor from "./CodeMirrorEditor";
import QueryHistory from "../history/QueryHistory";
import {
  TableSchema,
  SelectOption,
  WhereClause,
  OrderByClause,
  JoinClause,
  HavingClause,
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
  QueryResult,
  ViewMode,
  ChartDataItem,
  ColumnSchema,
  TableDescription,
} from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { SingleValue, MultiValue } from "react-select";
import HavingSelect from "./HavingSelect";
import { Button } from "@/components/ui/button";
import { Braces, LucideHistory, LucidePlay } from "lucide-react";
import {
  getQueryData,
  setQueryData,
  clearQueryData,
} from "@/app/utils/fileStorageUtils";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "@/app/utils/localStorageUtils";
import { useMutation } from "@apollo/client/react";
import { RUN_QUERY } from "@/app/graphql/mutations/runQuery";
import ResultsPane from "./ResultsPane";

interface EditorClientProps {
  schema: TableSchema[];
  error: string | null;
  isMySQL?: boolean;
}

export default function EditorClient({
  schema,
  error,
  isMySQL = false,
}: EditorClientProps) {
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<SelectOption[]>([]);
  const [selectedGroupByColumns, setSelectedGroupByColumns] = useState<
    SelectOption[]
  >([]);
  const [whereClause, setWhereClause] = useState<WhereClause>({
    conditions: [{ column: null, operator: null, value: null, value2: null }],
  });
  const [orderByClause, setOrderByClause] = useState<OrderByClause>({
    column: null,
    direction: null,
  });
  const [limit, setLimit] = useState<SelectOption | null>(null);
  const [query, setQuery] = useState<string>("");
  const [isDistinct, setIsDistinct] = useState<boolean>(false);
  const [havingClause, setHavingClause] = useState<HavingClause>({
    condition: { aggregateColumn: null, operator: null, value: null },
  });
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [pinnedQueries, setPinnedQueries] = useState<PinnedQuery[]>([]);
  const [bookmarkedQueries, setBookmarkedQueries] = useState<BookmarkedQuery[]>(
    []
  );
  const [labeledQueries, setLabeledQueries] = useState<LabeledQuery[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [runQueryMutation] = useMutation<
    { runQuery: QueryResult },
    { query: string }
  >(RUN_QUERY);

  useEffect(() => {
    if (queryResult) {
      window.QueryResults = queryResult;
      console.log(
        "QueryResults available in console as window.QueryResults:",
        queryResult
      );
    }
  }, [queryResult]);

  const logQueryResultAsJson = useCallback(() => {
    if (!queryResult) {
      console.warn("No query results available. Please run a query first.");
      toast.error("No query results available. Please run a query first.");

      return undefined;
    }
    if (!queryResult.rows || !queryResult.fields) {
      console.warn("Query result is incomplete: missing rows or fields.");

      toast.error("Query result is incomplete.");

      return undefined;
    }
    try {
      const jsonContent = JSON.stringify(
        {
          fields: queryResult.fields,
          rows: queryResult.rows,
        },
        null,
        2
      );
      console.log("Query Results as JSON:", jsonContent);
      toast.success("Query results logged as JSON in the console.");

      return jsonContent;
    } catch (error) {
      console.error("Failed to convert query results to JSON:", error);
      toast.error("Failed to log query results as JSON.");

      return undefined;
    }
  }, [queryResult]);

  useEffect(() => {
    window.logQueryResultAsJson = logQueryResultAsJson;
  }, [logQueryResultAsJson]);

  useEffect(() => {
    setQueryData({ queryHistory });
  }, [queryHistory]);

  useEffect(() => {
    setQueryData({ pinnedQueries });
  }, [pinnedQueries]);

  useEffect(() => {
    setQueryData({ bookmarkedQueries });
  }, [bookmarkedQueries]);

  useEffect(() => {
    setQueryData({ labeledQueries });
  }, [labeledQueries]);

  useEffect(() => {
    setQueryData({ showQueryHistory: showHistory });
  }, [showHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Run Query shortcut: Ctrl+Enter or Cmd+Enter
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runQuery(query);
      }
      // Toggle History shortcut: Ctrl+H or Cmd+H
      if ((event.ctrlKey || event.metaKey) && event.key === "h") {
        event.preventDefault();
        setShowHistory((prev) => {
          const newState = !prev;
          setLocalStorageItem("showQueryHistory", newState);
          return newState;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query]);

  const exportToCsv = useCallback(
    (exportAll: boolean = false, startIndex: number, endIndex: number) => {
      if (!queryResult || !queryResult.rows || !queryResult.fields) return;
      const headers = queryResult.fields.join(",");
      const rows = queryResult.rows
        .slice(
          exportAll ? 0 : startIndex,
          exportAll ? queryResult.rows.length : endIndex
        )
        .map((row) =>
          queryResult.fields
            .map((field) => {
              const value = row[field] !== null ? String(row[field]) : "";
              if (value.includes(",") || value.includes('"')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        );
      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `query_results_${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [queryResult]
  );

  const exportToJson = useCallback(
    (exportAll: boolean = false, startIndex: number, endIndex: number) => {
      if (!queryResult || !queryResult.rows) return;
      const jsonContent = JSON.stringify(
        queryResult.rows.slice(
          exportAll ? 0 : startIndex,
          exportAll ? queryResult.rows.length : endIndex
        ),
        null,
        2
      );
      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `query_results_${new Date().toISOString()}.json`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [queryResult]
  );

  const exportToMarkdown = useCallback(
    (exportAll: boolean = false, startIndex: number, endIndex: number) => {
      if (!queryResult || !queryResult.rows || !queryResult.fields) return;
      const headers = queryResult.fields.join(" | ");
      const separator = queryResult.fields.map(() => "---").join(" | ");
      const rows = queryResult.rows
        .slice(
          exportAll ? 0 : startIndex,
          exportAll ? queryResult.rows.length : endIndex
        )
        .map((row) =>
          queryResult.fields
            .map((field) => {
              const value = row[field] !== null ? String(row[field]) : "";
              return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
            })
            .join(" | ")
        );
      const markdownContent = [
        `| ${headers} |`,
        `| ${separator} |`,
        ...rows.map((row) => `| ${row} |`),
      ].join("\n");
      const blob = new Blob([markdownContent], {
        type: "text/markdown;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `query_results_${new Date().toISOString()}.md`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [queryResult]
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      const totalRows = queryResult?.rows?.length || 0;
      const totalPages = Math.ceil(totalRows / pageSize);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [queryResult, pageSize]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const selectedTableName = selectedTable?.value || "";
  const table = useMemo(() => {
    return schema.filter((t) => t.table_name === selectedTableName);
  }, [schema, selectedTableName]);

  const tableDescription = useMemo(() => {
    const selected = schema.find((t) => t.table_name === selectedTableName);
    if (!selected) return null;

    return {
      table_name: selected.table_name,
      columns: selected.columns.map(
        (col): ColumnSchema => ({
          column_name: col.column_name,
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default,
          is_primary_key: col.is_primary_key,
          is_indexed: col.is_indexed,
          index_names: col.index_names,
          uniqueValues: col.uniqueValues,
        })
      ),
      primary_keys: selected.primary_keys,
      foreign_keys: selected.foreign_keys,
    } as TableDescription;
  }, [schema, selectedTableName]);

  const statsChartData: ChartDataItem[] = useMemo(
    () =>
      queryResult
        ? [
            {
              name: "Total Time",
              value: queryResult.totalTime ?? 0,
              unit: "ms",
            },
            {
              name: "Errors",
              value: queryResult.errorsCount ?? 0,
              unit: "count",
            },
          ]
        : [],
    [queryResult]
  );

  const resultChartData: ChartDataItem[] = useMemo(() => {
    if (!queryResult || !queryResult.rows || !queryResult.fields) return [];

    const numericalColumns = queryResult.fields.filter((field) =>
      queryResult.rows.every((row) => typeof row[field] === "number")
    );

    const categoricalColumns = queryResult.fields.filter(
      (field) => !numericalColumns.includes(field)
    );

    if (categoricalColumns.length > 0 && numericalColumns.length > 0) {
      const categoryField = categoricalColumns[0];
      const valueField = numericalColumns[0];

      const groupedData = queryResult.rows.reduce(
        (acc: Record<string, number>, row) => {
          const category = String(row[categoryField]);
          const value = Number(row[valueField]) || 0;
          acc[category] = (acc[category] ?? 0) + value;
          return acc;
        },
        {}
      );

      return Object.entries(groupedData).map(([name, value]) => ({
        name,
        value,
        unit: "count",
      }));
    }

    if (categoricalColumns.length > 0) {
      const categoryField = categoricalColumns[0];

      const counts = queryResult.rows.reduce(
        (acc: Record<string, number>, row) => {
          const category = String(row[categoryField]);
          acc[category] = (acc[category] ?? 0) + 1;
          return acc;
        },
        {}
      );

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        unit: "count",
      }));
    }

    return [];
  }, [queryResult]);

  const updateQueryFromHavingClause = useCallback(
    (updatedHavingClause: HavingClause) => {
      if (!selectedTable) return;

      const tableName = needsQuotes(selectedTable.value)
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      const columnsString =
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      let newQuery = `SELECT ${
        isDistinct ? "DISTINCT " : ""
      }${columnsString} FROM ${tableName}`;

      const conditionsStrings = whereClause.conditions
        .filter((cond) => cond.column)
        .map((cond, index) => {
          const colName = needsQuotes(cond.column!.value)
            ? `"${cond.column!.value}"`
            : cond.column!.value;
          const logicalOp =
            index > 0 ? cond.logicalOperator?.value || "AND" : "";
          if (!cond.operator) return `${logicalOp} ${colName}`.trim();
          const op = cond.operator.value.toUpperCase();

          if (op === "IS NULL" || op === "IS NOT NULL") {
            return `${logicalOp} ${colName} ${op}`.trim();
          }

          if (op === "BETWEEN" && cond.value && cond.value2) {
            const val1 = needsQuotes(cond.value.value)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            const val2 = needsQuotes(cond.value2.value)
              ? `'${stripQuotes(cond.value2.value)}'`
              : cond.value2.value;
            return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
          }

          if (cond.value) {
            const val = needsQuotes(cond.value.value)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            return `${logicalOp} ${colName} ${op} ${val}`.trim();
          }

          return `${logicalOp} ${colName} ${op}`.trim();
        });

      if (conditionsStrings.length > 0) {
        newQuery += " WHERE " + conditionsStrings.join(" ");
      }

      if (selectedGroupByColumns.length > 0) {
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        newQuery += ` GROUP BY ${groupByString}`;
      }

      if (updatedHavingClause.condition.aggregateColumn) {
        const aggName = updatedHavingClause.condition.aggregateColumn.value;
        let havingString = `HAVING ${aggName}`;
        if (updatedHavingClause.condition.operator) {
          const op = updatedHavingClause.condition.operator.value.toUpperCase();
          havingString += ` ${op}`;
          if (updatedHavingClause.condition.value) {
            const val = needsQuotes(updatedHavingClause.condition.value.value)
              ? `'${stripQuotes(updatedHavingClause.condition.value.value)}'`
              : updatedHavingClause.condition.value.value;
            havingString += ` ${val}`;
          }
        }
        newQuery += ` ${havingString}`;
      }

      if (orderByClause.column) {
        const col = needsQuotes(orderByClause.column.value)
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        const dir = orderByClause.direction?.value || "";
        newQuery += ` ORDER BY ${col} ${dir}`.trim();
      }

      if (limit) {
        newQuery += ` LIMIT ${limit.value}`;
      }

      newQuery = newQuery.trim();
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        newQuery += ";";
      } else {
        newQuery += " ";
      }

      console.log("Updated query from having clause:", newQuery);
      setQuery(newQuery);
    },
    [
      selectedTable,
      selectedColumns,
      selectedGroupByColumns,
      whereClause,
      orderByClause,
      limit,
      isDistinct,
    ]
  );

  const handleAggregateColumnSelect = useCallback(
    (value: SingleValue<SelectOption>) => {
      setHavingClause((prev) => {
        const updatedClause = {
          condition: {
            ...prev.condition,
            aggregateColumn: value,
            operator: null,
            value: null,
          },
        };
        updateQueryFromHavingClause(updatedClause);
        return updatedClause;
      });
    },
    [updateQueryFromHavingClause]
  );

  const handleHavingOperatorSelect = useCallback(
    (value: SingleValue<SelectOption>) => {
      setHavingClause((prev) => {
        const updatedClause = {
          condition: {
            ...prev.condition,
            operator: value,
            value: null,
          },
        };
        updateQueryFromHavingClause(updatedClause);
        return updatedClause;
      });
    },
    [updateQueryFromHavingClause]
  );

  const handleHavingValueSelect = useCallback(
    (value: SingleValue<SelectOption>) => {
      setHavingClause((prev) => {
        const updatedClause = {
          condition: {
            ...prev.condition,
            value,
          },
        };
        updateQueryFromHavingClause(updatedClause);
        return updatedClause;
      });
    },
    [updateQueryFromHavingClause]
  );

  const tableNames = schema.map((table) => table.table_name);
  const tableColumns = schema.reduce((acc, table) => {
    acc[table.table_name] = table.columns.map((col) => col.column_name);
    return acc;
  }, {} as Record<string, string[]>);
  const uniqueValues = schema.reduce(
    (acc: Record<string, SelectOption[]>, table) => {
      table.columns.forEach((col) => {
        acc[`${table.table_name}.${col.column_name}`] =
          table.values && Array.isArray(table.values)
            ? [
                ...new Set(
                  table.values
                    .map((row: Record<string, string | number | null>) => {
                      const value = row[col.column_name] ?? "";
                      return {
                        value: String(value),
                        label: String(value),
                      };
                    })
                    .filter((v: SelectOption) => v.value !== "")
                    .map((v: SelectOption) => v.value)
                ),
              ].map((value) => ({ value, label: value }))
            : [];
      });
      return acc;
    },
    {} as Record<string, SelectOption[]>
  );

  const operatorOptions: SelectOption[] = [
    { value: "=", label: "=" },
    { value: "!=", label: "!=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
    { value: "LIKE", label: "LIKE" },
    { value: "IS NULL", label: "IS NULL" },
    { value: "IS NOT NULL", label: "IS NOT NULL" },
    { value: "BETWEEN", label: "BETWEEN" },
  ];

  const logicalOperatorOptions: SelectOption[] = [
    { value: "AND", label: "AND" },
    { value: "OR", label: "OR" },
  ];

  const handleTableSelect = useCallback(
    (value: SelectOption | null) => {
      setSelectedTable(value);
      setSelectedGroupByColumns([]);
      setHavingClause({
        condition: { aggregateColumn: null, operator: null, value: null },
      });
      setSelectedColumns([{ value: "*", label: "All Columns (*)" }]);
      setWhereClause({
        conditions: [
          { column: null, operator: null, value: null, value2: null },
        ],
      });
      setOrderByClause({ column: null, direction: null });
      setLimit(null);

      if (value) {
        const tableName = needsQuotes(value.value)
          ? `"${value.value}"`
          : value.value;
        const newQuery = `SELECT${
          isDistinct ? " DISTINCT" : ""
        } * FROM ${tableName};`;
        console.log("Setting query in handleTableSelect:", newQuery);
        setQuery(newQuery);
      } else {
        const newQuery = `SELECT${isDistinct ? " DISTINCT" : ""} * `;
        console.log("Setting query (no table):", newQuery);
        setQuery(newQuery);
      }
    },
    [isDistinct]
  );

  const handleColumnSelect = useCallback(
    (value: MultiValue<SelectOption>) => {
      const newCols = value.some((col) => col.value === "*")
        ? [{ value: "*", label: "All Columns (*)" }]
        : value.filter((col) => col.value !== "*");

      setSelectedColumns(newCols);

      const colsString =
        newCols.length === 0
          ? "*"
          : newCols
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      let newQuery = query
        .replace(/\s+/g, " ")
        .replace(/;+\s*$/, "")
        .trim();

      let whereClauseString = "";
      const whereMatch = newQuery.match(
        /\bWHERE\s+(.+?)(?=\s*(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      if (whereMatch) {
        whereClauseString = whereMatch[0].trim();
      }

      let groupByClause = "";
      const groupByMatch = newQuery.match(
        /\bGROUP\s+BY\s+(.+?)(?=\s*(HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      if (groupByMatch) {
        groupByClause = groupByMatch[0].trim();
      }

      let havingClauseString = "";
      const havingMatch = newQuery.match(
        /\bHAVING\s+(.+?)(?=\s*(ORDER\s+BY|LIMIT|;|$))/i
      );
      if (havingMatch) {
        havingClauseString = havingMatch[0].trim();
      }

      let orderByClause = "";
      const orderByMatch = newQuery.match(
        /\bORDER\s+BY\s+(.+?)(?=\s*(LIMIT|;|$))/i
      );
      if (orderByMatch) {
        orderByClause = orderByMatch[0].trim();
      }

      let limitClause = "";
      const limitMatch = newQuery.match(/\bLIMIT\s+(\d+)\s*?(?=;|$)/i);
      if (limitMatch) {
        limitClause = limitMatch[0].trim();
      }

      if (newQuery.match(/\bSELECT\b/i)) {
        newQuery = newQuery.replace(
          /^\s*SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i,
          `SELECT ${isDistinct ? "DISTINCT " : ""}${colsString}`
        );
      } else {
        const tableName = selectedTable
          ? needsQuotes(selectedTable.value)
            ? `"${selectedTable.value}"`
            : selectedTable.value
          : "";
        newQuery = `SELECT ${isDistinct ? "DISTINCT " : ""}${colsString}${
          tableName ? ` FROM ${tableName}` : ""
        }`;
      }

      if (whereClauseString) {
        newQuery += ` ${whereClauseString}`;
      }
      if (groupByClause) {
        newQuery += ` ${groupByClause}`;
      }
      if (havingClauseString) {
        newQuery += ` ${havingClauseString}`;
      }
      if (orderByClause) {
        newQuery += ` ${orderByClause}`;
      }
      if (limitClause) {
        newQuery += ` ${limitClause}`;
      }

      newQuery = newQuery.trim();
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        newQuery += ";";
      } else {
        newQuery += " ";
      }

      setQuery(newQuery);
    },
    [query, selectedTable, isDistinct]
  );

  const handleDistinctSelect = useCallback(
    (value: boolean) => {
      setIsDistinct(value);
      handleDistinctChange(value);
    },
    [query, selectedColumns, selectedTable]
  );

  const handleDistinctChange = useCallback(
    (value: boolean) => {
      setIsDistinct(value);

      const colsString =
        selectedColumns.length === 0
          ? "*"
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      let newQuery = query.replace(
        /^\s*SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i,
        `SELECT ${value ? "DISTINCT " : ""}${colsString}`
      );

      if (!/SELECT/i.test(newQuery)) {
        const tableName = selectedTable
          ? needsQuotes(selectedTable.value)
            ? `"${selectedTable.value}"`
            : selectedTable.value
          : "";
        newQuery = `SELECT ${value ? "DISTINCT " : ""}${colsString}${
          tableName ? ` FROM ${tableName}` : ""
        }`;
      }

      setQuery(newQuery.trim() + " ");
    },
    [query, selectedColumns, selectedTable]
  );

  const handleGroupByColumnSelect = useCallback(
    (value: MultiValue<SelectOption>) => {
      const groupByColumns = Array.from(value) as SelectOption[];
      setSelectedGroupByColumns(groupByColumns);

      if (!selectedTable) return;

      const tableName = needsQuotes(selectedTable.value)
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      const columnsString =
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      let newQuery = `SELECT ${
        isDistinct ? "DISTINCT " : ""
      }${columnsString} FROM ${tableName}`;

      let whereClauseString = "";
      const whereMatch = query.match(
        /\bWHERE\s+(.+?)(?=\s*(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      if (whereMatch) {
        whereClauseString = whereMatch[0].trim();
      } else if (
        whereClause &&
        whereClause.conditions &&
        Array.isArray(whereClause.conditions)
      ) {
        const conditionsStrings = whereClause.conditions
          .filter((cond) => cond.column && cond.operator && cond.value)
          .map((cond, index) => {
            const colName = needsQuotes(cond.column!.value)
              ? `"${cond.column!.value}"`
              : cond.column!.value;
            const logicalOp: string =
              index > 0 ? cond.logicalOperator?.value || "AND" : "";
            const op = String(cond.operator?.value ?? "").toUpperCase();

            if (op === "IS NULL" || op === "IS NOT NULL") {
              return `${logicalOp} ${colName} ${op}`.trim();
            }

            if (op === "BETWEEN" && cond.value && cond.value2) {
              const val1 = needsQuotes(cond.value.value)
                ? `'${stripQuotes(cond.value.value)}'`
                : cond.value.value;
              const val2 = needsQuotes(cond.value2.value)
                ? `'${stripQuotes(cond.value2.value)}'`
                : cond.value2.value;
              return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
            }

            const val = needsQuotes(cond.value!.value)
              ? `'${stripQuotes(cond.value!.value)}'`
              : cond.value!.value;
            return `${logicalOp} ${colName} ${op} ${val}`.trim();
          });

        if (conditionsStrings.length > 0) {
          whereClauseString = "WHERE " + conditionsStrings.join(" ");
        }
      }

      if (whereClauseString) {
        newQuery += ` ${whereClauseString}`;
      }

      if (groupByColumns.length > 0) {
        const groupByString = groupByColumns
          .map((col) =>
            col.aggregate
              ? col.value
              : needsQuotes(col.value)
              ? `"${col.value}"`
              : col.value
          )
          .join(", ");
        newQuery += ` GROUP BY ${groupByString}`;
      }

      if (havingClause.condition.aggregateColumn) {
        const aggName = havingClause.condition.aggregateColumn.value;
        let havingString = `HAVING ${aggName}`;
        if (havingClause.condition.operator) {
          const op = havingClause.condition.operator.value.toUpperCase();
          havingString += ` ${op}`;
          if (havingClause.condition.value) {
            const val = needsQuotes(havingClause.condition.value.value)
              ? `'${stripQuotes(havingClause.condition.value.value)}'`
              : havingClause.condition.value.value;
            havingString += ` ${val}`;
          }
        }
        newQuery += ` ${havingString}`;
      }

      if (orderByClause.column) {
        const columnName = needsQuotes(orderByClause.column.value)
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        const direction = orderByClause.direction?.value || "";
        newQuery += ` ORDER BY ${columnName}${
          direction ? ` ${direction}` : ""
        }`;
      }

      if (limit) {
        newQuery += ` LIMIT ${limit.value}`;
      }

      newQuery = newQuery.trim();
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        newQuery += ";";
      } else {
        newQuery += " ";
      }

      setQuery(newQuery);
    },
    [
      selectedTable,
      selectedColumns,
      isDistinct,
      whereClause,
      havingClause,
      orderByClause,
      limit,
      query,
    ]
  );

  const handleOrderBySelect = useCallback(
    (
      column: SingleValue<SelectOption>,
      direction: SingleValue<SelectOption> | null,
      limitValue?: SingleValue<SelectOption>
    ) => {
      if (limitValue) {
        setLimit(limitValue);
      } else {
        setOrderByClause({ column, direction });
      }
      updateQueryWithOrderByAndLimit(
        { column: column || orderByClause.column, direction },
        limitValue || limit
      );
    },
    [orderByClause, limit]
  );

  const handleOrderByColumnSelect = useCallback(
    (value: SingleValue<SelectOption>) => {
      setOrderByClause((prev) => ({ ...prev, column: value }));
      updateQueryWithOrderByAndLimit(
        { ...orderByClause, column: value },
        limit
      );
    },
    [orderByClause, limit]
  );

  const handleOrderByDirectionSelect = useCallback(
    (value: SingleValue<SelectOption>) => {
      setOrderByClause((prev) => ({ ...prev, direction: value }));
      updateQueryWithOrderByAndLimit(
        { ...orderByClause, direction: value },
        limit
      );
    },
    [orderByClause, limit]
  );

  const handleLimitSelect = useCallback(
    (value: SingleValue<SelectOption>) => {
      setLimit(value);
      updateQueryWithOrderByAndLimit(orderByClause, value);
    },
    [orderByClause]
  );

  const handleLogicalOperatorSelect = useCallback(
    (value: SingleValue<SelectOption>) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        if (newConditions.length > 0) {
          newConditions[0].logicalOperator = value;
          if (!newConditions[1]) {
            newConditions.push({
              column: null,
              operator: null,
              value: null,
              value2: null,
            });
          }
        }
        return { conditions: newConditions };
      });

      updateQueryFromWhereClause({
        ...whereClause,
        conditions: [
          { ...whereClause.conditions[0], logicalOperator: value },
          ...whereClause.conditions.slice(1),
        ],
      });
    },
    [whereClause]
  );

  const handleWhereColumnSelect = useCallback(
    (value: SingleValue<SelectOption>, conditionIndex: number) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        if (value === null) {
          newConditions.splice(conditionIndex, 1);
          if (newConditions.length === 0) {
            newConditions.push({
              column: null,
              operator: null,
              value: null,
              value2: null,
            });
          }
        } else {
          newConditions[conditionIndex] = {
            column: value,
            operator: null,
            value: null,
            value2: null,
          };
        }
        return { conditions: newConditions };
      });

      updateQueryFromWhereClause({
        ...whereClause,
        conditions: whereClause.conditions.slice(0, conditionIndex).concat(
          value === null
            ? []
            : [
                {
                  column: value,
                  operator: null,
                  value: null,
                  value2: null,
                },
              ],
          whereClause.conditions.slice(conditionIndex + 1)
        ),
      });
    },
    [whereClause]
  );

  const handleDeleteCondition = useCallback(
    (index: number) => {
      setWhereClause((prev) => {
        const newConditions = prev.conditions.filter((_, i) => i !== index);
        if (newConditions.length === 0) {
          newConditions.push({
            column: null,
            operator: null,
            value: null,
            value2: null,
          });
        }
        return { conditions: newConditions };
      });

      updateQueryFromWhereClause({
        conditions: whereClause.conditions.filter((_, i) => i !== index),
      });
    },
    [whereClause]
  );

  const updateQueryFromWhereClause = useCallback(
    (updatedWhereClause: WhereClause) => {
      if (!selectedTable) {
        console.log("No table selected, skipping query update.");
        return;
      }

      const tableName = needsQuotes(selectedTable.value)
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      const columnsString =
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      let newQuery = `SELECT ${
        isDistinct ? "DISTINCT " : ""
      }${columnsString} FROM ${tableName}`;

      const conditionsStrings = updatedWhereClause.conditions
        .map((cond, index) => {
          if (!cond.column) return null;
          const colName = needsQuotes(cond.column!.value)
            ? `"${cond.column!.value}"`
            : cond.column!.value;
          const logicalOp =
            index > 0 ? cond.logicalOperator?.value || "AND" : "";

          if (!cond.operator) {
            return `${logicalOp} ${colName}`.trim();
          }

          const op = cond.operator!.value.toUpperCase();

          if (op === "IS NULL" || op === "IS NOT NULL") {
            return `${logicalOp} ${colName} ${op}`.trim();
          }

          if (op === "BETWEEN" && cond.value && cond.value2) {
            const val1 = needsQuotes(cond.value.value, true)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            const val2 = needsQuotes(cond.value2.value, true)
              ? `'${stripQuotes(cond.value2.value)}'`
              : cond.value2.value;
            return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
          }

          if (cond.value) {
            const val = needsQuotes(cond.value.value, true, undefined)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            return `${logicalOp} ${colName} ${op} ${val}`.trim();
          }

          return `${logicalOp} ${colName} ${op}`.trim();
        })
        .filter(Boolean);

      if (conditionsStrings.length > 0) {
        newQuery += ` WHERE ${conditionsStrings.join(" ")}`;
      }

      if (selectedGroupByColumns.length > 0) {
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        newQuery += ` GROUP BY ${groupByString}`;
      }

      if (havingClause.condition.aggregateColumn) {
        const agg = havingClause.condition.aggregateColumn.value;
        let havingString = `HAVING ${agg}`;
        if (havingClause.condition.operator) {
          const op = havingClause.condition.operator.value.toUpperCase();
          havingString += ` ${op}`;
          if (havingClause.condition.value) {
            const val = needsQuotes(havingClause.condition.value.value, true)
              ? `'${stripQuotes(havingClause.condition.value.value)}'`
              : havingClause.condition.value.value;
            havingString += ` ${val}`;
          }
        }
        newQuery += ` ${havingString}`;
      }

      if (orderByClause.column) {
        const columnName = needsQuotes(orderByClause.column.value)
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        const direction = orderByClause.direction?.value || "";
        newQuery += ` ORDER BY ${columnName}${
          direction ? ` ${direction}` : ""
        }`;
      }

      if (limit) {
        newQuery += ` LIMIT ${limit.value}`;
      }

      newQuery = newQuery.trim();
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        newQuery += ";";
      } else {
        newQuery += " ";
      }

      setQuery(newQuery);
      console.log("Updated query from WHERE clause:", newQuery);
    },
    [
      selectedTable,
      selectedColumns,
      selectedGroupByColumns,
      havingClause,
      orderByClause,
      limit,
      isDistinct,
    ]
  );

  const handleValueSelect = useCallback(
    (
      value: SingleValue<SelectOption>,
      conditionIndex: number,
      isValue2: boolean
    ) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          [isValue2 ? "value2" : "value"]: value,
        };

        updateQueryFromWhereClause({ conditions: newConditions });

        return { conditions: newConditions };
      });
    },
    [updateQueryFromWhereClause]
  );

  const handleOperatorSelect = useCallback(
    (value: SingleValue<SelectOption>, conditionIndex: number) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          operator: value,
          value: null,
          value2: null,
        };

        updateQueryFromWhereClause({ conditions: newConditions });

        return { conditions: newConditions };
      });
    },
    [updateQueryFromWhereClause]
  );

  const updateQueryWithOrderByAndLimit = useCallback(
    (updatedOrderBy: OrderByClause, updatedLimit: SelectOption | null) => {
      if (!selectedTable) {
        console.log("No table selected, skipping query update.");
        return;
      }

      const tableName = needsQuotes(selectedTable.value)
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      const columnsString =
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      let newQuery = `SELECT ${
        isDistinct ? "DISTINCT " : ""
      }${columnsString} FROM ${tableName}`;

      let whereClauseString = "";
      const whereMatch = query.match(
        /\bWHERE\s+(.+?)(?=\s*(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      if (whereMatch) {
        whereClauseString = whereMatch[0].trim();
      } else {
        if (
          whereClause &&
          whereClause.conditions &&
          Array.isArray(whereClause.conditions)
        ) {
          const conditionsStrings = whereClause.conditions
            .filter((cond) => cond.column && cond.operator && cond.value)
            .map((cond, index) => {
              const colName = needsQuotes(cond.column!.value)
                ? `"${cond.column!.value}"`
                : cond.column!.value;
              const logicalOp: string =
                index > 0 ? cond.logicalOperator?.value || "AND" : "";
              const op = cond.operator!.value.toUpperCase();

              if (op === "IS NULL" || op === "IS NOT NULL") {
                return `${logicalOp} ${colName} ${op}`.trim();
              }

              if (op === "BETWEEN" && cond.value && cond.value2) {
                const val1 = needsQuotes(cond.value.value)
                  ? `'${stripQuotes(cond.value.value)}'`
                  : cond.value.value;
                const val2 = needsQuotes(cond.value2.value)
                  ? `'${stripQuotes(cond.value2.value)}'`
                  : cond.value2.value;
                return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
              }

              const val = needsQuotes(cond.value!.value)
                ? `'${stripQuotes(cond.value!.value)}'`
                : cond.value!.value;
              return `${logicalOp} ${colName} ${op} ${val}`.trim();
            });

          if (conditionsStrings.length > 0) {
            whereClauseString = "WHERE " + conditionsStrings.join(" ");
          }
        }
      }

      if (whereClauseString) {
        newQuery += ` ${whereClauseString}`;
      }

      if (selectedGroupByColumns.length > 0) {
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        newQuery += ` GROUP BY ${groupByString}`;
      }

      if (havingClause.condition.aggregateColumn) {
        const aggName = havingClause.condition.aggregateColumn.value;
        let havingString = `HAVING ${aggName}`;
        if (havingClause.condition.operator) {
          const op = havingClause.condition.operator.value.toUpperCase();
          havingString += ` ${op}`;
          if (havingClause.condition.value) {
            const val = needsQuotes(havingClause.condition.value.value)
              ? `'${stripQuotes(havingClause.condition.value.value)}'`
              : havingClause.condition.value.value;
            havingString += ` ${val}`;
          }
        }
        newQuery += ` ${havingString}`;
      }

      if (updatedOrderBy.column) {
        const columnName = needsQuotes(updatedOrderBy.column.value)
          ? `"${updatedOrderBy.column.value}"`
          : updatedOrderBy.column.value;
        const direction = updatedOrderBy.direction?.value || "";
        newQuery += ` ORDER BY ${columnName}${
          direction ? ` ${direction}` : ""
        }`;
      }

      if (updatedLimit) {
        newQuery += ` LIMIT ${updatedLimit.value}`;
      }

      newQuery = newQuery.trim();
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        newQuery += ";";
      } else {
        newQuery += " ";
      }

      setQuery(newQuery);
    },
    [
      selectedTable,
      selectedColumns,
      selectedGroupByColumns,
      query,
      isDistinct,
      whereClause,
      havingClause,
    ]
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      console.log("Handling query change, input query:", newQuery);

      let normalizedQuery = newQuery
        .replace(
          /;+\s*(?=ORDER\s+BY|LIMIT|WHERE|FROM|GROUP\s+BY|HAVING)/gi,
          " "
        )
        .replace(/;+$/, "")
        .trim();

      if (
        normalizedQuery.match(/\b(LIMIT\s+\d+|ORDER\s+BY\s+.*|HAVING\s+.*)$/i)
      ) {
        normalizedQuery += ";";
      } else {
        normalizedQuery += " ";
      }

      console.log("Normalized query:", normalizedQuery);
      setQuery(normalizedQuery);

      const isDistinctQuery = normalizedQuery.match(/\bSELECT\s+DISTINCT\b/i);
      setIsDistinct(!!isDistinctQuery);

      const tableMatch = normalizedQuery.match(
        /FROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i
      );
      const tableName = tableMatch ? stripQuotes(tableMatch[1]) : null;
      if (tableName && tableNames.includes(tableName)) {
        if (!selectedTable || selectedTable.value !== tableName) {
          console.log("Setting selected table:", tableName);
          setSelectedTable({ value: tableName, label: tableName });
        }
      } else if (!normalizedQuery) {
        console.log("Clearing state due to empty query.");
        setSelectedTable(null);
        setSelectedColumns([]);
        setSelectedGroupByColumns([]);
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
        setOrderByClause({ column: null, direction: null });
        setLimit(null);
        setHavingClause({
          condition: { aggregateColumn: null, operator: null, value: null },
        });
        setIsDistinct(false);
        return;
      }

      const selectMatch = normalizedQuery.match(
        /SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i
      );
      if (selectMatch && tableName) {
        const columnsStr = selectMatch[2].trim();
        if (columnsStr === "*" || columnsStr === "") {
          setSelectedColumns([{ value: "*", label: "All Columns (*)" }]);
        } else {
          const columnRegex =
            /(?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*|COUNT\(\*\)|ROUND\((?:AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(?:[^,)]+)\)(?:,\s*(\d+))?\)|(?:SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(?:[^,)]+)(?:,\s*(\d+))?\))/gi;
          const parsedColumns: SelectOption[] = [];
          let match;
          while ((match = columnRegex.exec(columnsStr)) !== null) {
            const col = match[0];
            if (col === "*") {
              parsedColumns.push({ value: "*", label: "All Columns (*)" });
            } else if (col === "COUNT(*)") {
              parsedColumns.push({
                value: "COUNT(*)",
                label: "COUNT(*)",
                aggregate: true,
              });
            } else if (col.match(/^(SUM|AVG|MAX|MIN|ROUND|COUNT)\(/i)) {
              const funcMatch = col.match(
                /^(SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(.+?)(?:,\s*(\d+))?\)$/i
              );
              const nestedMatch = col.match(
                /^ROUND\((AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(.+?)\)(?:,\s*(\d+))?\)$/i
              );
              if (nestedMatch) {
                const innerFunc = nestedMatch[1];
                const targetCol = stripQuotes(nestedMatch[2]);
                const decimals = nestedMatch[3] || null;
                const isDistinct = col.includes("DISTINCT");
                if (
                  tableColumns[tableName]?.includes(targetCol) &&
                  (!isDistinct || innerFunc === "COUNT" || isMySQL)
                ) {
                  parsedColumns.push({
                    value: isDistinct
                      ? `ROUND(${innerFunc}(DISTINCT ${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        })${decimals ? `, ${decimals}` : ""})`
                      : `ROUND(${innerFunc}(${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        })${decimals ? `, ${decimals}` : ""})`,
                    label: isDistinct
                      ? `ROUND(${innerFunc}(DISTINCT ${targetCol})${
                          decimals ? `, ${decimals}` : ""
                        })`
                      : `ROUND(${innerFunc}(${targetCol})${
                          decimals ? `, ${decimals}` : ""
                        })`,
                    aggregate: true,
                    column: targetCol,
                  });
                }
              } else if (funcMatch) {
                const func = funcMatch[1];
                const targetCol = stripQuotes(funcMatch[2]);
                const decimals = funcMatch[3] || null;
                const isDistinct = col.includes("DISTINCT");
                if (
                  tableColumns[tableName]?.includes(targetCol) &&
                  (!isDistinct || func === "COUNT" || isMySQL)
                ) {
                  parsedColumns.push({
                    value: isDistinct
                      ? `${func}(DISTINCT ${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        }${decimals ? `, ${decimals}` : ""})`
                      : `${func}(${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        }${decimals ? `, ${decimals}` : ""})`,
                    label: isDistinct
                      ? `${func}(DISTINCT ${targetCol}${
                          decimals ? `, ${decimals}` : ""
                        })`
                      : `${func}(${targetCol}${
                          decimals ? `, ${decimals}` : ""
                        })`,
                    aggregate: func !== "ROUND",
                    column: targetCol,
                  });
                }
              }
            } else {
              const cleanCol = stripQuotes(col);
              if (tableColumns[tableName]?.includes(cleanCol)) {
                parsedColumns.push({ value: cleanCol, label: cleanCol });
              }
            }
          }
          setSelectedColumns(
            parsedColumns.length > 0
              ? parsedColumns
              : [{ value: "*", label: "All Columns (*)" }]
          );
        }
      } else if (!normalizedQuery) {
        setSelectedColumns([]);
      }

      const groupByMatch = normalizedQuery.match(
        /\bGROUP\s+BY\s+(.+?)(?=\s*(HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      if (groupByMatch && tableName) {
        const groupByStr = groupByMatch[1].trim();
        const groupByColumns = groupByStr
          .split(",")
          .map((col) => stripQuotes(col.trim()))
          .filter((col) => tableColumns[tableName]?.includes(col))
          .map((col) => ({ value: col, label: col }));
        setSelectedGroupByColumns(groupByColumns);
      } else {
        setSelectedGroupByColumns([]);
      }

      const havingMatch = normalizedQuery.match(
        /\bHAVING\s+(.+?)(?=\s*(ORDER\s+BY|LIMIT|;|$))/i
      );
      if (havingMatch && tableName) {
        const havingClauseStr = havingMatch[1].trim();
        console.log("Parsing HAVING clause:", havingClauseStr);
        const condition: HavingClause["condition"] = {
          aggregateColumn: null,
          operator: null,
          value: null,
        };

        const aggMatch = havingClauseStr.match(
          /^(COUNT\(\*\)|(?:SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(.+?)(?:,\s*(\d+))?\)|ROUND\((AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(.+?)\)(?:,\s*(\d+))?\))/i
        );
        if (aggMatch) {
          const fullAgg = aggMatch[0]?.match(
            /^(COUNT\(\*\)|(?:SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(.+?)(?:,\s*(\d+))?\)|ROUND\((AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(.+?)\)(?:,\s*(\d+))?\))/i
          );

          let targetCol: string | null = null;
          if (fullAgg?.[1] === "COUNT(*)") {
            condition.aggregateColumn = {
              value: "COUNT(*)",
              label: "COUNT(*)",
              aggregate: true,
            };
          } else if (aggMatch[4]) {
            const innerFunc = aggMatch[4];
            targetCol = stripQuotes(aggMatch[5]);
            const decimals = aggMatch[6] || null;
            const isDistinct = havingClauseStr.includes("DISTINCT");
            if (
              tableColumns[tableName]?.includes(targetCol) &&
              (!isDistinct || innerFunc === "COUNT" || isMySQL)
            ) {
              condition.aggregateColumn = {
                value: isDistinct
                  ? `ROUND(${innerFunc}(DISTINCT ${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    })${decimals ? `, ${decimals}` : ""})`
                  : `ROUND(${innerFunc}(${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    })${decimals ? `, ${decimals}` : ""})`,
                label: isDistinct
                  ? `ROUND(${innerFunc}(DISTINCT ${targetCol})${
                      decimals ? `, ${decimals}` : ""
                    })`
                  : `ROUND(${innerFunc}(${targetCol})${
                      decimals ? `, ${decimals}` : ""
                    })`,
                aggregate: true,
                column: targetCol,
              };
            }
          } else {
            const func = aggMatch[1];
            targetCol = stripQuotes(aggMatch[2]);
            const decimals = aggMatch[3] || null;
            const isDistinct = havingClauseStr.includes("DISTINCT");
            if (
              tableColumns[tableName]?.includes(targetCol) &&
              (!isDistinct || func === "COUNT" || isMySQL)
            ) {
              condition.aggregateColumn = {
                value: isDistinct
                  ? `${func}(DISTINCT ${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    }${decimals ? `, ${decimals}` : ""})`
                  : `${func}(${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    }${decimals ? `, ${decimals}` : ""})`,
                label: isDistinct
                  ? `${func}(DISTINCT ${targetCol}${
                      decimals ? `, ${decimals}` : ""
                    })`
                  : `${func}(${targetCol}${decimals ? `, ${decimals}` : ""})`,
                aggregate: func !== "ROUND",
                column: targetCol,
              };
            }
          }

          const operatorMatch = havingClauseStr.match(
            /\b(=[!>=]?|<>|>|>=|<|<=)\s*(?:('[^']*'|[0-9]+(?:\.[0-9]+)?|[a-zA-Z_][a-zA-Z0-9_]*))?/i
          );
          if (operatorMatch) {
            const operator = operatorMatch[1].toUpperCase();
            condition.operator = { value: operator, label: operator };

            if (operatorMatch[2]) {
              const value = stripQuotes(operatorMatch[2]);
              condition.value = { value, label: value };
            }
          }

          if (condition.aggregateColumn) {
            console.log("Parsed HAVING clause condition:", condition);
            setHavingClause({ condition });
          } else {
            console.log("No valid HAVING clause condition found, resetting.");
            setHavingClause({
              condition: { aggregateColumn: null, operator: null, value: null },
            });
          }
        } else {
          console.log("No valid HAVING clause found, resetting.");
          setHavingClause({
            condition: { aggregateColumn: null, operator: null, value: null },
          });
        }
      } else {
        console.log("No HAVING clause found, resetting.");
        setHavingClause({
          condition: { aggregateColumn: null, operator: null, value: null },
        });
      }

      const whereMatch = normalizedQuery.match(
        /\bWHERE\s+(.+?)(?=\s*(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );

      if (whereMatch && tableName) {
        const whereClauseStr = whereMatch[1].trim();
        console.log("Parsing WHERE clause:", whereClauseStr);
        const conditions: WhereClause["conditions"] = [];
        const conditionParts = whereClauseStr
          .split(/\s*(AND|OR)\s*/i)
          .filter((part) => part.trim());

        let currentLogicalOperator: SelectOption | null = null;
        for (let i = 0; i < conditionParts.length; i++) {
          const part = conditionParts[i].trim();
          if (!part) continue;

          if (part.toUpperCase() === "AND" || part.toUpperCase() === "OR") {
            currentLogicalOperator = {
              value: part.toUpperCase(),
              label: part.toUpperCase(),
            };
            continue;
          }

          const conditionMatch = part.match(
            /^((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))\s*(=|[<>]=?|!=|LIKE|IS\s+NULL|IS\s+NOT\s+NULL|BETWEEN)?(?:\s*('.*?'|".*?"|\d+(?:\.\d+)?|[a-zA-Z_][a-zA-Z0-9_]*))?(?:\s+AND\s+('.*?'|".*?"|\d+(?:\.\d+)?|[a-zA-Z_][a-zA-Z0-9_]*))?/i
          );

          const condition: WhereClause["conditions"][0] = {
            column: null,
            operator: null,
            value: null,
            value2: null,
            logicalOperator: i === 0 ? null : currentLogicalOperator,
          };

          if (conditionMatch) {
            const column = stripQuotes(conditionMatch[1]);
            if (tableColumns[tableName]?.includes(column)) {
              condition.column = { value: column, label: column };
            }
            if (conditionMatch[2]) {
              condition.operator = {
                value: conditionMatch[2].toUpperCase(),
                label: conditionMatch[2].toUpperCase(),
              };
            }
            if (conditionMatch[3]) {
              condition.value = {
                value: stripQuotes(conditionMatch[3]),
                label: stripQuotes(conditionMatch[3]),
              };
            }
            if (condition.operator?.value === "BETWEEN" && conditionMatch[4]) {
              condition.value2 = {
                value: stripQuotes(conditionMatch[4]),
                label: stripQuotes(conditionMatch[4]),
              };
            }
          } else {
            const columnOnlyMatch = part.match(
              /^((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))\s*(=|[<>]=?|!=|LIKE|IS\s+NULL|IS\s+NOT\s+NULL|BETWEEN)?/i
            );
            if (columnOnlyMatch) {
              const column = stripQuotes(columnOnlyMatch[1]);
              if (tableColumns[tableName]?.includes(column)) {
                condition.column = { value: column, label: column };
                if (columnOnlyMatch[2]) {
                  condition.operator = {
                    value: columnOnlyMatch[2].toUpperCase(),
                    label: columnOnlyMatch[2].toUpperCase(),
                  };
                }
              }
            }
          }

          if (condition.column) {
            conditions.push(condition);
          }
        }

        if (conditions.length > 0) {
          console.log("Parsed WHERE conditions:", conditions);
          setWhereClause({ conditions });
        } else {
          console.log("Incomplete WHERE clause, preserving partial state.");
          setWhereClause({
            conditions: [
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
              },
            ],
          });
        }
      } else {
        console.log("No WHERE clause found, preserving existing state.");
      }

      const orderByMatch = normalizedQuery.match(
        /\bORDER\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+)\s*(ASC|DESC)?)(?=\s*(LIMIT|;|$))/i
      );
      if (orderByMatch && tableName) {
        const column = stripQuotes(orderByMatch[1]);
        if (tableColumns[tableName]?.includes(column)) {
          console.log("Parsed ORDER BY clause:", {
            column,
            direction: orderByMatch[2],
          });
          setOrderByClause({
            column: { value: column, label: column },
            direction: orderByMatch[2]
              ? {
                  value: orderByMatch[2],
                  label:
                    orderByMatch[2] === "ASC"
                      ? "Ascending (A-Z, low-high)"
                      : "Descending (Z-A, high-low)",
                }
              : null,
          });
        }
      } else {
        console.log("No ORDER BY clause found, resetting.");
        setOrderByClause({ column: null, direction: null });
      }

      const limitMatch = normalizedQuery.match(/\bLIMIT\s+(\d+)/i);
      if (limitMatch && /^\d+$/.test(limitMatch[1])) {
        const limitValue = limitMatch[1];
        console.log("Parsed LIMIT clause:", limitValue);
        setLimit({ value: limitValue, label: limitValue });
      } else {
        console.log("No LIMIT clause found, resetting.");
        setLimit(null);
      }
    },
    [selectedTable, tableNames, tableColumns, isMySQL]
  );

  const addToHistory = useCallback((query: string) => {
    const timestamp = new Date().toISOString();
    const id = uuidv4();
    setQueryHistory((prev) => {
      const lastQuery = prev[0];
      const isRecentDuplicate =
        lastQuery?.query === query &&
        new Date(timestamp).getTime() -
          new Date(lastQuery.timestamp).getTime() <
          1000;
      if (isRecentDuplicate) {
        return prev;
      }
      const newItem: QueryHistoryItem = { id, query, timestamp };
      return [newItem, ...prev].slice(0, 200);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setQueryHistory([]);
    setPinnedQueries([]);
    setBookmarkedQueries([]);
    setLabeledQueries([]);
    clearQueryData();
  }, []);

  const loadQueryFromHistory = useCallback((query: string) => {
    setQuery(query);
  }, []);

  const runQuery = useCallback(
    async (query: string) => {
      console.log("Running query:", query);
      if (!query.trim()) {
        setQueryError("Query cannot be empty");
        return;
      }
      setQueryError(null);
      setQueryResult(null);
      addToHistory(query);

      try {
        const { data, error } = await runQueryMutation({
          variables: { query },
        });
        console.log("Query result:", data);

        if (error) {
          setQueryError(error.message || "Failed to execute query");
        } else if (data?.runQuery.error) {
          setQueryError(data.runQuery.error || "Failed to execute query");
        } else if (
          data?.runQuery &&
          data.runQuery.fields &&
          data.runQuery.rows
        ) {
          setQueryResult(data.runQuery);
          setViewMode("table");
        } else {
          setQueryError("Invalid query result: missing fields or rows");
        }
      } catch (error) {
        console.error("Error running query:", error);
        setQueryError((error as Error).message || "Unknown error");
      }
    },
    [addToHistory, runQueryMutation]
  );

  const runQueryFromHistory = useCallback(
    (query: string) => {
      runQuery(query);
    },
    [runQuery]
  );

  const addPinnedQuery = useCallback((query: string) => {
    const timestamp = new Date().toISOString();
    const id = uuidv4();
    setPinnedQueries([{ id, query, timestamp }]);
  }, []);

  const removePinnedQuery = useCallback((query: string) => {
    setPinnedQueries((prev) => prev.filter((q) => q.query !== query));
  }, []);

  const addBookmarkedQuery = useCallback((query: string) => {
    const timestamp = new Date().toISOString();
    const id = uuidv4();
    setBookmarkedQueries((prev) => {
      const exists = prev.find((q) => q.query === query);
      if (!exists) {
        return [...prev, { id, query, timestamp }].slice(0, 50);
      }
      return prev;
    });
  }, []);
  const removeBookmarkedQuery = useCallback((id: string) => {
    setBookmarkedQueries((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const addLabeledQuery = useCallback((label: string, query: string) => {
    const timestamp = new Date().toISOString();
    setLabeledQueries((prev) => {
      const filteredQueries = prev.filter((q) => q.query !== query);
      return [...filteredQueries, { id: uuidv4(), label, query, timestamp }];
    });
  }, []);

  const editLabeledQuery = useCallback((query: string, newLabel: string) => {
    setLabeledQueries((prev) => {
      return prev.map((item) =>
        item.query === query
          ? {
              ...item,
              label: newLabel.trim(),
              timestamp: new Date().toISOString(),
            }
          : item
      );
    });
  }, []);

  const removeLabeledQuery = useCallback((query: string) => {
    setLabeledQueries((prev) => prev.filter((q) => q.query !== query));
  }, []);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col bg-[#0f172a] text-white h-screen">
      <div className="flex flex-1 w-full min-w-0 overflow-hidden flex-col lg:flex-row">
        <ToastContainer />
        {showHistory && (
          <div className="w-full lg:w-52 flex-shrink-0 h-[500px] lg:h-auto overflow-y-auto overflow-x-hidden bg-[#0f172a] border-r border-slate-700/50">
            <QueryHistory
              showHistory={showHistory}
              history={queryHistory}
              pinnedQueries={pinnedQueries}
              bookmarkedQueries={bookmarkedQueries}
              labeledQueries={labeledQueries}
              clearHistory={clearHistory}
              loadQueryFromHistory={loadQueryFromHistory}
              runQueryFromHistory={runQueryFromHistory}
              addPinnedQuery={addPinnedQuery}
              removePinnedQuery={removePinnedQuery}
              addBookmarkedQuery={addBookmarkedQuery}
              removeBookmarkedQuery={removeBookmarkedQuery}
              addLabeledQuery={addLabeledQuery}
              editLabeledQuery={editLabeledQuery}
              removeLabeledQuery={removeLabeledQuery}
            />
          </div>
        )}
        <div className="flex flex-1 flex-col lg:flex-row w-full min-w-0 overflow-hidden">
          <div className="flex-1 w-full p-4 overflow-y-auto space-y-4 sm:space-y-6 min-h-0">
            {error ? (
              <p className="text-red-300">{error}</p>
            ) : (
              <>
                <div className="flex flex-wrap justify-end gap-3 mt-10 lg:mt-6">
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={logQueryResultAsJson}
                        className="flex items-center px-4 py-2 rounded-full transition duration-200 border border-green-700 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-2 focus:ring-emerald-400"
                        aria-label="Log query result as JSON"
                      >
                        <Braces className="w-4 h-4 mr-2 text-white" /> Log JSON
                      </Button>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                        Log query as JSON
                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                      </div>
                    </div>
                    <div className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleHistory}
                        className="flex items-center px-4 py-2 rounded-full transition duration-200 border border-green-700 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-2 focus:ring-emerald-400"
                        aria-label={
                          showHistory
                            ? "Hide query history"
                            : "Show query history"
                        }
                      >
                        <LucideHistory className="w-4 h-4 mr-2 text-white" />
                        {showHistory ? "Hide History" : "Show History"}
                      </Button>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                        {navigator.platform.includes("Mac") ? "⌘+H" : "Ctrl+H"}
                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runQuery(query)}
                      className="flex items-center px-5 py-2 rounded-full transition duration-200 border border-green-700 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-2 focus:ring-emerald-400"
                      aria-label="Run query"
                    >
                      <LucidePlay className="w-4 h-4 mr-2 text-white" />
                      Run Query
                    </Button>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                      {navigator.platform.includes("Mac")
                        ? "⌘+Enter"
                        : "Ctrl+Enter"}
                      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                    </div>
                  </div>
                </div>
                <TableSelect
                  tableNames={tableNames}
                  selectedTable={selectedTable}
                  onTableSelect={handleTableSelect}
                  metadataLoading={false}
                />
                <ColumnSelect
                  selectedTable={selectedTable}
                  tableColumns={tableColumns}
                  selectedColumns={selectedColumns}
                  onColumnSelect={handleColumnSelect}
                  metadataLoading={false}
                  isDistinct={isDistinct}
                  onDistinctChange={handleDistinctChange}
                  isMySQL={isMySQL}
                />
                <WhereClauseSelect
                  selectedTable={selectedTable}
                  tableColumns={tableColumns}
                  whereClause={whereClause}
                  uniqueValues={uniqueValues}
                  onLogicalOperatorSelect={handleLogicalOperatorSelect}
                  onWhereColumnSelect={handleWhereColumnSelect}
                  onOperatorSelect={handleOperatorSelect}
                  onValueSelect={handleValueSelect}
                  metadataLoading={false}
                  operatorOptions={operatorOptions}
                  logicalOperatorOptions={logicalOperatorOptions}
                  joinClauses={[]}
                  onDeleteCondition={handleDeleteCondition}
                />
                <OrderByLimitSelect
                  selectedTable={selectedTable}
                  tableColumns={tableColumns}
                  orderByClause={orderByClause}
                  limit={limit}
                  onOrderByColumnSelect={handleOrderByColumnSelect}
                  onOrderByDirectionSelect={handleOrderByDirectionSelect}
                  onLimitSelect={handleLimitSelect}
                  metadataLoading={false}
                  joinClauses={[]}
                />
                <GroupBySelect
                  selectedTable={selectedTable}
                  tableColumns={tableColumns}
                  selectedGroupByColumns={selectedGroupByColumns}
                  onGroupByColumnSelect={handleGroupByColumnSelect}
                  metadataLoading={false}
                  joinClauses={[]}
                />
                <HavingSelect
                  selectedTable={selectedTable}
                  tableColumns={tableColumns}
                  havingClause={havingClause}
                  uniqueValues={uniqueValues}
                  onAggregateColumnSelect={handleAggregateColumnSelect}
                  onOperatorSelect={handleHavingOperatorSelect}
                  onValueSelect={handleHavingValueSelect}
                  metadataLoading={false}
                  operatorOptions={operatorOptions}
                  logicalOperatorOptions={logicalOperatorOptions}
                  joinClauses={[]}
                  isMySQL={isMySQL}
                />
                <CodeMirrorEditor
                  selectedColumns={selectedColumns}
                  uniqueValues={uniqueValues}
                  query={query}
                  tableNames={tableNames}
                  tableColumns={tableColumns}
                  onQueryChange={handleQueryChange}
                  onTableSelect={handleTableSelect}
                  onWhereColumnSelect={handleWhereColumnSelect}
                  onOperatorSelect={handleOperatorSelect}
                  onValueSelect={handleValueSelect}
                  onLogicalOperatorSelect={handleLogicalOperatorSelect}
                  onOrderBySelect={handleOrderBySelect}
                  onColumnSelect={handleColumnSelect}
                  onDistinctSelect={handleDistinctSelect}
                  onGroupByColumnSelect={handleGroupByColumnSelect}
                  onAggregateColumnSelect={handleAggregateColumnSelect}
                  onHavingOperatorSelect={handleHavingOperatorSelect}
                  onHavingValueSelect={handleHavingValueSelect}
                  runQuery={runQuery}
                />
              </>
            )}
          </div>
          <div className="flex-1 w-full p-4 overflow-y-auto space-y-4 sm:space-y-6 min-h-0">
            <ResultsPane
              error={queryError ?? ""}
              loading={false}
              result={queryResult || undefined}
              viewMode={viewMode}
              selectedTable={selectedTableName}
              table={table}
              tableDescription={tableDescription}
              chartData={statsChartData}
              resultChartData={resultChartData}
              onViewModeChange={handleViewModeChange}
              onExportToCsv={exportToCsv}
              onExportToJson={exportToJson}
              onExportToMarkdown={exportToMarkdown}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
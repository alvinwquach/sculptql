"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { SingleValue, MultiValue } from "react-select";
import HavingSelect from "./HavingSelect";
import { Button } from "@/components/ui/button";
import { LucideHistory, LucidePlay } from "lucide-react";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "@/app/utils/localStorageUtils";
import { useMutation } from "@apollo/client/react";
import { RUN_QUERY } from "@/app/graphql/mutations/runQuery";

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
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [runQueryMutation] = useMutation<
    { runQuery: QueryResult },
    { query: string }
  >(RUN_QUERY);

  useEffect(() => {
    setQueryHistory(getLocalStorageItem("queryHistory", []));
    setPinnedQueries(getLocalStorageItem("pinnedQueries", []));
    setBookmarkedQueries(getLocalStorageItem("bookmarkedQueries", []));
    setLabeledQueries(getLocalStorageItem("labeledQueries", []));
  }, []);

  useEffect(() => {
    setLocalStorageItem("queryHistory", queryHistory);
  }, [queryHistory]);

  useEffect(() => {
    setLocalStorageItem("pinnedQueries", pinnedQueries);
  }, [pinnedQueries]);

  useEffect(() => {
    setLocalStorageItem("bookmarkedQueries", bookmarkedQueries);
  }, [bookmarkedQueries]);

  useEffect(() => {
    setLocalStorageItem("labeledQueries", labeledQueries);
  }, [labeledQueries]);

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

      if (value) {
        const tableName = needsQuotes(value.value)
          ? `"${value.value}"`
          : value.value;

        const currentQuery = query.trim().replace(/;+$/, "");
        if (!currentQuery.match(/\bFROM\s+/i)) {
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
          setQuery(
            `SELECT${
              isDistinct ? " DISTINCT" : ""
            } ${columnsString} FROM ${tableName} `
          );
        } else {
          const newQuery = currentQuery.replace(
            /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_"]*)?(?=\s*(WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i,
            `FROM ${tableName} `
          );
          setQuery(newQuery);
        }

        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
        setOrderByClause({ column: null, direction: null });
        setLimit(null);
      } else {
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
        setQuery(`SELECT${isDistinct ? " DISTINCT" : ""} ${columnsString} `);
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
        setOrderByClause({ column: null, direction: null });
        setLimit(null);
      }
    },
    [query, selectedColumns, isDistinct]
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
        newConditions[conditionIndex] = {
          column: value,
          operator: null,
          value: null,
          value2: null,
        };
        return { conditions: newConditions };
      });

      updateQueryFromWhereClause({
        ...whereClause,
        conditions: [
          ...whereClause.conditions.slice(0, conditionIndex),
          {
            column: value,
            operator: null,
            value: null,
            value2: null,
          },
          ...whereClause.conditions.slice(conditionIndex + 1),
        ],
      });
    },
    [whereClause]
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
        return { conditions: newConditions };
      });

      updateQueryFromWhereClause({
        ...whereClause,
        conditions: [
          ...whereClause.conditions.slice(0, conditionIndex),
          {
            ...whereClause.conditions[conditionIndex],
            operator: value,
            value: null,
            value2: null,
          },
          ...whereClause.conditions.slice(conditionIndex + 1),
        ],
      });
    },
    [whereClause]
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
        return { conditions: newConditions };
      });

      updateQueryFromWhereClause({
        ...whereClause,
        conditions: [
          ...whereClause.conditions.slice(0, conditionIndex),
          {
            ...whereClause.conditions[conditionIndex],
            [isValue2 ? "value2" : "value"]: value,
          },
          ...whereClause.conditions.slice(conditionIndex + 1),
        ],
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

      const conditionsStrings = updatedWhereClause.conditions
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
        const col = needsQuotes(orderByClause.column.value)
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        const dir = orderByClause.direction?.value || "";
        newQuery += ` ORDER BY ${col}${dir ? ` ${dir}` : ""}`;
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
      selectedGroupByColumns,
      havingClause,
      orderByClause,
      limit,
      isDistinct,
    ]
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
        const conditionParts = whereClauseStr.split(/\b(AND|OR)\b/i);

        let currentLogicalOperator: SelectOption | null = null;
        for (let i = 0; i < conditionParts.length; i++) {
          const part = conditionParts[i].trim();
          if (part.toUpperCase() === "AND" || part.toUpperCase() === "OR") {
            currentLogicalOperator = {
              value: part.toUpperCase(),
              label: part.toUpperCase(),
            };
            continue;
          }
          if (part) {
            const columnMatch = part.match(
              /^((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))/i
            );
            if (columnMatch) {
              const column = stripQuotes(columnMatch[1]);
              if (tableColumns[tableName]?.includes(column)) {
                const condition: WhereClause["conditions"][0] = {
                  column: { value: column, label: column },
                  operator: null,
                  value: null,
                  value2: null,
                  logicalOperator: i === 0 ? null : currentLogicalOperator,
                };

                const operatorMatch = part.match(
                  /\b(=[!>=]?|<>|>|>=|<|<=|LIKE|IS\s+NULL|IS\s+NOT\s+NULL|BETWEEN)\b/i
                );
                if (operatorMatch) {
                  const operator = operatorMatch[1].toUpperCase();
                  condition.operator = { value: operator, label: operator };

                  if (operator !== "IS NULL" && operator !== "IS NOT NULL") {
                    const valueMatch = part.match(
                      /\b(?:[=!><]=?|LIKE|BETWEEN)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?|[a-zA-Z_][a-zA-Z0-9_]*)/i
                    );
                    if (valueMatch) {
                      const value = stripQuotes(valueMatch[1]);
                      condition.value = { value, label: value };

                      if (operator === "BETWEEN") {
                        const value2Match = part.match(
                          /\bAND\s*('[^']*'|[0-9]+(?:\.[0-9]+)?|[a-zA-Z_][a-zA-Z0-9_]*)/i
                        );
                        if (value2Match) {
                          const value2 = stripQuotes(value2Match[1]);
                          condition.value2 = { value: value2, label: value2 };
                        }
                      }
                    }
                  }
                  conditions.push(condition);
                }
              }
            }
          }
        }

        if (conditions.length > 0) {
          console.log("Parsed WHERE clause conditions:", conditions);
          setWhereClause({ conditions });
        } else {
          console.log("No valid WHERE clause conditions found, resetting.");
          setWhereClause({
            conditions: [
              { column: null, operator: null, value: null, value2: null },
            ],
          });
        }
      } else {
        console.log("No WHERE clause found, resetting.");
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
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
    const newItem: QueryHistoryItem = { query, timestamp };
    setQueryHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 200);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setQueryHistory([]);
    setPinnedQueries([]);
    setBookmarkedQueries([]);
    setLabeledQueries([]);
    removeLocalStorageItem("queryHistory");
    removeLocalStorageItem("pinnedQueries");
    removeLocalStorageItem("bookmarkedQueries");
    removeLocalStorageItem("labeledQueries");
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
        } else if (data?.runQuery) {
          setQueryResult(data.runQuery);
        } else {
          setQueryError("No data returned from query");
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
    setPinnedQueries([{ query, timestamp }]);
  }, []);

  const removePinnedQuery = useCallback((query: string) => {
    setPinnedQueries((prev) => prev.filter((q) => q.query !== query));
  }, []);

  const addBookmarkedQuery = useCallback((query: string) => {
    const timestamp = new Date().toISOString();
    setBookmarkedQueries((prev) => {
      const exists = prev.find((q) => q.query === query);
      if (!exists) {
        return [...prev, { query, timestamp }].slice(0, 50);
      }
      return prev;
    });
  }, []);

  const removeBookmarkedQuery = useCallback((query: string) => {
    setBookmarkedQueries((prev) => prev.filter((q) => q.query !== query));
  }, []);

  const addLabeledQuery = useCallback((label: string, query: string) => {
    const timestamp = new Date().toISOString();
    setLabeledQueries([{ label, query, timestamp }]);
  }, []);

  const removeLabeledQuery = useCallback((query: string) => {
    setLabeledQueries((prev) => prev.filter((q) => q.query !== query));
  }, []);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {showHistory && (
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
          removeLabeledQuery={removeLabeledQuery}
        />
      )}
      <Card className="flex-1 mx-auto bg-[#0f172a] border-slate-700/50 shadow-lg overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {error ? (
            <p className="text-red-300">{error}</p>
          ) : (
            <div className="space-y-4">
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
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHistory}
                  className={`px-2.5 py-1 rounded-lg transition-all duration-300 ease-in-out border-2 shadow-sm
      bg-gradient-to-r from-green-600 to-green-700 text-white border-[#1e293b] shadow-md
      hover:from-emerald-600 hover:to-emerald-700`}
                >
                  <LucideHistory className="w-4 h-4 mr-1 text-white" />
                  {showHistory ? "Hide History" : "Show History"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runQuery(query)}
                  className="px-2.5 py-1 rounded-lg transition-all duration-300 ease-in-out border-2 shadow-sm
      bg-gradient-to-r from-green-600 to-green-700 text-white border-[#1e293b] shadow-md
      hover:from-emerald-600 hover:to-emerald-700"
                >
                  <LucidePlay className="w-4 h-4 mr-1 text-white" />
                  Run Query
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
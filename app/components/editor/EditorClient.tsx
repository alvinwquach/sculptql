"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TableSelect from "./TableSelect";
import ColumnSelect from "./ColumnSelect";
import WhereClauseSelect from "./WhereClauseSelect";
import OrderByLimitSelect from "./OrderByLimitSelect";
import CodeMirrorEditor from "./CodeMirrorEditor";
import {
  TableSchema,
  SelectOption,
  WhereClause,
  OrderByClause,
} from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { SingleValue, MultiValue } from "react-select";

interface EditorClientProps {
  schema: TableSchema[];
  error: string | null;
}

export default function EditorClient({ schema, error }: EditorClientProps) {
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<SelectOption[]>([]);
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
    { value: "AND", label: "AND" },
    { value: "OR", label: "OR" },
  ];

  const logicalOperatorOptions: SelectOption[] = [
    { value: "AND", label: "AND" },
    { value: "OR", label: "OR" },
  ];

  const handleTableSelect = useCallback(
    (value: SelectOption | null) => {
      setSelectedTable(value);

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
                    needsQuotes(col.value) ? `"${col.value}"` : col.value
                  )
                  .join(", ");
          setQuery(
            `SELECT${
              isDistinct ? " DISTINCT" : ""
            } ${columnsString} FROM ${tableName} `
          );
        } else {
          const newQuery = currentQuery.replace(
            /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_"]*)?(?=\s*(WHERE|ORDER\s+BY|LIMIT|;|$))/i,
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
                  needsQuotes(col.value) ? `"${col.value}"` : col.value
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
          ? "" 
          : newCols.some((col) => col.value === "*")
          ? "*"
          : newCols
              .map((col) =>
                needsQuotes(col.value) ? `"${col.value}"` : col.value
              )
              .join(", ");

      let newQuery = query.replace(
        /^\s*SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i,
        `SELECT ${isDistinct ? "DISTINCT " : ""}${colsString}`
      );

      if (!/SELECT/i.test(newQuery)) {
        const tableName = selectedTable
          ? needsQuotes(selectedTable.value)
            ? `"${selectedTable.value}"`
            : selectedTable.value
          : "";
        newQuery = `SELECT ${isDistinct ? "DISTINCT " : ""}${colsString}${
          tableName ? ` FROM ${tableName}` : ""
        } `;
      }

      setQuery(newQuery.trim() + " ");
    },
    [query, selectedTable, isDistinct]
  );

  const handleDistinctSelect = useCallback((value: boolean) => {
    setIsDistinct(value);
    handleDistinctChange(value);
  }, []);

  const handleDistinctChange = useCallback(
    (value: boolean) => {
      setIsDistinct(value);

      const colsString =
        selectedColumns.length === 0
          ? ""
          : selectedColumns.some((col) => col.value === "*")
          ? "*"
          : selectedColumns
              .map((col) =>
                needsQuotes(col.value) ? `"${col.value}"` : col.value
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
        } `;
      }

      setQuery(newQuery.trim() + " ");
    },
    [query, selectedColumns, selectedTable]
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
                needsQuotes(col.value) ? `"${col.value}"` : col.value
              )
              .join(", ");

      let newQuery = query.replace(
        /^\s*SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i,
        `SELECT ${isDistinct ? "DISTINCT " : ""}${columnsString}`
      );

      if (!newQuery.match(/\bSELECT\b/i)) {
        newQuery = `SELECT ${isDistinct ? "DISTINCT " : ""}${columnsString} `;
      }

      if (!newQuery.match(/\bFROM\b/i)) {
        newQuery += `FROM ${tableName} `;
      }

      let whereClauseString = "";
      let isCompleteWhereClause = true;

      updatedWhereClause.conditions.forEach((condition, index) => {
        if (condition.column) {
          const columnName = needsQuotes(condition.column.value)
            ? `"${condition.column.value}"`
            : condition.column.value;

          const logicalPrefix =
            index > 0 && updatedWhereClause.conditions[0].logicalOperator
              ? `${updatedWhereClause.conditions[0].logicalOperator.value} `
              : "";

          if (condition.operator) {
            if (
              condition.operator.value === "IS NULL" ||
              condition.operator.value === "IS NOT NULL"
            ) {
              whereClauseString += `${logicalPrefix}${columnName} ${condition.operator.value}`;
            } else if (
              condition.operator.value === "BETWEEN" &&
              condition.value &&
              condition.value2
            ) {
              const value1 = needsQuotes(condition.value.value)
                ? `'${stripQuotes(condition.value.value)}'`
                : condition.value.value;
              const value2 = needsQuotes(condition.value2.value)
                ? `'${stripQuotes(condition.value2.value)}'`
                : condition.value2.value;
              whereClauseString += `${logicalPrefix}${columnName} BETWEEN ${value1} AND ${value2}`;
            } else if (condition.value) {
              const value = needsQuotes(condition.value.value)
                ? `'${stripQuotes(condition.value.value)}'`
                : condition.value.value;
              whereClauseString += `${logicalPrefix}${columnName} ${condition.operator.value} ${value}`;
            } else {
              whereClauseString += `${logicalPrefix}${columnName} ${condition.operator.value}`;
              isCompleteWhereClause = false;
            }
          } else {
            whereClauseString += `${logicalPrefix}${columnName}`;
            isCompleteWhereClause = false;
          }
        }
      });

      if (whereClauseString) {
        newQuery = newQuery.replace(
          /\bWHERE\s+.*?(?=\b(ORDER\s+BY|LIMIT|;|$))/i,
          ""
        );
        newQuery += ` WHERE ${whereClauseString}`;
      }

      if (orderByClause.column) {
        const columnName = needsQuotes(orderByClause.column.value)
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        const direction = orderByClause.direction?.value || "";
        newQuery += ` ORDER BY ${columnName} ${direction}`.trim();
      }

      if (limit) {
        newQuery += ` LIMIT ${limit.value}`;
      }

      setQuery(
        whereClauseString && isCompleteWhereClause
          ? `${newQuery};`
          : `${newQuery} `
      );
    },
    [selectedTable, selectedColumns, orderByClause, limit, query, isDistinct]
  );

  const updateQueryWithOrderByAndLimit = useCallback(
    (updatedOrderBy: OrderByClause, updatedLimit: SelectOption | null) => {
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
                needsQuotes(col.value) ? `"${col.value}"` : col.value
              )
              .join(", ");

      let newQuery = query.replace(
        /^\s*SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i,
        `SELECT ${isDistinct ? "DISTINCT " : ""}${columnsString}`
      );

      if (!newQuery.match(/\bSELECT\b/i)) {
        newQuery = `SELECT ${isDistinct ? "DISTINCT " : ""}${columnsString} `;
      }

      if (!newQuery.match(/\bFROM\b/i)) {
        newQuery += `FROM ${tableName} `;
      }

      const whereMatch = query.match(
        /\bWHERE\s+.*?(?=\b(ORDER\s+BY|LIMIT|;|$))/i
      );
      if (whereMatch) {
        newQuery = newQuery.replace(
          /\bWHERE\s+.*?(?=\b(ORDER\s+BY|LIMIT|;|$))/i,
          ""
        );
        newQuery += ` ${whereMatch[0]}`;
      }

      newQuery = newQuery.replace(/\bORDER\s+BY\s+.*?(?=\b(LIMIT|;|$))/i, "");

      if (updatedOrderBy.column) {
        const columnName = needsQuotes(updatedOrderBy.column.value)
          ? `"${updatedOrderBy.column.value}"`
          : updatedOrderBy.column.value;
        const direction = updatedOrderBy.direction?.value || "";
        newQuery += ` ORDER BY ${columnName} ${direction}`.trim();
      }

      newQuery = newQuery.replace(/\bLIMIT\s+\d+\s*?(?=;|$)/i, "");
      if (updatedLimit) {
        newQuery += ` LIMIT ${updatedLimit.value}`;
      }

      setQuery(`${newQuery.trim()};`);
    },
    [selectedTable, selectedColumns, query, isDistinct]
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      let normalizedQuery = newQuery.replace(/;+$/, "").trim();
      normalizedQuery = normalizedQuery.replace(
        /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_"]*)\s*(ORDER\s+BY|LIMIT|;|$)/i,
        (match, tableName, suffix) => {
          return `FROM ${tableName} ${suffix}`;
        }
      );
      if (
        normalizedQuery.match(/\b(LIMIT\s+\d+|ORDER\s+BY\s+.*)$/i) &&
        normalizedQuery
      ) {
        normalizedQuery = `${normalizedQuery};`;
      } else {
        normalizedQuery = normalizedQuery ? `${normalizedQuery} ` : "";
      }
      setQuery(normalizedQuery);

      const isDistinctQuery = normalizedQuery.match(/\bSELECT\s+DISTINCT\b/i);
      setIsDistinct(!!isDistinctQuery);

      const tableMatch = normalizedQuery.match(
        /FROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i
      );
      const tableName = tableMatch ? stripQuotes(tableMatch[1]) : null;
      if (tableName && tableNames.includes(tableName)) {
        if (!selectedTable || selectedTable.value !== tableName) {
          setSelectedTable({ value: tableName, label: tableName });
        }
      } else if (!normalizedQuery) {
        setSelectedTable(null);
        setSelectedColumns([]);
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
        setOrderByClause({ column: null, direction: null });
        setLimit(null);
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
          // Improved column parsing to handle multiple columns with quotes
          const columnRegex = /(?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*)/g;
          const parsedColumns = [];
          let match;
          while ((match = columnRegex.exec(columnsStr)) !== null) {
            const col = stripQuotes(match[0]);
            if (
              col &&
              (col === "*" ||
                (tableName && tableColumns[tableName]?.includes(col)))
            ) {
              parsedColumns.push({ value: col, label: col });
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

      const whereMatch = normalizedQuery.match(
        /\bWHERE\s+(.+?)(?=\b(ORDER\s+BY|LIMIT|;|$))/i
      );
      if (whereMatch && tableName) {
        const whereClauseStr = whereMatch[1].trim();
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
            const columnMatch = part.match(/^((?:"[\w]+"|'[\w]+'|[\w_]+))/i);
            if (columnMatch) {
              const column = stripQuotes(columnMatch[1]);
              if (tableColumns[tableName]?.includes(column)) {
                const condition: WhereClause["conditions"][0] = {
                  column: { value: column, label: column },
                  operator: null,
                  value: null,
                  value2: null,
                  logicalOperator: i === 0 ? currentLogicalOperator : null,
                };

                const operatorMatch = part.match(
                  /\b(=[!>=]?|<>|>|>=|<|<=|LIKE|IS\s+NULL|IS\s+NOT\s+NULL|BETWEEN)\b/i
                );
                if (operatorMatch) {
                  const operator = operatorMatch[1].toUpperCase();
                  condition.operator = { value: operator, label: operator };

                  if (operator !== "IS NULL" && operator !== "IS NOT NULL") {
                    const valueMatch = part.match(
                      /\b(?:[=!><]=?|LIKE|BETWEEN)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)/i
                    );
                    if (valueMatch) {
                      const value = stripQuotes(valueMatch[1]);
                      condition.value = { value, label: value };

                      if (operator === "BETWEEN") {
                        const value2Match = part.match(
                          /\bAND\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)/i
                        );
                        if (value2Match) {
                          const value2 = stripQuotes(value2Match[1]);
                          condition.value2 = { value: value2, label: value2 };
                        }
                      }
                    }
                  }
                }
                conditions.push(condition);
              }
            }
          }
        }

        if (conditions.length > 0) {
          setWhereClause({ conditions });
        } else {
          const columnMatch = whereClauseStr.match(
            /^((?:"[\w]+"|'[\w]+'|[\w_]+))/i
          );
          if (columnMatch && tableName) {
            const column = stripQuotes(columnMatch[1]);
            if (tableColumns[tableName]?.includes(column)) {
              setWhereClause({
                conditions: [
                  {
                    column: { value: column, label: column },
                    operator: null,
                    value: null,
                    value2: null,
                    logicalOperator: null,
                  },
                ],
              });
            } else {
              setWhereClause({
                conditions: [
                  { column: null, operator: null, value: null, value2: null },
                ],
              });
            }
          } else {
            setWhereClause({
              conditions: [
                { column: null, operator: null, value: null, value2: null },
              ],
            });
          }
        }
      } else {
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
      }

      const orderByMatch = normalizedQuery.match(
        /\bORDER\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+)\s*(ASC|DESC)?)(?=\b(LIMIT|;|$))/i
      );
      if (orderByMatch && tableName) {
        const column = stripQuotes(orderByMatch[1]);
        if (tableColumns[tableName]?.includes(column)) {
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
        setOrderByClause({ column: null, direction: null });
      }

      const limitMatch = normalizedQuery.match(/\bLIMIT\s+(\d+)/i);
      if (limitMatch && /^\d+$/.test(limitMatch[1])) {
        const limitValue = limitMatch[1];
        setLimit({ value: limitValue, label: limitValue });
      } else {
        setLimit(null);
      }
    },
    [selectedTable, tableNames, tableColumns]
  );

  return (
    <Card className="mx-auto max-w-7xl bg-[#0f172a] border-slate-700/50 shadow-lg">
      <CardContent>
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
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
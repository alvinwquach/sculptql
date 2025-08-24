"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TableSelector from "./TableSelector";
import WhereClauseSelector from "./WhereClauseSelector";
import CodeMirrorEditor from "./CodeMirrorEditor";
import { TableSchema, SelectOption, WhereClause } from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { SingleValue } from "react-select";

interface EditorClientProps {
  schema: TableSchema[];
  error: string | null;
}

export default function EditorClient({ schema, error }: EditorClientProps) {
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(null);
  const [whereClause, setWhereClause] = useState<WhereClause>({
    conditions: [{ column: null, operator: null, value: null, value2: null }],
  });
  const [query, setQuery] = useState<string>("");

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

  const handleTableSelect = useCallback((value: SelectOption | null) => {
    setSelectedTable(value);
    setWhereClause({
      conditions: [{ column: null, operator: null, value: null, value2: null }],
    });
    if (value) {
      const tableName = needsQuotes(value.value)
        ? `"${value.value}"`
        : value.value;
      setQuery(`SELECT * FROM ${tableName};`);
    } else {
      setQuery("");
    }
  }, []);

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

      let newQuery = query.trim().endsWith(";") ? query.slice(0, -1) : query;
      const whereMatch = newQuery.match(/\bWHERE\s+.*$/i);
      const tableName = needsQuotes(selectedTable.value)
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      let whereClauseString = "";
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
              whereClauseString += `${logicalPrefix}${columnName} BETWEEN '${condition.value.value}' AND '${condition.value2.value}'`;
            } else if (condition.value) {
              whereClauseString += `${logicalPrefix}${columnName} ${condition.operator.value} '${condition.value.value}'`;
            } else {
              whereClauseString += `${logicalPrefix}${columnName} ${condition.operator.value}`;
            }
          }
        }
      });

      if (whereClauseString) {
        newQuery = whereMatch
          ? newQuery.replace(/\bWHERE\s+.*$/i, `WHERE ${whereClauseString}`)
          : `${newQuery} WHERE ${whereClauseString}`;
      } else if (whereMatch) {
        newQuery = newQuery.replace(/\bWHERE\s+.*$/i, "");
      }

      if (!newQuery.includes("SELECT")) {
        newQuery = `SELECT * FROM ${tableName} ${
          whereClauseString ? `WHERE ${whereClauseString}` : ""
        }`;
      }

      setQuery(`${newQuery};`);
    },
    [query, selectedTable]
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      const tableMatch = newQuery.match(/FROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i);
      if (tableMatch && tableMatch[1]) {
        const tableName = stripQuotes(tableMatch[1]);
        if (
          tableNames.includes(tableName) &&
          (!selectedTable || selectedTable.value !== tableName)
        ) {
          setSelectedTable({ value: tableName, label: tableName });
          setWhereClause({
            conditions: [
              { column: null, operator: null, value: null, value2: null },
            ],
          });
        }
      } else if (!tableMatch && selectedTable) {
        setSelectedTable(null);
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
      }

      if (!newQuery.match(/\bWHERE\b/i)) {
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
      }
    },
    [selectedTable, tableNames]
  );

  return (
    <Card className="mx-auto max-w-7xl bg-[#0f172a] border-slate-700/50 shadow-lg">
      <CardContent>
        {error ? (
          <p className="text-red-300">{error}</p>
        ) : (
          <div className="space-y-4">
            <TableSelector
              tableNames={tableNames}
              selectedTable={selectedTable}
              onTableSelect={handleTableSelect}
              metadataLoading={false}
            />
            <WhereClauseSelector
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
            <CodeMirrorEditor
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
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

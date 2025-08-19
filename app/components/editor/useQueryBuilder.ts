"use client";

import { useState, useCallback, useMemo, useEffect, RefObject } from "react";
import { MultiValue, SingleValue } from "react-select";
import { EditorView } from "@codemirror/view";
import {
  SelectOption,
  WhereClause,
  OrderByClause,
  TableColumn,
  JoinClause,
} from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { containsRestrictedKeywords } from "../../utils/restrictedKeywords";

interface QueryState {
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  selectedAggregate: SelectOption | null;
  aggregateColumn: SelectOption | null;
  decimalPlaces: SelectOption | null;
  whereClause: WhereClause;
  orderByClause: OrderByClause;
  groupByColumns: SelectOption[];
  limit: SelectOption | null;
  uniqueValues: Record<string, SelectOption[]>;
  fetchError: string | null;
  queryError: string | null;
  joinClauses: JoinClause[];
}

export const useQueryBuilder = (
  tableNames: string[],
  tableColumns: TableColumn,
  onQueryChange: (query: string) => void,
  editorRef: RefObject<EditorView | null>
) => {
  const [queryState, setQueryState] = useState<QueryState>({
    selectedTable: null,
    selectedColumns: [],
    selectedAggregate: null,
    aggregateColumn: null,
    decimalPlaces: null,
    whereClause: {
      conditions: [
        {
          column: null,
          operator: null,
          value: null,
          value2: null,
          logicalOperator: { value: "AND", label: "AND" },
        },
        {
          column: null,
          operator: null,
          value: null,
          value2: null,
          logicalOperator: null,
        },
      ],
    },
    orderByClause: { column: null, direction: null },
    groupByColumns: [],
    limit: null,
    uniqueValues: { condition1: [], condition2: [] },
    fetchError: null,
    queryError: null,
    joinClauses: [],
  });

  const operatorOptions: SelectOption[] = useMemo(
    () => [
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
    ],
    []
  );

  const logicalOperatorOptions = useMemo(
    () => [
      { value: "AND", label: "AND" },
      { value: "OR", label: "OR" },
    ],
    []
  );

  const buildQuery = useCallback(() => {
    const {
      selectedTable,
      selectedColumns,
      selectedAggregate,
      aggregateColumn,
      decimalPlaces,
      whereClause,
      orderByClause,
      groupByColumns,
      limit,
      joinClauses,
    } = queryState;

    let columns: string;
    if (selectedAggregate?.value) {
      if (selectedAggregate.value === "COUNT(*)") {
        columns = selectedAggregate.value;
      } else if (
        ["SUM", "MAX", "MIN", "AVG"].includes(selectedAggregate.value) &&
        aggregateColumn?.value
      ) {
        columns = `${selectedAggregate.value}(${
          needsQuotes(aggregateColumn.value)
            ? `"${aggregateColumn.value}"`
            : aggregateColumn.value
        })`;
      } else if (
        selectedAggregate.value === "ROUND" &&
        aggregateColumn?.value &&
        decimalPlaces?.value &&
        !isNaN(Number(decimalPlaces.value))
      ) {
        columns = `ROUND(${
          needsQuotes(aggregateColumn.value)
            ? `"${aggregateColumn.value}"`
            : aggregateColumn.value
        }, ${decimalPlaces.value})`;
      } else {
        columns = "*";
      }
      if (selectedColumns.length > 0 && selectedColumns[0].value !== "*") {
        columns +=
          ", " +
          selectedColumns
            .map((col) =>
              col.value.includes(".")
                ? col.value
                : needsQuotes(col.value)
                ? `"${col.value}"`
                : col.value
            )
            .join(", ");
      }
    } else {
      columns = selectedColumns.length
        ? selectedColumns
            .map((col) =>
              col.value.includes(".")
                ? col.value
                : needsQuotes(col.value)
                ? `"${col.value}"`
                : col.value
            )
            .join(", ")
        : "*";
    }

    let query = selectedTable?.value
      ? `SELECT ${columns} FROM ${
          needsQuotes(selectedTable.value)
            ? `"${selectedTable.value}"`
            : selectedTable.value
        } `
      : "";

    // Add JOIN clauses
    if (joinClauses.length > 0) {
      query += joinClauses
        .filter(
          (join) =>
            join.table?.value && join.onColumn1?.value && join.onColumn2?.value
        )
        .map((join) => {
          const table = needsQuotes(join.table!.value)
            ? `"${join.table!.value}"`
            : join.table!.value;
          const onColumn1 = needsQuotes(join.onColumn1!.value)
            ? `"${join.onColumn1!.value}"`
            : join.onColumn1!.value;
          const onColumn2 = needsQuotes(join.onColumn2!.value)
            ? `"${join.onColumn2!.value}"`
            : join.onColumn2!.value;
          const joinType = join.joinType?.value || "INNER JOIN";
          return `${joinType} ${table} ON ${
            selectedTable?.value
          }.${onColumn1} = ${join.table!.value}.${onColumn2}`;
        })
        .join(" ");
    }

    const validConditions = whereClause.conditions.filter(
      (c) =>
        c.column?.value &&
        c.operator?.value &&
        (c.operator.value === "IS NULL" ||
          c.operator.value === "IS NOT NULL" ||
          (c.value?.value && c.value.value.trim() !== ""))
    );

    if (validConditions.length > 0) {
      query += " WHERE ";
      query += validConditions
        .map((condition) => {
          const column = condition.column!.value.includes(".")
            ? condition.column!.value
            : needsQuotes(condition.column!.value)
            ? `"${condition.column!.value}"`
            : condition.column!.value;
          let conditionStr = `${column} ${condition.operator!.value}`;
          if (
            condition.operator!.value === "BETWEEN" &&
            condition.value?.value &&
            condition.value2?.value &&
            condition.value.value.trim() !== "" &&
            condition.value2.value.trim() !== ""
          ) {
            conditionStr += ` '${condition.value.value}' AND '${condition.value2.value}'`;
          } else if (
            condition.value?.value &&
            condition.operator!.value !== "IS NULL" &&
            condition.operator!.value !== "IS NOT NULL" &&
            condition.operator!.value !== "BETWEEN"
          ) {
            conditionStr += ` '${condition.value.value}'`;
          }
          return conditionStr;
        })
        .join(` ${whereClause.conditions[0].logicalOperator?.value || "AND"} `);
    }

    if (groupByColumns.length > 0) {
      const selectColumnNames = selectedColumns
        .filter((col) => col.value !== "*")
        .map((col) => col.value);
      const aggregateColumnName = selectedAggregate?.value
        ? selectedAggregate.value === "COUNT(*)"
          ? selectedAggregate.value
          : `${selectedAggregate.value}(${aggregateColumn?.value || ""}${
              selectedAggregate.value === "ROUND" && decimalPlaces?.value
                ? `, ${decimalPlaces.value}`
                : ""
            })`
        : null;
      const allSelectColumns = aggregateColumnName
        ? [aggregateColumnName, ...selectColumnNames]
        : selectColumnNames;
      const groupByClause = groupByColumns
        .map((col) => {
          const selectIndex =
            allSelectColumns.findIndex(
              (selCol) =>
                selCol === col.value ||
                selCol.includes(`(${col.value})`) ||
                selCol.includes(`(${col.value},`)
            ) + 1;
          return selectIndex > 0
            ? selectIndex.toString()
            : col.value.includes(".")
            ? col.value
            : needsQuotes(col.value)
            ? `"${col.value}"`
            : col.value;
        })
        .join(", ");
      query += ` GROUP BY ${groupByClause}`;
    }

    if (orderByClause.column?.value && orderByClause.direction?.value) {
      const column = orderByClause.column.value.includes(".")
        ? orderByClause.column.value
        : needsQuotes(orderByClause.column.value)
        ? `"${orderByClause.column.value}"`
        : orderByClause.column.value;
      query += ` ORDER BY ${column} ${orderByClause.direction.value}`;
    }

    if (
      limit?.value &&
      limit.value.trim() !== "" &&
      !isNaN(Number(limit.value)) &&
      Number(limit.value) > 0
    ) {
      query += ` LIMIT ${limit.value}`;
    }

    return query;
  }, [queryState]);

  const updateEditor = useCallback(
    (query: string) => {
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
        setTimeout(() => onQueryChange(query), 0);
      }
    },
    [editorRef, onQueryChange]
  );

  const handleTableSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => ({
        ...prev,
        selectedTable: newValue,
        selectedColumns: [],
        selectedAggregate: null,
        aggregateColumn: null,
        decimalPlaces: null,
        whereClause: {
          conditions: [
            {
              column: null,
              operator: null,
              value: null,
              value2: null,
              logicalOperator: { value: "AND", label: "AND" },
            },
            {
              column: null,
              operator: null,
              value: null,
              value2: null,
              logicalOperator: null,
            },
          ],
        },
        orderByClause: { column: null, direction: null },
        groupByColumns: [],
        limit: null,
        uniqueValues: { condition1: [], condition2: [] },
        fetchError: null,
        joinClauses: [],
      }));
      const query = newValue?.value
        ? `SELECT * FROM ${
            needsQuotes(newValue.value) ? `"${newValue.value}"` : newValue.value
          } `
        : "";
      updateEditor(query);
    },
    [updateEditor]
  );

  const handleColumnSelect = useCallback(
    (newValue: MultiValue<SelectOption>) => {
      if (!queryState.selectedTable?.value) {
        setQueryState((prev) => ({
          ...prev,
          selectedColumns: [],
          selectedAggregate: null,
          aggregateColumn: null,
          decimalPlaces: null,
          whereClause: {
            conditions: [
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
                logicalOperator: { value: "AND", label: "AND" },
              },
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
                logicalOperator: null,
              },
            ],
          },
          orderByClause: { column: null, direction: null },
          groupByColumns: [],
          limit: null,
          uniqueValues: { condition1: [], condition2: [] },
          fetchError: null,
          joinClauses: [],
        }));
        updateEditor("");
        return;
      }

      const includesStar = newValue.some((option) => option.value === "*");
      const columnsToSelect = includesStar
        ? [
            ...(tableColumns[queryState.selectedTable.value]?.map((col) => ({
              value: `${queryState.selectedTable!.value}.${col}`,
              label: `${queryState.selectedTable!.value}.${col}`,
            })) || []),
            ...queryState.joinClauses
              .filter((join) => join.table?.value)
              .flatMap(
                (join) =>
                  tableColumns[join.table!.value]?.map((col) => ({
                    value: `${join.table!.value}.${col}`,
                    label: `${join.table!.value}.${col}`,
                  })) || []
              ),
          ]
        : (newValue as SelectOption[]);

      setQueryState((prev) => ({ ...prev, selectedColumns: columnsToSelect }));
      const query = buildQuery();
      updateEditor(query);
    },
    [
      queryState.selectedTable,
      queryState.joinClauses,
      tableColumns,
      buildQuery,
      updateEditor,
    ]
  );

  const handleAggregateSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => ({
        ...prev,
        selectedAggregate: newValue,
        aggregateColumn: null,
        decimalPlaces: null,
      }));
      const query = buildQuery();
      updateEditor(query);
    },
    [buildQuery, updateEditor]
  );

  const handleAggregateColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => ({ ...prev, aggregateColumn: newValue }));
      const query = buildQuery();
      updateEditor(query);
    },
    [buildQuery, updateEditor]
  );

  const handleDecimalPlacesSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => ({
        ...prev,
        decimalPlaces:
          newValue &&
          !isNaN(Number(newValue.value)) &&
          Number(newValue.value) >= 0
            ? newValue
            : null,
      }));
      const query = buildQuery();
      updateEditor(query);
    },
    [buildQuery, updateEditor]
  );

  const handleGroupByColumnsSelect = useCallback(
    (newValue: MultiValue<SelectOption>) => {
      setQueryState((prev) => ({
        ...prev,
        groupByColumns: newValue as SelectOption[],
      }));
      const query = buildQuery();
      updateEditor(query);
    },
    [buildQuery, updateEditor]
  );

  const handleLogicalOperatorSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newConditions = [...prev.whereClause.conditions];
        newConditions[0] = { ...newConditions[0], logicalOperator: newValue };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, whereClause: { conditions: newConditions } };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleWhereColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setQueryState((prev) => {
        const newConditions = [...prev.whereClause.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          column: newValue,
          operator: null,
          value: null,
          value2: null,
        };
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          whereClause: { conditions: newConditions },
          uniqueValues: {
            ...prev.uniqueValues,
            [`condition${conditionIndex + 1}`]: [],
          },
          fetchError: null,
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleOperatorSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setQueryState((prev) => {
        const newConditions = [...prev.whereClause.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          operator: newValue,
          value: null,
          value2: null,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, whereClause: { conditions: newConditions } };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleValueSelect = useCallback(
    (
      newValue: SingleValue<SelectOption>,
      conditionIndex: number,
      isValue2: boolean
    ) => {
      setQueryState((prev) => {
        const newConditions = [...prev.whereClause.conditions];
        if (
          !newConditions[conditionIndex].operator?.value ||
          !newConditions[conditionIndex].column?.value ||
          (newValue && newValue.value.trim() === "")
        ) {
          newConditions[conditionIndex] = {
            ...newConditions[conditionIndex],
            value: isValue2 ? newConditions[conditionIndex].value : null,
            value2: isValue2 ? null : newConditions[conditionIndex].value2,
          };
        } else if (isValue2) {
          if (newConditions[conditionIndex].operator?.value !== "BETWEEN") {
            return prev;
          }
          newConditions[conditionIndex] = {
            ...newConditions[conditionIndex],
            value2: newValue,
          };
        } else {
          newConditions[conditionIndex] = {
            ...newConditions[conditionIndex],
            value: newValue,
            value2:
              newConditions[conditionIndex].operator?.value !== "BETWEEN"
                ? null
                : newConditions[conditionIndex].value2,
          };
        }
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, whereClause: { conditions: newConditions } };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleOrderByColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newClause = {
          ...prev.orderByClause,
          column: newValue,
          direction: prev.orderByClause.direction || {
            value: "ASC",
            label: "Ascending (A-Z, low-high)",
          },
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, orderByClause: newClause };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleOrderByDirectionSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newClause = { ...prev.orderByClause, direction: newValue };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, orderByClause: newClause };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleLimitSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => ({
        ...prev,
        limit:
          newValue &&
          !isNaN(Number(newValue.value)) &&
          Number(newValue.value) > 0
            ? newValue
            : null,
      }));
      const query = buildQuery();
      updateEditor(query);
    },
    [buildQuery, updateEditor]
  );

  const handleJoinTypeSelect = useCallback(
    (newValue: SingleValue<SelectOption>, joinIndex: number) => {
      setQueryState((prev) => {
        const newJoinClauses = [...prev.joinClauses];
        newJoinClauses[joinIndex] = {
          ...newJoinClauses[joinIndex],
          joinType: newValue,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, joinClauses: newJoinClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleJoinTableSelect = useCallback(
    (newValue: SingleValue<SelectOption>, joinIndex: number) => {
      setQueryState((prev) => {
        const newJoinClauses = [...prev.joinClauses];
        newJoinClauses[joinIndex] = {
          ...newJoinClauses[joinIndex],
          table: newValue,
          onColumn1: null,
          onColumn2: null,
          joinType: { value: "INNER JOIN", label: "INNER JOIN" }, // Default to INNER JOIN
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, joinClauses: newJoinClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleJoinOnColumn1Select = useCallback(
    (newValue: SingleValue<SelectOption>, joinIndex: number) => {
      setQueryState((prev) => {
        const newJoinClauses = [...prev.joinClauses];
        newJoinClauses[joinIndex] = {
          ...newJoinClauses[joinIndex],
          onColumn1: newValue,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, joinClauses: newJoinClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleJoinOnColumn2Select = useCallback(
    (newValue: SingleValue<SelectOption>, joinIndex: number) => {
      setQueryState((prev) => {
        const newJoinClauses = [...prev.joinClauses];
        newJoinClauses[joinIndex] = {
          ...newJoinClauses[joinIndex],
          onColumn2: newValue,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, joinClauses: newJoinClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const addJoinClause = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      joinClauses: [
        ...prev.joinClauses,
        {
          table: null,
          onColumn1: null,
          onColumn2: null,
          joinType: { value: "INNER JOIN", label: "INNER JOIN" },
        },
      ],
    }));
  }, []);

  const removeJoinClause = useCallback(
    (joinIndex: number) => {
      setQueryState((prev) => {
        const newJoinClauses = prev.joinClauses.filter(
          (_, index) => index !== joinIndex
        );
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, joinClauses: newJoinClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  useEffect(() => {
    if (!queryState.selectedTable?.value) {
      setQueryState((prev) => ({
        ...prev,
        uniqueValues: { condition1: [], condition2: [] },
        fetchError: null,
        joinClauses: [],
      }));
      return;
    }

    const fetchUniqueValues = async (conditionIndex: number) => {
      const condition = queryState.whereClause.conditions[conditionIndex];
      if (!condition.column?.value) {
        setQueryState((prev) => ({
          ...prev,
          uniqueValues: {
            ...prev.uniqueValues,
            [`condition${conditionIndex + 1}`]: [],
          },
        }));
        return;
      }

      const [tableName, columnName] = condition.column.value.split(".");
      const targetTable = tableName || queryState.selectedTable?.value;

      try {
        if (!targetTable) {
          throw new Error("No table selected");
        }

        const res = await fetch(
          `/api/unique-values?table=${encodeURIComponent(
            targetTable
          )}&column=${encodeURIComponent(columnName || condition.column.value)}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json"))
          throw new Error("Response is not JSON");
        const data = await res.json();
        if (!data.values || !Array.isArray(data.values))
          throw new Error("Invalid response format: 'values' array expected");
        const values =
          condition.operator?.value === "LIKE" ||
          condition.operator?.value === "IS NULL" ||
          condition.operator?.value === "IS NOT NULL"
            ? []
            : data.values.map((value: string) => ({ value, label: value }));
        setQueryState((prev) => ({
          ...prev,
          uniqueValues: {
            ...prev.uniqueValues,
            [`condition${conditionIndex + 1}`]: values,
          },
          fetchError: null,
        }));
      } catch (e) {
        const message = (e as Error).message || "Failed to fetch unique values";
        console.error(
          `Error fetching unique values for condition ${conditionIndex + 1}:`,
          message
        );
        setQueryState((prev) => ({
          ...prev,
          fetchError: message,
          uniqueValues: {
            ...prev.uniqueValues,
            [`condition${conditionIndex + 1}`]: [],
          },
        }));
      }
    };

    fetchUniqueValues(0);
    fetchUniqueValues(1);
  }, [queryState.selectedTable, queryState.whereClause.conditions]);

  const updateQueryState = useCallback(
    (newQuery: string) => {
      if (containsRestrictedKeywords(newQuery)) {
        setQueryState((prev) => ({
          ...prev,
          queryError:
            "Query contains restricted keywords that could modify the database.",
        }));
        return;
      }

      const tableNameMatch =
        newQuery.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i)?.[1] || null;
      if (!tableNameMatch || !tableNames.includes(tableNameMatch)) {
        setQueryState((prev) => ({
          ...prev,
          selectedTable: null,
          selectedColumns: [],
          selectedAggregate: null,
          aggregateColumn: null,
          decimalPlaces: null,
          whereClause: {
            conditions: [
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
                logicalOperator: { value: "AND", label: "AND" },
              },
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
                logicalOperator: null,
              },
            ],
          },
          orderByClause: { column: null, direction: null },
          groupByColumns: [],
          limit: null,
          uniqueValues: { condition1: [], condition2: [] },
          fetchError: null,
          queryError: "Invalid or missing table name in query.",
          joinClauses: [],
        }));
        return;
      }

      setQueryState((prev) => ({
        ...prev,
        selectedTable: { value: tableNameMatch, label: tableNameMatch },
        queryError: null,
      }));

      // Parse JOIN clauses
      const joinMatches = newQuery.matchAll(
        /(INNER|LEFT)\s+JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+ON\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/gi
      );
      const joinClauses: JoinClause[] = [];
      for (const match of joinMatches) {
        const [, joinType, joinTable, table1, column1, table2, column2] = match;
        if (
          tableNames.includes(joinTable) &&
          tableColumns[table1]?.includes(column1) &&
          tableColumns[table2]?.includes(column2)
        ) {
          joinClauses.push({
            table: { value: joinTable, label: joinTable },
            onColumn1: { value: column1, label: column1 },
            onColumn2: { value: column2, label: column2 },
            joinType: { value: joinType + " JOIN", label: joinType + " JOIN" },
          });
        }
      }
      setQueryState((prev) => ({ ...prev, joinClauses }));

      // Update columns and aggregates
      const columnMatch = newQuery.match(/SELECT\s+(.+?)\s+FROM/i);
      if (columnMatch) {
        const columns = columnMatch[1]
          .split(",")
          .map((col) => stripQuotes(col.trim()))
          .filter((col) => col !== "");
        const aggregateMatch = columns.find(
          (col) =>
            col.toUpperCase() === "COUNT(*)" ||
            col.match(/^SUM\(.+\)$/i) ||
            col.match(/^MAX\(.+\)$/i) ||
            col.match(/^MIN\(.+\)$/i) ||
            col.match(/^AVG\(.+\)$/i) ||
            col.match(/^ROUND\(.+,\s*\d+\)$/i)
        );
        if (aggregateMatch) {
          if (aggregateMatch.toUpperCase() === "COUNT(*)") {
            setQueryState((prev) => ({
              ...prev,
              selectedAggregate: {
                value: "COUNT(*)",
                label: "COUNT(*)",
                aggregate: true,
              },
              aggregateColumn: null,
              decimalPlaces: null,
            }));
          } else if (aggregateMatch.match(/^(SUM|MAX|MIN|AVG)\((.+)\)$/i)) {
            const [aggFunc, column] = aggregateMatch
              .match(/^(SUM|MAX|MIN|AVG)\((.+)\)$/i)!
              .slice(1);
            setQueryState((prev) => ({
              ...prev,
              selectedAggregate: {
                value: aggFunc,
                label: `${aggFunc}()`,
                aggregate: true,
              },
              aggregateColumn: {
                value: stripQuotes(column),
                label: stripQuotes(column),
              },
              decimalPlaces: null,
            }));
          } else if (aggregateMatch.match(/^ROUND\((.+),\s*(\d+)\)$/i)) {
            const [, column, decimals] = aggregateMatch.match(
              /^ROUND\((.+),\s*(\d+)\)$/i
            )!;
            setQueryState((prev) => ({
              ...prev,
              selectedAggregate: {
                value: "ROUND",
                label: "ROUND()",
                aggregate: true,
              },
              aggregateColumn: {
                value: stripQuotes(column),
                label: stripQuotes(column),
              },
              decimalPlaces: { value: decimals, label: decimals },
            }));
          }
          columns.splice(columns.indexOf(aggregateMatch), 1);
        } else {
          setQueryState((prev) => ({
            ...prev,
            selectedAggregate: null,
            aggregateColumn: null,
            decimalPlaces: null,
          }));
        }

        const allAvailableColumns = [
          ...(tableColumns[tableNameMatch]?.map(
            (col) => `${tableNameMatch}.${col}`
          ) || []),
          ...joinClauses
            .filter((join) => join.table?.value)
            .flatMap(
              (join) =>
                tableColumns[join.table!.value]?.map(
                  (col) => `${join.table!.value}.${col}`
                ) || []
            ),
        ];

        setQueryState((prev) => ({
          ...prev,
          selectedColumns:
            columns.length > 0 && columns[0] !== "*"
              ? columns
                  .filter((col) => allAvailableColumns.includes(col))
                  .map((col) => ({ value: col, label: col }))
              : allAvailableColumns.map((col) => ({
                  value: col,
                  label: col,
                })),
        }));
      }

      // Update WHERE clause
      const whereMatch = newQuery.match(
        /WHERE\s+((?:"[\w]+"|'[\w]+'|[\w_]+\.[\w_]+))\s*(IS NULL|IS NOT NULL|BETWEEN|[=!><]=?|LIKE)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)?(?:\s+AND\s+('[^']*'|[0-9]+(?:\.[0-9]+)?))?\s*(AND|OR)?\s*((?:"[\w]+"|'[\w]+'|[\w_]+\.[\w_]+))?\s*(IS NULL|IS NOT NULL|BETWEEN|[=!><]=?|LIKE)?\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)?(?:\s+AND\s+('[^']*'|[0-9]+(?:\.[0-9]+)?))?/i
      );
      if (whereMatch) {
        const [
          ,
          column1,
          operator1,
          value1,
          value2_1,
          logicalOp,
          column2,
          operator2,
          value2,
          value2_2,
        ] = whereMatch;
        setQueryState((prev) => ({
          ...prev,
          whereClause: {
            conditions: [
              {
                column: column1
                  ? { value: stripQuotes(column1), label: stripQuotes(column1) }
                  : null,
                operator: operator1
                  ? { value: operator1, label: operator1 }
                  : null,
                value:
                  operator1 === "IS NULL" ||
                  operator1 === "IS NOT NULL" ||
                  !value1 ||
                  value1 === "''"
                    ? null
                    : {
                        value: stripQuotes(value1),
                        label: stripQuotes(value1),
                      },
                value2:
                  operator1 === "BETWEEN" && value2_1 && value2_1 !== "''"
                    ? {
                        value: stripQuotes(value2_1),
                        label: stripQuotes(value2_1),
                      }
                    : null,
                logicalOperator: logicalOp
                  ? { value: logicalOp, label: logicalOp }
                  : { value: "AND", label: "AND" },
              },
              {
                column: column2
                  ? { value: stripQuotes(column2), label: stripQuotes(column2) }
                  : null,
                operator: operator2
                  ? { value: operator2, label: operator2 }
                  : null,
                value:
                  operator2 === "IS NULL" ||
                  operator2 === "IS NOT NULL" ||
                  !value2 ||
                  value2 === "''"
                    ? null
                    : {
                        value: stripQuotes(value2),
                        label: stripQuotes(value2),
                      },
                value2:
                  operator2 === "BETWEEN" && value2_2 && value2_2 !== "''"
                    ? {
                        value: stripQuotes(value2_2),
                        label: stripQuotes(value2_2),
                      }
                    : null,
                logicalOperator: null,
              },
            ],
          },
        }));
      } else {
        setQueryState((prev) => ({
          ...prev,
          whereClause: {
            conditions: [
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
                logicalOperator: { value: "AND", label: "AND" },
              },
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
                logicalOperator: null,
              },
            ],
          },
          uniqueValues: { condition1: [], condition2: [] },
          fetchError: null,
        }));
      }

      // Update GROUP BY clause
      const groupByMatch = newQuery.match(/\bGROUP\s+BY\s+([^;]+)/i);
      if (groupByMatch && tableNameMatch) {
        const groupByItems = groupByMatch[1]
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          .filter((item) => item);
        const selectMatch = newQuery.match(/SELECT\s+(.+?)\s+FROM/i);
        const selectColumns = selectMatch
          ? selectMatch[1]
              .split(",")
              .map((col) => stripQuotes(col.trim()))
              .filter((col) => col)
              .map((col) =>
                col.replace(
                  /^(SUM|MAX|MIN|AVG|ROUND|COUNT)\((.*?)(?:,\s*\d+)?\)$/i,
                  "$1($2)"
                )
              )
          : [];

        const allAvailableColumns = [
          ...(tableColumns[tableNameMatch]?.map(
            (col) => `${tableNameMatch}.${col}`
          ) || []),
          ...joinClauses
            .filter((join) => join.table?.value)
            .flatMap(
              (join) =>
                tableColumns[join.table!.value]?.map(
                  (col) => `${join.table!.value}.${col}`
                ) || []
            ),
        ];

        const groupByColumns = groupByItems
          .map((item) => {
            const isNumber = !isNaN(parseInt(item));
            if (isNumber) {
              const index = parseInt(item) - 1;
              if (index >= 0 && selectColumns[index]) {
                let columnName = selectColumns[index];
                const aggregateMatch = columnName.match(
                  /^(SUM|MAX|MIN|AVG|ROUND|COUNT)\((.*?)\)$/i
                );
                if (aggregateMatch) {
                  columnName = stripQuotes(aggregateMatch[2]);
                }
                return allAvailableColumns.includes(columnName)
                  ? { value: columnName, label: columnName }
                  : null;
              }
              return null;
            }
            return allAvailableColumns.includes(item)
              ? { value: item, label: item }
              : null;
          })
          .filter((item): item is SelectOption => item !== null);

        setQueryState((prev) => ({ ...prev, groupByColumns }));
      } else {
        setQueryState((prev) => ({ ...prev, groupByColumns: [] }));
      }

      // Update ORDER BY clause
      const orderByMatch = newQuery.match(
        /\bORDER\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+\.[\w_]+))\s*(ASC|DESC)?\s*(?:LIMIT\s+(\d+))?/i
      );
      if (orderByMatch) {
        const [, column, direction, limitValue] = orderByMatch;
        setQueryState((prev) => ({
          ...prev,
          orderByClause: {
            column: column
              ? { value: stripQuotes(column), label: stripQuotes(column) }
              : null,
            direction: direction
              ? {
                  value: direction,
                  label:
                    direction === "ASC"
                      ? "Ascending (A-Z, low-high)"
                      : "Descending (Z-A, high-low)",
                }
              : null,
          },
          limit:
            limitValue && !isNaN(Number(limitValue)) && Number(limitValue) > 0
              ? { value: limitValue, label: limitValue }
              : null,
        }));
      } else {
        setQueryState((prev) => ({
          ...prev,
          orderByClause: { column: null, direction: null },
          limit: null,
        }));
      }
    },
    [tableNames, tableColumns]
  );

  return {
    queryState,
    queryError: queryState.queryError,
    fetchError: queryState.fetchError,
    updateQueryState,
    handleTableSelect,
    handleColumnSelect,
    handleAggregateSelect,
    handleAggregateColumnSelect,
    handleDecimalPlacesSelect,
    handleGroupByColumnsSelect,
    handleLogicalOperatorSelect,
    handleWhereColumnSelect,
    handleOperatorSelect,
    handleValueSelect,
    handleOrderByColumnSelect,
    handleOrderByDirectionSelect,
    handleLimitSelect,
    handleJoinTypeSelect,
    handleJoinTableSelect,
    handleJoinOnColumn1Select,
    handleJoinOnColumn2Select,
    addJoinClause,
    removeJoinClause,
    operatorOptions,
    logicalOperatorOptions,
  };
};
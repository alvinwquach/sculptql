"use client";

import { useState, useCallback, useEffect } from "react";
import { MultiValue, SingleValue } from "react-select";
import { EditorView } from "@codemirror/view";
import {
  SelectOption,
  WhereClause,
  OrderByClause,
  TableColumn,
  JoinClause,
  HavingCondition,
  UnionClause,
  CaseClause,
  CaseCondition,
  CteClause,
  ColumnType,
} from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { containsRestrictedKeywords } from "../../utils/restrictedKeywords";

interface QueryState {
  cteClauses: CteClause[];
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  selectedAggregate: SelectOption | null;
  aggregateColumn: SelectOption | null;
  decimalPlaces: SelectOption | null;
  whereClause: WhereClause;
  havingClause: { conditions: HavingCondition[] };
  orderByClause: OrderByClause;
  groupByColumns: SelectOption[];
  limit: SelectOption | null;
  uniqueValues: Record<string, SelectOption[]>;
  fetchError: string | null;
  queryError: string | null;
  joinClauses: JoinClause[];
  unionClauses: UnionClause[];
  caseClause: CaseClause;
}

export const useQueryBuilder = (
  tableNames: string[],
  tableColumns: TableColumn,
  onQueryChange: (query: string) => void,
  editorRef: React.RefObject<EditorView | null>
) => {
  const [queryState, setQueryState] = useState<QueryState>({
    cteClauses: [],
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
    havingClause: { conditions: [] },
    orderByClause: { column: null, direction: null },
    groupByColumns: [],
    limit: null,
    uniqueValues: {
      condition1: [],
      condition2: [],
      caseCondition1: [],
      caseCondition2: [],
      cteCondition1: [],
      cteCondition2: [],
    },
    fetchError: null,
    queryError: null,
    joinClauses: [],
    unionClauses: [],
    caseClause: {
      conditions: [],
      elseValue: null,
      alias: null,
    },
  });

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

  const buildQuery = useCallback(() => {
    const {
      cteClauses,
      selectedTable,
      selectedColumns,
      selectedAggregate,
      aggregateColumn,
      decimalPlaces,
      whereClause,
      havingClause,
      orderByClause,
      groupByColumns,
      limit,
      joinClauses,
      unionClauses,
      caseClause,
    } = queryState;

    let query = "";

    // Build CTEs
    if (cteClauses.length > 0) {
      const cteQueries = cteClauses
        .filter((cte) => cte.alias && cte.fromTable?.value)
        .map((cte) => {
          const columns = cte.selectedColumns.length
            ? cte.selectedColumns
                .map((col) =>
                  col.value.includes(".")
                    ? col.value
                    : needsQuotes(col.value)
                    ? `"${col.value}"`
                    : col.value
                )
                .join(", ")
            : "*";
          const table = needsQuotes(cte.fromTable!.value)
            ? `"${cte.fromTable!.value}"`
            : cte.fromTable!.value;
          let cteQuery = `${
            needsQuotes(cte.alias!) ? `"${cte.alias}"` : cte.alias
          } AS (SELECT ${columns} FROM ${table}`;

          const validCteConditions = cte.whereClause.conditions.filter(
            (c) =>
              c.column?.value &&
              c.operator?.value &&
              (c.operator.value === "IS NULL" ||
                c.operator.value === "IS NOT NULL" ||
                (c.value?.value && c.value.value.trim() !== ""))
          );

          if (validCteConditions.length > 0) {
            cteQuery += " WHERE ";
            cteQuery += validCteConditions
              .map((condition, index) => {
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
                return index === 0 || !condition.logicalOperator?.value
                  ? conditionStr
                  : `${condition.logicalOperator.value} ${conditionStr}`;
              })
              .join(" ");
          }

          return `${cteQuery})`;
        })
        .join(", ");
      if (cteQueries) {
        query += `WITH ${cteQueries}`;
      }

      // If only CTEs are defined and no main query components are selected, return just the CTEs
      if (
        !selectedTable &&
        selectedColumns.length === 0 &&
        !selectedAggregate &&
        !aggregateColumn &&
        !caseClause.conditions.length &&
        !caseClause.elseValue &&
        !caseClause.alias &&
        joinClauses.length === 0 &&
        unionClauses.length === 0 &&
        groupByColumns.length === 0 &&
        !orderByClause.column &&
        !limit &&
        whereClause.conditions.every(
          (c) =>
            !c.column?.value &&
            !c.operator?.value &&
            (!c.value?.value || c.value.value.trim() === "")
        ) &&
        havingClause.conditions.length === 0
      ) {
        return query.trim();
      }
    }

    let columns: string;
    // Handle CASE clause
    if (
      caseClause.conditions.length > 0 ||
      caseClause.elseValue ||
      caseClause.alias
    ) {
      const caseConditions = caseClause.conditions
        .filter(
          (c: CaseCondition) =>
            c.column?.value && c.operator?.value && c.result?.value
        )
        .map((c: CaseCondition) => {
          const column = c.column!.value.includes(".")
            ? c.column!.value
            : needsQuotes(c.column!.value)
            ? `"${c.column!.value}"`
            : c.column!.value;
          const value =
            c.operator!.value === "IS NULL" ||
            c.operator!.value === "IS NOT NULL"
              ? ""
              : c.value && needsQuotes(c.value.value)
              ? `'${c.value.value}'`
              : c.value?.value || "";
          const result = needsQuotes(c.result!.value)
            ? `'${c.result!.value}'`
            : c.result!.value;
          return `WHEN ${column} ${c.operator!.value} ${value} THEN ${result}`;
        })
        .join(" ");
      const elsePart = caseClause.elseValue?.value
        ? ` ELSE ${
            needsQuotes(caseClause.elseValue.value)
              ? `'${caseClause.elseValue.value}'`
              : caseClause.elseValue.value
          }`
        : "";
      const aliasPart = caseClause.alias
        ? ` AS ${
            needsQuotes(caseClause.alias)
              ? `"${caseClause.alias}"`
              : caseClause.alias
          }`
        : "";
      columns =
        caseConditions || elsePart
          ? `CASE ${caseConditions}${elsePart}${aliasPart}`
          : "*";
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
    } else if (selectedAggregate?.value) {
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

    // Use CTE alias in FROM if CTEs are present and no selectedTable, otherwise use selectedTable
    const fromTable =
      cteClauses.length > 0 && cteClauses[0].alias && !selectedTable
        ? needsQuotes(cteClauses[0].alias)
          ? `"${cteClauses[0].alias}"`
          : cteClauses[0].alias
        : selectedTable?.value
        ? needsQuotes(selectedTable.value)
          ? `"${selectedTable.value}"`
          : selectedTable.value
        : "";
    query += fromTable ? `SELECT ${columns} FROM ${fromTable} ` : "";

    if (joinClauses.length > 0) {
      query += joinClauses
        .filter((join) => join.table?.value)
        .map((join) => {
          const table = needsQuotes(join.table!.value)
            ? `"${join.table!.value}"`
            : join.table!.value;
          const joinType = join.joinType?.value || "INNER JOIN";
          if (joinType === "CROSS JOIN") {
            return `${joinType} ${table}`;
          }
          if (!join.onColumn1?.value || !join.onColumn2?.value) {
            return "";
          }
          const onColumn1 = needsQuotes(join.onColumn1!.value)
            ? `"${join.onColumn1!.value}"`
            : join.onColumn1!.value;
          const onColumn2 = needsQuotes(join.onColumn2!.value)
            ? `"${join.onColumn2!.value}"`
            : join.onColumn2!.value;
          return `${joinType} ${table} ON ${
            cteClauses.length > 0 && cteClauses[0].alias && !selectedTable
              ? cteClauses[0].alias
              : selectedTable?.value
          }.${onColumn1} = ${join.table!.value}.${onColumn2}`;
        })
        .filter((clause) => clause !== "")
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
        .map((condition, index) => {
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
          return index === 0 || !condition.logicalOperator?.value
            ? conditionStr
            : `${condition.logicalOperator.value} ${conditionStr}`;
        })
        .join(" ");
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

    const validHavingConditions = havingClause.conditions.filter(
      (c) => c.aggregate?.value && c.operator?.value && c.value?.trim()
    );
    if (validHavingConditions.length > 0) {
      query += " HAVING ";
      query += validHavingConditions
        .map((condition, index) => {
          let conditionStr = "";
          if (condition.aggregate!.value === "COUNT(*)") {
            conditionStr = `COUNT(*) ${condition.operator!.value} ${
              condition.value
            }`;
          } else if (condition.column?.value) {
            conditionStr = `${condition.aggregate!.value}(${
              needsQuotes(condition.column.value)
                ? `"${condition.column.value}"`
                : condition.column.value
            }) ${condition.operator!.value} ${condition.value}`;
          }
          return index === 0 || !condition.logicalOperator?.value
            ? conditionStr
            : `${condition.logicalOperator.value} ${conditionStr}`;
        })
        .join(" ");
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

    if (unionClauses.length > 0) {
      query += unionClauses
        .filter((union) => union.table?.value)
        .map((union) => {
          const table = needsQuotes(union.table!.value)
            ? `"${union.table!.value}"`
            : union.table!.value;
          const unionType = union.unionType?.value || "UNION";
          return ` ${unionType} SELECT ${columns} FROM ${table}`;
        })
        .join("");
    }

    return query.trim();
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

  const fetchUniqueValues = useCallback(
    async (
      conditionIndex: number,
      isHaving: boolean = false,
      isCase: boolean = false,
      isCte: boolean = false,
      cteIndex: number = 0
    ) => {
      const targetTable = isCte
        ? queryState.cteClauses[cteIndex]?.fromTable?.value
        : queryState.selectedTable?.value;
      const conditions = isHaving
        ? queryState.havingClause.conditions
        : isCase
        ? queryState.caseClause.conditions
        : isCte
        ? queryState.cteClauses[cteIndex]?.whereClause.conditions
        : queryState.whereClause.conditions;
      const condition = conditions?.[conditionIndex];

      if (!targetTable || !condition?.column?.value) return;

      const columnName = condition.column.value.split(".").pop();
      if (!columnName) return;

      try {
        const res = await fetch(
          `/api/unique-values?table=${encodeURIComponent(
            targetTable
          )}&column=${encodeURIComponent(columnName)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        const unique = data.values.map((val: string) => ({
          value: val,
          label: val,
        }));
        setQueryState((prev) => ({
          ...prev,
          uniqueValues: {
            ...prev.uniqueValues,
            [isHaving
              ? `having${conditionIndex + 1}`
              : isCase
              ? `caseCondition${conditionIndex + 1}`
              : isCte
              ? `cte${cteIndex}Condition${conditionIndex + 1}`
              : `condition${conditionIndex + 1}`]: unique,
          },
          fetchError: null,
        }));
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to fetch unique values";
        console.error(
          `Error fetching unique values for ${
            isHaving
              ? "having"
              : isCase
              ? "case condition"
              : isCte
              ? `CTE ${cteIndex + 1} condition`
              : "condition"
          } ${conditionIndex + 1}:`,
          message
        );
        setQueryState((prev) => ({
          ...prev,
          fetchError: message,
          uniqueValues: {
            ...prev.uniqueValues,
            [isHaving
              ? `having${conditionIndex + 1}`
              : isCase
              ? `caseCondition${conditionIndex + 1}`
              : isCte
              ? `cte${cteIndex}Condition${conditionIndex + 1}`
              : `condition${conditionIndex + 1}`]: [],
          },
        }));
      }
    },
    [
      queryState.selectedTable,
      queryState.whereClause.conditions,
      queryState.havingClause.conditions,
      queryState.caseClause.conditions,
      queryState.cteClauses,
    ]
  );

  useEffect(() => {
    queryState.whereClause.conditions.forEach((_, i) => fetchUniqueValues(i));
    queryState.havingClause.conditions.forEach((_, i) =>
      fetchUniqueValues(i, true)
    );
    queryState.caseClause.conditions.forEach((_, i) =>
      fetchUniqueValues(i, false, true)
    );
    queryState.cteClauses.forEach((cte, cteIndex) =>
      cte.whereClause.conditions.forEach((_, i) =>
        fetchUniqueValues(i, false, false, true, cteIndex)
      )
    );
  }, [
    queryState.selectedTable,
    queryState.whereClause.conditions,
    queryState.havingClause.conditions,
    queryState.caseClause.conditions,
    queryState.cteClauses,
    fetchUniqueValues,
  ]);

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
        havingClause: { conditions: [] },
        orderByClause: { column: null, direction: null },
        groupByColumns: [],
        limit: null,
        uniqueValues: {
          condition1: [],
          condition2: [],
          caseCondition1: [],
          caseCondition2: [],
          cteCondition1: [],
          cteCondition2: [],
        },
        fetchError: null,
        joinClauses: [],
        unionClauses: [],
        caseClause: { conditions: [], elseValue: null, alias: null },
        cteClauses: [], // Reset CTE clauses when table changes
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
      if (
        !queryState.selectedTable?.value &&
        !queryState.cteClauses[0]?.alias
      ) {
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
          havingClause: { conditions: [] },
          orderByClause: { column: null, direction: null },
          groupByColumns: [],
          limit: null,
          uniqueValues: {
            condition1: [],
            condition2: [],
            caseCondition1: [],
            caseCondition2: [],
            cteCondition1: [],
            cteCondition2: [],
          },
          fetchError: null,
          joinClauses: [],
          unionClauses: [],
          caseClause: { conditions: [], elseValue: null, alias: null },
        }));
        updateEditor("");
        return;
      }

      const includesStar = newValue.some((option) => option.value === "*");
      const columnsToSelect = includesStar
        ? [
            ...(queryState.cteClauses[0]?.alias &&
            queryState.cteClauses[0]?.selectedColumns
              ? queryState.cteClauses[0].selectedColumns
              : tableColumns[queryState.selectedTable?.value || ""]?.map(
                  (col) => ({
                    value: `${queryState.selectedTable!.value}.${col}`,
                    label: `${queryState.selectedTable!.value}.${col}`,
                  })
                ) || []),
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
      queryState.cteClauses,
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
      if (newValue) fetchUniqueValues(conditionIndex);
    },
    [buildQuery, updateEditor, fetchUniqueValues]
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

  const handleCaseColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setQueryState((prev) => {
        const newConditions = [...prev.caseClause.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          column: newValue,
          operator: null,
          value: null,
          result: newConditions[conditionIndex]?.result || null,
        };
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          caseClause: {
            ...prev.caseClause,
            conditions: newConditions,
          },
          uniqueValues: {
            ...prev.uniqueValues,
            [`caseCondition${conditionIndex + 1}`]: [],
          },
          fetchError: null,
        };
      });
      if (newValue) fetchUniqueValues(conditionIndex, false, true);
    },
    [buildQuery, updateEditor, fetchUniqueValues]
  );

  const handleCaseOperatorSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setQueryState((prev) => {
        const newConditions = [...prev.caseClause.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          operator: newValue,
          value: null,
        };
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          caseClause: {
            ...prev.caseClause,
            conditions: newConditions,
          },
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleCaseValueSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setQueryState((prev) => {
        const newConditions = [...prev.caseClause.conditions];
        if (
          !newConditions[conditionIndex]?.operator?.value ||
          !newConditions[conditionIndex]?.column?.value ||
          (newValue && newValue.value.trim() === "")
        ) {
          newConditions[conditionIndex] = {
            ...newConditions[conditionIndex],
            value: null,
          };
        } else {
          const valueOption = newValue
            ? { value: newValue.value, label: newValue.label || newValue.value }
            : null;
          newConditions[conditionIndex] = {
            ...newConditions[conditionIndex],
            value: valueOption,
          };
        }
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          caseClause: {
            ...prev.caseClause,
            conditions: newConditions,
          },
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleCaseResultSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setQueryState((prev) => {
        const newConditions = [...prev.caseClause.conditions];
        const valueOption = newValue
          ? { value: newValue.value, label: newValue.label || newValue.value }
          : null;
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          result: valueOption,
        };
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          caseClause: {
            ...prev.caseClause,
            conditions: newConditions,
          },
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleElseResultSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const valueOption = newValue
          ? { value: newValue.value, label: newValue.label || newValue.value }
          : null;
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          caseClause: {
            ...prev.caseClause,
            elseValue: valueOption,
          },
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleCaseAliasChange = useCallback(
    (alias: string | null) => {
      setQueryState((prev) => ({
        ...prev,
        caseClause: {
          ...prev.caseClause,
          alias: alias ? stripQuotes(alias) : null,
        },
      }));
      const query = buildQuery();
      updateEditor(query);
    },
    [buildQuery, updateEditor]
  );

  const addCaseCondition = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      caseClause: {
        ...prev.caseClause,
        conditions: [
          ...prev.caseClause.conditions,
          { column: null, operator: null, value: null, result: null },
        ],
      },
    }));
    const query = buildQuery();
    updateEditor(query);
  }, [buildQuery, updateEditor]);

  const removeCaseCondition = useCallback(
    (conditionIndex: number) => {
      setQueryState((prev) => {
        const newConditions = prev.caseClause.conditions.filter(
          (_, index) => index !== conditionIndex
        );
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          caseClause: {
            ...prev.caseClause,
            conditions: newConditions,
          },
          uniqueValues: {
            ...prev.uniqueValues,
            [`caseCondition${conditionIndex + 1}`]: [],
          },
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleHavingAggregateSelect = useCallback(
    (index: number, newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newConditions = [...prev.havingClause.conditions];
        newConditions[index] = {
          ...newConditions[index],
          aggregate: newValue,
          column:
            newValue?.value === "COUNT(*)" ? null : newConditions[index].column,
          value: null,
          operator: null,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, havingClause: { conditions: newConditions } };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleHavingColumnSelect = useCallback(
    (index: number, newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newConditions = [...prev.havingClause.conditions];
        newConditions[index] = {
          ...newConditions[index],
          column: newValue,
          value: null,
          operator: null,
        };
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          havingClause: { conditions: newConditions },
          uniqueValues: {
            ...prev.uniqueValues,
            [`having${index + 1}`]: [],
          },
          fetchError: null,
        };
      });
      if (newValue) fetchUniqueValues(index, true);
    },
    [buildQuery, updateEditor, fetchUniqueValues]
  );

  const handleHavingOperatorSelect = useCallback(
    (index: number, newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newConditions = [...prev.havingClause.conditions];
        newConditions[index] = {
          ...newConditions[index],
          operator: newValue,
          value: null,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, havingClause: { conditions: newConditions } };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleHavingValueChange = useCallback(
    (index: number, value: string | null) => {
      setQueryState((prev) => {
        const newConditions = [...prev.havingClause.conditions];
        newConditions[index] = {
          ...newConditions[index],
          value: value?.trim() || null,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, havingClause: { conditions: newConditions } };
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
          onColumn1:
            newValue?.value === "CROSS JOIN"
              ? null
              : newJoinClauses[joinIndex].onColumn1,
          onColumn2:
            newValue?.value === "CROSS JOIN"
              ? null
              : newJoinClauses[joinIndex].onColumn2,
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
          onColumn1:
            newJoinClauses[joinIndex].joinType?.value === "CROSS JOIN"
              ? null
              : null,
          onColumn2:
            newJoinClauses[joinIndex].joinType?.value === "CROSS JOIN"
              ? null
              : null,
          joinType: newJoinClauses[joinIndex].joinType || {
            value: "INNER JOIN",
            label: "INNER JOIN",
          },
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
    const query = buildQuery();
    updateEditor(query);
  }, [buildQuery, updateEditor]);

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

  const handleUnionTableSelect = useCallback(
    (newValue: SingleValue<SelectOption>, unionIndex: number) => {
      setQueryState((prev) => {
        const newUnionClauses = [...prev.unionClauses];
        newUnionClauses[unionIndex] = { table: newValue };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, unionClauses: newUnionClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleUnionTypeSelect = useCallback(
    (newValue: SingleValue<SelectOption>, unionIndex: number) => {
      setQueryState((prev) => {
        const newUnionClauses = [...prev.unionClauses];
        newUnionClauses[unionIndex] = {
          ...newUnionClauses[unionIndex],
          unionType:
            newValue && ["UNION", "UNION ALL"].includes(newValue.value)
              ? {
                  value: newValue.value as "UNION" | "UNION ALL",
                  label: newValue.label,
                }
              : undefined,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, unionClauses: newUnionClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const addUnionClause = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      unionClauses: [...prev.unionClauses, { table: null }],
    }));
    const query = buildQuery();
    updateEditor(query);
  }, [buildQuery, updateEditor]);

  const removeUnionClause = useCallback(
    (unionIndex: number) => {
      setQueryState((prev) => {
        const newUnionClauses = prev.unionClauses.filter(
          (_, index) => index !== unionIndex
        );
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, unionClauses: newUnionClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const addCteClause = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      cteClauses: [
        ...prev.cteClauses,
        {
          alias: null,
          selectedColumns: [],
          fromTable: null,
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
        },
      ],
      uniqueValues: {
        ...prev.uniqueValues,
        [`cte${prev.cteClauses.length}Condition1`]: [],
        [`cte${prev.cteClauses.length}Condition2`]: [],
      },
    }));
    const query = buildQuery();
    updateEditor(query);
  }, [buildQuery, updateEditor]);

  const removeCteClause = useCallback(
    (cteIndex: number) => {
      setQueryState((prev) => {
        const newCteClauses = prev.cteClauses.filter(
          (_, index) => index !== cteIndex
        );
        const newUniqueValues = { ...prev.uniqueValues };
        delete newUniqueValues[`cte${cteIndex}Condition1`];
        delete newUniqueValues[`cte${cteIndex}Condition2`];
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          cteClauses: newCteClauses,
          uniqueValues: newUniqueValues,
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleCteAliasChange = useCallback(
    (cteIndex: number, alias: string | null) => {
      const cleanAlias = alias ? stripQuotes(alias.trim()) : null;
      if (cleanAlias && containsRestrictedKeywords(cleanAlias)) {
        setQueryState((prev) => ({
          ...prev,
          queryError: "CTE alias contains restricted keywords.",
        }));
        return;
      }
      if (
        cleanAlias &&
        queryState.cteClauses.some(
          (cte, i) => i !== cteIndex && cte.alias === cleanAlias
        )
      ) {
        setQueryState((prev) => ({
          ...prev,
          queryError: "Duplicate CTE alias detected.",
        }));
        return;
      }
      setQueryState((prev) => {
        const newCteClauses = [...prev.cteClauses];
        newCteClauses[cteIndex] = {
          ...newCteClauses[cteIndex],
          alias: cleanAlias,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, cteClauses: newCteClauses, queryError: null };
      });
    },
    [queryState.cteClauses, buildQuery, updateEditor]
  );

  const handleCteTableSelect = useCallback(
    (cteIndex: number, newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newCteClauses = [...prev.cteClauses];
        newCteClauses[cteIndex] = {
          ...newCteClauses[cteIndex],
          fromTable: newValue,
          selectedColumns: [],
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
        };
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          cteClauses: newCteClauses,
          uniqueValues: {
            ...prev.uniqueValues,
            [`cte${cteIndex}Condition1`]: [],
            [`cte${cteIndex}Condition2`]: [],
          },
        };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleCteColumnSelect = useCallback(
    (cteIndex: number, newValue: MultiValue<SelectOption>) => {
      setQueryState((prev) => {
        const newCteClauses = [...prev.cteClauses];
        const includesStar = newValue.some((option) => option.value === "*");
        const columnsToSelect = includesStar
          ? tableColumns[newCteClauses[cteIndex].fromTable?.value || ""]?.map(
              (col) => ({
                value: col,
                label: col,
              })
            ) || []
          : (newValue as SelectOption[]);
        newCteClauses[cteIndex] = {
          ...newCteClauses[cteIndex],
          selectedColumns: columnsToSelect,
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, cteClauses: newCteClauses };
      });
    },
    [buildQuery, updateEditor, tableColumns]
  );

  const handleCteLogicalOperatorSelect = useCallback(
    (cteIndex: number, newValue: SingleValue<SelectOption>) => {
      setQueryState((prev) => {
        const newCteClauses = [...prev.cteClauses];
        const newConditions = [
          ...newCteClauses[cteIndex].whereClause.conditions,
        ];
        newConditions[0] = { ...newConditions[0], logicalOperator: newValue };
        newCteClauses[cteIndex] = {
          ...newCteClauses[cteIndex],
          whereClause: { conditions: newConditions },
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, cteClauses: newCteClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleCteWhereColumnSelect = useCallback(
    (
      cteIndex: number,
      conditionIndex: number,
      newValue: SingleValue<SelectOption>
    ) => {
      setQueryState((prev) => {
        const newCteClauses = [...prev.cteClauses];
        const newConditions = [
          ...newCteClauses[cteIndex].whereClause.conditions,
        ];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          column: newValue,
          operator: null,
          value: null,
          value2: null,
        };
        newCteClauses[cteIndex] = {
          ...newCteClauses[cteIndex],
          whereClause: { conditions: newConditions },
        };
        const query = buildQuery();
        updateEditor(query);
        return {
          ...prev,
          cteClauses: newCteClauses,
          uniqueValues: {
            ...prev.uniqueValues,
            [`cte${cteIndex}Condition${conditionIndex + 1}`]: [],
          },
          fetchError: null,
        };
      });
      if (newValue)
        fetchUniqueValues(conditionIndex, false, false, true, cteIndex);
    },
    [buildQuery, updateEditor, fetchUniqueValues]
  );

  const handleCteOperatorSelect = useCallback(
    (
      cteIndex: number,
      conditionIndex: number,
      newValue: SingleValue<SelectOption>
    ) => {
      setQueryState((prev) => {
        const newCteClauses = [...prev.cteClauses];
        const newConditions = [
          ...newCteClauses[cteIndex].whereClause.conditions,
        ];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          operator: newValue,
          value: null,
          value2: null,
        };
        newCteClauses[cteIndex] = {
          ...newCteClauses[cteIndex],
          whereClause: { conditions: newConditions },
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, cteClauses: newCteClauses };
      });
    },
    [buildQuery, updateEditor]
  );

  const handleCteValueSelect = useCallback(
    (
      cteIndex: number,
      conditionIndex: number,
      newValue: SingleValue<SelectOption>,
      isValue2: boolean
    ) => {
      setQueryState((prev) => {
        const newCteClauses = [...prev.cteClauses];
        const newConditions = [
          ...newCteClauses[cteIndex].whereClause.conditions,
        ];
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
        newCteClauses[cteIndex] = {
          ...newCteClauses[cteIndex],
          whereClause: { conditions: newConditions },
        };
        const query = buildQuery();
        updateEditor(query);
        return { ...prev, cteClauses: newCteClauses };
      });
    },
    [buildQuery, updateEditor]
  );

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

      // Parse CTEs
      const cteMatch = newQuery.match(
        /WITH\s+((?:[\w"]+\s+AS\s+\([^)]+\)(?:\s*,\s*)?)+)\s*SELECT/i
      );
      let cteClauses: CteClause[] = [];
      if (cteMatch) {
        const cteText = cteMatch[1];
        const cteMatches = cteText.matchAll(
          /([\w"]+)\s+AS\s+\(SELECT\s+(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+WHERE\s+(.+?))?\)/gi
        );
        cteClauses = Array.from(cteMatches).map((match) => {
          const [, alias, columns, table, whereText] = match;
          const columnOptions = columns
            .split(",")
            .map((col) => col.trim())
            .filter((col) => col && col !== "*")
            .map((col) => ({
              value: stripQuotes(col),
              label: stripQuotes(col),
            }));

          let whereConditions: WhereClause["conditions"] = [
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
          ];

          if (whereText) {
            const whereMatch = whereText.match(
              /((?:"[\w]+"|'[\w]+'|[\w_]+\.[\w_]+))\s*(IS NULL|IS NOT NULL|BETWEEN|[=!><]=?|LIKE)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)?(?:\s+AND\s+('[^']*'|[0-9]+(?:\.[0-9]+)?))?\s*(AND|OR)?\s*((?:"[\w]+"|'[\w]+'|[\w_]+\.[\w_]+))?\s*(IS NULL|IS NOT NULL|BETWEEN|[=!><]=?|LIKE)?\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)?(?:\s+AND\s+('[^']*'|[0-9]+(?:\.[0-9]+)?))?/i
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
              whereConditions = [
                {
                  column: column1
                    ? {
                        value: stripQuotes(column1),
                        label: stripQuotes(column1),
                      }
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
                    ? {
                        value: stripQuotes(column2),
                        label: stripQuotes(column2),
                      }
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
              ];
            }
          }

          return {
            alias: stripQuotes(alias),
            selectedColumns: columnOptions,
            fromTable: tableNames.includes(table)
              ? { value: table, label: table }
              : null,
            whereClause: { conditions: whereConditions },
          };
        });
      }

      // Split query into UNION parts
      const mainQueryText = cteMatch
        ? newQuery.replace(cteMatch[0], "SELECT")
        : newQuery;
      const unionQueries = mainQueryText.split(/\s*UNION\s*(ALL)?\s*/i);
      const mainQuery = unionQueries[0];
      const unionTables: UnionClause[] = unionQueries
        .slice(1)
        .map((part, index) => {
          const tableMatch = part.match(
            /SELECT\s+\*\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i
          );
          if (tableMatch && tableNames.includes(tableMatch[1])) {
            return {
              table: { value: tableMatch[1], label: tableMatch[1] },
              unionType:
                unionQueries[index * 2] === "ALL"
                  ? { value: "UNION ALL", label: "UNION ALL" }
                  : { value: "UNION", label: "UNION" },
            };
          }
          return { table: null };
        })
        .filter((clause) => clause.table !== null);

      const tableNameMatch =
        mainQuery.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i)?.[1] || null;
      const selectedTable =
        tableNameMatch &&
        (tableNames.includes(tableNameMatch) ||
          cteClauses.some((cte) => cte.alias === tableNameMatch))
          ? { value: tableNameMatch, label: tableNameMatch }
          : null;

      if (
        !tableNameMatch ||
        (!tableNames.includes(tableNameMatch) &&
          !cteClauses.some((cte) => cte.alias === tableNameMatch))
      ) {
        setQueryState((prev) => ({
          ...prev,
          cteClauses,
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
          havingClause: { conditions: [] },
          orderByClause: { column: null, direction: null },
          groupByColumns: [],
          limit: null,
          uniqueValues: {
            condition1: [],
            condition2: [],
            caseCondition1: [],
            caseCondition2: [],
            cteCondition1: [],
            cteCondition2: [],
          },
          fetchError: null,
          queryError: "Invalid or missing table name in query.",
          joinClauses: [],
          unionClauses: [],
          caseClause: { conditions: [], elseValue: null, alias: null },
        }));
        return;
      }

      setQueryState((prev) => ({
        ...prev,
        cteClauses,
        selectedTable,
        unionClauses: unionTables,
        queryError: null,
      }));

      const joinMatches = mainQuery.matchAll(
        /((INNER|LEFT|RIGHT|CROSS)\s+JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+ON\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*))?/gi
      );
      const joinClauses: JoinClause[] = [];
      for (const match of joinMatches) {
        const [, , joinType, joinTable, table1, column1, table2, column2] =
          match;
        if (tableNames.includes(joinTable)) {
          joinClauses.push({
            table: { value: joinTable, label: joinTable },
            onColumn1: column1 ? { value: column1, label: column1 } : null,
            onColumn2: column2 ? { value: column2, label: column2 } : null,
            joinType: { value: joinType, label: joinType },
          });
        }
      }
      setQueryState((prev) => ({ ...prev, joinClauses }));

      const columnMatch = mainQuery.match(/SELECT\s+(.+?)\s+FROM/i);
      if (columnMatch) {
        const columns = columnMatch[1]
          .split(",")
          .map((col) => col.trim())
          .filter((col) => col !== "");

        // Parse CASE clause
        const caseMatch = columns.find((col) =>
          col.match(/CASE\s+WHEN.*END(?:\s+AS\s+\w+)?/i)
        );
        if (caseMatch) {
          const caseClauseMatch = caseMatch.match(
            /CASE\s+((?:WHEN\s+(.*?)\s+THEN\s+([^;]+?)\s*)+)(?:ELSE\s+([^;]+?))?\s*END(?:\s+AS\s+(['"]?[\w]+['"]?))?/i
          );
          if (caseClauseMatch) {
            const [, whenClauses, , elseValue, alias] = caseClauseMatch;
            const whenMatches = whenClauses.matchAll(
              /WHEN\s+((?:[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*\s*(?:=|>|<|>=|<=|!=|IS NULL|IS NOT NULL|LIKE)\s*(?:'[^']*'|[0-9]+(?:\.[0-9]+)?)?\s*(?:OR\s+[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*\s*(?:=|>|<|>=|<=|!=|IS NULL|IS NOT NULL|LIKE)\s*(?:'[^']*'|[0-9]+(?:\.[0-9]+)?)?)*))\s*THEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?|[a-zA-Z_][a-zA-Z0-9_]*)/gi
            );
            const conditionsParsed: CaseCondition[] = Array.from(whenMatches)
              .flatMap((match) => {
                const [, conditionsStr, result] = match;
                const conditionMatches = conditionsStr.matchAll(
                  /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*(=|>|<|>=|<=|!=|IS NULL|IS NOT NULL|LIKE)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)?/gi
                );
                return Array.from(conditionMatches).map((condMatch) => {
                  const [, column, operator, value] = condMatch;
                  return {
                    column: column
                      ? {
                          value: stripQuotes(column),
                          label: stripQuotes(column),
                        }
                      : null,
                    operator: operator
                      ? { value: operator, label: operator }
                      : null,
                    value:
                      operator === "IS NULL" ||
                      operator === "IS NOT NULL" ||
                      !value ||
                      value === "''"
                        ? null
                        : {
                            value: stripQuotes(value),
                            label: stripQuotes(value),
                          },
                    result: result
                      ? {
                          value: stripQuotes(result),
                          label: stripQuotes(result),
                        }
                      : null,
                  };
                });
              })
              .filter((c) => c.column && c.operator && c.result);

            setQueryState((prev) => ({
              ...prev,
              caseClause: {
                conditions: conditionsParsed,
                elseValue: elseValue
                  ? {
                      value: stripQuotes(elseValue),
                      label: stripQuotes(elseValue),
                    }
                  : null,
                alias: alias ? stripQuotes(alias) : null,
              },
            }));
            columns.splice(columns.indexOf(caseMatch), 1);
          } else {
            setQueryState((prev) => ({
              ...prev,
              caseClause: { conditions: [], elseValue: null, alias: null },
            }));
          }
        } else {
          setQueryState((prev) => ({
            ...prev,
            caseClause: { conditions: [], elseValue: null, alias: null },
          }));
        }

        // Parse aggregate
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

        const allAvailableColumns: SelectOption[] = [
          ...(cteClauses[0]?.alias && cteClauses[0]?.selectedColumns
            ? (cteClauses[0].selectedColumns as SelectOption[])
            : tableColumns[tableNameMatch]?.map((col) => ({
                value: `${tableNameMatch}.${col}`,
                label: `${tableNameMatch}.${col}`,
              })) || []),
          ...joinClauses
            .filter((join) => join.table?.value)
            .flatMap(
              (join) =>
                tableColumns[join.table!.value]?.map((col) => ({
                  value: `${join.table!.value}.${col}`,
                  label: `${join.table!.value}.${col}`,
                })) || []
            ),
        ];

        setQueryState((prev) => ({
          ...prev,
          selectedColumns:
            columns.length > 0 &&
            (typeof columns[0] === "string"
              ? columns[0] !== "*"
              : (columns[0] as SelectOption).value !== "*")
              ? (columns as ColumnType[])
                  .filter((col) =>
                    allAvailableColumns.some((avail) => {
                      const colValue =
                        typeof col === "string" ? stripQuotes(col) : col.value;
                      return colValue === avail.value;
                    })
                  )
                  .map((col) => ({
                    value:
                      typeof col === "string" ? stripQuotes(col) : col.value,
                    label:
                      typeof col === "string" ? stripQuotes(col) : col.label,
                  }))
              : allAvailableColumns,
        }));
      }

      const whereMatch = mainQuery.match(
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
          uniqueValues: {
            ...prev.uniqueValues,
            condition1: [],
            condition2: [],
          },
          fetchError: null,
        }));
      }

      const groupByMatch = mainQuery.match(/\bGROUP\s+BY\s+([^;]+)/i);
      if (groupByMatch && tableNameMatch) {
        const groupByItems = groupByMatch[1]
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          .filter((item) => item);
        const selectMatch = mainQuery.match(/SELECT\s+(.+?)\s+FROM/i);
        const selectColumns = selectMatch
          ? selectMatch[1]
              .split(",")
              .map((col) => stripQuotes(col.trim()))
              .filter((col) => col && !col.match(/CASE\s+WHEN.*END/i))
              .map((col) =>
                col.replace(
                  /^(SUM|MAX|MIN|AVG|ROUND|COUNT)\((.*?)(?:,\s*\d+)?\)$/i,
                  "$1($2)"
                )
              )
          : [];

        const allAvailableColumns = [
          ...(cteClauses[0]?.alias && cteClauses[0]?.selectedColumns
            ? cteClauses[0].selectedColumns.map((col) => col.value)
            : tableColumns[tableNameMatch]?.map(
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

      const havingMatch = mainQuery.match(
        /\bHAVING\s+(.+?)(?=\s*(ORDER\s+BY|LIMIT|$))/i
      );
      if (havingMatch && tableNameMatch) {
        const havingText = havingMatch[1];
        const conditionStrings = havingText
          .split(/(AND|OR)/i)
          .map((part) => part.trim())
          .filter((part) => part && !part.match(/AND|OR/i));
        const logicalOperators = havingText.match(/(AND|OR)/gi) || [];

        const havingConditions: HavingCondition[] = conditionStrings
          .map((condition, index) => {
            const match: RegExpMatchArray | null = condition.match(
              /(COUNT\(\*\)|(?:SUM|MAX|MIN|AVG|ROUND)\((.*?)\))\s*(=|>|<|>=|<=|!=)\s*([0-9]+(?:\.[0-9]+)?|\w+)/i
            );
            if (!match) return null;
            const [, aggregate, column, operator, value] = match;
            return {
              aggregate: aggregate
                ? { value: aggregate, label: aggregate }
                : null,
              column: column
                ? { value: stripQuotes(column), label: stripQuotes(column) }
                : null,
              operator: operator ? { value: operator, label: operator } : null,
              value: value || null,
              logicalOperator:
                index > 0 && logicalOperators[index - 1]
                  ? {
                      value: logicalOperators[index - 1],
                      label: logicalOperators[index - 1],
                    }
                  : null,
            };
          })
          .filter(
            (c): c is HavingCondition =>
              !!c &&
              c.aggregate !== null &&
              c.operator !== null &&
              c.value !== null
          );

        setQueryState((prev) => ({
          ...prev,
          havingClause: { conditions: havingConditions },
        }));
      } else {
        setQueryState((prev) => ({
          ...prev,
          havingClause: { conditions: [] },
        }));
      }

      const orderByMatch = mainQuery.match(
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
    handleHavingAggregateSelect,
    handleHavingColumnSelect,
    handleHavingOperatorSelect,
    handleHavingValueChange,
    handleOrderByColumnSelect,
    handleOrderByDirectionSelect,
    handleLimitSelect,
    handleJoinTypeSelect,
    handleJoinTableSelect,
    handleJoinOnColumn1Select,
    handleJoinOnColumn2Select,
    addJoinClause,
    removeJoinClause,
    handleUnionTableSelect,
    handleUnionTypeSelect,
    addUnionClause,
    removeUnionClause,
    handleCaseColumnSelect,
    handleCaseOperatorSelect,
    handleCaseValueSelect,
    handleCaseResultSelect,
    handleElseResultSelect,
    handleCaseAliasChange,
    addCaseCondition,
    removeCaseCondition,
    addCteClause,
    removeCteClause,
    handleCteAliasChange,
    handleCteTableSelect,
    handleCteColumnSelect,
    handleCteLogicalOperatorSelect,
    handleCteWhereColumnSelect,
    handleCteOperatorSelect,
    handleCteValueSelect,
    operatorOptions,
    logicalOperatorOptions,
  };
};
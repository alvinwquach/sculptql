"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import Select, {
  MultiValue,
  SingleValue,
  StylesConfig,
  GroupBase,
} from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Wand2, AlertCircle } from "lucide-react";
import QueryTabs from "./QueryTabs";
import {
  SelectOption,
  Tab,
  TableColumn,
  WhereClause,
  OrderByClause,
} from "@/app/types/query";
import { EditorView, keymap, drawSelection } from "@codemirror/view";
import {
  autocompletion,
  startCompletion,
  CompletionSource,
} from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState, Compartment } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import { format as formatSQL } from "sql-formatter";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";

interface EditorPaneProps {
  queryTabs: Tab[];
  activeTab: number;
  fullScreenEditor: boolean;
  onToggleFullscreen: () => void;
  onTabClick: (id: number) => void;
  onTabClose: (id: number) => void;
  onQueryChange: (query: string) => void;
  onTabReorder: (newTabs: Tab[]) => void;
  completion: CompletionSource;
  metadataLoading: boolean;
  runQuery: () => void;
  tableNames: string[];
  tableColumns: TableColumn;
}

export default function EditorPane({
  queryTabs,
  activeTab,
  fullScreenEditor,
  onToggleFullscreen,
  onTabClick,
  onTabClose,
  onQueryChange,
  onTabReorder,
  completion,
  metadataLoading,
  runQuery,
  tableNames,
  tableColumns,
}: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<SelectOption[]>([]);
  const [selectedAggregate, setSelectedAggregate] =
    useState<SelectOption | null>(null);
  const [aggregateColumn, setAggregateColumn] = useState<SelectOption | null>(
    null
  );
  const [decimalPlaces, setDecimalPlaces] = useState<SelectOption | null>(null);
  const [whereClause, setWhereClause] = useState<WhereClause>({
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
  });
  const [orderByClause, setOrderByClause] = useState<OrderByClause>({
    column: null,
    direction: null,
  });
  const [groupByColumns, setGroupByColumns] = useState<SelectOption[]>([]);
  const [limit, setLimit] = useState<SelectOption | null>(null);
  const [uniqueValues, setUniqueValues] = useState<
    Record<string, SelectOption[]>
  >({ condition1: [], condition2: [] });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const isInitialRender = useRef(true);

  const tableOptions: SelectOption[] = tableNames.map((name) => ({
    value: name,
    label: name,
  }));

  const columnOptions: SelectOption[] = selectedTable
    ? [
        { value: "*", label: "* (All Columns)" },
        ...(tableColumns[selectedTable.value]?.map((col) => ({
          value: col,
          label: col,
        })) || []),
      ]
    : [];

  const aggregateOptions: SelectOption[] = [
    { value: "COUNT(*)", label: "COUNT(*) – Count all rows", aggregate: true },
    { value: "SUM", label: "SUM() – Total of values", aggregate: true },
    { value: "MAX", label: "MAX() – Largest value", aggregate: true },
    { value: "MIN", label: "MIN() – Smallest value", aggregate: true },
    { value: "AVG", label: "AVG() – Average value", aggregate: true },
    { value: "ROUND", label: "ROUND() – Round values", aggregate: true },
  ];

  const aggregateColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  const groupByColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  const decimalPlacesOptions: SelectOption[] = [
    { value: "0", label: "0" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
  ];

  const whereColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  const orderByColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  const directionOptions: SelectOption[] = [
    { value: "ASC", label: "Ascending (A-Z, low-high)" },
    { value: "DESC", label: "Descending (Z-A, high-low)" },
  ];

  const limitOptions: SelectOption[] = [
    { value: "1", label: "1" },
    { value: "3", label: "3" },
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const operatorOptions = useMemo(
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

  useEffect(() => {
    if (!selectedTable) {
      setUniqueValues({ condition1: [], condition2: [] });
      setFetchError(null);
      return;
    }
    const fetchUniqueValues = async (conditionIndex: number) => {
      const condition = whereClause.conditions[conditionIndex];
      if (!condition.column) {
        setUniqueValues((prev) => ({
          ...prev,
          [`condition${conditionIndex + 1}`]: [],
        }));
        return;
      }
      try {
        const res = await fetch(
          `/api/unique-values?table=${encodeURIComponent(
            selectedTable.value
          )}&column=${encodeURIComponent(condition.column!.value)}`
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
        setUniqueValues((prev) => ({
          ...prev,
          [`condition${conditionIndex + 1}`]: values,
        }));
        setFetchError(null);
      } catch (e) {
        const message = (e as Error).message || "Failed to fetch unique values";
        console.error(
          `Error fetching unique values for condition ${conditionIndex + 1}:`,
          message
        );
        setFetchError(message);
        setUniqueValues((prev) => ({
          ...prev,
          [`condition${conditionIndex + 1}`]: [],
        }));
      }
    };
    fetchUniqueValues(0);
    fetchUniqueValues(1);
  }, [selectedTable, whereClause.conditions]);

  const buildQuery = useCallback(() => {
    let columns: string;
    if (selectedAggregate) {
      if (selectedAggregate.value === "COUNT(*)") {
        columns = selectedAggregate.value;
      } else if (
        ["SUM", "MAX", "MIN", "AVG"].includes(selectedAggregate.value) &&
        aggregateColumn
      ) {
        columns = `${selectedAggregate.value}(${
          needsQuotes(aggregateColumn.value)
            ? `"${aggregateColumn.value}"`
            : aggregateColumn.value
        })`;
      } else if (
        selectedAggregate.value === "ROUND" &&
        aggregateColumn &&
        decimalPlaces &&
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
              needsQuotes(col.value) ? `"${col.value}"` : col.value
            )
            .join(", ");
      }
    } else {
      columns = selectedColumns.length
        ? selectedColumns
            .map((col) =>
              needsQuotes(col.value) ? `"${col.value}"` : col.value
            )
            .join(", ")
        : "*";
    }
    let query = selectedTable
      ? `SELECT ${columns} FROM ${
          needsQuotes(selectedTable.value)
            ? `"${selectedTable.value}"`
            : selectedTable.value
        } `
      : "";
    const validConditions = whereClause.conditions.filter(
      (c) =>
        c.column &&
        c.operator &&
        (c.operator.value === "IS NULL" ||
          c.operator.value === "IS NOT NULL" ||
          (c.value && c.value.value.trim() !== ""))
    );
    if (validConditions.length > 0) {
      query += "WHERE ";
      query += validConditions
        .map((condition) => {
          const column = needsQuotes(condition.column!.value)
            ? `"${condition.column!.value}"`
            : condition.column!.value;
          let conditionStr = `${column} ${condition.operator!.value}`;
          if (
            condition.operator!.value === "BETWEEN" &&
            condition.value &&
            condition.value2 &&
            condition.value.value.trim() !== "" &&
            condition.value2.value.trim() !== ""
          ) {
            conditionStr += ` '${condition.value.value}' AND '${condition.value2.value}'`;
          } else if (
            condition.value &&
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
      const aggregateColumnName = selectedAggregate
        ? selectedAggregate.value === "COUNT(*)"
          ? selectedAggregate.value
          : `${selectedAggregate.value}(${aggregateColumn?.value || ""}${
              selectedAggregate.value === "ROUND" && decimalPlaces
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
            : needsQuotes(col.value)
            ? `"${col.value}"`
            : col.value;
        })
        .join(", ");
      query += ` GROUP BY ${groupByClause}`;
    }
    if (orderByClause.column && orderByClause.direction) {
      const column = needsQuotes(orderByClause.column.value)
        ? `"${orderByClause.column.value}"`
        : orderByClause.column.value;
      query += ` ORDER BY ${column} ${orderByClause.direction.value}`;
    }
    if (
      limit &&
      limit.value.trim() !== "" &&
      !isNaN(Number(limit.value)) &&
      Number(limit.value) > 0
    ) {
      query += ` LIMIT ${limit.value}`;
    }
    return query;
  }, [
    selectedTable,
    selectedColumns,
    selectedAggregate,
    aggregateColumn,
    decimalPlaces,
    whereClause,
    orderByClause,
    groupByColumns,
    limit,
  ]);

  const handleTableSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setSelectedTable(newValue);
      setSelectedColumns([]);
      setSelectedAggregate(null);
      setAggregateColumn(null);
      setDecimalPlaces(null);
      setWhereClause({
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
      });
      setOrderByClause({ column: null, direction: null });
      setGroupByColumns([]);
      setLimit(null);
      setUniqueValues({ condition1: [], condition2: [] });
      setFetchError(null);
      const query = newValue
        ? `SELECT * FROM ${
            needsQuotes(newValue.value) ? `"${newValue.value}"` : newValue.value
          } `
        : "";
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
      setTimeout(() => onQueryChange(query), 0);
    },
    [onQueryChange]
  );

  const handleColumnSelect = useCallback(
    (newValue: MultiValue<SelectOption>) => {
      if (!selectedTable) {
        setSelectedColumns([]);
        setSelectedAggregate(null);
        setAggregateColumn(null);
        setDecimalPlaces(null);
        setWhereClause({
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
        });
        setOrderByClause({ column: null, direction: null });
        setGroupByColumns([]);
        setLimit(null);
        setUniqueValues({ condition1: [], condition2: [] });
        setFetchError(null);
        setTimeout(() => onQueryChange(""), 0);
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: "",
            },
          });
        }
        return;
      }

      const includesStar = newValue.some((option) => option.value === "*");
      let columnsToSelect: SelectOption[] = [];
      if (includesStar) {
        columnsToSelect =
          tableColumns[selectedTable.value]?.map((col) => ({
            value: col,
            label: col,
          })) || [];
      } else {
        columnsToSelect = newValue as SelectOption[];
      }

      setSelectedColumns(columnsToSelect);
      const query = buildQuery();
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
      setTimeout(() => onQueryChange(query), 0);
    },
    [selectedTable, tableColumns, buildQuery, onQueryChange]
  );

  const handleAggregateSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setSelectedAggregate(newValue);
      setAggregateColumn(null);
      setDecimalPlaces(null);
      const query = buildQuery();
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
      setTimeout(() => onQueryChange(query), 0);
    },
    [buildQuery, onQueryChange]
  );

  const handleAggregateColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setAggregateColumn(newValue);
      const query = buildQuery();
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
      setTimeout(() => onQueryChange(query), 0);
    },
    [buildQuery, onQueryChange]
  );

  const handleDecimalPlacesSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setDecimalPlaces(
        newValue &&
          !isNaN(Number(newValue.value)) &&
          Number(newValue.value) >= 0
          ? newValue
          : null
      );
      const query = buildQuery();
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
      setTimeout(() => onQueryChange(query), 0);
    },
    [buildQuery, onQueryChange]
  );

  const handleGroupByColumnsSelect = useCallback(
    (newValue: MultiValue<SelectOption>) => {
      setGroupByColumns(newValue as SelectOption[]);
      const query = buildQuery();
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
      setTimeout(() => onQueryChange(query), 0);
    },
    [buildQuery, onQueryChange]
  );

  const handleLogicalOperatorSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        newConditions[0] = { ...newConditions[0], logicalOperator: newValue };
        const newClause = { conditions: newConditions };
        const query = buildQuery();
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: query,
            },
          });
        }
        setTimeout(() => onQueryChange(query), 0);
        return newClause;
      });
    },
    [buildQuery, onQueryChange]
  );

  const handleWhereColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          column: newValue,
          operator: null,
          value: null,
          value2: null,
        };
        const newClause = { conditions: newConditions };
        const query = buildQuery();
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: query,
            },
          });
        }
        setTimeout(() => onQueryChange(query), 0);
        return newClause;
      });
      setUniqueValues((prev) => ({
        ...prev,
        [`condition${conditionIndex + 1}`]: [],
      }));
      setFetchError(null);
    },
    [buildQuery, onQueryChange]
  );

  const handleOperatorSelect = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          operator: newValue,
          value: null,
          value2: null,
        };
        const newClause = { conditions: newConditions };
        const query = buildQuery();
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: query,
            },
          });
        }
        setTimeout(() => onQueryChange(query), 0);
        return newClause;
      });
    },
    [buildQuery, onQueryChange]
  );

  const handleValue1Select = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        if (
          !newConditions[conditionIndex].operator ||
          !newConditions[conditionIndex].column ||
          (newValue && newValue.value.trim() === "")
        ) {
          newConditions[conditionIndex] = {
            ...newConditions[conditionIndex],
            value: null,
            value2: null,
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
        const newClause = { conditions: newConditions };
        const query = buildQuery();
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: query,
            },
          });
        }
        setTimeout(() => onQueryChange(query), 0);
        return newClause;
      });
    },
    [buildQuery, onQueryChange]
  );

  const handleValue2Select = useCallback(
    (newValue: SingleValue<SelectOption>, conditionIndex: number) => {
      setWhereClause((prev) => {
        const newConditions = [...prev.conditions];
        if (
          !newConditions[conditionIndex].operator ||
          newConditions[conditionIndex].operator?.value !== "BETWEEN" ||
          (newValue && newValue.value.trim() === "")
        ) {
          return prev;
        }
        newConditions[conditionIndex] = {
          ...newConditions[conditionIndex],
          value2: newValue,
        };
        const newClause = { conditions: newConditions };
        const query = buildQuery();
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: query,
            },
          });
        }
        setTimeout(() => onQueryChange(query), 0);
        return newClause;
      });
    },
    [buildQuery, onQueryChange]
  );

  const handleOrderByColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setOrderByClause((prev) => {
        const newClause = {
          ...prev,
          column: newValue,
          direction: prev.direction || directionOptions[0],
        };
        const query = buildQuery();
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: query,
            },
          });
        }
        setTimeout(() => onQueryChange(query), 0);
        return newClause;
      });
    },
    [buildQuery, onQueryChange, directionOptions]
  );

  const handleOrderByDirectionSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setOrderByClause((prev) => {
        const newClause = { ...prev, direction: newValue };
        const query = buildQuery();
        if (editorRef.current) {
          editorRef.current.dispatch({
            changes: {
              from: 0,
              to: editorRef.current.state.doc.length,
              insert: query,
            },
          });
        }
        setTimeout(() => onQueryChange(query), 0);
        return newClause;
      });
    },
    [buildQuery, onQueryChange]
  );

  const handleLimitSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setLimit(
        newValue && !isNaN(Number(newValue.value)) && Number(newValue.value) > 0
          ? newValue
          : null
      );
      const query = buildQuery();
      if (editorRef.current) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: query,
          },
        });
      }
      setTimeout(() => onQueryChange(query), 0);
    },
    [buildQuery, onQueryChange]
  );

  const formatQuery = useCallback(() => {
    if (!editorRef.current) return;
    const currentText = editorRef.current.state.doc.toString();
    if (!currentText) return;
    try {
      const formatted = formatSQL(currentText, {
        language: "postgresql",
        keywordCase: "upper",
      });
      editorRef.current.dispatch({
        changes: {
          from: 0,
          to: editorRef.current.state.doc.length,
          insert: formatted,
        },
      });
      onQueryChange(formatted);
    } catch (err) {
      console.error("SQL formatting failed:", err);
    }
  }, [onQueryChange]);

  const updateGroupByClause = (query: string): void => {
    const groupByMatch = query.match(/\bGROUP\s+BY\s+([^;]+)/i);
    if (groupByMatch && selectedTable) {
      const groupByItems = groupByMatch[1]
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
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

      const groupByColumns: SelectOption[] = groupByItems
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
              return tableColumns[selectedTable.value].includes(columnName)
                ? { value: columnName, label: columnName }
                : null;
            }
            return null;
          }
          const cleanItem = stripQuotes(item);
          return tableColumns[selectedTable.value].includes(cleanItem)
            ? { value: cleanItem, label: cleanItem }
            : null;
        })
        .filter((item): item is SelectOption => item !== null);

      setGroupByColumns(groupByColumns);
    } else {
      setGroupByColumns([]);
    }
  };

  const updateWhereClause = (query: string): void => {
    const whereMatch = query.match(
      /WHERE\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(IS NULL|IS NOT NULL|BETWEEN|[=!><]=?|LIKE)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)?(?:\s+AND\s+('[^']*'|[0-9]+(?:\.[0-9]+)?))?\s*(AND|OR)?\s*((?:"[\w]+"|'[\w]+'|[\w_]+))?\s*(IS NULL|IS NOT NULL|BETWEEN|[=!><]=?|LIKE)?\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)?(?:\s+AND\s+('[^']*'|[0-9]+(?:\.[0-9]+)?))?/i
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
      setWhereClause({
        conditions: [
          {
            column: column1
              ? { value: stripQuotes(column1), label: stripQuotes(column1) }
              : null,
            operator:
              operator1 &&
              operatorOptions.find((opt) => opt.value === operator1)
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
            operator:
              operator2 &&
              operatorOptions.find((opt) => opt.value === operator2)
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
      });
    } else {
      setWhereClause({
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
      });
      setUniqueValues({ condition1: [], condition2: [] });
      setFetchError(null);
    }
  };

  const updateOrderByClause = (query: string): void => {
    const orderByMatch = query.match(
      /\bORDER\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(ASC|DESC)?\s*(?:LIMIT\s+(\d+))?/i
    );
    if (orderByMatch) {
      const [, column, direction, limitValue] = orderByMatch;
      setOrderByClause({
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
      });
      setLimit(
        limitValue && !isNaN(Number(limitValue)) && Number(limitValue) > 0
          ? { value: limitValue, label: limitValue }
          : null
      );
    } else {
      setOrderByClause({ column: null, direction: null });
      setLimit(null);
    }
  };

  const updateColumnAndAggregateSelection = (
    query: string,
    tableName: string
  ): void => {
    const columnMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
    if (!columnMatch) {
      setSelectedAggregate(null);
      setAggregateColumn(null);
      setDecimalPlaces(null);
      setSelectedColumns([]);
      return;
    }
    const columns: string[] = columnMatch[1]
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
        setSelectedAggregate({
          value: "COUNT(*)",
          label: "COUNT(*)",
          aggregate: true,
        });
        setAggregateColumn(null);
        setDecimalPlaces(null);
      } else if (aggregateMatch.match(/^(SUM|MAX|MIN|AVG)\((.+)\)$/i)) {
        const [aggFunc, column] = aggregateMatch
          .match(/^(SUM|MAX|MIN|AVG)\((.+)\)$/i)!
          .slice(1);
        setSelectedAggregate({
          value: aggFunc,
          label: `${aggFunc}()`,
          aggregate: true,
        });
        setAggregateColumn({
          value: stripQuotes(column),
          label: stripQuotes(column),
        });
        setDecimalPlaces(null);
      } else if (aggregateMatch.match(/^ROUND\((.+),\s*(\d+)\)$/i)) {
        const [, column, decimals] = aggregateMatch.match(
          /^ROUND\((.+),\s*(\d+)\)$/i
        )!;
        setSelectedAggregate({
          value: "ROUND",
          label: "ROUND()",
          aggregate: true,
        });
        setAggregateColumn({
          value: stripQuotes(column),
          label: stripQuotes(column),
        });
        setDecimalPlaces({
          value: decimals,
          label: decimals,
        });
      }
      columns.splice(columns.indexOf(aggregateMatch), 1);
    } else {
      setSelectedAggregate(null);
      setAggregateColumn(null);
      setDecimalPlaces(null);
    }

    if (columns.length > 0 && columns[0] !== "*") {
      setSelectedColumns(
        columns
          .filter((col) => tableColumns[tableName]?.includes(col))
          .map((col) => ({ value: col, label: col }))
      );
    } else {
      setSelectedColumns(
        tableColumns[tableName]?.map((col) => ({
          value: col,
          label: col,
        })) || []
      );
    }
  };

  useEffect(() => {
    if (!containerRef.current || editorRef.current || metadataLoading) return;

    const updateQueryOnChange = ViewPlugin.define(
      () => ({
        update: (update) => {
          if (!update.docChanged || isInitialRender.current) return;
          const newQuery: string = update.state.doc.toString();
          onQueryChange(newQuery);
          const tableName: string | null = extractTableName(newQuery);
          if (!tableName || !tableNames.includes(tableName)) {
            resetQueryState();
            return;
          }
          updateTableSelection(tableName);
          updateColumnAndAggregateSelection(newQuery, tableName);
          updateWhereClause(newQuery);
          updateGroupByClause(newQuery);
          updateOrderByClause(newQuery);
        },
      }),
      {
        eventHandlers: {
          mount: () => {
            isInitialRender.current = false;
          },
        },
      }
    );

    const extractTableName = (query: string): string | null => {
      const tableMatch = query.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      return tableMatch ? tableMatch[1] : null;
    };

    const resetQueryState = (): void => {
      setSelectedTable(null);
      setSelectedColumns([]);
      setSelectedAggregate(null);
      setAggregateColumn(null);
      setDecimalPlaces(null);
      setWhereClause({
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
      });
      setOrderByClause({ column: null, direction: null });
      setGroupByColumns([]);
      setLimit(null);
      setUniqueValues({ condition1: [], condition2: [] });
      setFetchError(null);
    };

    const updateTableSelection = (tableName: string): void => {
      setSelectedTable((prev) =>
        prev?.value === tableName
          ? prev
          : { value: tableName, label: tableName }
      );
    };

    const customTheme = EditorView.theme(
      {
        "&": {
          backgroundColor: "#0f172a",
          color: "#f8f9fa",
          fontSize: "clamp(12px, 3vw, 14px)",
          height: "100%",
        },
        ".cm-content": {
          caretColor: "#22c55e",
          paddingRight: "1.5rem",
          minHeight: "150px",
        },
        ".cm-line": { backgroundColor: "transparent" },
        ".cm-keyword": { color: "#f8f9fa !important" },
        ".cm-operator": { color: "#f8f9fa !important" },
        ".cm-variableName": { color: "#f8f9fa !important" },
        ".cm-string": { color: "#f8f9fa" },
        ".cm-comment": { color: "#4a4a4a", fontStyle: "italic" },
        ".cm-attribute": { color: "#f8f9fa" },
        ".cm-property": { color: "#f8f9fa" },
        ".cm-atom": { color: "#f8f9fa" },
        ".cm-number": { color: "#f8f9fa" },
        ".cm-def": { color: "#f8f9fa" },
        ".cm-variable-2": { color: "#f8f9fa" },
        ".cm-tag": { color: "#f8f9fa" },
        "&.cm-focused .cm-cursor": { borderLeftColor: "#22c55e" },
        "&.cm-focused .cm-selectionBackground, ::selection": {
          backgroundColor: "rgba(34, 197, 94, 0.1)",
        },
        ".cm-gutters": {
          backgroundColor: "#0f172a",
          color: "#22c55e",
          border: "none",
        },
        ".cm-gutter": { background: "#0f172a", border: "none" },
        ".cm-active-line": { backgroundColor: "rgba(34, 197, 94, 0.05)" },
      },
      { dark: true }
    );

    const state = EditorState.create({
      doc: queryTabs.find((tab) => tab.id === activeTab)?.query || "",
      extensions: [
        keymap.of([
          {
            key: isMac ? "Cmd-Shift-f" : "Ctrl-Shift-f",
            run: () => {
              formatQuery();
              return true;
            },
          },
          {
            key: isMac ? "Cmd-Enter" : "Ctrl-Enter",
            run: () => {
              runQuery();
              return true;
            },
          },
          { key: "Ctrl-Space", run: startCompletion },
          indentWithTab,
          ...defaultKeymap,
        ]),
        languageCompartment.current.of(sql()),
        autocompletion({ override: [completion], activateOnTyping: true }),
        drawSelection(),
        customTheme,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        updateQueryOnChange,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
      isInitialRender.current = true;
    };
  }, [
    runQuery,
    metadataLoading,
    activeTab,
    queryTabs,
    onQueryChange,
    formatQuery,
    isMac,
    tableNames,
    tableColumns,
    completion,
  ]);

  useEffect(() => {
    if (editorRef.current) {
      const currentTab = queryTabs.find((tab) => tab.id === activeTab);
      const currentQuery = currentTab?.query || "";
      if (editorRef.current.state.doc.toString() !== currentQuery) {
        editorRef.current.dispatch({
          changes: {
            from: 0,
            to: editorRef.current.state.doc.length,
            insert: currentQuery,
          },
        });
        editorRef.current.focus();
      }
    }
  }, [activeTab, queryTabs]);

  const selectStyles: StylesConfig<SelectOption, true> = {
    control: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: "#1e293b",
      borderColor: state.isFocused ? "#3b82f6" : "#334155",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      "&:hover": { borderColor: "#3b82f6" },
      color: "#f8f9fa",
      borderRadius: "0.375rem",
      fontSize: "12px",
      minHeight: "28px",
      padding: "0.1rem",
      lineHeight: "1.25",
      width: "100%",
    }),
    singleValue: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
      fontSize: "12px",
    }),
    multiValue: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#3b82f6",
      borderRadius: "0.25rem",
      margin: "0.05rem",
    }),
    multiValueLabel: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
      fontSize: "12px",
      padding: "0.1rem 0.2rem",
    }),
    multiValueRemove: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
      borderRadius: "0.25rem",
      "&:hover": { backgroundColor: "#2563eb", color: "#fff" },
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "0.375rem",
      marginTop: "0.1rem",
      zIndex: 20,
      width: "100%",
      overflowY: "auto",
    }),
    option: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#334155"
        : "#1e293b",
      color: "#f8f9fa",
      "&:active": { backgroundColor: "#2563eb" },
      padding: "0.3rem 0.5rem",
      fontSize: "12px",
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      fontSize: "12px",
    }),
    input: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
      fontSize: "12px",
    }),
    dropdownIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
      padding: "0.1rem",
    }),
    clearIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
      padding: "0.1rem",
    }),
  };

  const singleSelectStyles: StylesConfig<
    SelectOption,
    false,
    GroupBase<SelectOption>
  > = {
    control: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: "#1e293b",
      borderColor: state.isFocused ? "#3b82f6" : "#334155",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      "&:hover": { borderColor: "#3b82f6" },
      color: "#f8f9fa",
      borderRadius: "0.375rem",
      fontSize: "12px",
      minHeight: "28px",
      padding: "0.1rem",
      lineHeight: "1.25",
      width: "100%",
    }),
    singleValue: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
      fontSize: "12px",
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "0.375rem",
      marginTop: "0.1rem",
      zIndex: 20,
      width: "100%",
      overflowY: "auto",
    }),
    option: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#334155"
        : "#1e293b",
      color: "#f8f9fa",
      "&:active": { backgroundColor: "#2563eb" },
      padding: "0.3rem 0.5rem",
      fontSize: "12px",
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      fontSize: "12px",
    }),
    input: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
      fontSize: "12px",
    }),
    dropdownIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
      padding: "0.1rem",
    }),
    clearIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
      padding: "0.1rem",
    }),
  };

  return (
    <div
      className={`flex-1 ${
        fullScreenEditor ? "fixed inset-0 z-50" : "lg:w-1/2"
      } flex flex-col bg-[#0f172a] border-b lg:border-b-0 lg:border-r border-slate-700`}
    >
      <QueryTabs
        queryTabs={queryTabs}
        activeTab={activeTab}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        onTabReorder={onTabReorder}
      />
      <div className="flex flex-col gap-2 p-2 border-b border-slate-700">
        {fetchError && (
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{fetchError}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#f8f9fa] mb-1">Table</label>
          <Select
            options={tableOptions}
            value={selectedTable}
            onChange={handleTableSelect}
            placeholder="Select a table"
            isClearable
            isDisabled={metadataLoading}
            styles={singleSelectStyles}
            className="min-w-0 w-full"
          />
        </div>
        <div className="flex flex-row items-center gap-2 w-full">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-[#f8f9fa] mb-1">
              Aggregate Function
            </label>
            <Select
              options={aggregateOptions}
              value={selectedAggregate}
              onChange={handleAggregateSelect}
              placeholder="Select aggregate function"
              isClearable
              isDisabled={!selectedTable || metadataLoading}
              styles={singleSelectStyles}
              className="min-w-0 w-full"
            />
          </div>
          {["SUM", "MAX", "MIN", "AVG", "ROUND"].includes(
            selectedAggregate?.value || ""
          ) && (
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-[#f8f9fa] mb-1">
                Aggregate Column
              </label>
              <Select
                options={aggregateColumnOptions}
                value={aggregateColumn}
                onChange={handleAggregateColumnSelect}
                placeholder={`Select column for ${selectedAggregate?.value}`}
                isClearable
                isDisabled={!selectedTable || metadataLoading}
                styles={singleSelectStyles}
                className="min-w-0 w-full"
              />
            </div>
          )}
          {selectedAggregate?.value === "ROUND" && aggregateColumn && (
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-[#f8f9fa] mb-1">
                Decimal Places
              </label>
              <CreatableSelect
                options={decimalPlacesOptions}
                value={decimalPlaces}
                onChange={handleDecimalPlacesSelect}
                placeholder="Select or enter decimal places"
                isClearable
                isDisabled={
                  !selectedTable || !aggregateColumn || metadataLoading
                }
                styles={singleSelectStyles}
                className="min-w-0 w-full"
                formatCreateLabel={(inputValue) => inputValue}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#f8f9fa] mb-1">Columns</label>
          <Select
            options={columnOptions}
            value={selectedColumns}
            onChange={handleColumnSelect}
            placeholder="Select columns"
            isMulti
            isDisabled={!selectedTable || metadataLoading}
            styles={selectStyles}
            className="min-w-0 w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#f8f9fa] mb-1">Group By</label>
          <Select
            options={groupByColumnOptions}
            value={groupByColumns}
            onChange={handleGroupByColumnsSelect}
            placeholder="Select columns to group by"
            isMulti
            isClearable
            isDisabled={!selectedTable || metadataLoading}
            styles={selectStyles}
            className="min-w-0 w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          {whereClause.conditions.map((condition, index) => (
            <div
              key={index}
              className="flex flex-row items-center gap-2 w-full"
            >
              {index === 1 && (
                <div className="flex flex-col gap-1 w-1/4">
                  <label className="text-xs text-[#f8f9fa] mb-1">Filter</label>
                  <Select
                    options={logicalOperatorOptions}
                    value={whereClause.conditions[0].logicalOperator}
                    onChange={handleLogicalOperatorSelect}
                    placeholder="Filter"
                    isDisabled={!selectedTable || metadataLoading}
                    styles={singleSelectStyles}
                    className="min-w-0 w-full"
                  />
                </div>
              )}
              <div
                className={
                  index === 0
                    ? "flex flex-col gap-1 w-1/4"
                    : "flex flex-col gap-1 w-1/4"
                }
              >
                <label className="text-xs text-[#f8f9fa] mb-1">
                  {index === 0 ? "Column (Where)" : "Column (And)"}
                </label>
                <Select
                  options={whereColumnOptions}
                  value={condition.column}
                  onChange={(value) => handleWhereColumnSelect(value, index)}
                  placeholder="Column"
                  isClearable
                  isDisabled={!selectedTable || metadataLoading}
                  styles={singleSelectStyles}
                  className="min-w-0 w-full"
                />
              </div>
              <div
                className={
                  index === 0
                    ? "flex flex-col gap-1 w-1/4"
                    : "flex flex-col gap-1 w-1/4"
                }
              >
                <label className="text-xs text-[#f8f9fa] mb-1">Operator</label>
                <Select
                  options={operatorOptions}
                  value={condition.operator}
                  onChange={(value) => handleOperatorSelect(value, index)}
                  placeholder="Operator"
                  isClearable
                  isDisabled={
                    !selectedTable || !condition.column || metadataLoading
                  }
                  styles={singleSelectStyles}
                  className="min-w-0 w-full"
                />
              </div>
              {condition.operator?.value === "BETWEEN" ? (
                <>
                  <div className="flex flex-col gap-1 w-1/4">
                    <label className="text-xs text-[#f8f9fa] mb-1">
                      Value 1
                    </label>
                    <CreatableSelect
                      options={uniqueValues[`condition${index + 1}`]}
                      value={condition.value}
                      onChange={(value) => handleValue1Select(value, index)}
                      placeholder="Value 1"
                      isClearable
                      isDisabled={
                        !selectedTable ||
                        !condition.column ||
                        !condition.operator ||
                        metadataLoading
                      }
                      styles={singleSelectStyles}
                      className="min-w-0 w-full"
                      formatCreateLabel={(inputValue) => inputValue}
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-1/4">
                    <label className="text-xs text-[#f8f9fa] mb-1">
                      Value 2
                    </label>
                    <CreatableSelect
                      options={uniqueValues[`condition${index + 1}`]}
                      value={condition.value2}
                      onChange={(value) => handleValue2Select(value, index)}
                      placeholder="Value 2"
                      isClearable
                      isDisabled={
                        !selectedTable ||
                        !condition.column ||
                        !condition.operator ||
                        !condition.value ||
                        metadataLoading
                      }
                      styles={singleSelectStyles}
                      className="min-w-0 w-full"
                      formatCreateLabel={(inputValue) => inputValue}
                    />
                  </div>
                </>
              ) : (
                <div
                  className={
                    index === 0
                      ? "flex flex-col gap-1 w-1/2"
                      : "flex flex-col gap-1 w-1/4"
                  }
                >
                  <label className="text-xs text-[#f8f9fa] mb-1">Value</label>
                  <CreatableSelect
                    options={uniqueValues[`condition${index + 1}`]}
                    value={condition.value}
                    onChange={(value) => handleValue1Select(value, index)}
                    placeholder="Value"
                    isClearable
                    isDisabled={
                      !selectedTable ||
                      !condition.column ||
                      !condition.operator ||
                      condition.operator?.value === "IS NULL" ||
                      condition.operator?.value === "IS NOT NULL" ||
                      metadataLoading
                    }
                    styles={singleSelectStyles}
                    className="min-w-0 w-full"
                    formatCreateLabel={(inputValue) => inputValue}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2 w-full">
            <div className="flex flex-col gap-1 w-1/3">
              <label className="text-xs text-[#f8f9fa] mb-1">
                Column (Order By)
              </label>
              <Select
                options={orderByColumnOptions}
                value={orderByClause.column}
                onChange={handleOrderByColumnSelect}
                placeholder="Column"
                isClearable
                isDisabled={!selectedTable || metadataLoading}
                styles={singleSelectStyles}
                className="min-w-0 w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-1/3">
              <label className="text-xs text-[#f8f9fa] mb-1">Direction</label>
              <Select
                options={directionOptions}
                value={orderByClause.direction}
                onChange={handleOrderByDirectionSelect}
                placeholder="Select direction"
                isClearable
                isDisabled={
                  !selectedTable || !orderByClause.column || metadataLoading
                }
                styles={singleSelectStyles}
                className="min-w-0 w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-1/3">
              <label className="text-xs text-[#f8f9fa] mb-1">Limit</label>
              <CreatableSelect
                options={limitOptions}
                value={limit}
                onChange={handleLimitSelect}
                placeholder="Set row limit"
                isClearable
                isDisabled={!selectedTable || metadataLoading}
                styles={singleSelectStyles}
                className="min-w-0 w-full"
                formatCreateLabel={(inputValue) => inputValue}
              />
            </div>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1" />
      <div className="absolute top-10 -right-2 z-50 flex flex-col gap-2">
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className="text-green-300 hover:bg-transparent hover:text-green-400 transition-all duration-300"
            aria-label={
              fullScreenEditor
                ? "Exit editor fullscreen"
                : "Enter editor fullscreen"
            }
          >
            {fullScreenEditor ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
            {fullScreenEditor ? "Exit fullscreen" : "Enter fullscreen"}
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            onClick={formatQuery}
            className="text-blue-300 hover:bg-transparent hover:text-blue-400 transition-all duration-300"
            aria-label="Format SQL"
          >
            <Wand2 className="w-5 h-5" />
          </Button>
          <div className="absolute top-1 right-8 z-30 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
            Format SQL ({isMac ? "⌘+⇧+F" : "Ctrl+Shift+F"})
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-700 rotate-45 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
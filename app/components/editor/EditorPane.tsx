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
  WhereCondition,
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
  const [whereCondition, setWhereCondition] = useState<WhereCondition>({
    column: null,
    operator: null,
    value: null,
    value2: null,
  });
  const [uniqueValues, setUniqueValues] = useState<SelectOption[]>([]);
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

  const whereColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  const operatorOptions = useMemo(() => {
    return [
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
  }, []);

  useEffect(() => {
    if (!selectedTable || !whereCondition.column) {
      setUniqueValues([]);
      setFetchError(null);
      return;
    }
    const fetchUniqueValues = async () => {
      try {
        const res = await fetch(
          `/api/unique-values?table=${encodeURIComponent(
            selectedTable.value
          )}&column=${encodeURIComponent(whereCondition.column!.value)}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }
        const data = await res.json();
        if (!data.values || !Array.isArray(data.values)) {
          throw new Error("Invalid response format: 'values' array expected");
        }
        const values =
          whereCondition.operator?.value === "LIKE" ||
          whereCondition.operator?.value === "IS NULL" ||
          whereCondition.operator?.value === "IS NOT NULL"
            ? []
            : data.values.map((value: string) => ({ value, label: value }));
        setUniqueValues(values);
        setFetchError(null);
      } catch (e) {
        const message = (e as Error).message || "Failed to fetch unique values";
        console.error("Error fetching unique values:", message);
        setFetchError(message);
        setUniqueValues([]);
      }
    };
    fetchUniqueValues();
  }, [selectedTable, whereCondition.column, whereCondition.operator]);

  const handleTableSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setSelectedTable(newValue);
      setSelectedColumns([]);
      setWhereCondition({
        column: null,
        operator: null,
        value: null,
        value2: null,
      });
      setUniqueValues([]);
      setFetchError(null);
      const query = newValue ? `SELECT * FROM ${newValue.value} ` : "";
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
        setWhereCondition({
          column: null,
          operator: null,
          value: null,
          value2: null,
        });
        setUniqueValues([]);
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

      const columns = includesStar
        ? "*"
        : columnsToSelect.length > 0
        ? columnsToSelect.map((opt) => opt.value).join(", ")
        : "";
      const baseQuery = columns
        ? `SELECT ${columns} FROM ${selectedTable.value} `
        : `SELECT FROM ${selectedTable.value} `;

      const { column, operator, value, value2 } = whereCondition;
      let query = baseQuery;
      if (column) {
        query += `WHERE ${column.value}`;
        if (operator) {
          query += ` ${operator.value}`;
          if (operator.value === "BETWEEN" && value && value2) {
            const isNumeric =
              !isNaN(Number(value.value)) && !isNaN(Number(value2.value));
            query += isNumeric
              ? ` ${value.value} AND ${value2.value}`
              : ` '${value.value}' AND '${value2.value}'`;
          } else if (
            value &&
            operator.value !== "IS NULL" &&
            operator.value !== "IS NOT NULL" &&
            operator.value !== "BETWEEN"
          ) {
            const isLike = operator.value === "LIKE";
            query += isLike ? ` '${value.value}'` : ` '${value.value}'`;
          }
        }
      }

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
    [selectedTable, tableColumns, whereCondition, onQueryChange]
  );

  const handleWhereColumnSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setWhereCondition((prev) => {
        const newCondition = {
          ...prev,
          column: newValue,
          operator: null,
          value: null,
          value2: null,
        };
        setUniqueValues([]);
        setFetchError(null);
        const baseQuery = selectedColumns.length
          ? `SELECT ${selectedColumns
              .map((col) => col.value)
              .join(", ")} FROM ${selectedTable!.value} `
          : `SELECT * FROM ${selectedTable!.value} `;
        const query = newValue
          ? `${baseQuery}WHERE ${newValue.value} `
          : baseQuery;
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
        return newCondition;
      });
    },
    [selectedTable, selectedColumns, onQueryChange]
  );

  const handleOperatorSelect = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      setWhereCondition((prev) => {
        const newCondition = {
          ...prev,
          operator: newValue,
          value: null,
          value2: null,
        };
        const baseQuery = selectedColumns.length
          ? `SELECT ${selectedColumns
              .map((col) => col.value)
              .join(", ")} FROM ${selectedTable!.value} `
          : `SELECT * FROM ${selectedTable!.value} `;
        const query = prev.column
          ? `${baseQuery}WHERE ${prev.column.value} ${
              newValue ? newValue.value : ""
            } `
          : baseQuery;
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
        return newCondition;
      });
    },
    [selectedTable, selectedColumns, onQueryChange]
  );

  const handleValue1Select = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      if (!whereCondition.operator || !whereCondition.column) {
        setWhereCondition((prev) => ({ ...prev, value: null, value2: null }));
        const baseQuery = selectedColumns.length
          ? `SELECT ${selectedColumns
              .map((col) => col.value)
              .join(", ")} FROM ${selectedTable!.value}`
          : `SELECT * FROM ${selectedTable!.value}`;
        const query =
          whereCondition.column && whereCondition.operator
            ? `${baseQuery} WHERE ${whereCondition.column.value} ${whereCondition.operator.value} `
            : baseQuery;
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
        return;
      }

      setWhereCondition((prev) => {
        const newCondition = { ...prev, value: newValue };
        if (prev.operator?.value !== "BETWEEN") {
          const baseQuery = selectedColumns.length
            ? `SELECT ${selectedColumns
                .map((col) => col.value)
                .join(", ")} FROM ${selectedTable!.value}`
            : `SELECT * FROM ${selectedTable!.value}`;
          const query =
            prev.column && prev.operator
              ? `${baseQuery} WHERE ${prev.column.value} ${
                  prev.operator.value
                } ${
                  newValue &&
                  (prev.operator.value === "LIKE" ||
                    isNaN(Number(newValue.value)) ||
                    newValue.value.includes(" "))
                    ? `'${newValue.value}'`
                    : newValue
                    ? newValue.value
                    : ""
                }`
              : baseQuery;

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
        }
        return newCondition;
      });
    },
    [selectedTable, selectedColumns, whereCondition, onQueryChange]
  );

  const handleValue2Select = useCallback(
    (newValue: SingleValue<SelectOption>) => {
      if (
        !whereCondition.operator ||
        whereCondition.operator.value !== "BETWEEN"
      ) {
        return;
      }

      setWhereCondition((prev) => {
        const newCondition = { ...prev, value2: newValue };
        const baseQuery = selectedColumns.length
          ? `SELECT ${selectedColumns
              .map((col) => col.value)
              .join(", ")} FROM ${selectedTable!.value}`
          : `SELECT * FROM ${selectedTable!.value}`;
        const query =
          prev.column && prev.operator && prev.value && newValue
            ? `${baseQuery} WHERE ${prev.column.value} ${prev.operator.value} ${
                isNaN(Number(prev.value.value)) ||
                prev.value.value.includes(" ")
                  ? `'${prev.value.value}'`
                  : prev.value.value
              } AND ${
                isNaN(Number(newValue.value)) || newValue.value.includes(" ")
                  ? `'${newValue.value}'`
                  : newValue.value
              }`
            : `${baseQuery} WHERE ${prev.column?.value} ${
                prev.operator?.value
              } ${
                prev.value
                  ? isNaN(Number(prev.value.value)) ||
                    prev.value.value.includes(" ")
                    ? `'${prev.value.value}'`
                    : prev.value.value
                  : ""
              }`;

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
        return newCondition;
      });
    },
    [selectedTable, selectedColumns, whereCondition, onQueryChange]
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
      setTimeout(() => onQueryChange(formatted), 0);
    } catch (err) {
      console.error("SQL formatting failed:", err);
    }
  }, [onQueryChange]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current || metadataLoading) return;

    const updateQueryOnChange = ViewPlugin.define(
      () => ({
        update: (update) => {
          if (!update.docChanged || isInitialRender.current) return;
          const newQuery: string = update.state.doc.toString();
          setTimeout(() => {
            onQueryChange(newQuery);
            const tableName: string | null = extractTableName(newQuery);
            if (!tableName || !tableNames.includes(tableName)) {
              resetQueryState();
              return;
            }
            updateTableSelection(tableName);
            updateColumnSelection(newQuery, tableName);
            updateWhereCondition(newQuery);
          }, 0);
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
      setWhereCondition({
        column: null,
        operator: null,
        value: null,
        value2: null,
      });
      setUniqueValues([]);
      setFetchError(null);
    };

    const updateTableSelection = (tableName: string): void => {
      setSelectedTable((prev) =>
        prev?.value === tableName
          ? prev
          : { value: tableName, label: tableName }
      );
    };

    const updateColumnSelection = (query: string, tableName: string): void => {
      const columnMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
      const columns: string[] = columnMatch
        ? columnMatch[1].split(",").map((col) => col.trim())
        : [];

      if (columns.length > 0 && columns[0] !== "*") {
        setSelectedColumns(
          columns.map((col: string) => ({ value: col, label: col }))
        );
      } else {
        setSelectedColumns(
          tableColumns[tableName]?.map((col: string) => ({
            value: col,
            label: col,
          })) || []
        );
      }
    };

    const updateWhereCondition = (query: string): void => {
      const whereMatch = query.match(
        /WHERE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(IS NULL|IS NOT NULL|BETWEEN|[=!><]=?|LIKE)\s*('[^']*'|[0-9]+)?(?:\s+AND\s+('[^']*'|[0-9]+))?/i
      );

      if (whereMatch) {
        const [column, operator, value1, value2] = whereMatch;
        setWhereCondition((prev) => ({
          column:
            prev.column?.value === column
              ? prev.column
              : { value: column, label: column },
          operator:
            prev.operator?.value === operator
              ? prev.operator
              : operatorOptions.find((opt) => opt.value === operator) || null,
          value:
            operator === "IS NULL" || operator === "IS NOT NULL"
              ? null
              : prev.value?.value === value1
              ? prev.value
              : value1
              ? { value: value1, label: value1 }
              : null,
          value2:
            operator === "BETWEEN" && value2
              ? prev.value2?.value === value2
                ? prev.value2
                : { value: value2, label: value2 }
              : null,
        }));
      } else if (!query.includes("WHERE")) {
        setWhereCondition({
          column: null,
          operator: null,
          value: null,
          value2: null,
        });
        setUniqueValues([]);
        setFetchError(null);
      }
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
    operatorOptions,
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
      borderRadius: "0.5rem",
      fontSize: "clamp(12px, 2.5vw, 14px)",
      minHeight: "36px",
      padding: "0.25rem",
    }),
    singleValue: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
    }),
    multiValue: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#3b82f6",
      borderRadius: "0.25rem",
      margin: "0.125rem",
    }),
    multiValueLabel: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
      fontSize: "clamp(12px, 2.5vw, 14px)",
      padding: "0.125rem 0.25rem",
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
      borderRadius: "0.5rem",
      marginTop: "0.25rem",
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
      padding: "0.5rem 0.75rem",
      fontSize: "clamp(12px, 2.5vw, 14px)",
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
    }),
    input: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
    }),
    dropdownIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
    }),
    clearIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
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
      borderRadius: "0.5rem",
      fontSize: "clamp(12px, 2.5vw, 14px)",
      minHeight: "36px",
      padding: "0.25rem",
    }),
    singleValue: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "0.5rem",
      marginTop: "0.25rem",
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
      padding: "0.5rem 0.75rem",
      fontSize: "clamp(12px, 2.5vw, 14px)",
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
    }),
    input: (baseStyles) => ({
      ...baseStyles,
      color: "#f8f9fa",
    }),
    dropdownIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
    }),
    clearIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#94a3b8",
      "&:hover": { color: "#3b82f6" },
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
      <div className="flex flex-col gap-4 p-4 border-b border-slate-700">
        {fetchError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{fetchError}</span>
          </div>
        )}
        <div>
          <label className="text-sm text-[#f8f9fa] mb-1 block">Table</label>
          <Select
            options={tableOptions}
            value={selectedTable}
            onChange={handleTableSelect}
            placeholder="Select a table"
            isClearable
            isDisabled={metadataLoading}
            styles={singleSelectStyles}
            className="flex-1 min-w-0"
          />
        </div>
        <div>
          <label className="text-sm text-[#f8f9fa] mb-1 block">Columns</label>
          <Select
            options={columnOptions}
            value={selectedColumns}
            onChange={handleColumnSelect}
            placeholder="Select columns"
            isMulti
            isDisabled={!selectedTable || metadataLoading}
            styles={selectStyles}
            className="flex-1 min-w-0"
          />
        </div>
        <div>
          <div
            className={
              whereCondition.operator?.value === "BETWEEN"
                ? "grid grid-cols-4 gap-3"
                : "grid grid-cols-3 gap-3"
            }
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#f8f9fa] mb-1 block">Where</label>
              <Select
                options={whereColumnOptions}
                value={whereCondition.column}
                onChange={handleWhereColumnSelect}
                placeholder=""
                isClearable
                isDisabled={!selectedTable || metadataLoading}
                styles={singleSelectStyles}
                className="min-w-0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#f8f9fa] mb-1 block">
                Operator
              </label>
              <Select
                options={operatorOptions}
                value={whereCondition.operator}
                onChange={handleOperatorSelect}
                placeholder=""
                isClearable
                isDisabled={
                  !selectedTable || !whereCondition.column || metadataLoading
                }
                styles={singleSelectStyles}
                className="min-w-0"
              />
            </div>
            {whereCondition.operator?.value === "BETWEEN" ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#f8f9fa] mb-1 block">
                    Value 1
                  </label>
                  <CreatableSelect
                    options={uniqueValues}
                    value={whereCondition.value}
                    onChange={handleValue1Select}
                    placeholder=""
                    isClearable
                    isDisabled={
                      !selectedTable ||
                      !whereCondition.column ||
                      !whereCondition.operator ||
                      metadataLoading
                    }
                    styles={singleSelectStyles}
                    className="min-w-0"
                    formatCreateLabel={(inputValue) => inputValue}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#f8f9fa] mb-1 block">
                    Value 2
                  </label>
                  <CreatableSelect
                    options={uniqueValues}
                    value={whereCondition.value2}
                    onChange={handleValue2Select}
                    placeholder=""
                    isClearable
                    isDisabled={
                      !selectedTable ||
                      !whereCondition.column ||
                      !whereCondition.operator ||
                      !whereCondition.value ||
                      metadataLoading
                    }
                    styles={singleSelectStyles}
                    className="min-w-0"
                    formatCreateLabel={(inputValue) => inputValue}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#f8f9fa] mb-1 block">
                  Value
                </label>
                <CreatableSelect
                  options={uniqueValues}
                  value={whereCondition.value}
                  onChange={handleValue1Select}
                  placeholder=""
                  isClearable
                  isDisabled={
                    !selectedTable ||
                    !whereCondition.column ||
                    !whereCondition.operator ||
                    whereCondition.operator?.value === "IS NULL" ||
                    whereCondition.operator?.value === "IS NOT NULL" ||
                    metadataLoading
                  }
                  styles={singleSelectStyles}
                  className="min-w-0"
                  formatCreateLabel={(inputValue) => inputValue}
                />
              </div>
            )}
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
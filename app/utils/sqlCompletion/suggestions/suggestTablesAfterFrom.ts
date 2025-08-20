import { CompletionResult } from "@codemirror/autocomplete";
import { Select, ColumnRefExpr } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

interface AggrFuncExpr {
  type: "aggr_func";
  name: string;
  args: { expr: ColumnRefExpr } | { expr: ColumnRefExpr; decimals: number };
}

export const suggestTablesAfterFrom = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  getValidTables: (
    selectedColumn: string | null,
    tableColumns: TableColumn,
    dataType?: string
  ) => string[],
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  tableColumns: TableColumn,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // Check if a node is a SELECT node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Check if an expression is a column reference
  const isColumnRefExpr = (expr: unknown): expr is ColumnRefExpr =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "column_ref" &&
    "column" in expr;

  // Check if an expression is an aggregate function
  const isAggrFuncExpr = (expr: unknown): expr is AggrFuncExpr =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "aggr_func" &&
    "name" in expr &&
    ["COUNT", "SUM", "MAX", "MIN", "AVG", "ROUND"].includes(
      (expr as { name: string }).name.toUpperCase()
    );

  // Regex to match SELECT followed by columns or * and FROM
  const afterFromRegex = /\bSELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s*$/i;

  // Regex to match a valid table name after FROM
  const afterTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;

  // Handle suggestions after a valid table (e.g., SELECT * FROM users)
  if (afterTableRegex.test(docText)) {
    const tableName = docText.match(afterTableRegex)![3];
    const filteredTables = getValidTables(null, tableColumns).filter(
      (table) => table.toLowerCase() === tableName.toLowerCase()
    );

    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "INNER JOIN",
            type: "keyword",
            apply: "INNER JOIN ",
            detail: "Join tables with matching records",
          },
          {
            label: "LEFT JOIN",
            type: "keyword",
            apply: "LEFT JOIN ",
            detail: "Join tables, keeping all records from the left table",
          },
          {
            label: "RIGHT JOIN",
            type: "keyword",
            apply: "RIGHT JOIN ",
            detail: "Join tables, keeping all records from the right table",
          },
          {
            label: "CROSS JOIN",
            type: "keyword",
            apply: "CROSS JOIN ",
            detail: "Combine all rows from both tables",
          },
          {
            label: "UNION",
            type: "keyword",
            apply: "UNION ",
            detail: "Combine results with another SELECT query",
          },
          {
            label: "WHERE",
            type: "keyword",
            apply: "WHERE ",
            detail: "Filter results",
          },
          {
            label: ";",
            type: "text",
            apply: ";",
            detail: "Complete query",
          },
        ],
        filter: true,
        validFor:
          /^(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN|WHERE|;)$/i,
      };
    }
  }

  // Handle suggestions immediately after FROM (e.g., SELECT * FROM)
  if (afterFromRegex.test(docText)) {
    let selectedColumn: string | null = null;
    const match = docText.match(afterFromRegex);
    if (match) {
      const columns = match[2]
        .split(",")
        .map((col) => stripQuotes(col.trim()))
        .filter((col) => col);
      const lastColumn = columns[columns.length - 1];
      if (lastColumn && lastColumn !== "*") {
        selectedColumn = lastColumn.replace(
          /^(SUM|MAX|MIN|AVG|ROUND|COUNT)\((.*?)\)$/i,
          "$2"
        );
      }
    }

    // Get valid tables based on the selected column
    const validTables = getValidTables(selectedColumn, tableColumns).filter(
      (tableName) =>
        currentWord
          ? tableName
              .toLowerCase()
              .startsWith(stripQuotes(currentWord).toLowerCase())
          : true
    );

    if (validTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: validTables.map((tableName) => ({
          label: tableName,
          type: "table",
          apply: needsQuotes(tableName) ? `"${tableName}" ` : `${tableName} `,
          detail: "Table name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Fallback to AST for column or aggregate function
  if (ast) {
    const selectNode = Array.isArray(ast)
      ? ast.find((node: Select) => isSelectNode(node))
      : isSelectNode(ast)
      ? ast
      : null;

    if (
      selectNode &&
      selectNode.columns &&
      selectNode.columns.length > 0 &&
      !selectNode.from
    ) {
      let selectedColumn: string | null = null;
      const lastColumn = selectNode.columns[selectNode.columns.length - 1];

      if (lastColumn.expr) {
        if (isColumnRefExpr(lastColumn.expr)) {
          selectedColumn = stripQuotes(lastColumn.expr.column);
        } else if (isAggrFuncExpr(lastColumn.expr)) {
          if (isColumnRefExpr(lastColumn.expr.args.expr)) {
            selectedColumn = stripQuotes(lastColumn.expr.args.expr.column);
          }
        }
      }

      const validTables = getValidTables(selectedColumn, tableColumns).filter(
        (tableName) =>
          currentWord
            ? tableName
                .toLowerCase()
                .startsWith(stripQuotes(currentWord).toLowerCase())
            : true
      );

      if (validTables.length > 0) {
        return {
          from: word ? word.from : pos,
          options: validTables.map((tableName) => ({
            label: tableName,
            type: "table",
            apply: needsQuotes(tableName) ? `"${tableName}" ` : `${tableName} `,
            detail: "Table name",
          })),
          filter: true,
          validFor: /^["'\w]*$/,
        };
      }
    }
  }

  return null;
};
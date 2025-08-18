import { CompletionResult } from "@codemirror/autocomplete";
import { Select, ColumnRefExpr } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

interface AggrFuncExpr {
  type: "aggr_func";
  name: string;
  args: { expr: ColumnRefExpr };
}

// This function suggests table names after the "FROM" keyword in a SQL query.
export const suggestTablesAfterFrom = (
  docText: string, // Full SQL query text
  currentWord: string, // Word currently being typed at the cursor
  pos: number, // Cursor position
  word: { from: number } | null, // Word range (used for determining where to insert suggestion)
  getValidTables: (
    selectedColumn: string | null,
    dataType?: string
  ) => string[], // Updated to accept optional dataType
  stripQuotes: (s: string) => string, // Utility to remove quotes from identifiers
  needsQuotes: (id: string) => boolean, // Utility to check if a table name needs quotes
  ast: Select | Select[] | null // Parsed SQL Abstract Syntax Tree (AST)
): CompletionResult | null => {
  // === STEP 1: Define helper functions ===
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  const isColumnRefExpr = (expr: unknown): expr is ColumnRefExpr =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "column_ref" &&
    "column" in expr;

  const isAggrFuncExpr = (expr: unknown): expr is AggrFuncExpr =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "aggr_func" &&
    "name" in expr &&
    "args" in expr &&
    typeof (expr as { args: unknown }).args === "object" &&
    "expr" in (expr as { args: { expr: unknown } }).args;

  // === STEP 2: Define regex patterns ===
  // Matches: SELECT [DISTINCT] column_name FROM, SELECT [DISTINCT] * FROM, SELECT COUNT(*) FROM, or SELECT SUM(column) FROM
  const selectFromTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[\w]+"|'[\w]+'|[\w_]+)|\*|COUNT\(\*\)|SUM\((?:"[\w]+"|'[\w]+'|[\w_]+)\))\s+FROM\s*(\w*)$/i;

  // Matches: SELECT [DISTINCT] column_name FROM table_name, SELECT COUNT(*) FROM table_name, or SELECT SUM(column) FROM table_name
  const afterTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[\w]+"|'[\w]+'|[\w_]+)|\*|COUNT\(\*\)|SUM\((?:"[\w]+"|'[\w]+'|[\w_]+)\))\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;

  // === STEP 3: Handle suggestions after FROM with a valid table ===
  if (afterTableRegex.test(docText)) {
    const tableName = docText.match(afterTableRegex)![3];
    const filteredTables = getValidTables(null).filter(
      (table) => tableName.toLowerCase() === table.toLowerCase()
    );

    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: [
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
        validFor: /^(WHERE|;)$/i,
      };
    }
  }

  // === STEP 4: Handle table suggestions after FROM ===
  if (selectFromTableRegex.test(docText)) {
    // Extract the column or aggregate function from the regex match
    const match = docText.match(selectFromTableRegex);
    let selectedColumn: string | null = null;
    let isSumFunction = false;

    if (match && match[2] !== "*" && match[2] !== "COUNT(*)") {
      if (match[2].startsWith("SUM(")) {
        selectedColumn = stripQuotes(match[2].slice(4, -1)); // Extract column from SUM(column)
        isSumFunction = true;
      } else {
        selectedColumn = stripQuotes(match[2]); // Regular column
      }
    }

    // === STEP 5: Fallback to AST for column or aggregate function ===
    if (!selectedColumn && ast) {
      const selectNode = Array.isArray(ast)
        ? ast.find((node: Select) => isSelectNode(node))
        : isSelectNode(ast)
        ? ast
        : null;

      if (selectNode && selectNode.columns && selectNode.columns.length > 0) {
        const lastColumn = selectNode.columns[selectNode.columns.length - 1];
        if (isColumnRefExpr(lastColumn.expr)) {
          selectedColumn = stripQuotes(lastColumn.expr.column);
        } else if (
          isAggrFuncExpr(lastColumn.expr) &&
          (lastColumn.expr.name.toUpperCase() === "COUNT" ||
            lastColumn.expr.name.toUpperCase() === "SUM")
        ) {
          if (lastColumn.expr.name.toUpperCase() === "COUNT") {
            selectedColumn = null; // COUNT(*) doesn't reference a specific column
          } else if (
            lastColumn.expr.name.toUpperCase() === "SUM" &&
            isColumnRefExpr(lastColumn.expr.args.expr)
          ) {
            selectedColumn = stripQuotes(lastColumn.expr.args.expr.column); // SUM(column)
            isSumFunction = true;
          }
        }
      }
    }

    // === STEP 6: Get valid tables based on the selected column and data type ===
    const numericTypes = [
      "INTEGER",
      "INT",
      "FLOAT",
      "DOUBLE",
      "DECIMAL",
      "NUMERIC",
      "BIGINT",
      "SMALLINT",
      "REAL",
    ];
    const filteredTables = getValidTables(
      selectedColumn,
      isSumFunction ? numericTypes.join(",") : undefined
    ).filter((tableName) =>
      currentWord
        ? tableName
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // === STEP 7: Return table suggestions ===
    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredTables.map((tableName) => ({
          label: tableName,
          type: "table",
          apply: needsQuotes(tableName) ? `"${tableName}" ` : `${tableName} `,
          detail: "Table name",
        })),
        filter: true,
        validFor: /^\w*$/,
      };
    }
  }

  return null;
};
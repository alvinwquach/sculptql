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
    tableColumns: TableColumn,
    dataType?: string
  ) => string[], // Function to get valid tables based on selected column and table metadata
  stripQuotes: (s: string) => string, // Utility to remove quotes from identifiers
  needsQuotes: (id: string) => boolean, // Utility to check if a table name needs quotes
  tableColumns: TableColumn, // Table metadata mapping table names to their columns
  ast: Select | Select[] | null // Parsed SQL Abstract Syntax Tree (AST)
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

  // Check if an expression is an aggregate function (COUNT, SUM, MAX, MIN, AVG)
  const isAggrFuncExpr = (expr: unknown): expr is AggrFuncExpr =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "aggr_func" &&
    "name" in expr &&
    ["COUNT", "SUM", "MAX", "MIN", "AVG"].includes(
      (expr as { name: string }).name.toUpperCase()
    );

  // Matches: SELECT [DISTINCT] column_name, *, COUNT(*), SUM(column), MAX(column), MIN(column), AVG(column)
  const selectColumnRegex =
    /\bSELECT\s+(?:(?:DISTINCT\s+)?(?:COUNT\(\*\)|(?:SUM|MAX|MIN|AVG)\(\s*(["'\w][^)]*?)\s*\)|(["'\w][^,]*?))\s*(?:,\s*(?:COUNT\(\*\)|(?:SUM|MAX|MIN|AVG)\(\s*(["'\w][^)]*?)\s*\)|(["'\w][^,]*?)))*)?$/i;

  // Matches: SELECT [DISTINCT] column_name FROM table_name, etc.
  const afterTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[\w]+"|'[\w]+'|[\w_]+)|\*|COUNT\(\*\)|(?:SUM|MAX|MIN|AVG)\((?:"[\w]+"|'[\w]+'|[\w_]+)\))\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;

  // === STEP 3: Handle suggestions after FROM with a valid table ===
  // Suggest WHERE or ; if a valid table name is already provided after FROM
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
  // Suggest table names when the user is typing after SELECT ... FROM
  if (selectColumnRegex.test(docText) && !docText.match(/\bFROM\b/i)) {
    let selectedColumn: string | null = null;

    // Extract the column or aggregate function from the regex match
    const match = docText.match(selectColumnRegex);
    if (match) {
      if (match[1]) {
        selectedColumn = stripQuotes(match[1]); // Column inside SUM/MAX/MIN
      } else if (match[2]) {
        selectedColumn = stripQuotes(match[2]); // Regular column
      } else if (match[3]) {
        selectedColumn = stripQuotes(match[3]); // Column inside SUM/MAX/MIN (from comma-separated list)
      } else if (match[4]) {
        selectedColumn = stripQuotes(match[4]); // Regular column (from comma-separated list)
      }
    }

    // Get valid tables based on the selected column and table metadata (no data type filtering)
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

  // === STEP 5: Fallback to AST for column or aggregate function ===
  // Use the AST to find the last column or aggregate function if regex didn't match
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

      // === STEP 6: Get valid tables based on the selected column and table metadata (no data type filtering)
      const validTables = getValidTables(selectedColumn, tableColumns).filter(
        (tableName) =>
          currentWord
            ? tableName
                .toLowerCase()
                .startsWith(stripQuotes(currentWord).toLowerCase())
            : true
      );

      // === STEP 7: Return table suggestions ===
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

  // === STEP 8: No valid suggestions found ===
  return null;
};

import { CompletionResult } from "@codemirror/autocomplete";
import { Select, ColumnRefExpr } from "node-sql-parser";

// This function suggests table names after the "FROM" keyword in a SQL query.
export const suggestTablesAfterFrom = (
  docText: string, // Full SQL query text
  currentWord: string, // Word currently being typed at the cursor
  pos: number, // Cursor position
  word: { from: number } | null, // Word range (used for determining where to insert suggestion)
  getValidTables: (selectedColumn: string | null) => string[], // Function to get valid tables, optionally based on a selected column
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

  const isAggrFuncExpr = (
    expr: unknown
  ): expr is { type: string; name: string } =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "aggr_func" &&
    "name" in expr;

  // === STEP 2: Define regex patterns ===
  // Matches: SELECT [DISTINCT] column_name FROM, SELECT [DISTINCT] * FROM, or SELECT COUNT(*) FROM
  const selectFromTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[\w]+"|'[\w]+'|[\w_]+)|\*|COUNT\(\*\))\s+FROM\s*(\w*)$/i;

  // Matches: SELECT [DISTINCT] column_name FROM table_name or SELECT COUNT(*) FROM table_name
  const afterTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[\w]+"|'[\w]+'|[\w_]+)|\*|COUNT\(\*\))\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;

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
    let selectedColumn =
      match && match[2] !== "*" && match[2] !== "COUNT(*)"
        ? stripQuotes(match[2])
        : null;

    // === STEP 5: Fallback to AST for column or aggregate function ===
    if (!selectedColumn && ast) {
      const selectNode = Array.isArray(ast)
        ? ast.find((node: Select) => isSelectNode(node))
        : isSelectNode(ast)
        ? ast
        : null;
      // Extract the last valid column from the AST, if available

      if (selectNode && selectNode.columns && selectNode.columns.length > 0) {
        const lastColumn = selectNode.columns[selectNode.columns.length - 1];
        if (isColumnRefExpr(lastColumn.expr)) {
          selectedColumn = stripQuotes(lastColumn.expr.column);
        } else if (
          isAggrFuncExpr(lastColumn.expr) &&
          lastColumn.expr.name.toUpperCase() === "COUNT"
        ) {
          selectedColumn = null; // COUNT(*) doesn't reference a specific column
        }
      }
    }

    // === STEP 6: Get valid tables based on the selected column (or none for COUNT(*)) ===
    const filteredTables = getValidTables(selectedColumn).filter((tableName) =>
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
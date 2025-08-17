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
  needsQuotes: (id: string) => boolean, // Utility to check if a table name needs quotes  ast: Select | Select[] | null // Parsed SQL Abstract Syntax Tree (AST)
  ast: Select | Select[] | null // Parsed SQL Abstract Syntax Tree (AST)
): CompletionResult | null => {
  // === STEP 1: Define regex to match SELECT [DISTINCT] column_name FROM or SELECT [DISTINCT] * FROM ===
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

  const selectFromTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[\w]+"|'[\w]+'|[\w_]+)|\*)\s+FROM\s*(\w*)$/i;

  const afterTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[\w]+"|'[\w]+'|[\w_]+)|\*)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;

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

  // === STEP 2: Check if the query matches the expected pattern ===
  if (selectFromTableRegex.test(docText)) {
    // Extract the column name from the regex match
    const match = docText.match(selectFromTableRegex);
    let selectedColumn =
      match && match[2] !== "*" ? stripQuotes(match[2]) : null;
    // === STEP 3: Fallback to AST if regex-based column extraction is ambiguous ===

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
        }
      }
    }

    // === STEP 4: Get valid tables based on the selected column ===
    const filteredTables = getValidTables(selectedColumn).filter((tableName) =>
      currentWord
        ? tableName
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // === STEP 5: Return table suggestions if any valid tables exist ===
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
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
  // === STEP 1: Detect if we're in or after a FROM clause ===

  const inFromClause =
    ast &&
    // AST is a single SELECT node
    (Array.isArray(ast)
      ? ast.some(
          (node: Select) => node.type === "select" && node.from !== undefined
        )
      : ast.type === "select" && ast.from !== undefined); // Allow ast.from to be empty array but not undefined/null

  // Fallback check: matches simple incomplete queries like "SELECT * FROM "
  const fromRegex = /\bSELECT\s+.*\bFROM\s*$/i;

  // If the cursor is after FROM, proceed to show table suggestions
  if (inFromClause || fromRegex.test(docText)) {
    // === STEP 2: Get the first selected column (if any), to provide context-aware table suggestions ===

    const selectNode = Array.isArray(ast)
      ? ast.find((node: Select) => node.type === "select")
      : ast;

    // Type guard to check if expr is a ColumnRefExpr
    const isColumnRefExpr = (expr: unknown): expr is ColumnRefExpr =>
      !!expr &&
      typeof expr === "object" &&
      Object.prototype.hasOwnProperty.call(expr, "type") &&
      (expr as { type: unknown }).type === "column_ref" &&
      Object.prototype.hasOwnProperty.call(expr, "column");

    const firstCol =
      selectNode && selectNode.columns && selectNode.columns[0]
        ? isColumnRefExpr(selectNode.columns[0].expr)
          ? stripQuotes(selectNode.columns[0].expr.column)
          : null
        : null;

    // === STEP 3: Filter valid tables based on the typed prefix ===

    const typed = currentWord.replace(/["']/g, ""); // Remove quotes from what the user is typing
    const filteredTables = getValidTables(firstCol || null).filter((t) =>
      typed ? t.toLowerCase().startsWith(typed) : true
    );

    // No matching tables to suggest
    if (filteredTables.length === 0) return null;

    // === STEP 4: Return the table suggestions ===
    return {
      from: word ? word.from : pos, // Where to insert the table name
      options: filteredTables.map((tableName) => ({
        label: tableName, // The suggestion shown to the user
        type: "table", // Suggestion type for styling or grouping
        apply: needsQuotes(tableName) ? `"${tableName}" ` : `${tableName} `, // Add quotes if necessary
        detail: "Table name", // Description shown in the autocomplete UI
      })),
      filter: true, // Filter suggestions as user continues typing
      validFor: /^["'\w.]*$/, // Only suggest if the input matches a valid table identifier
    };
  }

  // === STEP 5: Not in a FROM clause or no match — do not show suggestions ===
  return null;
};
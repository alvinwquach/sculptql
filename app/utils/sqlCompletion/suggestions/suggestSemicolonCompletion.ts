import { CompletionResult } from "@codemirror/autocomplete";
import { TableColumn } from "@/app/types/query";

// This function suggests a semicolon (";") to complete a SQL query,
// but only if the query is a valid SELECT with known, valid columns and a FROM clause.
export const suggestSemicolonCompletion = (
  pos: number, // Cursor position
  tableColumns: TableColumn, // A map of table name -> array of valid column names
  stripQuotes: (s: string) => string, // Helper function to remove quotes from identifiers
  ast: any // The parsed SQL AST
): CompletionResult | null => {
  // === STEP 1: Validate that we have a SELECT query with FROM and columns ===

  const isValidSelect =
    ast &&
    // AST is either a single select node
    (ast.type === "select" ||
      // Or an array containing at least one select node
      (Array.isArray(ast) &&
        ast.some((node: any) => node.type === "select"))) &&
    ast.from && // FROM clause exists
    ast.columns && // At least one column is selected
    ast.columns.length > 0;

  if (isValidSelect) {
    // === STEP 2: Extract selected column names (ignoring "*") ===

    const selectedColumns = ast.columns
      .map((col: any) =>
        // Try to get column name from either `expr.column` or `expr.value`, fallback to empty string
        stripQuotes(col.expr.column || col.expr.value || "")
      )
      .filter((col: string) => col !== "*"); // Ignore "*" since it doesn't need validation

    // === STEP 3: Get the table name being queried ===
    const selectedTable = ast.from[0]?.table;

    // If no table is found, we can't continue
    if (!selectedTable) {
      return null;
    }

    // === STEP 4: Validate all selected columns exist in the specified table ===

    const tableHasColumns = tableColumns[selectedTable];
    const allColumnsValid =
      selectedColumns.length > 0 &&
      tableHasColumns &&
      selectedColumns.every((col: string) =>
        tableHasColumns.some(
          (tableCol) => tableCol.toLowerCase() === col.toLowerCase()
        )
      );

    // === STEP 5: If all columns are valid, suggest semicolon completion ===
    if (allColumnsValid) {
      return {
        from: pos, // Insert semicolon at cursor
        options: [
          {
            label: ";", // The suggestion shown to the user
            type: "text", // Simple text insert
            apply: ";", // The actual character inserted
            detail: "Complete query", // Description shown in UI
          },
        ],
      };
    }
  }

  // === STEP 6: If query isn't valid, don't suggest anything ===
  return null;
};

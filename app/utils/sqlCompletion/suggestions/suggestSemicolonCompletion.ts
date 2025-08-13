import { CompletionResult } from "@codemirror/autocomplete";
import { Select, Column, From } from "node-sql-parser";
import { TableColumn, TableReference } from "@/app/types/query";

// This function suggests a semicolon (";") to complete a SQL query,
// but only if the query is a valid SELECT with known, valid columns and a FROM clause.
export const suggestSemicolonCompletion = (
  pos: number, // Cursor position
  tableColumns: TableColumn, // A map of table name -> array of valid column names
  stripQuotes: (s: string) => string, // Helper function to remove quotes from identifiers
  ast: Select | Select[] | null // The parsed SQL AST from node-sql-parser
): CompletionResult | null => {
  // === STEP 1: Validate that we have a SELECT query with FROM and columns ===

  const isValidSelect =
    ast &&
    // AST is either a single select node or an array of nodes
    (Array.isArray(ast)
      ? ast.some(
          (node: Select) =>
            node.type === "select" &&
            node.from &&
            node.columns &&
            node.columns.length > 0
        )
      : ast.type === "select" &&
        ast.from &&
        ast.columns &&
        ast.columns.length > 0);

  if (!isValidSelect) {
    return null;
  }

  // === STEP 2: Extract selected column names (ignoring "*") ===

  const selectNode = Array.isArray(ast)
    ? ast.find(
        (node: Select) => node.type === "select" && node.from && node.columns
      )
    : ast;

  // Ensure selectNode is a Select and has columns
  if (!selectNode || !selectNode.columns) {
    return null;
  }

  const selectedColumns = selectNode.columns
    .map((col: Column) => {
      // Handle the expr.column safely, accounting for node-sql-parser's type
      if ("expr" in col && col.expr && "column" in col.expr) {
        const columnValue = col.expr.column;
        // Ensure columnValue is a string before stripping quotes
        return typeof columnValue === "string" ? stripQuotes(columnValue) : "";
      }
      return "";
    })
    .filter((col: string) => col !== "*" && col !== ""); // Ignore "*" and invalid columns

  // === STEP 3: Get the table name being queried ===
  // Type guard to check if the from item has a table property
  const isTableReference = (fromItem: unknown): fromItem is TableReference => {
    if (
      fromItem != null &&
      typeof fromItem === "object" &&
      "table" in (fromItem as Record<string, unknown>)
    ) {
      const tableValue = (fromItem as Record<string, unknown>).table;
      return tableValue === null || typeof tableValue === "string";
    }
    return false;
  };

  let selectedTable: string | null = null;
  // Ensure selectNode.from is treated as From | From[] | null
  const fromClause = selectNode.from as From | From[] | null;
  if (Array.isArray(fromClause)) {
    // Handle array of FROM items
    const firstFrom = fromClause[0];
    if (isTableReference(firstFrom)) {
      selectedTable = firstFrom.table;
    }
  } else if (fromClause && isTableReference(fromClause)) {
    // Handle single FROM item
    selectedTable = fromClause.table;
  }

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

  // === STEP 6: If query isn't valid, don't suggest anything ===
  return null;
};

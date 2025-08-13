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
    // === STEP 1: Define regex to match SELECT column_name FROM or SELECT * FROM ===
    const selectFromTableRegex =
      /^select\s+((?:"[\w]+"|'[\w]+'|[\w_]+)|\*)\s+from\s*(\w*)$/i;

    // === STEP 2: Check if the query matches the expected pattern ===
    if (selectFromTableRegex.test(docText)) {
      // Extract the column name from the regex match
      const match = docText.match(selectFromTableRegex);
      let selectedColumn =
        match && match[1] !== "*" ? stripQuotes(match[1]) : null;

      // === STEP 3: Fallback to AST if regex-based column extraction is ambiguous ===
      if (!selectedColumn && ast) {
        const selectNode = Array.isArray(ast)
          ? ast.find((node: Select) => node.type === "select")
          : ast;

        const isColumnRefExpr = (expr: unknown): expr is ColumnRefExpr =>
          !!expr &&
          typeof expr === "object" &&
          Object.prototype.hasOwnProperty.call(expr, "type") &&
          (expr as { type: unknown }).type === "column_ref" &&
          Object.prototype.hasOwnProperty.call(expr, "column");

        // Extract the last valid column from the AST, if available
        if (selectNode && selectNode.columns && selectNode.columns.length > 0) {
          const lastColumn = selectNode.columns[selectNode.columns.length - 1];
          if (isColumnRefExpr(lastColumn.expr)) {
            selectedColumn = stripQuotes(lastColumn.expr.column);
          }
        }
      }

      // === STEP 4: Get valid tables based on the selected column ===
      const filteredTables = getValidTables(selectedColumn).filter(
        (tableName) =>
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
            apply: needsQuotes(tableName) ? `"${tableName}";` : `${tableName};`,
            detail: "Table name",
          })),
          filter: true,
          validFor: /^\w*$/,
        };
      }
    }

    return null;
  };
import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

// This function provides autocomplete suggestions for column names
// immediately after the `SELECT` keyword in a SQL query.
export const suggestColumnsAfterSelect = (
  docText: string, // The full text of the current SQL document
  currentWord: string, // The current word being typed at the cursor
  pos: number, // Cursor position
  word: { from: number } | null, // The range of the current word
  allColumns: string[], // List of available column names to suggest
  needsQuotes: (id: string) => boolean, // Function to determine if a column name needs quotes
  ast: Select | Select[] | null // The parsed SQL AST (Abstract Syntax Tree), can be a single Select or an array of Selects
): CompletionResult | null => {
  // === STEP 1: Determine if we're in a SELECT clause with no columns ===

  // Check if AST is a "select" node or contains a "select" node
  // AND the select clause has no columns yet.
  const inSelectClause =
    ast &&
    (Array.isArray(ast)
      ? ast.some(
          (node: Select) =>
            node.type === "select" &&
            (!node.columns || node.columns.length === 0)
        )
      : ast.type === "select" && (!ast.columns || ast.columns.length === 0));

  // Regex to match `SELECT` with no columns yet typed (e.g., just "SELECT")
  const selectRegex = /^select\s*$/i;

  // === STEP 2: If in SELECT with no columns, or typing just "SELECT", offer column suggestions ===
  if (inSelectClause || selectRegex.test(docText.trim())) {
    // Filter column suggestions if user has started typing a partial word
    const filteredColumns = allColumns.filter((column) =>
      currentWord
        ? column.toLowerCase().startsWith(currentWord.replace(/["']/g, ""))
        : true
    );

    // === STEP 3: Return suggestions ===
    return {
      from: word ? word.from : pos, // Suggestion should replace the current word
      options: [
        {
          label: "*",
          type: "field",
          apply: "* ", // Suggest selecting all columns
          detail: "All columns",
        },
        // Map each matching column to a completion item
        ...filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `, // Quote if necessary
          detail: "Column name",
        })),
      ],
      filter: true, // Enable filtering as user types more
      validFor: /^["'\w.]*$/, // Only trigger if valid characters (letters, quotes, etc.)
    };
  }

  // === STEP 4: Not in SELECT clause or already has columns -> no suggestions ===
  return null;
};
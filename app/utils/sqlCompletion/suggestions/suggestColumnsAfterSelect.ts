import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

// This function provides autocomplete suggestions for DISTINCT, *, and column names
// immediately after the `SELECT` or `SELECT DISTINCT` keywords in a SQL query.
export const suggestColumnsAfterSelect = (
  docText: string, // The full text of the current SQL document
  currentWord: string, // The current word being typed at the cursor
  pos: number, // Cursor position
  word: { from: number } | null, // The range of the current word
  allColumns: string[], // List of available column names to suggest
  needsQuotes: (id: string) => boolean, // Function to determine if a column name needs quotes
  ast: Select | Select[] | null // The parsed SQL AST (Abstract Syntax Tree)
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

  // Regex to match `SELECT` or `SELECT DISTINCT` with no columns yet typed
  const selectRegex = /^select\s*$/i;
  const selectDistinctRegex = /^select\s+distinct\s*$/i;

  // === STEP 2: Check if DISTINCT is present ===
  const isDistinctPresent =
    selectDistinctRegex.test(docText.trim()) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some((node: Select) => node.type === "select" && node.distinct)
        : ast.type === "select" && ast.distinct));

  // === STEP 3: If in SELECT or SELECT DISTINCT with no columns, offer suggestions ===
  if (
    inSelectClause ||
    selectRegex.test(docText.trim()) ||
    selectDistinctRegex.test(docText.trim())
  ) {
    // Filter column suggestions if user has started typing a partial word
    const filteredColumns = allColumns.filter((column) =>
      currentWord
        ? column.toLowerCase().startsWith(currentWord.replace(/["']/g, ""))
        : true
    );

    // === STEP 4: Build suggestions ===
    const options = [
      // Suggest DISTINCT only if not already present and not after SELECT DISTINCT
      ...(!isDistinctPresent
        ? [
            {
              label: "DISTINCT",
              type: "keyword",
              apply: "DISTINCT ",
              detail: "Select unique values",
            },
            {
              label: "COUNT(*)",
              type: "function",
              apply: "COUNT(*) ",
              detail: "Count all rows",
            },
          ]
        : []),
      // Only include '*' if DISTINCT is not present
      ...(!isDistinctPresent
        ? [
            {
              label: "*",
              type: "field",
              apply: "* ",
              detail: "All columns",
            },
          ]
        : []),
      // Map each matching column to a completion item
      ...filteredColumns.map((column) => ({
        label: column,
        type: "field",
        apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
        detail: "Column name",
      })),
    ];

    // === STEP 5: Return suggestions if there are any ===
    if (options.length > 0) {
      return {
        from: word ? word.from : pos, 
        options,
        filter: true, // Enable filtering as user types more
        validFor: /^["'\w.]*$/, // Only trigger if valid characters (letters, quotes, etc.)
      };
    }
  }

  // === STEP 6: Not in SELECT clause or already has columns -> no suggestions ===
  return null;
};
import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { stripQuotes } from "../stripQuotes";

// This function provides autocomplete suggestions for DISTINCT, *, aggregate functions,
// and column names immediately after the `SELECT` or `SELECT DISTINCT` keywords in a SQL query,
// or within the parentheses of an aggregate function (e.g., MAX(), SUM(), MIN(), AVG()).
export const suggestColumnsAfterSelect = (
  docText: string, // The full text of the current SQL document
  currentWord: string, // The current word being typed at the cursor
  pos: number, // Cursor position
  word: { from: number } | null, // The range of the current word
  allColumns: string[], // List of available column names to suggest
  needsQuotes: (id: string) => boolean, // Function to determine if a column name needs quotes
  ast: Select | Select[] | null // The parsed SQL AST (Abstract Syntax Tree)
): CompletionResult | null => {
  // Regex to match SELECT or SELECT DISTINCT with no columns yet typed
  const selectRegex = /^SELECT\s*(DISTINCT\s*)?$/i;
  // Regex to match inside an aggregate function (e.g., SELECT AVG(, SELECT AVG(d)
  const aggrFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?(?:SUM|MAX|MIN|AVG)\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*$/i;

  const aggrMatch = docText.match(aggrFuncRegex);
  const isInSelectClause =
    selectRegex.test(docText.trim()) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some(
            (node: Select) =>
              node.type === "select" &&
              (!node.columns || node.columns.length === 0)
          )
        : ast.type === "select" && (!ast.columns || ast.columns.length === 0)));

  // === STEP 2: Check if DISTINCT is present ===
  // Regex to match `SELECT` or `SELECT DISTINCT` with no columns yet typed
  const isDistinctPresent =
    /^SELECT\s+DISTINCT\s*$/i.test(docText.trim()) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some((node: Select) => node.type === "select" && node.distinct)
        : ast.type === "select" && ast.distinct));

  // === STEP 3: Handle suggestions inside aggregate function parentheses
  if (aggrMatch) {
    const partialColumn = aggrMatch[2] ? stripQuotes(aggrMatch[2]) : "";
    const filteredColumns = allColumns.filter((column) =>
      partialColumn
        ? column.toLowerCase().startsWith(partialColumn.toLowerCase())
        : true
    );
    // Filter column suggestions if user has started typing a partial word
    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}") ` : `${column}) `,
          detail: "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Handle suggestions after SELECT or SELECT DISTINCT
  if (isInSelectClause || selectRegex.test(docText.trim())) {
    const filteredColumns = allColumns.filter((column) =>
      currentWord
        ? column
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // === STEP 4: Build suggestions ===
    const options = [
      // Suggest DISTINCT and aggregate functions if not after SELECT DISTINCT
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
            {
              label: "SUM(",
              type: "function",
              apply: "SUM(",
              detail: "Sum of column values",
            },
            {
              label: "MAX(",
              type: "function",
              apply: "MAX(",
              detail: "Maximum column value",
            },
            {
              label: "MIN(",
              type: "function",
              apply: "MIN(",
              detail: "Minimum column value",
            },
            {
              label: "AVG(",
              type: "function",
              apply: "AVG(",
              detail: "Average of column values",
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
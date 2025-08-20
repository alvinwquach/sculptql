import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { stripQuotes } from "../stripQuotes";

export const suggestColumnsAfterSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  allColumns: string[],
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Define regex patterns for SELECT, UNION SELECT, aggregate functions, and ROUND
  // 2. If in a CASE statement or after a column in SELECT, return null (handled by suggestCaseClause)
  // 3. If inside ROUND(column, suggest decimal places
  // 4. If inside aggregate function (e.g., SUM(), suggest columns
  // 5. If after SELECT or SELECT DISTINCT (including after UNION), suggest:
  //    a. DISTINCT (if not present), aggregate functions, *, and columns
  // 6. Return null if no suggestions apply

  // Regex to match SELECT or SELECT DISTINCT with no columns yet typed at the start of the query
  const selectRegex = /^SELECT\s*(DISTINCT\s*)?$/i;
  // Regex to match SELECT or SELECT DISTINCT after UNION or UNION ALL
  const unionSelectRegex = /\bUNION\s*(ALL\s*)?SELECT\s*(DISTINCT\s*)?$/i;
  // Regex to match inside an aggregate function (e.g., SELECT AVG(, SELECT AVG(d)
  const aggrFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?(?:SUM|MAX|MIN|AVG|ROUND)\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*$/i;
  // Regex to match after ROUND(column, (e.g., SELECT ROUND(price,
  const roundDecimalRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\(\s*(?:"[\w]+"|'[\w]+'|[\w_]+)\s*,\s*(\d*)?\s*$/i;
  // Regex to detect if we're in a CASE statement
  const inCaseStatementRegex = /\bCASE\s+([^;]*?)$/i;
  // Regex to detect if we're after a column in SELECT
  const afterSelectColumnRegex = /\bSELECT\s+([^;]*?),\s*(\w*)$/i;

  // If we're in a CASE statement or after a column in SELECT, don't suggest columns (let suggestCaseClause handle it)
  if (
    inCaseStatementRegex.test(docText) ||
    afterSelectColumnRegex.test(docText)
  ) {
    return null;
  }

  const aggrMatch = docText.match(aggrFuncRegex);
  const roundDecimalMatch = docText.match(roundDecimalRegex);
  // Check if we're in a SELECT clause with no columns yet
  const isInSelectClause =
    selectRegex.test(docText.trim()) ||
    // Add support for UNION SELECT
    unionSelectRegex.test(docText.trim()) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some(
            (node: Select) =>
              node.type === "select" &&
              (!node.columns || node.columns.length === 0)
          )
        : ast.type === "select" && (!ast.columns || ast.columns.length === 0)));

  // Check if DISTINCT is present
  const isDistinctPresent =
    /^SELECT\s+DISTINCT\s*$/i.test(docText.trim()) ||
    (unionSelectRegex.test(docText.trim()) &&
      // Check for DISTINCT after UNION SELECT
      docText.match(/\bDISTINCT\s*$/i)) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some((node: Select) => node.type === "select" && node.distinct)
        : ast.type === "select" && ast.distinct));

  // Handle suggestions for decimal places in ROUND(column, ...)
  if (roundDecimalMatch) {
    const partialNumber = roundDecimalMatch[2] || "";
    const decimalOptions = ["0", "1", "2", "3", "4"].filter((num) =>
      partialNumber ? num.startsWith(partialNumber) : true
    );
    return {
      from: word ? word.from : pos,
      options: decimalOptions.map((num) => ({
        label: num,
        type: "number",
        apply: `${num}) `,
        detail: "Decimal places",
      })),
      filter: true,
      validFor: /^\d*$/,
    };
  }

  // Handle suggestions inside aggregate function parentheses
  if (aggrMatch) {
    const partialColumn = aggrMatch[2] ? stripQuotes(aggrMatch[2]) : "";
    const isRoundFunction = aggrMatch[0].toUpperCase().includes("ROUND(");
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
          apply: needsQuotes(column)
            ? isRoundFunction
              ? `"${column}", `
              : `"${column}") `
            : isRoundFunction
            ? `${column}, `
            : `${column}) `,
          detail: "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Handle suggestions after SELECT or SELECT DISTINCT (including after UNION SELECT or UNION ALL)
  if (
    isInSelectClause ||
    selectRegex.test(docText.trim()) ||
    unionSelectRegex.test(docText.trim())
  ) {
    const filteredColumns = allColumns.filter((column) =>
      currentWord
        ? column
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // Build suggestions
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
            {
              label: "ROUND(",
              type: "function",
              apply: "ROUND(",
              detail: "Round column values",
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

    // Return suggestions if there are any
    if (options.length > 0) {
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^["'\w.]*$/,
      };
    }
  }

  return null;
};
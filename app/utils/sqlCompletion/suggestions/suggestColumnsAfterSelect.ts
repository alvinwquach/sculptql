import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { SelectOption } from "@/app/types/query";
import { stripQuotes } from "../stripQuotes";

export const suggestColumnsAfterSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  allColumns: string[],
  selectedColumns: SelectOption[],
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Check if query is after SELECT or SELECT DISTINCT (including in CTE or UNION)
  // 2. Check if in a CTE subquery and count parentheses
  // 3. If inside an aggregate function (e.g., AVG(), ROUND()), suggest columns
  // 4. If after ROUND(column, suggest decimal places
  // 5. If after SELECT *, suggest FROM or ) (if in CTE)
  // 6. Suggest columns, DISTINCT, aggregate functions, *, or ) (if in CTE) after SELECT
  // 7. Return null if in CASE or after a column in SELECT

  // Check if in a CTE subquery and count parentheses
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );

  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  const selectRegex = /\bSELECT\s*(DISTINCT\s*)?$/i;
  const unionSelectRegex = /\bUNION\s*(ALL\s*)?SELECT\s*(DISTINCT\s*)?$/i;
  const aggrFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?(?:SUM|MAX|MIN|AVG|ROUND)\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*$/i;
  const roundDecimalRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\(\s*(?:"[\w]+"|'[\w]+'|[\w_]+)\s*,\s*(\d*)?\s*$/i;
  const inCaseStatementRegex = /\bCASE\s+([^;]*?)$/i;
  const afterSelectColumnRegex = /\bSELECT\s+([^;]*?),\s*(\w*)$/i;
  const selectStarRegex = /\bSELECT\s*(DISTINCT\s*)?\*\s*$/i;
  const cteSelectRegex =
    /\bWITH\s+[\w"]+\s+AS\s*\(\s*SELECT\s*(DISTINCT\s*)?$/i;

  if (
    inCaseStatementRegex.test(docText) ||
    afterSelectColumnRegex.test(docText)
  ) {
    return null;
  }

  const aggrMatch = docText.match(aggrFuncRegex);
  const roundDecimalMatch = docText.match(roundDecimalRegex);
  const selectStarMatch = docText.match(selectStarRegex);

  const isInSelectClause =
    selectRegex.test(docText.trim()) ||
    unionSelectRegex.test(docText.trim()) ||
    cteSelectRegex.test(docText) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some(
            (node: Select) =>
              node.type === "select" &&
              (!node.columns || node.columns.length === 0)
          )
        : ast.type === "select" && (!ast.columns || ast.columns.length === 0)));

  const isDistinctPresent =
    /^SELECT\s+DISTINCT\s*$/i.test(docText.trim()) ||
    (unionSelectRegex.test(docText.trim()) &&
      docText.match(/\bDISTINCT\s*$/i)) ||
    (cteSelectRegex.test(docText) && docText.match(/\bDISTINCT\s*$/i)) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some((node: Select) => node.type === "select" && node.distinct)
        : ast.type === "select" && ast.distinct));

  // Extract selected column names for exclusion
  const selectedColumnNames = selectedColumns.map((c) => c.value.toLowerCase());

  // Suggest decimals for ROUND
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
        apply: `${num}`,
        detail: "Decimal places",
      })),
      filter: true,
      validFor: /^\d*$/,
    };
  }

  // Suggest columns inside aggregate functions
  if (aggrMatch) {
    const partialColumn = aggrMatch[2] ? stripQuotes(aggrMatch[2]) : "";
    const isRoundFunction = aggrMatch[0].toUpperCase().includes("ROUND(");

    const filteredColumns = allColumns.filter((column) => {
      const colLower = column.toLowerCase();
      return (
        !selectedColumnNames.includes(colLower) &&
        (partialColumn
          ? colLower.startsWith(partialColumn.toLowerCase())
          : true)
      );
    });

    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column)
            ? isRoundFunction
              ? `"${column}", `
              : `"${column}"`
            : isRoundFunction
            ? `${column}, `
            : `${column}`,
          detail: "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Suggest FROM or ) after SELECT *
  if (selectStarMatch) {
    const options = [
      {
        label: "FROM",
        type: "keyword",
        apply: "FROM ",
        detail: "Specify table to select from",
      },
    ];

    if (isInCteSubquery && parenCount > 0) {
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }

    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(FROM|\))$/i,
    };
  }

  // Suggest columns, DISTINCT, aggregates, *, or ) after SELECT
  if (
    isInSelectClause ||
    selectRegex.test(docText.trim()) ||
    unionSelectRegex.test(docText.trim()) ||
    cteSelectRegex.test(docText)
  ) {
    const filteredColumns = allColumns.filter((column) => {
      const colLower = column.toLowerCase();
      return (
        !selectedColumnNames.includes(colLower) &&
        (currentWord
          ? colLower.startsWith(stripQuotes(currentWord).toLowerCase())
          : true)
      );
    });

    const options = [
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
            {
              label: "*",
              type: "field",
              apply: "* ",
              detail: "All columns",
            },
          ]
        : []),
      ...filteredColumns.map((column) => ({
        label: column,
        type: "field",
        apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
        detail: "Column name",
      })),
    ];

    if (isInCteSubquery && parenCount > 0) {
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }

    if (options.length > 0) {
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^["'\w.*()]*$/,
      };
    }
  }

  return null;
};

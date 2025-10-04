import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";
import { getAvailableColumns } from "./helpers";

export function getSelectCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  context: CompletionContext
): CompletionResult | null {
  // Set the options to the options array empty
  const options = [];
  // Set the select match to the select match
  const selectMatch = textBeforeCursor.match(/\bSELECT\s+(DISTINCT\s+)?(.+?)$/i);
  // Set the has selected columns to the has selected columns
  const hasSelectedColumns = selectMatch && selectMatch[2] &&
    selectMatch[2].trim().length > 0 &&
    !/^\s*$/i.test(selectMatch[2]) &&
    selectMatch[2] !== '*';
  // Set the has distinct to the has distinct
  const hasDistinct = /\bSELECT\s+DISTINCT\b/i.test(textBeforeCursor);
  // If the has selected columns is true and 
  // the text before cursor does not end with a comma
  if (hasSelectedColumns && !/,\s*$/.test(textBeforeCursor)) {
    options.push({
      label: "FROM",
      type: "keyword",
      apply: "FROM ",
      detail: "Specify table to select from",
      boost: 10,
    });
  }
  // If the has distinct is false and 
  // the text before cursor ends with a select
  if (!hasDistinct && /\bSELECT\s*$/i.test(textBeforeCursor)) {
    options.push({
      label: "DISTINCT",
      type: "keyword",
      apply: "DISTINCT ",
      detail: "Select unique values only",
    });
  }

  // Set the aggregate functions to the aggregate functions array
  const aggregateFunctions = [
    { label: "COUNT(*)", apply: "COUNT(*)", detail: "Count all rows" },
    { label: "SUM()", apply: "SUM(", detail: "Sum numeric values" },
    { label: "AVG()", apply: "AVG(", detail: "Average numeric values" },
    { label: "MIN()", apply: "MIN(", detail: "Minimum value" },
    { label: "MAX()", apply: "MAX(", detail: "Maximum value" },
    ...(hasSelectedColumns ? [] : [{ label: "*", apply: "*", detail: "All columns" }]),
  ];

  // Push the aggregate functions to the options
  options.push(...aggregateFunctions);
  // Set the available columns to the available columns
  const availableColumns = getAvailableColumns(context);
  // Push the available columns to the options
  options.push(
    ...availableColumns.map((col) => ({
      label: col,
      type: "field",
      apply: context.needsQuotes(col) ? `"${col}"` : col,
      detail: "Column",
    }))
  );
  // Return the options
  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^[\w*"']*$/,
  };
}

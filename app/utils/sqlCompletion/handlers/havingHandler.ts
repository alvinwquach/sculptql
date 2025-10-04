import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";

export function getHavingCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  _textBeforeCursor: string,
  _context: CompletionContext
): CompletionResult | null {
  // Set the options to the options array empty
  const options = [];

  // Set the aggregate functions to the aggregate functions array
  const aggregateFunctions = [
    { label: "COUNT(*)", apply: "COUNT(*)", detail: "Count all rows" },
    { label: "SUM()", apply: "SUM(", detail: "Sum numeric values" },
    { label: "AVG()", apply: "AVG(", detail: "Average numeric values" },
    { label: "MIN()", apply: "MIN(", detail: "Minimum value" },
    { label: "MAX()", apply: "MAX(", detail: "Maximum value" },
  ];

  // Push the aggregate functions to the options
  options.push(...aggregateFunctions);
  // Set the operators to the operators array

  const operators = [
    { label: ">", apply: "> ", detail: "Greater than" },
    { label: "<", apply: "< ", detail: "Less than" },
    { label: ">=", apply: ">= ", detail: "Greater than or equal" },
    { label: "<=", apply: "<= ", detail: "Less than or equal" },
    { label: "=", apply: "= ", detail: "Equals" },
    { label: "!=", apply: "!= ", detail: "Not equals" },
  ];

  // Push the operators to the options
  options.push(...operators);

  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^[\w"']*$/,
  };
}

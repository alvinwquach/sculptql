import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";

export function getLimitCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  _textBeforeCursor: string,
  _context: CompletionContext
): CompletionResult | null {
  // Set the options to the options array
  const options = [
    { label: "10", type: "number", apply: "10", detail: "Limit to 10 rows" },
    { label: "25", type: "number", apply: "25", detail: "Limit to 25 rows" },
    { label: "50", type: "number", apply: "50", detail: "Limit to 50 rows" },
    { label: "100", type: "number", apply: "100", detail: "Limit to 100 rows" },
    { label: "1000", type: "number", apply: "1000", detail: "Limit to 1000 rows" },
  ];

  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^\d*$/,
  };
}

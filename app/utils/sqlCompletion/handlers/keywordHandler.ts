import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";

export function getKeywordCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  _textBeforeCursor: string,
  _context: CompletionContext
): CompletionResult | null {
  // Set the query start keywords to the query start keywords
  const queryStartKeywords = [
    { label: "SELECT", apply: "SELECT ", detail: "Select data from tables" },
    {
      label: "WITH",
      apply: "WITH ",
      detail: "Common Table Expression (CTE)",
    },
    {
      label: "VALUES",
      apply: "VALUES ",
      detail: "Query literal rows of data",
    },
    {
      label: "TABLE",
      apply: "TABLE ",
      detail: "Query table directly (PostgreSQL)",
    },
  ];
  // Set the filtered keywords to the filtered keywords
  const filteredKeywords = queryStartKeywords.filter((keyword) =>
    // If the current word is true
    currentWord
      // If the current word is true
      ? keyword.label.toLowerCase().startsWith(currentWord.toLowerCase())
      : true
  );

  return {
    from: word ? word.from : pos,
    options: filteredKeywords,
    filter: true,
    validFor: /^[A-Z\s]*$/i,
  };
}

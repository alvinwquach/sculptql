import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";

export function getUnionCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  _context: CompletionContext
): CompletionResult | null {
  // Set the after union match to the after union match
  const afterUnionMatch = textBeforeCursor.match(
    /\bUNION(?:\s+ALL)?\s*$/i
  );
  // If the after union match is true
  if (afterUnionMatch) {
    // Return the options
    return {
      from: word ? word.from : pos,
      options: [
        { label: "SELECT", type: "keyword", apply: "SELECT ", detail: "Start new SELECT query" },
      ],
      filter: true,
      validFor: /^SELECT$/i,
    };
  }

  // Set the options to the options array
  const options = [
    { label: "UNION", apply: "UNION ", detail: "Union (removes duplicates)" },
    {
      label: "UNION ALL",
      apply: "UNION ALL ",
      detail: "Union all (keeps duplicates)",
    },
  ];

  // Return the options
  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^UNION(\s+ALL)?$/i,
  };
}

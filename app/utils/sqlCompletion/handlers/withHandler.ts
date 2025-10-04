import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";

export function getWithCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  _context: CompletionContext
): CompletionResult | null {
  // Set the after cte name match to the after cte name match
  const afterCteNameMatch = textBeforeCursor.match(
    /\bWITH\s+(?:RECURSIVE\s+)?[\w"']+\s*$/i
  );

  // If the after cte name match is true
  if (afterCteNameMatch) {
    // Return the options
    return {
      from: word ? word.from : pos,
      options: [
        { label: "AS", type: "keyword", apply: "AS (", detail: "Define CTE query" },
      ],
      filter: true,
      validFor: /^AS$/i,
    };
  }

  // Set the after as match to the after as match
  const afterAsMatch = textBeforeCursor.match(
    /\bWITH\s+(?:RECURSIVE\s+)?[\w"']+\s+AS\s*\(\s*$/i
  );
  // If the after as match is true
  if (afterAsMatch) {
    // Return the options
    return {
      from: word ? word.from : pos,
      options: [
        { label: "SELECT", type: "keyword", apply: "SELECT ", detail: "Start CTE SELECT query" },
      ],
      filter: true,
      validFor: /^SELECT$/i,
    };
  }

  // Set the after cte closed to the after cte closed
  const afterCteClosed = textBeforeCursor.match(
    /\bWITH\s+(?:RECURSIVE\s+)?[\w"']+\s+AS\s*\([^)]+\)\s*$/i
  );

  // If the after cte closed is true
  if (afterCteClosed) {
    // Return the options
    return {
      from: word ? word.from : pos,
      options: [
        { label: "SELECT", type: "keyword", apply: "SELECT ", detail: "Main SELECT query" },
        { label: ",", type: "keyword", apply: ", ", detail: "Define another CTE" },
      ],
      filter: true,
      validFor: /^(SELECT|,)$/i,
    };
  }

  // Set the options to the options array
  const options = [
    { label: "WITH", apply: "WITH ", detail: "Common Table Expression" },
    {
      label: "WITH RECURSIVE",
      apply: "WITH RECURSIVE ",
      detail: "Recursive CTE",
    },
  ];

  // Return the options
  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^WITH(\s+RECURSIVE)?$/i,
  };
}

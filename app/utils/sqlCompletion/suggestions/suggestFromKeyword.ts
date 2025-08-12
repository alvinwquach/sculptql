import { CompletionResult } from "@codemirror/autocomplete";

/**
 * Suggests the FROM keyword after a column or "*" is selected.
 */
export const suggestFromKeyword = (
  docText: string,
  pos: number
): CompletionResult | null => {
  // Matches: SELECT <column or *> with optional quotes
  const selectColumnRegex = /^select\s+((?:"[\w]+"|[\w_]+)|\*)\s*$/i;

  if (selectColumnRegex.test(docText) && !/\bfrom\b/i.test(docText)) {
    return {
      from: pos,
      options: [
        {
          label: "FROM",
          type: "keyword",
          apply: "FROM ",
          detail: "Specify table",
        },
      ],
    };
  }
  return null;
};

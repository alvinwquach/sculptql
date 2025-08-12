import { CompletionResult } from "@codemirror/autocomplete";

export const suggestSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null
): CompletionResult | null => {
  if (
    (!docText || /^s(el(ect)?)?$/i.test(currentWord)) &&
    !/^\s*select\b/i.test(docText)
  ) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "SELECT",
          type: "keyword",
          apply: "SELECT ",
          detail: "Select data from a table",
        },
      ],
    };
  }
  return null;
};

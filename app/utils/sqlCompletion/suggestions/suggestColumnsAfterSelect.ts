import { CompletionResult } from "@codemirror/autocomplete";

/**
 * Suggests "*" and column names after `SELECT`.
 */
export const suggestColumnsAfterSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  allColumns: string[],
  needsQuotes: (id: string) => boolean
): CompletionResult | null => {
  if (/^select\s*$/i.test(docText)) {
    const filteredColumns = allColumns.filter((column) =>
      currentWord
        ? column.toLowerCase().startsWith(currentWord.replace(/"/g, ""))
        : true
    );

    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "*",
          type: "field",
          apply: "* ",
          detail: "All columns",
        },
        ...filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
          detail: "Column name",
        })),
      ],
      filter: true,
      validFor: /^["\w.]*$/,
    };
  }
  return null;
};

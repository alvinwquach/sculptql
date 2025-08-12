import { CompletionResult } from "@codemirror/autocomplete";

/**
 * Suggests table names after FROM.
 */
export const suggestTablesAfterFrom = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  getValidTables: (selectedColumn: string | null) => string[],
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean
): CompletionResult | null => {
  const selectFromTableRegex =
    /^select\s+((?:"[\w]+"|[\w_]+)|\*)\s+from\s*(\w*)$/i;

  if (selectFromTableRegex.test(docText)) {
    const match = docText.match(selectFromTableRegex);
    const selectedColumn =
      match && match[1] !== "*" ? stripQuotes(match[1]) : null;

    const filteredTables = getValidTables(selectedColumn).filter((tableName) =>
      currentWord ? tableName.toLowerCase().startsWith(currentWord) : true
    );

    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredTables.map((tableName) => ({
          label: tableName,
          type: "table",
          apply: needsQuotes(tableName) ? `"${tableName}";` : `${tableName};`,
          detail: "Table name",
        })),
        filter: true,
        validFor: /^\w*$/,
      };
    }
  }
  return null;
};

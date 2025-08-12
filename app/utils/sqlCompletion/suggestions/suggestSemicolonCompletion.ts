import { TableColumn } from "@/app/types/query";
import { CompletionResult } from "@codemirror/autocomplete";

/**
 * Suggests a semicolon to complete the query after SELECT <column> FROM <table>.
 */
export const suggestSemicolonCompletion = (
  docText: string,
  pos: number,
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string
): CompletionResult | null => {
  const selectColumnFromTableRegex =
    /^select\s+((?:"[\w]+"|[\w_]+))\s+from\s+(\w+)\s*$/i;

  if (selectColumnFromTableRegex.test(docText)) {
    const match = docText.match(selectColumnFromTableRegex);
    const selectedColumn = match ? stripQuotes(match[1]) : null;
    const selectedTable = match ? match[2] : null;

    if (
      selectedColumn &&
      selectedTable &&
      tableColumns[selectedTable] &&
      !tableColumns[selectedTable].some(
        (col) => col.toLowerCase() === selectedColumn.toLowerCase()
      )
    ) {
      return null;
    }

    return {
      from: pos,
      options: [
        {
          label: ";",
          type: "text",
          apply: ";",
          detail: "Complete query",
        },
      ],
    };
  }
  return null;
};

import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

export const suggestGroupByClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for FROM clause
  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    !!fromItem &&
    typeof fromItem === "object" &&
    "table" in fromItem &&
    (typeof (fromItem as { table: unknown }).table === "string" ||
      (fromItem as { table: unknown }).table === null);

  // Get the table name from the FROM clause
  let selectedTable: string | null = null;
  if (ast) {
    const selectNode = Array.isArray(ast)
      ? ast.find((node: Select) => isSelectNode(node))
      : isSelectNode(ast)
      ? ast
      : null;
    if (selectNode && selectNode.from) {
      const fromClause = Array.isArray(selectNode.from)
        ? selectNode.from[0]
        : selectNode.from;
      if (isTableReference(fromClause)) {
        selectedTable = fromClause.table;
      }
    }
  } else {
    const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
    selectedTable = fromMatch ? fromMatch[1] : null;
  }

  if (!selectedTable || !tableColumns[selectedTable]) {
    return null;
  }

  // Check if GROUP BY already exists in the query
  const hasGroupBy = /\bGROUP\s+BY\b/i.test(docText);

  // Suggest GROUP BY after FROM or WHERE if no GROUP BY exists
  const afterTableOrWhereRegex = /\bFROM\s+\w+(\s+WHERE\s+[^;]*?)?\s*$/i;
  if (!hasGroupBy && afterTableOrWhereRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "GROUP BY",
          type: "keyword",
          apply: "GROUP BY ",
          detail: "Group results by column",
        },
      ],
      filter: true,
      validFor: /^GROUP\s*BY$/i,
    };
  }

  // Suggest columns after GROUP BY
  const afterGroupByRegex = /\bGROUP\s+BY\s*(\w*)$/i;
  if (afterGroupByRegex.test(docText)) {
    const columns = tableColumns[selectedTable].filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    if (columns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: columns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
          detail: "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Suggest ORDER BY or ; after a valid GROUP BY column
  const afterGroupByColumnRegex =
    /\bGROUP\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  const match = docText.match(afterGroupByColumnRegex);
  if (match) {
    const column = stripQuotes(match[1]);
    if (
      tableColumns[selectedTable].some(
        (c) => stripQuotes(c).toLowerCase() === column.toLowerCase()
      )
    ) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "ORDER BY",
            type: "keyword",
            apply: "ORDER BY ",
            detail: "Sort results",
          },
          {
            label: ";",
            type: "text",
            apply: ";",
            detail: "Complete query",
          },
        ],
        filter: true,
        validFor: /^(ORDER\s+BY|;)$/i,
      };
    }
  }

  return null;
};

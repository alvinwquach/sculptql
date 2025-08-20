import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

export const suggestOrderByClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Define type guards for Select node and table reference
  // 2. Extract table name from AST or regex
  // 3. If after FROM or WHERE and no ORDER BY, suggest ORDER BY
  // 4. If after ORDER BY, suggest columns
  // 5. If after a valid column, suggest ASC, DESC, or LIMIT
  // 6. Return null if no suggestions apply

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

  // Check if ORDER BY already exists in the query
  const hasOrderBy = /\bORDER\s+BY\b/i.test(docText);

  // Suggest ORDER BY only after FROM or WHERE and if no ORDER BY exists
  const afterTableOrWhereRegex = /\bFROM\s+\w+(\s+WHERE\s+[^;]*?)?\s*$/i;
  if (!hasOrderBy && afterTableOrWhereRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "ORDER BY",
          type: "keyword",
          apply: "ORDER BY ",
          detail: "Sort results",
        },
      ],
      filter: true,
      validFor: /^ORDER\s*BY$/i,
    };
  }

  // Suggest columns after ORDER BY
  const afterOrderByRegex = /\bORDER\s+BY\s*(\w*)$/i;
  if (afterOrderByRegex.test(docText)) {
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

  // Suggest ASC, DESC, or LIMIT after a valid column
  const afterOrderByColumnRegex =
    /\bORDER\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  const match = docText.match(afterOrderByColumnRegex);
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
            label: "ASC",
            type: "keyword",
            apply: "ASC ",
            detail: "Sort in ascending order (A-Z, low-high)",
          },
          {
            label: "DESC",
            type: "keyword",
            apply: "DESC ",
            detail: "Sort in descending order (Z-A, high-low)",
          },
          {
            label: "LIMIT",
            type: "keyword",
            apply: "LIMIT ",
            detail: "Limit the number of rows returned",
          },
        ],
        filter: true,
        validFor: /^(ASC|DESC|LIMIT)$/i,
      };
    }
  }

  return null;
};
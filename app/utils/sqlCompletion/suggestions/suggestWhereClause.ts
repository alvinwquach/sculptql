import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

export const suggestWhereClause = (
  docText: string, // Full SQL query text
  currentWord: string, // Word currently being typed at the cursor
  pos: number, // Cursor position
  word: { from: number } | null, // Word range (used for determining where to insert suggestion)
  tableColumns: TableColumn, // Function to get valid tables, optionally based on a selected column
  stripQuotes: (s: string) => string, // Utility to remove quotes from identifiers
  needsQuotes: (id: string) => boolean, // Utility to check if a table name needs quotes
  ast: Select | Select[] | null // Parsed SQL Abstract Syntax Tree (AST)
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

  // Suggest columns if immediately after WHERE
  const afterWhereRegex = /\bWHERE\s*(\w*)$/i;
  if (afterWhereRegex.test(docText)) {
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

  // Suggest comparison operators after a valid column
  const afterColumnRegex = /\bWHERE\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  const match = docText.match(afterColumnRegex);
  if (match) {
    const column = stripQuotes(match[1]);
    if (
      tableColumns[selectedTable].some(
        (c) => stripQuotes(c).toLowerCase() === column.toLowerCase()
      )
    ) {
      const operators = ["=", "!=", ">", "<", ">=", "<="];
      return {
        from: word ? word.from : pos,
        options: operators.map((op) => ({
          label: op,
          type: "keyword",
          apply: `${op} `,
          detail: "Comparison operator",
        })),
        filter: true,
        validFor: /^[=!><]*$/,
      };
    }
  }

  // Suggest unique values after an operator
  const afterOperatorRegex =
    /\bWHERE\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?)\s*(\w*)$/i;
  if (afterOperatorRegex.test(docText)) {
    const [column] = docText.match(afterOperatorRegex)!;
    const strippedColumn = stripQuotes(column);
    if (
      tableColumns[selectedTable].some(
        (c) => stripQuotes(c).toLowerCase() === strippedColumn.toLowerCase()
      )
    ) {
      return null;
    }
  }

  return null;
};

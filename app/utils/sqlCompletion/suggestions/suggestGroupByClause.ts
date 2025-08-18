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
    const fromMatch = docText.match(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    selectedTable = fromMatch ? fromMatch[1] : null;
  }

  if (!selectedTable || !tableColumns[selectedTable]) {
    return null;
  }

  // Get selected columns from SELECT clause
  const selectMatch = docText.match(/SELECT\s+(.+?)\s+FROM/i);
  const selectColumns = selectMatch
    ? selectMatch[1]
        .split(",")
        .map((col) => stripQuotes(col.trim()))
        .filter((col) => col)
        .map((col) =>
          col.replace(/^(SUM|MAX|MIN|AVG|ROUND|COUNT)\((.*?)\)$/i, "$1($2)")
        )
    : [];

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
          detail: "Group results by column or column number",
        },
      ],
      filter: true,
      validFor: /^GROUP\s*BY$/i,
    };
  }

  // Suggest columns or column numbers after GROUP BY
  const afterGroupByRegex = /\bGROUP\s+BY\s*([^;]*)$/i;
  if (afterGroupByRegex.test(docText)) {
    const groupByText = afterGroupByRegex.exec(docText)![1].trim();
    const lastCharIsComma = groupByText.endsWith(",");
    const currentGroupByItems = groupByText
      ? groupByText
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item)
      : [];

    // If the last character is a comma or GROUP BY is empty, suggest columns and numbers
    if (lastCharIsComma || groupByText === "") {
      const columns = tableColumns[selectedTable].filter(
        (column) =>
          !currentGroupByItems.includes(column) &&
          !currentGroupByItems.includes(
            selectColumns.findIndex((col) => col === column).toString()
          ) &&
          (currentWord
            ? stripQuotes(column)
                .toLowerCase()
                .startsWith(stripQuotes(currentWord).toLowerCase())
            : true)
      );

      const columnNumberOptions = selectColumns
        .map((_, index) => index + 1)
        .filter(
          (num) =>
            !currentGroupByItems.includes(num.toString()) &&
            (currentWord ? num.toString().startsWith(currentWord) : true)
        );

      const options = [
        ...columns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column)
            ? `"${column}"${lastCharIsComma ? "" : ", "}`
            : `${column}${lastCharIsComma ? "" : ", "}`,
          detail: `Column name (Position ${selectColumns.indexOf(column) + 1})`,
        })),
        ...columnNumberOptions.map((num) => ({
          label: num.toString(),
          type: "text",
          apply: `${num}${lastCharIsComma ? "" : ", "}`,
          detail: `Column number (${selectColumns[num - 1] || "N/A"})`,
        })),
      ];

      if (options.length > 0) {
        return {
          from: word ? word.from : pos,
          options,
          filter: true,
          validFor: /^["'\w\d]*$/,
        };
      }
    }
  }

  // Suggest comma, ORDER BY, or ; after a valid GROUP BY item
  const afterGroupByItemRegex = /\bGROUP\s+BY\s+([^;]+?)(?:(,\s*)?(\w*))?$/i;
  const match = docText.match(afterGroupByItemRegex);
  if (match) {
    const groupByItems = match[1]
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    const lastItem = groupByItems[groupByItems.length - 1];
    const isValidItem =
      !isNaN(parseInt(lastItem)) ||
      tableColumns[selectedTable].some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(lastItem).toLowerCase()
      );

    if (isValidItem) {
      const options = [
        {
          label: ",",
          type: "text",
          apply: ", ",
          detail: "Add another GROUP BY column",
        },
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
      ];

      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(,|ORDER\s+BY|;)$/i,
      };
    }
  }

  return null;
};
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
  // 3. If after FROM, WHERE, or GROUP BY/HAVING and no ORDER BY, suggest ORDER BY
  // 4. If after ORDER BY, suggest columns or column numbers
  // 5. If after a valid ORDER BY column, suggest ASC, DESC, comma, LIMIT, or ;
  // 6. If in a CTE subquery with unbalanced parentheses, include ) in suggestions
  // 7. Return null if no suggestions apply

  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    !!fromItem &&
    typeof fromItem === "object" &&
    "table" in fromItem &&
    (typeof (fromItem as { table: unknown }).table === "string" ||
      (fromItem as { table: unknown }).table === null);

  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

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

  const hasOrderBy = /\bORDER\s+BY\b/i.test(docText);
  const afterTableOrWhereOrGroupByRegex =
    /\bFROM\s+\w+(\s+(WHERE|GROUP\s+BY)\s+[^;]*?)?\s*$/i;
  if (!hasOrderBy && afterTableOrWhereOrGroupByRegex.test(docText)) {
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

  const afterOrderByRegex = /\bORDER\s+BY\s*([^;]*)$/i;
  if (afterOrderByRegex.test(docText)) {
    const orderByText = afterOrderByRegex.exec(docText)![1].trim();
    const lastCharIsComma = orderByText.endsWith(",");
    const currentOrderByItems = orderByText
      ? orderByText
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item)
      : [];

    if (lastCharIsComma || orderByText === "") {
      const selectMatch = docText.match(/SELECT\s+(.+?)\s+FROM/i);
      const selectColumns = selectMatch
        ? selectMatch[1]
            .split(",")
            .map((col) => stripQuotes(col.trim()))
            .filter((col) => col)
        : [];

      const columns = tableColumns[selectedTable].filter(
        (column) =>
          !currentOrderByItems.includes(column) &&
          !currentOrderByItems.includes(
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
            !currentOrderByItems.includes(num.toString()) &&
            (currentWord ? num.toString().startsWith(currentWord) : true)
        );

      const options = [
        ...columns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
          detail: `Column name (Position ${selectColumns.indexOf(column) + 1})`,
        })),
        ...columnNumberOptions.map((num) => ({
          label: num.toString(),
          type: "text",
          apply: `${num} `,
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

  const afterOrderByItemRegex = /\bORDER\s+BY\s+([^;]+?)(\s*)$/i;
  const match = docText.match(afterOrderByItemRegex);
  if (match) {
    const orderByItems = match[1]
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    const lastItem = orderByItems[orderByItems.length - 1];
    const isValidItem =
      !isNaN(parseInt(lastItem)) ||
      tableColumns[selectedTable].some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(lastItem).toLowerCase()
      );

    if (isValidItem) {
      const options = [
        {
          label: "ASC",
          type: "keyword",
          apply: "ASC ",
          detail: "Sort in ascending order",
        },
        {
          label: "DESC",
          type: "keyword",
          apply: "DESC ",
          detail: "Sort in descending order",
        },
        {
          label: ",",
          type: "text",
          apply: ", ",
          detail: "Add another ORDER BY column",
        },
        {
          label: "LIMIT",
          type: "keyword",
          apply: "LIMIT ",
          detail: "Limit the number of rows returned",
        },
        {
          label: ";",
          type: "text",
          apply: ";",
          detail: "Complete query",
        },
      ];

      if (isInCteSubquery && parenCount > 0) {
        options.push({
          label: ")",
          type: "keyword",
          apply: ") ",
          detail: "Close CTE subquery",
        });
      }

      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(ASC|DESC|,|LIMIT|;|\))$/i,
      };
    }
  }

  return null;
};
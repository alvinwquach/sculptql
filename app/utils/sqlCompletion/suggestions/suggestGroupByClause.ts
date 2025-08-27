import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn, SelectOption } from "@/app/types/query";
import { MultiValue } from "react-select";

export const suggestGroupByClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null,
  onGroupByColumnSelect?: (value: MultiValue<SelectOption>) => void
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Define type guards for Select node and FROM clause
  // 2. Detect if inside CTE subquery and count open parentheses
  // 3. Extract table name from AST or regex fallback
  // 4. Extract SELECT columns (accounting for aggregates)
  // 5. If no GROUP BY yet and cursor is after FROM/WHERE -> suggest "GROUP BY"
  // 6. If cursor is after GROUP BY keyword -> suggest column names or column numbers
  //    - Filter out columns already used in GROUP BY
  //    - When applying, call onGroupByColumnSelect?.(newValue)
  // 7. If cursor is after a valid GROUP BY item -> suggest ",", HAVING, ORDER BY, ";"
  // 8. Add ")" option if in CTE with unbalanced parentheses
  // 9. Return null if no matches

  // --- 1. Type guards ---
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

  // --- 2. Detect CTE + parens ---
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  // --- 3. Extract table ---
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

  // --- 4. Extract SELECT columns ---
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

  const hasGroupBy = /\bGROUP\s+BY\b/i.test(docText);
  const hasHaving = /\bHAVING\b/i.test(docText);

  // --- 5. Suggest GROUP BY after FROM/WHERE ---
  const afterTableOrWhereRegex = /\bFROM\s+\w+(\s+WHERE\s+[^;]*?)?\s*$/i;
  if (!hasGroupBy && afterTableOrWhereRegex.test(docText)) {
    const options = [
      {
        label: "GROUP BY",
        type: "keyword",
        apply: "GROUP BY ",
        detail: "Group results by column or column number",
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
      validFor: /^(GROUP\s+BY|\))$/i,
    };
  }

  // --- 6. Suggest columns after GROUP BY ---
  const afterGroupByRegex = /\bGROUP\s+BY\s*([^;]*)$/i;
  if (!hasHaving && afterGroupByRegex.test(docText)) {
    const groupByText = afterGroupByRegex.exec(docText)![1].trim();
    const lastCharIsComma = groupByText.endsWith(",");
    const currentGroupByItems = groupByText
      ? groupByText
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          .filter((item) => item)
      : [];

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
          apply: () => {
            const newValue: SelectOption[] = [
              ...currentGroupByItems
                .filter((item) => tableColumns[selectedTable!].includes(item))
                .map((item) => ({ value: item, label: item })),
              { value: column, label: column },
            ];
            onGroupByColumnSelect?.(newValue);
            return needsQuotes(column)
              ? `"${column}"${lastCharIsComma ? "" : ", "}`
              : `${column}${lastCharIsComma ? "" : ", "}`;
          },
          detail: `Column name (Position ${selectColumns.indexOf(column) + 1})`,
        })),
        ...columnNumberOptions.map((num) => ({
          label: num.toString(),
          type: "text",
          apply: () => {
            const newValue: SelectOption[] = [
              ...currentGroupByItems
                .filter((item) => tableColumns[selectedTable!].includes(item))
                .map((item) => ({ value: item, label: item })),
              { value: selectColumns[num - 1], label: selectColumns[num - 1] },
            ];
            onGroupByColumnSelect?.(newValue); // ✅ safe call
            return `${num}${lastCharIsComma ? "" : ", "}`;
          },
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

  // --- 7. After GROUP BY item -> suggest comma, HAVING, ORDER BY ---
  const afterGroupByItemRegex = /\bGROUP\s+BY\s+([^;]+?)(\s*)$/i;
  const match = docText.match(afterGroupByItemRegex);
  if (!hasHaving && match) {
    const groupByItems = match[1]
      .split(",")
      .map((item) => stripQuotes(item.trim()))
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
          label: "HAVING",
          type: "keyword",
          apply: "HAVING ",
          detail: "Filter grouped results",
        },
        {
          label: "ORDER BY",
          type: "keyword",
          apply: "ORDER BY ",
          detail: "Sort results",
        },
        { label: ";", type: "text", apply: ";", detail: "Complete query" },
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
        validFor: /^(,|HAVING|ORDER\s+BY|;|\))$/i,
      };
    }
  }

  // --- 9. Default fallback ---
  return null;
};

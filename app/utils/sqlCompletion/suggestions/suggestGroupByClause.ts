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

  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    // If the node is undefined, return false
    !!node &&
    // If the node is not an object, return false
    typeof node === "object" &&
    // If the node does not have a type, return false
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for FROM clause
  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    // If the from item is undefined, return false
    !!fromItem &&
    // If the from item is not an object, return false
    typeof fromItem === "object" &&
    // If the from item does not have a table, return false
    "table" in fromItem &&
    (typeof (fromItem as { table: unknown }).table === "string" ||
      (fromItem as { table: unknown }).table === null);

  // Check if in a CTE subquery
      const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Calculate the parenthesis count
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;


  // Set the selected table to null
  let selectedTable: string | null = null;
  // If the ast is a select node
  if (ast) {
    const selectNode = Array.isArray(ast)
      // If the ast is an array, find the first select node
      ? ast.find((node: Select) => isSelectNode(node))
      // If the ast is a select node, return the ast
      : isSelectNode(ast)
      // If the ast is not a select node, return null
      ? ast
      : null;
    // If the select node has a from clause
    if (selectNode && selectNode.from) {
      // Set the from clause to the from clause
      const fromClause = Array.isArray(selectNode.from)
        ? selectNode.from[0]
        : selectNode.from;
      // If the from clause is a table reference
      if (isTableReference(fromClause)) {
        selectedTable = fromClause.table;
      }
    }
  } else {
    // Set the from match to the from match
    const fromMatch = docText.match(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    // Set the selected table to the from match
    selectedTable = fromMatch ? fromMatch[1] : null;
  }
  // If the selected table is null or the table columns 
  // does not have the selected table
  if (!selectedTable || !tableColumns[selectedTable]) {
    // Return null
    return null;
  }

  // Set the select match to the select match
  const selectMatch = docText.match(/SELECT\s+(.+?)\s+FROM/i);
  // Set the select columns to the select columns
  const selectColumns = selectMatch
    ? selectMatch[1]
    // Split the select columns by comma
        .split(",")
        // Strip the quotes from the select columns
        .map((col) => stripQuotes(col.trim()))
        // Filter the select columns by the column
        .filter((col) => col)
        .map((col) =>
          col.replace(/^(SUM|MAX|MIN|AVG|ROUND|COUNT)\((.*?)\)$/i, "$1($2)")
        )
    : [];

  // Set the has group by to the has group by
  const hasGroupBy = /\bGROUP\s+BY\b/i.test(docText);
  // Set the has having to the has having
  const hasHaving = /\bHAVING\b/i.test(docText);

  // Set the after table or where regex to the after table or where regex
  const afterTableOrWhereRegex = /\bFROM\s+\w+(\s+WHERE\s+[^;]*?)?\s*$/i;
  // If the has group by is false and 
  // the after table or where regex is true
  if (!hasGroupBy && afterTableOrWhereRegex.test(docText)) {
    // Set the options to the options
    const options = [
      {
        label: "GROUP BY",
        type: "keyword",
        apply: "GROUP BY ",
        detail: "Group results by column or column number",
      },
    ];
    // If the is in cte subquery and the parenthesis count is greater than 0
    if (isInCteSubquery && parenCount > 0) {
      // Push the ) option to the options
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }
    // Return the options
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(GROUP\s+BY|\))$/i,
    };
  }

  // Set the after group by regex to the after group by regex
  const afterGroupByRegex = /\bGROUP\s+BY\s*([^;]*)$/i;
  // If the has having is false and the after group by regex is true
  if (!hasHaving && afterGroupByRegex.test(docText)) {
    // Set the group by text to the group by text
    const groupByText = afterGroupByRegex.exec(docText)![1].trim();
    // Set the last char is comma to the last char is comma
    const lastCharIsComma = groupByText.endsWith(",");
    // Set the current group by items to the current group by items
    const currentGroupByItems = groupByText
      ? groupByText
        // Split the group by text by comma
          .split(",")
          // Strip the quotes from the group by text
          .map((item) => stripQuotes(item.trim()))
          // Filter the group by text by the item
          .filter((item) => item)
      : [];

    // If the last char is comma or the group by text is empty
    if (lastCharIsComma || groupByText === "") {
      // Set the columns to the columns
      const columns = tableColumns[selectedTable].filter(
        (column) =>
          // If the current group by items does not include the column
          !currentGroupByItems.includes(column) &&
          // If the current group by items does not include the select columns index
          !currentGroupByItems.includes(
            selectColumns.findIndex((col) => col === column).toString()
          ) &&
          // If the current word is true
          (currentWord
            // Set the strip quotes to the strip quotes
            ? stripQuotes(column)
                .toLowerCase()
                .startsWith(stripQuotes(currentWord).toLowerCase())
            : true)
      );

      // Set the column number options to the column number options
      const columnNumberOptions = selectColumns
        // Map the select columns by the index
        .map((_, index) => index + 1)
        // Filter the column number options by the num
        .filter(
          (num) =>
            // If the current group by items does not include the num
            !currentGroupByItems.includes(num.toString()) &&
            // If the current word is true
            (currentWord ? num.toString().startsWith(currentWord) : true)
        );

      // Set the options to the options
      const options = [
        ...columns.map((column) => ({
          label: column,
          type: "field",
          apply: () => {
            // Set the new value to the new value
            const newValue: SelectOption[] = [
              // Set the current group by items 
              // to the current group by items
              ...currentGroupByItems
                // Filter the current group by items by the item
                .filter((item) => tableColumns[selectedTable!].includes(item))
                .map((item) => ({ value: item, label: item })),
              { value: column, label: column },
            ];
            // If the on group by column select is not null
            // On group by column select the new value
            onGroupByColumnSelect?.(newValue);
            // Return the needs quotes
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
            // Set the new value to the new value
            const newValue: SelectOption[] = [
              // Set the current group by items 
              // to the current group by items
              ...currentGroupByItems
                // Filter the current group by items by the item
                .filter((item) => tableColumns[selectedTable!].includes(item))
                .map((item) => ({ value: item, label: item })),
              { value: selectColumns[num - 1], label: selectColumns[num - 1] },
            ];
            // If the on group by column select is not null
            // On group by column select the new value
            onGroupByColumnSelect?.(newValue);
            // Return the num
            return `${num}${lastCharIsComma ? "" : ", "}`;
          },
          detail: `Column number (${selectColumns[num - 1] || "N/A"})`,
        })),
      ];
      // If the options length is greater than 0
      if (options.length > 0) {
        // Return the options
        return {
          from: word ? word.from : pos,
          options,
          filter: true,
          validFor: /^["'\w\d]*$/,
        };
      }
    }
  }


  // Set the after group by item regex to the 
  // after group by item regex
  const afterGroupByItemRegex = /\bGROUP\s+BY\s+([^;]+?)(\s*)$/i;
  // If the has having is false and the 
  // after group by item regex is true
  const match = docText.match(afterGroupByItemRegex);
  // If the has having is false and the match is true
  if (!hasHaving && match) {
    // Set the group by items to the group by items
    const groupByItems = match[1]
      // Split the group by items by comma
      .split(",")
      // Strip the quotes from the group by items
      .map((item) => stripQuotes(item.trim()))
      // Filter the group by items by the item
      .filter((item) => item);
    // Set the last item to the last item
    const lastItem = groupByItems[groupByItems.length - 1];
    // Set the isValidItem to the isValidItem
    const isValidItem =
      !isNaN(parseInt(lastItem)) ||
      // If the table columns does not include the last item
      // Set the isValidItem to the isValidItem
      tableColumns[selectedTable].some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(lastItem).toLowerCase()
      );
    // If the isValidItem is true
    if (isValidItem) {
      // Set the options to the options
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
      // If the is in cte subquery and the 
      // parenthesis count is greater than 0
      if (isInCteSubquery && parenCount > 0) {
        // Push the ) option to the options
        options.push({
          label: ")",
          type: "keyword",
          apply: ") ",
          detail: "Close CTE subquery",
        });
      }
      // Return the options
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(,|HAVING|ORDER\s+BY|;|\))$/i,
      };
    }
  }
  // Return null
  return null;
};

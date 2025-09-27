import { CompletionResult, Completion } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn, SelectOption } from "@/app/types/query";
import { SingleValue } from "react-select";
import { EditorView } from "codemirror";

export const suggestOrderByClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null,
  onOrderBySelect?: (
    column: SingleValue<SelectOption>,
    direction: SingleValue<SelectOption> | null,
    limit?: SingleValue<SelectOption>
  ) => void
): CompletionResult | null => {
  
  // Set the normalized doc text to the normalized doc text
  const normalizedDocText = docText
    // Replace multiple spaces with a single space
    .replace(/\s+/g, " ")
    // Replace FROM with FROM and ORDER BY with ORDER BY
    .replace(
      /(FROM\s+((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*)))(ORDER\s+BY)/i,
      // Replace FROM with FROM and ORDER BY with ORDER BY
      "$1 $2"
    )
    // Trim the normalized doc text
    .trim();


  // Set the is select node to the is select node
  const isSelectNode = (node: unknown): node is Select =>
    // If the node is undefined, return false
    !!node &&
    // If the node is not an object, return false
    typeof node === "object" &&
    // If the node does not have a type, return false
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Set the is table reference to the is table reference
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


  // Set the is in cte subquery to the is in cte subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    normalizedDocText
  );

  // Set the paren count to the paren count
  const parenCount = isInCteSubquery
    // If the is in cte subquery is true
    ? (normalizedDocText.match(/\(/g) || []).length -
      // If the normalized doc text matches the regex, return the length of the matches
      (normalizedDocText.match(/\)/g) || []).length
    : 0;

  // Set the selected table to the selected table null
  let selectedTable: string | null = null;
  // If the ast is a select node
  if (ast) {
    // Set the select node to the select node
    const selectNode = Array.isArray(ast)
      // If the ast is an array, find the first select node
      ? ast.find((node: Select) => isSelectNode(node))
      : isSelectNode(ast)
      // If the ast is a select node, return the ast
      ? ast
      // If the ast is not a select node, return null
      : null;
    if (selectNode && selectNode.from) {
      // Set the from clause to the from clause
      const fromClause = Array.isArray(selectNode.from)
        // If the from clause is an array, 
        // set the from clause to the first item
        ? selectNode.from[0]
        // If the from clause is not an array,
        // set the from clause to the from clause
        : selectNode.from;
      // If the from clause is a table reference
      if (isTableReference(fromClause)) {
        // Set the selected table to the table
        selectedTable = fromClause.table;
      }
    }
  } else {
    // Set the from match to the from match
    const fromMatch = normalizedDocText.match(
      /\bFROM\s+((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))/i
    );
    // Set the selected table to the from match
    selectedTable = fromMatch ? stripQuotes(fromMatch[1]) : null;
  }


  // If the selected table is null or the table columns
  // does not have the selected table
  if (!selectedTable || !tableColumns[selectedTable]) {
    // Log the no valid table or columns found for ORDER BY suggestion
    console.log("No valid table or columns found for ORDER BY suggestion.");
    return null;
  }

  // Log the selected table for ORDER BY
  console.log(
    "Selected table for ORDER BY:",
    selectedTable,
    "Columns:",
    tableColumns[selectedTable]
  );

  // Set the has order by to the has order by
  const hasOrderBy = /\bORDER\s+BY\b/i.test(normalizedDocText);
  // Set the has limit to the has limit
  const hasLimit = /\bLIMIT\b/i.test(normalizedDocText);
  // Set the after table or where or group by regex 
  // to the after table or where or group by regex
  const afterTableOrWhereOrGroupByRegex =
    /\bFROM\s+((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))(\s+WHERE\s+[^;]*?)?(\s+GROUP\s+BY\s+[^;]*?)?\s*$/i;

  // If the has order by is false and the has limit is false
  // and the after table or where or group by regex is true
  if (
    !hasOrderBy &&
    !hasLimit &&
    afterTableOrWhereOrGroupByRegex.test(normalizedDocText)
  ) {
    // Log the suggesting ORDER BY or LIMIT keywords for query
    console.log(
      "Suggesting ORDER BY or LIMIT keywords for query:",
      normalizedDocText
    );
    // Return the options
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "ORDER BY",
          type: "keyword",
          apply: " ORDER BY ",
          detail: "Sort results",
        },
        {
          label: "LIMIT",
          type: "keyword",
          apply: " LIMIT ",
          detail: "Limit the number of rows",
        },
        {
          label: ";",
          type: "text",
          apply: ";",
          detail: "End query",
        },
        ...(isInCteSubquery && parenCount > 0
          ? [
              {
                label: ")",
                type: "keyword",
                apply: ") ",
                detail: "Close CTE subquery",
              },
            ]
          : []),
      ],
      filter: true,
      validFor: /^(ORDER\s+BY|LIMIT|;|\))$/i,
    };
  }

  // Set the after order by regex to the after order by regex
  const afterOrderByRegex = /\bORDER\s+BY\s*([^;]*)$/i;
  // If the after order by regex is true
  if (afterOrderByRegex.test(normalizedDocText)) {
    // Set the order by text to the order by text
    const orderByText = afterOrderByRegex.exec(normalizedDocText)![1].trim();
    // Set the last char is comma to the last char is comma
    const lastCharIsComma = orderByText.endsWith(",");
    // Set the current order by items to the current order by items
    const currentOrderByItems = orderByText
      ? orderByText
        // Split the order by text by the comma
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          // Filter the order by items by the item
          .filter((item) => item)
      : [];

    // If the last char is comma or the order by text is empty  
      if (lastCharIsComma || orderByText === "") {
      // Set the select match to the select match
      const selectMatch = normalizedDocText.match(/SELECT\s+(.+?)\s+FROM/i); // extract SELECT column list
      // Set the select columns to the select columns
      const selectColumns = selectMatch
        // If the select match is true
        ? selectMatch[1]
            // Split the select match by the comma
            .split(",")
            .map((col) => stripQuotes(col.trim()))
            // Filter the select columns by the col
            .filter((col) => col)
        : [];


      // Set the columns to the columns
      const columns = tableColumns[selectedTable].filter(
        (column) =>
          // If the current order by items does not include the column
          !currentOrderByItems.includes(column) &&
          // If the current order by items does not include 
          // the select columns index
          !currentOrderByItems.includes(
            selectColumns.findIndex((col) => col === column).toString()
          ) &&
          // If the current word is true
          (currentWord
            // Strip the quotes from the column
            ? stripQuotes(column)
                // Lowercase the column
                .toLowerCase()
                // Start with the strip quotes current word
                .startsWith(stripQuotes(currentWord).toLowerCase())
            : true)
      );

      // Set the column number options to the column number options
      const columnNumberOptions = selectColumns
        .map((_, index) => index + 1)
        // Filter the column number options by the num
        .filter(
          // If the current order by items does not include the num
          (num) =>
            // If the current order by items does not include the num
            !currentOrderByItems.includes(num.toString()) &&
            (currentWord ? num.toString().startsWith(currentWord) : true)
        );

      // Set the options to the options
      const options: Completion[] = [
        ...columns.map((column) => ({
          label: column,
          type: "field",
          apply: (view: EditorView) => {
            // Set the column name to the column name
            const columnName = needsQuotes(column) ? `"${column}"` : column;
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: columnName,
              },
            });
            // If the on order by select is not null
            // On order by select the column
            if (onOrderBySelect) {
              // Log the applying ORDER BY column
              console.log("Applying ORDER BY column:", column);
              // On order by select the column
              onOrderBySelect({ value: column, label: column }, null);
            }
          },
          detail: `Column name (ORDER BY)`,
        })),
        ...columnNumberOptions.map((num) => ({
          label: num.toString(),
          type: "text",
          apply: (view: EditorView) => {
            const column = selectColumns[num - 1];
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${num}`,
              },
            });
            // If the on order by select is not null 
            // and the column is not null
            // On order by select the column
            if (onOrderBySelect && column) {
              // Log the applying ORDER BY column number
              console.log(
                "Applying ORDER BY column number:",
                num,
                "Column:",
                column
              );
              // On order by select the column
              onOrderBySelect({ value: column, label: column }, null);
            }
          },
          detail: `Column number (${selectColumns[num - 1] || "N/A"})`,
        })),
      ];

      // If the options length is greater than 0
      if (options.length > 0) {
        // Log the ORDER BY column suggestions
        console.log("ORDER BY column suggestions:", options);
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


  // Set the after order by item regex to the after order by item regex
  const afterOrderByItemRegex = /\bORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i;
  // Set the match to the match
  const match = normalizedDocText.match(afterOrderByItemRegex);
  if (match && !hasLimit) {
    // Set the last item to the last item
    const lastItem = match[1].trim().split(",").pop()!.trim();
    // Set the isValid item to the isValid item
    const isValidItem =
      !isNaN(parseInt(lastItem)) ||
      tableColumns[selectedTable].some(
        // If the c is true
        // and the strip quotes c is equal to the strip quotes last item
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(lastItem).toLowerCase()
      );

    // If the isValid item is true and the current word is not true
    if (
      isValidItem &&
      (!currentWord || !/^(ASC|DESC|,|LIMIT|;|\))/i.test(currentWord))
    ) {
      // Set the options to the options
      const options: Completion[] = [
        {
          label: "ASC",
          type: "keyword",
          apply: (view: EditorView) => {
            // Set the updated query to the updated query
            const updatedQuery = normalizedDocText.replace(
              /\bORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i,
              `ORDER BY ${lastItem} ASC`
            );
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: updatedQuery,
              },
            }); 
            // If the on order by select is not null
            // On order by select the column
            if (onOrderBySelect) {
              // Log the applying ORDER BY direction: ASC for column
              console.log(
                "Applying ORDER BY direction: ASC for column:",
                lastItem
              );
              // On order by select the column
              onOrderBySelect(
                { value: stripQuotes(lastItem), label: stripQuotes(lastItem) },
                { value: "ASC", label: "Ascending (A-Z, low-high)" }
              );
            }
          },
          detail: "Sort ascending (A-Z)",
        },
        {
          label: "DESC",
          type: "keyword",
          apply: (view: EditorView) => {
            // Set the updated query to the updated query
            const updatedQuery = normalizedDocText.replace(
              /\bORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i,
              `ORDER BY ${lastItem} DESC`
            );
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: updatedQuery,
              },
            });
            // If the on order by select is not null
            // On order by select the column
            if (onOrderBySelect) {
              // Log the applying ORDER BY direction: DESC for column
              console.log(
                "Applying ORDER BY direction: DESC for column:",
                lastItem
              );
              // On order by select the column
              onOrderBySelect(
                { value: stripQuotes(lastItem), label: stripQuotes(lastItem) },
                { value: "DESC", label: "Descending (Z-A, high-low)" }
              );
            }
          },
          detail: "Sort descending (Z-A)",
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
          apply: " LIMIT ",
          detail: "Limit the number of rows",
        },
        {
          label: ";",
          type: "text",
          apply: ";",
          detail: "End query",
        },
      ];

      // If the is in cte subquery and the 
      // paren count is greater than 0
      if (isInCteSubquery && parenCount > 0) {
        // Push the ) option to the options
        options.push({
          label: ")",
          type: "keyword",
          apply: ") ",
          detail: "Close CTE subquery",
        });
      }

      // Log the suggestions after ORDER BY column
      console.log("Suggestions after ORDER BY column:", options);
      // Return the options
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(ASC|DESC|,|LIMIT|;|\))$/i,
      };
    }
  }


  // Set the after limit regex to the after limit regex
  const afterLimitRegex = /\bLIMIT\s*(\d*)\s*$/i;
  // Set the has number after limit to the has number after limit
  const hasNumberAfterLimit = /\bLIMIT\s+\d+\b/i.test(normalizedDocText);
  // If the after limit regex is true and the 
  // has number after limit is false
  if (afterLimitRegex.test(normalizedDocText) && !hasNumberAfterLimit) {
    // Set the limit suggestions to the limit suggestions
    const limitSuggestions = [
      { value: "1", label: "1", detail: "Limit to 1 row" },
      { value: "3", label: "3", detail: "Limit to 3 rows" },
      { value: "5", label: "5", detail: "Limit to 5 rows" },
      { value: "10", label: "10", detail: "Limit to 10 rows" },
      { value: "25", label: "25", detail: "Limit to 25 rows" },
      { value: "50", label: "50", detail: "Limit to 50 rows" },
      { value: "100", label: "100", detail: "Limit to 100 rows" },
    ];
    // Log the suggesting LIMIT values
    console.log("Suggesting LIMIT values:", limitSuggestions);
    // Return the options
    return {
      from: word ? word.from : pos,
      options: limitSuggestions.map((suggestion) => ({
        label: suggestion.label,
        type: "text",
        apply: (view: EditorView) => {
          // Dispatch the changes
          view.dispatch({
            changes: {
              from: word ? word.from : pos,
              to: pos,
              insert: `${suggestion.value}`,
            },
          });
          // If the on order by select is not null
          // On order by select the limit
          if (onOrderBySelect) {
            // Log the applying LIMIT value
            console.log("Applying LIMIT value:", suggestion.value);
            // On order by select the limit
            onOrderBySelect(null, null, {
              value: suggestion.value,
              label: suggestion.label,
            });
          }
        },
        detail: suggestion.detail,
      })),
      filter: true,
      validFor: /^\d*$/,
    };
  }
  // Log the no ORDER BY suggestions applicable for query
  console.log(
    "No ORDER BY suggestions applicable for query:",
    normalizedDocText
  );
  return null;
};
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
  // PSEUDOCODE
  // 1. Helper type checks
  //    - isSelectNode → verify if AST node is a SELECT.
  //    - isTableReference → verify if FROM clause references a table.
  //
  // 2. Handle CTEs (WITH ... AS (...))
  //    - Detect if user is inside a CTE subquery.
  //    - Track parentheses to know if subquery is still open.
  //
  // 3. Determine selected table
  //    - If AST is available, extract the table from FROM clause.
  //    - Otherwise, fallback to regex parsing on docText.
  //
  // 4. Early exit if no table or unknown columns.
  //
  // 5. Suggest "ORDER BY" keyword
  //    - If query has no ORDER BY yet and cursor is right after FROM/WHERE/GROUP BY, suggest inserting ORDER BY.
  //    - If inside a CTE with open parentheses, also suggest closing “)”.
  //
  // 6. After "ORDER BY" but before any column
  //    - Suggest column names from the current table.
  //    - Suggest column numbers (based on SELECT list).
  //    - Filter out already used ORDER BY items.
  //
  // 7. After an ORDER BY column
  //    - If user typed a valid column/number:
  //        - Suggest ASC, DESC.
  //        - Suggest comma (to add another ORDER BY).
  //        - Suggest LIMIT or semicolon (end query).
  //        - Suggest closing parenthesis if in a CTE.
  //
  // 8. If no case matches, return null (no suggestions).
  //
  // Returns: CompletionResult or null

  // Normalize docText to handle multiple spaces and ensure consistent spacing
  let normalizedDocText = docText
    .replace(/\s+/g, " ")
    .replace(
      /(FROM\s+((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*)))(ORDER\s+BY)/i,
      "$1 $2"
    )
    .trim();

  // --- STEP 1: Helpers to identify SQL AST node types ---
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

  // --- STEP 2: Detect CTEs and unmatched parentheses ---
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    normalizedDocText
  );
  const parenCount = isInCteSubquery
    ? (normalizedDocText.match(/\(/g) || []).length -
      (normalizedDocText.match(/\)/g) || []).length
    : 0;

  // --- STEP 3: Extract table name (from AST if possible, else fallback to regex) ---
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
    const fromMatch = normalizedDocText.match(
      /\bFROM\s+((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))/i
    );
    selectedTable = fromMatch ? stripQuotes(fromMatch[1]) : null;
  }

  // --- STEP 4: Exit early if no table or unknown table columns ---
  if (!selectedTable || !tableColumns[selectedTable]) {
    console.log("No valid table or columns found for ORDER BY suggestion.");
    return null;
  }

  console.log(
    "Selected table for ORDER BY:",
    selectedTable,
    "Columns:",
    tableColumns[selectedTable]
  );

  // --- STEP 5: Suggest "ORDER BY" or "LIMIT" if not present ---
  const hasOrderBy = /\bORDER\s+BY\b/i.test(normalizedDocText);
  const hasLimit = /\bLIMIT\b/i.test(normalizedDocText);
  const afterTableOrWhereOrGroupByRegex =
    /\bFROM\s+((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))(\s+WHERE\s+[^;]*?)?(\s+GROUP\s+BY\s+[^;]*?)?\s*$/i;

  if (
    !hasOrderBy &&
    !hasLimit &&
    afterTableOrWhereOrGroupByRegex.test(normalizedDocText)
  ) {
    console.log(
      "Suggesting ORDER BY or LIMIT keywords for query:",
      normalizedDocText
    );
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

  // --- STEP 6: After ORDER BY but before any column ---
  const afterOrderByRegex = /\bORDER\s+BY\s*([^;]*)$/i;
  if (afterOrderByRegex.test(normalizedDocText)) {
    const orderByText = afterOrderByRegex.exec(normalizedDocText)![1].trim();
    const lastCharIsComma = orderByText.endsWith(",");
    const currentOrderByItems = orderByText
      ? orderByText
          .split(",")
          .map((item) => stripQuotes(item.trim()))
          .filter((item) => item)
      : [];

    // Case: user typed "ORDER BY " or "ORDER BY col1,"
    if (lastCharIsComma || orderByText === "") {
      const selectMatch = normalizedDocText.match(/SELECT\s+(.+?)\s+FROM/i); // extract SELECT column list
      const selectColumns = selectMatch
        ? selectMatch[1]
            .split(",")
            .map((col) => stripQuotes(col.trim()))
            .filter((col) => col)
        : [];

      // build suggestions for actual column names
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

      // build suggestions for column positions (e.g., ORDER BY 1, 2)
      const columnNumberOptions = selectColumns
        .map((_, index) => index + 1)
        .filter(
          (num) =>
            !currentOrderByItems.includes(num.toString()) &&
            (currentWord ? num.toString().startsWith(currentWord) : true)
        );

      const options: Completion[] = [
        ...columns.map((column) => ({
          label: column,
          type: "field",
          apply: (view: EditorView) => {
            const columnName = needsQuotes(column) ? `"${column}"` : column;
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: columnName,
              },
            });
            if (onOrderBySelect) {
              console.log("Applying ORDER BY column:", column);
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
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${num}`,
              },
            });
            if (onOrderBySelect && column) {
              console.log(
                "Applying ORDER BY column number:",
                num,
                "Column:",
                column
              );
              onOrderBySelect({ value: column, label: column }, null);
            }
          },
          detail: `Column number (${selectColumns[num - 1] || "N/A"})`,
        })),
      ];

      // only return if we have something to suggest
      if (options.length > 0) {
        console.log("ORDER BY column suggestions:", options);
        return {
          from: word ? word.from : pos,
          options,
          filter: true,
          validFor: /^["'\w\d]*$/,
        };
      }
    }
  }

  // --- STEP 7: After ORDER BY column, suggest ASC/DESC, etc ---
  const afterOrderByItemRegex = /\bORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i;
  const match = normalizedDocText.match(afterOrderByItemRegex);
  if (match && !hasLimit) {
    const lastItem = match[1].trim().split(",").pop()!.trim();
    const isValidItem =
      !isNaN(parseInt(lastItem)) ||
      tableColumns[selectedTable].some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(lastItem).toLowerCase()
      );

    if (
      isValidItem &&
      (!currentWord || !/^(ASC|DESC|,|LIMIT|;|\))/i.test(currentWord))
    ) {
      const options: Completion[] = [
        {
          label: "ASC",
          type: "keyword",
          apply: (view: EditorView) => {
            const updatedQuery = normalizedDocText.replace(
              /\bORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i,
              `ORDER BY ${lastItem} ASC`
            );
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: updatedQuery,
              },
            });
            if (onOrderBySelect) {
              console.log(
                "Applying ORDER BY direction: ASC for column:",
                lastItem
              );
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
            const updatedQuery = normalizedDocText.replace(
              /\bORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i,
              `ORDER BY ${lastItem} DESC`
            );
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: updatedQuery,
              },
            });
            if (onOrderBySelect) {
              console.log(
                "Applying ORDER BY direction: DESC for column:",
                lastItem
              );
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

      if (isInCteSubquery && parenCount > 0) {
        options.push({
          label: ")",
          type: "keyword",
          apply: ") ",
          detail: "Close CTE subquery",
        });
      }

      console.log("Suggestions after ORDER BY column:", options);
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(ASC|DESC|,|LIMIT|;|\))$/i,
      };
    }
  }

  // --- STEP 8: Suggest numeric values after LIMIT ---
  const afterLimitRegex = /\bLIMIT\s*(\d*)\s*$/i;
  const hasNumberAfterLimit = /\bLIMIT\s+\d+\b/i.test(normalizedDocText);
  if (afterLimitRegex.test(normalizedDocText) && !hasNumberAfterLimit) {
    const limitSuggestions = [
      { value: "1", label: "1", detail: "Limit to 1 row" },
      { value: "3", label: "3", detail: "Limit to 3 rows" },
      { value: "5", label: "5", detail: "Limit to 5 rows" },
      { value: "10", label: "10", detail: "Limit to 10 rows" },
      { value: "25", label: "25", detail: "Limit to 25 rows" },
      { value: "50", label: "50", detail: "Limit to 50 rows" },
      { value: "100", label: "100", detail: "Limit to 100 rows" },
    ];

    console.log("Suggesting LIMIT values:", limitSuggestions);
    return {
      from: word ? word.from : pos,
      options: limitSuggestions.map((suggestion) => ({
        label: suggestion.label,
        type: "text",
        apply: (view: EditorView) => {
          view.dispatch({
            changes: {
              from: word ? word.from : pos,
              to: pos,
              insert: `${suggestion.value}`,
            },
          });
          if (onOrderBySelect) {
            console.log("Applying LIMIT value:", suggestion.value);
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

  console.log(
    "No ORDER BY suggestions applicable for query:",
    normalizedDocText
  );
  return null;
};
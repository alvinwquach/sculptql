import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { SelectOption, TableColumn } from "@/app/types/query";
import { getOperatorDetail } from "../../getOperatorDetail";
import { EditorView } from "codemirror";
import { SingleValue } from "react-select";

export const suggestWhereClause = (
  docText: string, // Full SQL query text in the editor
  currentWord: string, // The word currently being typed
  pos: number, // Cursor position
  word: { from: number } | null, // Start position of the current word
  tableColumns: TableColumn, // Map of table name to list of its columns
  uniqueValues: Record<string, SelectOption[]>, // Unique values for column suggestions
  stripQuotes: (s: string) => string, // Function to strip quotes from identifiers
  needsQuotes: (id: string) => boolean, // Function to check if value needs quotes
  ast: Select | Select[] | null, // Parsed SQL AST
  onWhereColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void,
  onLogicalOperatorSelect?: (value: SingleValue<SelectOption>) => void
): CompletionResult | null => {
  // PSEUDOCODE:

  // 1. Define type guards for various SQL AST node types:
  //    - isSelectNode: checks if a node is a SELECT node
  //    - isTableReference: checks if FROM clause references a table
  //    - isWithClause: checks if WITH clause has a valid name and SELECT statement

  // 2. Detect if user is inside a CTE subquery using regex, and calculate unclosed parentheses

  // 3. Initialize variables:
  //    - selectedTable: name of the table or CTE alias from FROM
  //    - columns: list of available columns (from tableColumns or CTE)
  //    - isCte: flag indicating whether the source is a CTE

  // 4. Try to extract table name and columns from AST if available
  //    - If AST is an array, find the first SELECT node
  //    - Get FROM clause and extract table name
  //    - If FROM refers to a CTE, find its columns from its SELECT statement
  //    - If FROM refers to a real table, fetch columns from tableColumns map

  // 5. If no AST, fallback to regex to extract table name from FROM and fetch columns

  // 6. If no selected table or no columns are found, exit early with null

  // 7. Check if WHERE clause already exists
  //    - If it doesn't, and cursor is after FROM or JOIN, suggest adding:
  //      - WHERE keyword
  //      - Possibly a closing parenthesis if inside a CTE subquery

  // 8. If cursor is after WHERE, AND, or OR:
  //    - Suggest list of columns from the table or CTE
  //    - Filter suggestions based on current word prefix
  //    - When a column is selected, call onWhereColumnSelect (if provided)

  // 9. If a column is already typed and matches known columns:
  //    - Suggest list of SQL operators (e.g., =, !=, >, <, LIKE, BETWEEN, IS NULL, etc.)
  //    - When operator is selected, call onOperatorSelect

  // 10. If an operator is present:
  //     - Suggest appropriate values based on operator and column
  //     - For LIKE: suggest LIKE patterns (not shown in the code above)
  //     - For IS NULL / IS NOT NULL: no value suggestions needed
  //     - For BETWEEN: suggest first value
  //     - For other operators: suggest values from uniqueValues[column] or fallback literals
  //     - When value is selected, call onValueSelect

  // 11. If user has typed BETWEEN first value:
  //     - Suggest "AND" keyword to complete the BETWEEN clause

  // 12. If BETWEEN is followed by AND:
  //     - Suggest second value options, similar to step 10
  //     - When value is selected, call onValueSelect with isValue2 = true

  // 13. If a complete condition is present:
  //     - Suggest logical operators AND/OR, ORDER BY, or closing parenthesis
  //     - When logical operator is selected, call onLogicalOperatorSelect

  // 14. If user has typed a condition with AND/OR but no new column yet:
  //     - Suggest columns again (like in step 8), but for the next condition
  //     - Increment conditionIndex to reflect position in condition chain

  // 15. If none of the above match:
  //     - Return null (no autocomplete suggestions apply)

  // Type guards to validate structure of AST nodes
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

  const isWithClause = (
    withItem: unknown
  ): withItem is { name: { value: string }; stmt: Select | Select[] } =>
    !!withItem &&
    typeof withItem === "object" &&
    "name" in withItem &&
    "stmt" in withItem;

  // Check if we are inside a CTE subquery (WITH clause)
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  let selectedTable: string | null = null;
  let columns: string[] = [];
  let isCte = false;

  // Extract table and columns from AST
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

        // If the table is a CTE, resolve its columns
        if (selectNode.with) {
          const withClauses = Array.isArray(selectNode.with)
            ? selectNode.with
            : [selectNode.with];
          const cte = withClauses.find(
            (w) =>
              isWithClause(w) && stripQuotes(w.name.value) === selectedTable
          );
          if (cte) {
            isCte = true;
            const cteStmt = Array.isArray(cte.stmt)
              ? cte.stmt.find(isSelectNode) ?? null
              : isSelectNode(cte.stmt)
              ? cte.stmt
              : null;
            if (cteStmt && cteStmt.columns) {
              columns = cteStmt.columns
                .map((col) =>
                  col.as
                    ? stripQuotes(col.as)
                    : col.expr?.type === "column_ref"
                    ? stripQuotes(col.expr.column)
                    : null
                )
                .filter((col): col is string => !!col);
            }
          }
        }

        // If not CTE, get columns from tableColumns map
        if (!isCte && selectedTable && tableColumns[selectedTable]) {
          columns = tableColumns[selectedTable];
        }
      }
    }
  } else {
    // Fallback: parse table name manually from SQL string
    const fromMatch = docText.match(/\bFROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i);
    selectedTable = fromMatch ? stripQuotes(fromMatch[1]) : null;
    if (selectedTable && tableColumns[selectedTable]) {
      columns = tableColumns[selectedTable];
    }
  }

  // Return null if no table or columns found
  if (!selectedTable || columns.length === 0) {
    return null;
  }

  // Suggest "WHERE" keyword after FROM/JOIN clause if WHERE is not yet used
  const hasWhere = /\bWHERE\b/i.test(docText);
  const afterFromOrJoinRegex =
    /\bFROM\s+[\w.]+\s*$|\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+[\w.]+\s*(ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+)?\s*$/i;
  if (!hasWhere && afterFromOrJoinRegex.test(docText)) {
    const options = [
      {
        label: "WHERE",
        type: "keyword",
        apply: "WHERE ",
        detail: "Filter results",
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
      validFor: /^(WHERE|\))$/i,
    };
  }

  // Suggest column names after WHERE, AND, or OR
  const afterWhereOrAndRegex = /\b(WHERE|AND|OR)\s*(\w*)$/i;
  if (afterWhereOrAndRegex.test(docText)) {
    const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    const filteredColumns = columns.filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: (view: EditorView) => {
            const columnName = needsQuotes(column) ? `"${column}"` : column;
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${columnName} `,
              },
            });
            onWhereColumnSelect?.(
              { value: column, label: column },
              conditionIndex
            );
          },
          detail: isCte ? "CTE column" : "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Suggest comparison operators (=, <>, >, etc.) after column
  const afterColumnRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  const match = docText.match(afterColumnRegex);
  if (match) {
    const column = stripQuotes(match[2]);
    const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    if (
      columns.some((c) => stripQuotes(c).toLowerCase() === column.toLowerCase())
    ) {
      const operators = [
        "=",
        "!=",
        ">",
        "<",
        ">=",
        "<=",
        "LIKE",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
      ];
      return {
        from: word ? word.from : pos,
        options: operators.map((op) => ({
          label: op,
          type: "keyword",
          apply: (view: EditorView) => {
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${op} `,
              },
            });
            onOperatorSelect?.({ value: op, label: op }, conditionIndex);
          },
          detail: getOperatorDetail(op),
        })),
        filter: true,
        validFor: /^[=!><]*$|^LIKE$|^BETWEEN$|^IS\s+NULL$|^IS\s+NOT\s+NULL$/i,
      };
    }
  }

  // Suggest value(s) after operator
  const afterOperatorRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|BETWEEN|IS\s+NULL|IS\s+NOT\s+NULL)\s*$/i;
  const operatorMatch = docText.match(afterOperatorRegex);
  if (operatorMatch) {
    const [, , column, operator] = operatorMatch;
    const strippedColumn = stripQuotes(column);
    const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    const valueKey = `${stripQuotes(selectedTable!)}.${strippedColumn}`;
    const valueOptions = uniqueValues[valueKey] || [];

    if (
      columns.some(
        (c) => stripQuotes(c).toLowerCase() === strippedColumn.toLowerCase()
      )
    ) {
      // Default/fallback value suggestions
      const fallbackOptions = [
        {
          label: "'value'",
          type: "text",
          apply: (view: EditorView) => {
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: "'value' ",
              },
            });
            onValueSelect?.(
              { value: "'value'", label: "'value'" },
              conditionIndex,
              false
            );
          },
          detail: "Enter a string value",
        },
        {
          label: "0",
          type: "text",
          apply: (view: EditorView) => {
            view.dispatch({
              changes: { from: word ? word.from : pos, to: pos, insert: "0 " },
            });
            onValueSelect?.({ value: "0", label: "0" }, conditionIndex, false);
          },
          detail: "Numeric value",
        },
      ];

      // Suggest values
      const filteredValueOptions = valueOptions.filter((opt) =>
        currentWord
          ? stripQuotes(opt.label)
              .toLowerCase()
              .startsWith(stripQuotes(currentWord).toLowerCase())
          : true
      );

      return {
        from: word ? word.from : pos,
        options:
          filteredValueOptions.length > 0
            ? filteredValueOptions.map((opt) => ({
                label: opt.label,
                type: "text",
                apply: (view: EditorView) => {
                  const value = needsQuotes(opt.value)
                    ? `'${opt.value}'`
                    : opt.value;
                  view.dispatch({
                    changes: {
                      from: word ? word.from : pos,
                      to: pos,
                      insert: `${value} `,
                    },
                  });
                  onValueSelect?.(opt, conditionIndex, false);
                },
                detail: "Value",
              }))
            : fallbackOptions,
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }
  }

  // Suggest "AND" after first value of BETWEEN
  const afterBetweenFirstValueRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*$/i;
  if (afterBetweenFirstValueRegex.test(docText)) {
    const [, , column] = afterBetweenFirstValueRegex.exec(docText)!;
    const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    if (
      columns.some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(column).toLowerCase()
      )
    ) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "AND",
            type: "keyword",
            apply: "AND ",
            detail: "Specify second value for BETWEEN",
          },
        ],
        filter: true,
        validFor: /^AND$/i,
      };
    }
  }

  // Suggest second value after BETWEEN ... AND
  const afterBetweenAndRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*$/i;
  if (afterBetweenAndRegex.test(docText)) {
    const [, , column] = afterBetweenAndRegex.exec(docText)!;
    const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    const valueKey = `${stripQuotes(selectedTable!)}.${stripQuotes(column)}`;
    const valueOptions = uniqueValues[valueKey] || [];

    if (
      columns.some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(column).toLowerCase()
      )
    ) {
      return {
        from: word ? word.from : pos,
        options:
          valueOptions.length > 0
            ? valueOptions.map((opt) => ({
                label: opt.label,
                type: "text",
                apply: (view: EditorView) => {
                  const value = needsQuotes(opt.value)
                    ? `'${opt.value}'`
                    : opt.value;
                  view.dispatch({
                    changes: {
                      from: word ? word.from : pos,
                      to: pos,
                      insert: `${value} `,
                    },
                  });
                  onValueSelect?.(opt, conditionIndex, true);
                },
                detail: "Second value",
              }))
            : [
                {
                  label: "'value'",
                  type: "text",
                  apply: (view: EditorView) => {
                    view.dispatch({
                      changes: {
                        from: word ? word.from : pos,
                        to: pos,
                        insert: "'value' ",
                      },
                    });
                    onValueSelect?.(
                      { value: "'value'", label: "'value'" },
                      conditionIndex,
                      true
                    );
                  },
                  detail: "Enter second value",
                },
                {
                  label: "0",
                  type: "text",
                  apply: (view: EditorView) => {
                    view.dispatch({
                      changes: {
                        from: word ? word.from : pos,
                        to: pos,
                        insert: "0 ",
                      },
                    });
                    onValueSelect?.(
                      { value: "0", label: "0" },
                      conditionIndex,
                      true
                    );
                  },
                  detail: "Numeric value",
                },
              ],
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }
  }

  // Suggest AND, OR, ORDER BY, or ")" after complete condition
  const afterConditionRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|IS\s+NULL|IS\s+NOT\s+NULL)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*(?!.*\bORDER\s+BY\b)$/i;
  const afterBetweenRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*(?!.*\bORDER\s+BY\b)$/i;
  if (afterConditionRegex.test(docText) || afterBetweenRegex.test(docText)) {
    const column = afterConditionRegex.test(docText)
      ? afterConditionRegex.exec(docText)![2]
      : afterBetweenRegex.exec(docText)![2];
    if (
      columns.some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(column).toLowerCase()
      )
    ) {
      const options = [
        {
          label: "AND",
          type: "keyword",
          apply: (view: EditorView) => {
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: "AND ",
              },
            });
            onLogicalOperatorSelect?.({ value: "AND", label: "AND" });
          },
          detail: "Add another condition (all must be true)",
        },
        {
          label: "OR",
          type: "keyword",
          apply: (view: EditorView) => {
            view.dispatch({
              changes: { from: word ? word.from : pos, to: pos, insert: "OR " },
            });
            onLogicalOperatorSelect?.({ value: "OR", label: "OR" });
          },
          detail: "Add another condition (any can be true)",
        },
        {
          label: "ORDER BY",
          type: "keyword",
          apply: "ORDER BY ",
          detail: "Sort results",
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
        validFor: /^(AND|OR|ORDER\s+BY|\))$/i,
      };
    }
  }

  // Suggest column after second condition introduced with AND/OR
  const afterAndOrRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE)\s*('[^']*')\s*(AND|OR)\s*$/i;
  if (afterAndOrRegex.test(docText)) {
    const conditionIndex = (docText.match(/\b(AND|OR)\b/gi)?.length || 0) + 1;
    const filteredColumns = columns.filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: (view: EditorView) => {
            const columnName = needsQuotes(column) ? `"${column}"` : column;
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${columnName} `,
              },
            });
            onWhereColumnSelect?.(
              { value: column, label: column },
              conditionIndex
            );
          },
          detail: isCte ? "CTE column" : "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Fallback
  return null;
};
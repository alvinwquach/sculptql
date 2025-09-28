import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { SelectOption, TableColumn } from "@/app/types/query";
import { getOperatorDetail } from "../../getOperatorDetail";
import { EditorView } from "codemirror";
import { SingleValue } from "react-select";

export const suggestWhereClause = (
  docText: string, 
  currentWord: string, 
  pos: number,
  word: { from: number } | null, 
  tableColumns: TableColumn, 
  uniqueValues: Record<string, SelectOption[]>, 
  stripQuotes: (s: string) => string, 
  needsQuotes: (id: string) => boolean, 
  ast: Select | Select[] | null, 
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

  // Set the is with clause to the is with clause
  const isWithClause = (
    withItem: unknown
  ): withItem is { name: { value: string }; stmt: Select | Select[] } =>
    // If the with item is undefined, return false
    !!withItem &&
    // If the with item is not an object, return false
    typeof withItem === "object" &&
    // If the with item does not have a name, return false
    "name" in withItem &&
    "stmt" in withItem;

  // Set the is in cte subquery to the is in cte subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Set the paren count to the paren count
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  // Set the selected table to the selected table null
  let selectedTable: string | null = null;
  // Set the columns to the columns
  let columns: string[] = [];
  // Set the is cte to the is cte
  let isCte = false;

  // If the ast is a select node
  if (ast) {
    // Set the select node to the select node
    const selectNode = Array.isArray(ast)
      // If the ast is an array, find the first select node
      ? ast.find((node: Select) => isSelectNode(node))
      // If the ast is a select node, return the ast
      : isSelectNode(ast)
      ? ast
      // If the ast is not a select node, return null
      : null;

    // If the select node has a from clause
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
        // If the select node has a with clause

        if (selectNode.with) {
          // Set the with clauses to the with clauses
          // If the with clauses is an array, 
          // set the with clauses to the first item
          // If the with clauses is not an array, 
          // set the with clauses to the with clauses
          const withClauses = Array.isArray(selectNode.with)
            ? selectNode.with
            : [selectNode.with];
          // Set the cte to the cte
          const cte = withClauses.find(
            (w) =>
              isWithClause(w) && stripQuotes(w.name.value) === selectedTable
          );
          // If the cte is true
          if (cte) {
            isCte = true;
            // Set the cte statement to the cte statement
            const cteStmt = Array.isArray(cte.stmt)
              // If the cte statement is an array, 
              // set the cte statement to the first item
              // If the cte statement is not an array, 
              // set the cte statement to the cte statement
              ? cte.stmt.find(isSelectNode) ?? null
              : isSelectNode(cte.stmt)
              ? cte.stmt
              : null;
            // If the cte statement has columns
            if (cteStmt && cteStmt.columns) {
              columns = cteStmt.columns
                .map((col) =>
                  // If the column has a as, 
                  // set the column to the as
                  // If the column has a expr and the expr type is column ref, 
                  // set the column to the expr column
                  // If the column has no as or expr, 
                  // set the column to null
                  col.as
                    // If the column has a as, 
                    // strip the quotes from the as
                    // If the column has a expr and the expr type is column ref, 
                    // strip the quotes from the expr column
                    // If the column has no as or expr, 
                    // set the column to null
                    ? stripQuotes(col.as)
                    : col.expr?.type === "column_ref"
                    ? stripQuotes(col.expr.column)
                    : null
                )
                // If the column is not null, 
                // set the column to the column
                // If the column is null, 
                // set the column to null
                .filter((col): col is string => !!col);
            }
          }
        }

        // If the is cte is false and the selected table is true 
        // and the table columns has the selected table
        if (!isCte && selectedTable && tableColumns[selectedTable]) {
          // Set the columns to the columns
          columns = tableColumns[selectedTable];
        }
      }
    }
  } else {
    // Set the from match to the from match
    const fromMatch = docText.match(/\bFROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i);
    // Set the selected table to the from match
    selectedTable = fromMatch ? stripQuotes(fromMatch[1]) : null;
    // If the selected table is true and the table columns has the selected table
    if (selectedTable && tableColumns[selectedTable]) {
      // Set the columns to the columns
      columns = tableColumns[selectedTable];
    }
  }
  // If the selected table is null or the columns length is 0
  if (!selectedTable || columns.length === 0) {
    // Return null
    return null;
  }

  // Set the has where to the has where
  const hasWhere = /\bWHERE\b/i.test(docText);
  // Set the after from or join regex to the after from or join regex
  const afterFromOrJoinRegex =
    /\bFROM\s+[\w.]+\s*$|\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+[\w.]+\s*(ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+)?\s*$/i;
  // If the has where is false and the after from or join regex is true
  if (!hasWhere && afterFromOrJoinRegex.test(docText)) {
    // Set the options to the options
    const options = [
      {
        label: "WHERE",
        type: "keyword",
        apply: "WHERE ",
        detail: "Filter results",
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
      validFor: /^(WHERE|\))$/i,
    };
  }

  // Set the after where or and regex to the after where or and regex
  const afterWhereOrAndRegex = /\b(WHERE|AND|OR)\s*(\w*)$/i;
  // If the after where or and regex is true
  if (afterWhereOrAndRegex.test(docText)) {
    // Set the condition index to the condition index
    // const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    // Set the filtered columns to the filtered columns
    const filteredColumns = columns.filter((column) =>
      // If the current word is true
    currentWord
    // Strip the quotes from the column
      ? stripQuotes(column)
      // Lowercase the column
      .toLowerCase()
      // Start with the strip quotes current word
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // If the filtered columns length is greater than 0
    if (filteredColumns.length > 0) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
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
                insert: `${columnName} `,
              },
            });
            // If the on where column select is not null
            // On where column select the column
            onWhereColumnSelect?.(
              { value: column, label: column },
              0 // conditionIndex
            );
          },
          detail: isCte ? "CTE column" : "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Set the after column regex to the after column regex
  const afterColumnRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  const match = docText.match(afterColumnRegex);
  // If the match is true
  if (match) {
    // Set the column to the column
    const column = stripQuotes(match[2]);
    // Set the condition index to the condition index
    // const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    // If the columns some the column
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
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${op} `,
              },
            });
            // If the on operator select is not null
            // On operator select the operator
            onOperatorSelect?.({ value: op, label: op }, 0); // conditionIndex
          },
          detail: getOperatorDetail(op),
        })),
        filter: true,
        validFor: /^[=!><]*$|^LIKE$|^BETWEEN$|^IS\s+NULL$|^IS\s+NOT\s+NULL$/i,
      };
    }
  }

  // Set the after operator regex to the after operator regex
  const afterOperatorRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|BETWEEN|IS\s+NULL|IS\s+NOT\s+NULL)\s*$/i;
  
  // Set the operator match to the operator match
  const operatorMatch = docText.match(afterOperatorRegex);
  // If the operator match is true
  if (operatorMatch) {
    // Set the column to the column
    const [, , column] = operatorMatch;
    // Set the stripped column to the stripped column
    const strippedColumn = stripQuotes(column);
    // Set the condition index to the condition index 0 
    // or the length of the doc text match 
    // const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    // Set the value key to the value key selected table and stripped column
    const valueKey = `${stripQuotes(selectedTable!)}.${strippedColumn}`;
    // Set the value options to the value options unique values value key 
    // or empty array
    const valueOptions = uniqueValues[valueKey] || [];

    // If the columns some the stripped column
    if (
      columns.some(
        // If the column is true
        // Strip the quotes from the column
        // Lowercase the column
        // Start with the strip quotes current word
        (c) => stripQuotes(c).toLowerCase() === strippedColumn.toLowerCase()
      )
    ) {
      // Set the fallback options to the fallback options
      const fallbackOptions = [
        {
          label: "'value'",
          type: "text",
          apply: (view: EditorView) => {
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: "'value' ",
              },
            });
            // If the on value select is not null
            // On value select the value
            onValueSelect?.(
              { value: "'value'", label: "'value'" },
              0, // conditionIndex
              false
            );
          },
          detail: "Enter a string value",
        },
        {
          label: "0",
          type: "text",
          apply: (view: EditorView) => {
            // Dispatch the changes
            view.dispatch({
              changes: { from: word ? word.from : pos, to: pos, insert: "0 " },
            });
            // If the on value select is not null
            // On value select the value
            onValueSelect?.({ value: "0", label: "0" }, 0, false); // conditionIndex
          },
          detail: "Numeric value",
        },
      ];

      // Set the filtered value options to the filtered value options
      const filteredValueOptions = valueOptions.filter((opt) =>
        // If the current word is true
      currentWord
      // Strip the quotes from the opt label
        ? stripQuotes(opt.label)
        // Lowercase the opt label
        .toLowerCase()
        // Start with the strip quotes current word
              .startsWith(stripQuotes(currentWord).toLowerCase())
          : true
      );

      // Return the options
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
                  // Dispatch the changes
                  view.dispatch({
                    changes: {
                      from: word ? word.from : pos,
                      to: pos,
                      insert: `${value} `,
                    },
                  });
                  // If the on value select is not null
                  // On value select the value
                  onValueSelect?.(opt, 0, false); // conditionIndex
                },
                detail: "Value",
              }))
            : fallbackOptions,
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }
  }

  // Set the after between first value regex to the after between first value regex
  const afterBetweenFirstValueRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*$/i;
  // If the after between first value regex is true
  if (afterBetweenFirstValueRegex.test(docText)) {
    // Set the column to the column
    const [, , column] = afterBetweenFirstValueRegex.exec(docText)!;
    // Set the condition index to the condition index
    // const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    // If the columns some the stripped column
    if (
      columns.some(
        // If the column is true
        // Strip the quotes from the column
        // Lowercase the column
        // Start with the strip quotes current word
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

  // Set the after between and regex to the after between and regex
  const afterBetweenAndRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*$/i;
  // If the after between and regex is true
  if (afterBetweenAndRegex.test(docText)) {
    // Set the column to the column
    const [, , column] = afterBetweenAndRegex.exec(docText)!;
    // Set the condition index to the condition index 0 
    // or the length of the doc text match 
    // const conditionIndex = docText.match(/\b(AND|OR)\b/gi)?.length || 0;
    // Set the value key to the value key selected table and stripped column
    const valueKey = `${stripQuotes(selectedTable!)}.${stripQuotes(column)}`;
    // Set the value options to the value options unique values value key 
    // or empty array
    const valueOptions = uniqueValues[valueKey] || [];

    // If the columns some the stripped column
    if (
      columns.some(
        // If the column is true
        // Strip the quotes from the column
        // Lowercase the column
        // Start with the strip quotes current word
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
                  // Dispatch the changes
                  view.dispatch({
                    changes: {
                      from: word ? word.from : pos,
                      to: pos,
                      insert: `${value} `,
                    },
                  });
                  // If the on value select is not null
                  // On value select the value
                  onValueSelect?.(opt, 0, true); // conditionIndex
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
                    // If the on value select is not null
                    // On value select the value
                    onValueSelect?.(
                      { value: "'value'", label: "'value'" },
                      0, // conditionIndex
                      true
                    );
                  },
                  detail: "Enter second value",
                },
                {
                  label: "0",
                  type: "text",
                  apply: (view: EditorView) => {
                    // Dispatch the changes
                    view.dispatch({
                      changes: {
                        from: word ? word.from : pos,
                        to: pos,
                        insert: "0 ",
                      },
                    });
                    // If the on value select is not null
                    // On value select the value
                    onValueSelect?.(
                      { value: "0", label: "0" },
                      0, // conditionIndex
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

  // Set the after condition regex to the after condition regex
  const afterConditionRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|IS\s+NULL|IS\s+NOT\s+NULL)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*(?!.*\bORDER\s+BY\b)$/i;
  // Set the after between regex to the after between regex
  const afterBetweenRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*(?!.*\bORDER\s+BY\b)$/i;

  // If the after condition regex is true or the after between regex is true
  if (afterConditionRegex.test(docText) || afterBetweenRegex.test(docText)) {
    // Set the column to the column
    const column = afterConditionRegex.test(docText)  
    // If the after between regex is true
      ? afterConditionRegex.exec(docText)![2]
      // Set the column to the column
      : afterBetweenRegex.exec(docText)![2];
    // If the columns some the stripped column
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
            // If the on logical operator select is not null
            // On logical operator select the logical operator
            onLogicalOperatorSelect?.({ value: "AND", label: "AND" });
          },
          detail: "Add another condition (all must be true)",
        },
        {
          label: "OR",
          type: "keyword",
          apply: (view: EditorView) => {
            // Dispatch the changes
            view.dispatch({
              changes: { from: word ? word.from : pos, to: pos, insert: "OR " },
            });
            // If the on logical operator select is not null
            // On logical operator select the logical operator
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

      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(AND|OR|ORDER\s+BY|\))$/i,
      };
    }
  }

  // Set the after and or regex to the after and or regex
  const afterAndOrRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE)\s*('[^']*')\s*(AND|OR)\s*$/i;
  // If the after and or regex is true
  if (afterAndOrRegex.test(docText)) {
    // Set the condition index to the condition index
    // const conditionIndex = (docText.match(/\b(AND|OR)\b/gi)?.length || 0) + 1;
    // Set the filtered columns to the filtered columns
    const filteredColumns = columns.filter((column) =>
      // If the current word is true
      currentWord
      // Strip the quotes from the column
      ? stripQuotes(column)
      // Lowercase the column
      .toLowerCase()
      // Start with the strip quotes current word
      .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );
    // If the filtered columns length is greater than 0
    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: (view: EditorView) => {
            const columnName = needsQuotes(column) ? `"${column}"` : column;
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${columnName} `,
              },
            });
            // If the on where column select is not null
            // On where column select the column
            onWhereColumnSelect?.(
              { value: column, label: column },
              0 // conditionIndex
            );
          },
          detail: isCte ? "CTE column" : "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }
  // Return null
  return null;
};
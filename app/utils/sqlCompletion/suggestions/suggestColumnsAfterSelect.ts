import { CompletionResult } from "@codemirror/autocomplete";
import { EditorView } from "codemirror";
import { Select } from "node-sql-parser";
import { SelectOption } from "@/app/types/query";
import { stripQuotes } from "../stripQuotes";
import { MultiValue } from "react-select";

export const suggestColumnsAfterSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  allColumns: string[],
  selectedColumns: SelectOption[],
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null,
  onColumnSelect?: (value: MultiValue<SelectOption>) => void,
  onDistinctSelect?: (value: boolean) => void,
  isMySQL: boolean = false
): CompletionResult | null => {
  // Check if inside a CTE subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Count parentheses to ensure ) 
  // is only suggested with unbalanced parens
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  // Set the select regex to the select regex
  const selectRegex = /\bSELECT\s*(DISTINCT\s*)?$/i;
  // Set the union select regex to the union select regex
  const unionSelectRegex = /\bUNION\s*(ALL\s*)?SELECT\s*(DISTINCT\s*)?$/i;
  // Set the aggr func regex to the aggr func regex
  const aggrFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?(?:SUM|MAX|MIN|AVG|COUNT)\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*$/i;
  // Set the round func regex to the round func regex
  const roundFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*$/i;
  // Set the round nested func regex to the round nested func regex
  const roundNestedFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\((?:AVG|SUM|MAX|MIN|COUNT)\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*\)\s*,?\s*(\d*)?\s*$/i;
  // Set the round decimal regex to the round decimal regex
  const roundDecimalRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\((?:(?:AVG|SUM|MAX|MIN|COUNT)\([^)]+\)|[^)]+)\s*,?\s*(\d*)?\s*$/i;
  // Set the in case statement regex to the in case statement regex
  const inCaseStatementRegex = /\bCASE\s+([^;]*?)$/i;
  // Set the after select column regex to the after select column regex
  const afterSelectColumnRegex = /\bSELECT\s+([^;]*?),\s*$/i;
  // Set the select star regex to the select star regex
  const selectStarRegex = /\bSELECT\s*(DISTINCT\s*)?\*\s*$/i;
  // Set the cte select regex to the cte select regex
  const cteSelectRegex =
    /\bWITH\s+[\w"]+\s+AS\s*\(\s*SELECT\s*(DISTINCT\s*)?$/i;
  // Set the after column regex to the after column regex
  const afterColumnRegex = /\bSELECT\s+([^;]*?)(?:"[\w]+"|'[\w]+'|[\w_]+)\s*$/i;
  // If the in case statement regex test the doc text
  if (inCaseStatementRegex.test(docText)) {
    // Return null
    return null;
  }
  // Set the aggr match to the aggr match
  const aggrMatch = docText.match(aggrFuncRegex);
  // Set the round func match to the round func match
  const roundFuncMatch = docText.match(roundFuncRegex);
  // Set the round nested func match to the round nested func match
  const roundNestedFuncMatch = docText.match(roundNestedFuncRegex);
  // Set the round decimal match to the round decimal match
  const roundDecimalMatch = docText.match(roundDecimalRegex);
  // Set the select star match to the select star match
  const selectStarMatch = docText.match(selectStarRegex);
  // Set the after select column match to the after select column match
  const afterSelectColumnMatch = docText.match(afterSelectColumnRegex);
  // Set the after column match to the after column match
  const afterColumnMatch = docText.match(afterColumnRegex);

  // Set the is in select clause to the is in select clause
  const isInSelectClause =
    // If the select regex test the doc text
    selectRegex.test(docText.trim()) ||
    // If the union select regex test the doc text
    unionSelectRegex.test(docText.trim()) ||
    // If the cte select regex test the doc text
    cteSelectRegex.test(docText) ||
    (ast &&
      (Array.isArray(ast)
        // If the ast is an array, some of the ast has a select node 
        // and the ast has no columns
        ? ast.some(
            (node: Select) =>
              node.type === "select" &&
              (!node.columns || node.columns.length === 0)
          )
          // If the ast is a select node and the ast has no columns
        : ast.type === "select" && (!ast.columns || ast.columns.length === 0)));
  // Set the is distinct present to the is distinct present
  const isDistinctPresent =
    /^SELECT\s+DISTINCT\s*$/i.test(docText.trim()) ||
    // If the union select regex test the doc text 
    (unionSelectRegex.test(docText.trim()) &&
      // If the doc text match the distinct regex
      docText.match(/\bDISTINCT\s*$/i)) ||
    // If the cte select regex test the doc text and the doc text match the distinct regex
    (cteSelectRegex.test(docText) && docText.match(/\bDISTINCT\s*$/i)) ||
    (ast &&
      (Array.isArray(ast)
        // If the ast is an array, 
        // some of the ast has a select node and the ast has distinct
        ? ast.some((node: Select) => node.type === "select" && node.distinct)
        // If the ast is a select node and the ast has distinct
        : ast.type === "select" && ast.distinct));

  // Set the selected column names to the selected column names
  const selectedColumnNames = selectedColumns.map((c) => c.value.toLowerCase());

  // If the round decimal match test the doc text
  if (roundDecimalMatch) {
    // Set the partial number to the partial number
    const partialNumber = roundDecimalMatch[2] || "";
    // Set the decimal options to the decimal options
    const decimalOptions = ["0", "1", "2", "3", "4"].filter((num) =>
      partialNumber ? num.startsWith(partialNumber) : true
    );
    // Return the options
    return {
      from: word ? word.from : pos,
      options: decimalOptions.map((num) => ({
        label: num,
        type: "number",
        apply: `${num}), `,
        detail: "Decimal places",
      })),
      filter: true,
      validFor: /^\d*$/,
    };
  }

  // If the round nested func match test the doc text
  if (roundNestedFuncMatch) {
    // Set the partial column to the partial column
    const partialColumn = roundNestedFuncMatch[2]
      // If the round nested func match test the doc text
      ? stripQuotes(roundNestedFuncMatch[2])
      : "";
    // Set the inner func to the inner func
    const innerFunc = roundNestedFuncMatch[0].match(
      /ROUND\((AVG|SUM|MAX|MIN|COUNT)\(/i
    )?.[1];
    // Set the filtered columns to the filtered columns
    const filteredColumns = allColumns.filter((column) => {
      // Set the col lower to the col lower
      const colLower = column.toLowerCase();
      // Return the filtered columns
      return (
        // If the selected column names includes the col lower
        !selectedColumnNames.includes(colLower) &&
        (partialColumn
          ? colLower.startsWith(partialColumn.toLowerCase())
          : true)
      );
    });
    // If the filtered columns length is greater than 0
    if (filteredColumns.length > 0) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: (view: EditorView) => {
            // Set the apply text to the apply text
            const applyText = needsQuotes(column)
              ? `"${column}"), `
              : `${column}), `;
            // Dispatch the changes
            view.dispatch({
              changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
            });
            // If the on column select and the inner func is not null
            if (onColumnSelect && innerFunc) {
              const newSelectedColumns = [
                // Set the new selected columns 
                // to the new selected columns
                ...selectedColumns.filter((c) => c.value !== "*"),
                {
                  value: `ROUND(${innerFunc}(${needsQuotes(column) ? `"${column}"` : column}), 2)`,
                  label: `ROUND(${innerFunc}(${column}), 2)`,
                  isAggregate: true,
                  targetColumn: column,
                },
              ];
              // On column select the new selected columns
              onColumnSelect(newSelectedColumns);
            }
          },
          detail: "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // If the aggr match or the round func match test the doc text
  if (aggrMatch || roundFuncMatch) {
    // Set the partial column to the partial column
    const partialColumn = aggrMatch
      ? aggrMatch[2]
        // If the aggr match test the doc text
        // Strip the quotes from the aggr match
        ? stripQuotes(aggrMatch[2])
        : ""
      // If the round func match test the doc text
      // Strip the quotes from the round func match
      : roundFuncMatch
      ? roundFuncMatch[2]
        ? stripQuotes(roundFuncMatch[2])
        : ""
      : "";
    // Set the is round function to the is round function
    const isRoundFunction = aggrMatch
      // If the aggr match test the doc text
      // Check if the aggr match includes the round function
      ? aggrMatch[0].toUpperCase().includes("ROUND(")
      : roundFuncMatch
      // If the round func match test the doc text
      // Check if the round func match includes the round function
      ? true
      : false;
    // Set the is count function to the is count function
    const isCountFunction = aggrMatch
      // If the aggr match test the doc text
      // Check if the aggr match includes the count function
      ? aggrMatch[0].toUpperCase().includes("COUNT(")
      : false;

    // Set the filtered columns to the filtered columns
    const filteredColumns = allColumns.filter((column) => {
      // Set the col lower to the col lower
      const colLower = column.toLowerCase();
      // Return the filtered columns
      return (
        // If the selected column names includes the col lower
        !selectedColumnNames.includes(colLower) &&
        (partialColumn
          ? colLower.startsWith(partialColumn.toLowerCase())
          : true)
      );
    });
    // If the filtered columns length is greater than 0
    if (filteredColumns.length > 0) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: (view: EditorView) => {
            // Set the func to the func
            const func = aggrMatch
              ? aggrMatch[0].match(/(SUM|MAX|MIN|AVG|COUNT)/i)?.[1]
              : "ROUND";
            // Set the apply text to the apply text
            const applyText = needsQuotes(column)
              ? isRoundFunction
                ? `"${column}", `
                // If the is count function and the func is count
                // Set the apply text to the apply text
                : isCountFunction && func === "COUNT"
                ? `"${column}"), `
                : `"${column}"), `
                // If the is round function
                // Set the apply text to the apply text
              : isRoundFunction
              ? `${column}, `
              : `${column}), `;
            // Dispatch the changes
            view.dispatch({
              changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
            });
            // If the on column select is not null
            if (onColumnSelect) {
              const newSelectedColumns = [
                // Set the new selected columns 
                // to the new selected columns
                // Filter the selected columns 
                // by the value not equal to *
                ...selectedColumns.filter((c) => c.value !== "*"),
                {
                  // Set the value to the value
                  value: isRoundFunction
                    // If the is round function
                    // Set the value to the value
                    ? `ROUND(${needsQuotes(column) ? `"${column}"` : column}, 2)`
                    : `${func}(${needsQuotes(column) ? `"${column}"` : column})`,
                  label: isRoundFunction
                    ? `ROUND(${column}, 2)`
                    : `${func}(${column})`,
                  // Set the is aggregate to the is aggregate
                    isAggregate: !isRoundFunction,
                  targetColumn: column,
                },
              ];
              // On column select the new selected columns
              onColumnSelect(newSelectedColumns);
            }
          },
          detail: "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // If the select star match test the doc text
  if (selectStarMatch) {
    // Set the options to the options
    const options = [
      {
        label: "FROM",
        type: "keyword",
        apply: "FROM ",
        detail: "Specify table to select from",
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
      validFor: /^(FROM|\))$/i,
    };
  }

  if (
    // If the is in select clause
    isInSelectClause ||
    // If the select regex test the doc text
    selectRegex.test(docText.trim()) ||
    // If the union select regex test the doc text
    unionSelectRegex.test(docText.trim()) ||
    // If the cte select regex test the doc text
    cteSelectRegex.test(docText) ||
    // If the after select column match test the doc text
    afterSelectColumnMatch
  ) {
    // Set the select match to the select match
    const selectMatch = docText.match(
      /SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i
    );
    // Set the existing columns to the existing columns
    const existingColumns = selectMatch
      // If the select match is not null
      ? selectMatch[2]
        // If the select match is not null
        // Split the select match by the comma
        // Map the select match by the strip quotes
        // Filter the select match by the column and the all columns includes the column
          .split(",")
          .map((col) => stripQuotes(col.trim()))
          .filter((col) => col && (col === "*" || allColumns.includes(col)))
      : [];

    // Set the filtered columns to the filtered columns
    const filteredColumns = allColumns.filter((column) => {
      // Set the col lower to the col lower
      const colLower = column.toLowerCase();
      // Return the filtered columns
      return (
        // If the existing columns includes the column
        !existingColumns.includes(column) &&
        // If the current word is not null
        // Check if the col lower starts with 
        // the strip quotes current word
        (currentWord
          ? colLower.startsWith(stripQuotes(currentWord).toLowerCase())
          : true)
      );
    });
    // Set the options to the options
    const options = [
      // Show FROM keyword when columns are already selected
      ...(existingColumns.length > 0
        ? [
            {
              label: "FROM",
              type: "keyword",
              apply: "FROM ",
              detail: "Specify table to select from",
            },
          ]
        : []),
      ...(!isDistinctPresent
        ? [
            {
              label: "DISTINCT",
              type: "keyword",
              apply: (view: EditorView) => {
                // Set the current query to the current query
                const currentQuery = view.state.doc.toString();
                // Set the new query to the new query
                let newQuery = currentQuery;
                // If the new query match the select regex
                // Set the select match to the select match
                if (newQuery.match(/^\s*SELECT\s+/i)) {
                  const selectMatch = newQuery.match(/^\s*SELECT\s+/i);
                  if (selectMatch) {
                    // Set the insert pos to the insert pos
                    const insertPos = selectMatch[0].length;
                    // Set the new query to the new query
                    newQuery =
                      newQuery.slice(0, insertPos) +
                      "DISTINCT " +
                      newQuery.slice(insertPos);
                  }
                } else {
                  // Set the new query to the new query
                  newQuery = `SELECT DISTINCT ${newQuery}`;
                }
                // Dispatch the changes
                view.dispatch({
                  changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: newQuery,
                  },
                });
                // If the on distinct select is not null
                // On distinct select the true
                if (onDistinctSelect) {
                  onDistinctSelect(true);
                }
              },
              detail: "Select unique values",
            },
            // If the count star option is not null
            {
              label: "COUNT(*)",
              type: "function",
              apply: (view: EditorView) => {
                // Dispatch the changes
                view.dispatch({
                  changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: "COUNT(*), " },
                });
                // If the on column select is not null
                // On column select the count star
                if (onColumnSelect) {
                  onColumnSelect([
                    // Set the new selected columns 
                    // to the new selected columns
                    // Filter the selected columns 
                    // by the value not equal to *
                    ...selectedColumns.filter((c) => c.value !== "*"),
                    { value: "COUNT(*)", label: "COUNT(*)", aggregate: true },
                  ]);
                }
              },
              detail: "Count all rows",
            },
            {
              label: "SUM(",
              type: "function",
              apply: "SUM(",
              detail: "Sum of column values",
            },
            {
              label: "AVG(",
              type: "function",
              apply: "AVG(",
              detail: "Average of column values",
            },
            {
              label: "MAX(",
              type: "function",
              apply: "MAX(",
              detail: "Maximum column value",
            },
            {
              label: "MIN(",
              type: "function",
              apply: "MIN(",
              detail: "Minimum column value",
            },
            {
              label: "ROUND(",
              type: "function",
              apply: "ROUND(",
              detail: "Round column or aggregate values",
            },
            // Only show * when NO columns have been selected yet
            ...(existingColumns.length === 0
              ? [
                  {
                    label: "*",
                    type: "field",
                    apply: (view: EditorView) => {
                      // Set the current query to the current query
                      const currentQuery = view.state.doc.toString();
                      // Set the new query to the new query
                      let newQuery = currentQuery;
                      // If the new query match the select regex
                      if (newQuery.match(/^\s*SELECT\s+(DISTINCT\s+)?/i)) {
                        // Set the new query to the new query
                        newQuery = newQuery.replace(
                          /^\s*SELECT\s+(DISTINCT\s+)?/i,
                          `SELECT ${isDistinctPresent ? "DISTINCT " : ""}* `
                        );
                      } else {
                        // Set the new query to the new query
                        newQuery = `SELECT ${isDistinctPresent ? "DISTINCT " : ""}* `;
                      }
                      // Dispatch the changes
                      view.dispatch({
                        changes: {
                          from: 0,
                          to: view.state.doc.length,
                          insert: newQuery,
                        },
                      });
                      // If the on column select is not null
                      // On column select the all columns
                      if (onColumnSelect) {
                        onColumnSelect([{ value: "*", label: "All Columns (*)" }]);
                      }
                    },
                    detail: "All columns",
                    boost: 10,
                  },
                ]
              : []),
          ]
        : []),
      ...filteredColumns.map((column) => ({
        label: column,
        type: "field",
        apply: (view: EditorView) => {
          // Set the current query to the current query
          const currentQuery = view.state.doc.toString();
          // Set the apply text to the apply text
          const applyText = needsQuotes(column)
            ? `"${column}", `
            : `${column}, `;
          // Set the new query to the new query
          let newQuery = currentQuery;
          // If the new query match the select regex
          if (newQuery.match(/^\s*SELECT\s+(DISTINCT\s+)?/i)) {
            // If the new query match the select regex and the select regex includes the distinct
            if (newQuery.match(/^\s*SELECT\s+(DISTINCT\s+)?\*\s*/i)) {
              // Set the new query to the new query
              newQuery = newQuery.replace(
                /^\s*SELECT\s+(DISTINCT\s+)?\*\s*/i,
                `SELECT ${isDistinctPresent ? "DISTINCT " : ""}${applyText}`
              );
            // If the new query match the select regex 
            // and the select regex includes the comma
            } else if (newQuery.match(/,\s*$/)) {
              // Set the new query to the new query
              newQuery = newQuery.replace(/,\s*$/, ` ${applyText}`);
            // If the new query match the select regex
            // and the select regex includes the semicolon
            } else {
              // Set the new query to the new query
              // Replace the select regex with the new query
              // Replace the distinct with the distinct
              // Replace the columns with the columns
              // Replace the comma with the comma
              // Replace the suffix with the suffix
              newQuery = newQuery.replace(
                /^\s*SELECT\s+(DISTINCT\s+)?([^;]*?)(,)?\s*(FROM|$)/i,
                (match, distinct, columns, comma, suffix) =>
                  `SELECT ${distinct || ""}${columns}${
                    comma || ""
                  } ${applyText} ${suffix}`
              );
            }
          } else {
            // Set the new query to the new query
            newQuery = `SELECT ${
              isDistinctPresent ? "DISTINCT " : ""
            }${applyText}`;
          }
          // Dispatch the changes
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: newQuery },
          });
          // Note: We don't call onColumnSelect here because it would conflict with the editor update
          // The column selection state will be synced through the query parsing in the editor
        },
        detail: "Column name",
      })),
      ...filteredColumns.flatMap((column) => {
        const aggregates = [
          {
            label: `COUNT(${column})`,
            type: "function",
            apply: (view: EditorView) => {
              const applyText = needsQuotes(column)
                ? `COUNT("${column}"), `
                : `COUNT(${column}), `;
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the count column
              if (onColumnSelect) {
                onColumnSelect([
                  // Set the new selected columns 
                  // to the new selected columns
                  // Filter the selected columns 
                  // by the value not equal to *
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  // Set the value to the value
                  {
                    value: `COUNT(${needsQuotes(column) ? `"${column}"` : column})`,
                    label: `COUNT(${column})`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Count non-null values",
          },
          {
            label: `COUNT(DISTINCT ${column})`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `COUNT(DISTINCT "${column}"), `
                : `COUNT(DISTINCT ${column}), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the count distinct column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  // Set the value to the value
                  {
                    value: `COUNT(DISTINCT ${needsQuotes(column) ? `"${column}"` : column})`,
                    label: `COUNT(DISTINCT ${column})`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Count distinct values",
          },
          {
            label: `SUM(${column})`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `SUM("${column}"), `
                : `SUM(${column}), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the sum column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `SUM(${needsQuotes(column) ? `"${column}"` : column})`,
                    label: `SUM(${column})`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Sum of column values",
          },
          {
            label: `AVG(${column})`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `AVG("${column}"), `
                : `AVG(${column}), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the avg column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `AVG(${needsQuotes(column) ? `"${column}"` : column})`,
                    label: `AVG(${column})`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Average of column values",
          },
          {
            label: `MAX(${column})`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `MAX("${column}"), `
                : `MAX(${column}), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the max column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `MAX(${needsQuotes(column) ? `"${column}"` : column})`,
                    label: `MAX(${column})`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Maximum column value",
          },
          {
            label: `MIN(${column})`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `MIN("${column}"), `
                : `MIN(${column}), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the min column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `MIN(${needsQuotes(column) ? `"${column}"` : column})`,
                    label: `MIN(${column})`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Minimum column value",
          },
          {
            label: `ROUND(${column}, 0)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 0), `
                : `ROUND(${column}, 0), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(${needsQuotes(column) ? `"${column}"` : column}, 0)`,
                    label: `ROUND(${column}, 0)`,
                    aggregate: false,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round column to 0 decimals",
          },
          {
            label: `ROUND(${column}, 1)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 1), `
                : `ROUND(${column}, 1), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(${needsQuotes(column) ? `"${column}"` : column}, 1)`,
                    label: `ROUND(${column}, 1)`,
                    aggregate: false,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round column to 1 decimal",
          },
          {
            label: `ROUND(${column}, 2)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 2), `
                : `ROUND(${column}, 2), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(${needsQuotes(column) ? `"${column}"` : column}, 2)`,
                    label: `ROUND(${column}, 2)`,
                    aggregate: false,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round column to 2 decimals",
          },
          {
            label: `ROUND(${column}, 3)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 3), `
                : `ROUND(${column}, 3), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(${needsQuotes(column) ? `"${column}"` : column}, 3)`,
                    label: `ROUND(${column}, 3)`,
                    aggregate: false,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round column to 3 decimals",
          },
          {
            label: `ROUND(${column}, 4)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 4), `
                : `ROUND(${column}, 4), `;
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(${needsQuotes(column) ? `"${column}"` : column}, 4)`,
                    label: `ROUND(${column}, 4)`,
                    aggregate: false,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round column to 4 decimals",
          },
          {
            label: `ROUND(AVG(${column}), 0)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 0), `
                : `ROUND(AVG(${column}), 0), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(AVG(${needsQuotes(column) ? `"${column}"` : column}), 0)`,
                    label: `ROUND(AVG(${column}), 0)`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round average to 0 decimals",
          },
          {
            label: `ROUND(AVG(${column}), 1)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 1), `
                : `ROUND(AVG(${column}), 1), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(AVG(${needsQuotes(column) ? `"${column}"` : column}), 1)`,
                    label: `ROUND(AVG(${column}), 1)`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round average to 1 decimal",
          },
          {
            label: `ROUND(AVG(${column}), 2)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 2), `
                : `ROUND(AVG(${column}), 2), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(AVG(${needsQuotes(column) ? `"${column}"` : column}), 2)`,
                    label: `ROUND(AVG(${column}), 2)`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round average to 2 decimals",
          },
          {
            label: `ROUND(AVG(${column}), 3)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 3), `
                : `ROUND(AVG(${column}), 3), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              // If the on column select is not null
              // On column select the round column
              // Set the new selected columns 
              // to the new selected columns
              // Filter the selected columns 
              // by the value not equal to *
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(AVG(${needsQuotes(column) ? `"${column}"` : column}), 3)`,
                    label: `ROUND(AVG(${column}), 3)`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round average to 3 decimals",
          },
          {
            label: `ROUND(AVG(${column}), 4)`,
            type: "function",
            apply: (view: EditorView) => {
              // Set the apply text to the apply text
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 4), `
                : `ROUND(AVG(${column}), 4), `;
              // Dispatch the changes
              view.dispatch({
                changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
              });
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
                  {
                    value: `ROUND(AVG(${needsQuotes(column) ? `"${column}"` : column}), 4)`,
                    label: `ROUND(AVG(${column}), 4)`,
                    aggregate: true,
                    column: column,
                  },
                ]);
              }
            },
            detail: "Round average to 4 decimals",
          },
        ];
        // If ismysql is true
        if (isMySQL) {
          // Set the aggregates to the aggregates
          aggregates.push(
            {
              label: `SUM(DISTINCT ${column})`,
              type: "function",
              apply: (view: EditorView) => {
                // Set the apply text to the apply text
                const applyText = needsQuotes(column)
                  ? `SUM(DISTINCT "${column}"), `
                  : `SUM(DISTINCT ${column}), `;
                // Dispatch the changes
                view.dispatch({
                  changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
                });
                // If the on column select is not null
                // On column select the sum distinct column
                // Set the new selected columns 
                // to the new selected columns
                // Filter the selected columns 
                // by the value not equal to *
                if (onColumnSelect) {
                  onColumnSelect([
                    ...selectedColumns.filter((c) => c.value !== "*"),
                    {
                      value: `SUM(DISTINCT ${needsQuotes(column) ? `"${column}"` : column})`,
                      label: `SUM(DISTINCT ${column})`,
                      aggregate: true,
                      column: column,
                    },
                  ]);
                }
              },
              detail: "Sum of distinct column values",
            },
            {
              label: `AVG(DISTINCT ${column})`,
              type: "function",
              apply: (view: EditorView) => {
                // Set the apply text to the apply text
                const applyText = needsQuotes(column)
                  ? `AVG(DISTINCT "${column}"), `
                  : `AVG(DISTINCT ${column}), `;
                // Dispatch the changes
                view.dispatch({
                  changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
                });
                // If the on column select is not null
                // On column select the avg distinct column
                // Set the new selected columns 
                // to the new selected columns
                // Filter the selected columns 
                // by the value not equal to *
                if (onColumnSelect) {
                  onColumnSelect([
                    ...selectedColumns.filter((c) => c.value !== "*"),
                    {
                      value: `AVG(DISTINCT ${needsQuotes(column) ? `"${column}"` : column})`,
                      label: `AVG(DISTINCT ${column})`,
                      aggregate: true,
                      column: column,
                    },
                  ]);
                }
              },
              detail: "Average of distinct column values",
            },
            {
              label: `MAX(DISTINCT ${column})`,
              type: "function",
              apply: (view: EditorView) => {
                // Set the apply text to the apply text
                const applyText = needsQuotes(column)
                  ? `MAX(DISTINCT "${column}"), `
                  : `MAX(DISTINCT ${column}), `;
                // Dispatch the changes
                view.dispatch({
                  changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
                });
                // If the on column select is not null
                // On column select the max distinct column
                // Set the new selected columns 
                // to the new selected columns
                // Filter the selected columns 
                // by the value not equal to *
                if (onColumnSelect) {
                  onColumnSelect([
                    ...selectedColumns.filter((c) => c.value !== "*"),
                    {
                      value: `MAX(DISTINCT ${needsQuotes(column) ? `"${column}"` : column})`,
                      label: `MAX(DISTINCT ${column})`,
                      aggregate: true,
                      column: column,
                    },
                  ]);
                }
              },
              detail: "Maximum of distinct column values",
            },
            {
              label: `MIN(DISTINCT ${column})`,
              type: "function",
              apply: (view: EditorView) => {  
                // Set the apply text to the apply text
                const applyText = needsQuotes(column)
                  ? `MIN(DISTINCT "${column}"), `
                  : `MIN(DISTINCT ${column}), `;
                // Dispatch the changes
                view.dispatch({
                  changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: applyText },
                });
                // If the on column select is not null
                // On column select the min distinct column
                // Set the new selected columns 
                // to the new selected columns
                // Filter the selected columns 
                // by the value not equal to *
                if (onColumnSelect) {
                  onColumnSelect([
                    ...selectedColumns.filter((c) => c.value !== "*"),
                    {
                      value: `MIN(DISTINCT ${needsQuotes(column) ? `"${column}"` : column})`,
                      label: `MIN(DISTINCT ${column})`,
                      aggregate: true,
                      column: column,
                    },
                  ]);
                }
              },
              detail: "Minimum of distinct column values",
            }
          );
        }
        // Return the aggregates
        return aggregates;
      }),
    ];
    // If the after column match and the 
    // after select column match is false
    if (afterColumnMatch && !afterSelectColumnMatch) {
      // Push the as option to the options
      options.push(
        {
          label: "AS",
          type: "keyword",
          apply: " AS ",
          detail: "Alias column",
        },
        {
          label: "FROM",
          type: "keyword",
          apply: " FROM ",
          detail: "Specify table to select from",
        }
      );
    }
    // If the is in cte subquery and the parenthesis count
    //  is greater than 0
    if (isInCteSubquery && parenCount > 0) {
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }
    // If the options length is greater than 0
    if (options.length > 0) {
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^["'\w.*()]*$/,
      };
    }
  }
  // Return null
  return null;
};
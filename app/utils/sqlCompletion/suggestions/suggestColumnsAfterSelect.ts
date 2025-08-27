import { Completion, CompletionResult } from "@codemirror/autocomplete";
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
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  const selectRegex = /\bSELECT\s*(DISTINCT\s*)?$/i;
  const unionSelectRegex = /\bUNION\s*(ALL\s*)?SELECT\s*(DISTINCT\s*)?$/i;
  const aggrFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?(?:SUM|MAX|MIN|AVG|COUNT)\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*$/i;
  const roundFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*$/i;
  const roundNestedFuncRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\((?:AVG|SUM|MAX|MIN|COUNT)\(\s*([a-zA-Z_][a-zA-Z0-9_"]*)?\s*\)\s*,?\s*(\d*)?\s*$/i;
  const roundDecimalRegex =
    /\bSELECT\s+(DISTINCT\s+)?ROUND\((?:(?:AVG|SUM|MAX|MIN|COUNT)\([^)]+\)|[^)]+)\s*,?\s*(\d*)?\s*$/i;
  const inCaseStatementRegex = /\bCASE\s+([^;]*?)$/i;
  const afterSelectColumnRegex = /\bSELECT\s+([^;]*?),\s*$/i;
  const selectStarRegex = /\bSELECT\s*(DISTINCT\s*)?\*\s*$/i;
  const cteSelectRegex =
    /\bWITH\s+[\w"]+\s+AS\s*\(\s*SELECT\s*(DISTINCT\s*)?$/i;
  const afterColumnRegex = /\bSELECT\s+([^;]*?)(?:"[\w]+"|'[\w]+'|[\w_]+)\s*$/i;

  if (inCaseStatementRegex.test(docText)) {
    return null;
  }

  const aggrMatch = docText.match(aggrFuncRegex);
  const roundFuncMatch = docText.match(roundFuncRegex);
  const roundNestedFuncMatch = docText.match(roundNestedFuncRegex);
  const roundDecimalMatch = docText.match(roundDecimalRegex);
  const selectStarMatch = docText.match(selectStarRegex);
  const afterSelectColumnMatch = docText.match(afterSelectColumnRegex);
  const afterColumnMatch = docText.match(afterColumnRegex);

  const isInSelectClause =
    selectRegex.test(docText.trim()) ||
    unionSelectRegex.test(docText.trim()) ||
    cteSelectRegex.test(docText) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some(
            (node: Select) =>
              node.type === "select" &&
              (!node.columns || node.columns.length === 0)
          )
        : ast.type === "select" && (!ast.columns || ast.columns.length === 0)));

  const isDistinctPresent =
    /^SELECT\s+DISTINCT\s*$/i.test(docText.trim()) ||
    (unionSelectRegex.test(docText.trim()) &&
      docText.match(/\bDISTINCT\s*$/i)) ||
    (cteSelectRegex.test(docText) && docText.match(/\bDISTINCT\s*$/i)) ||
    (ast &&
      (Array.isArray(ast)
        ? ast.some((node: Select) => node.type === "select" && node.distinct)
        : ast.type === "select" && ast.distinct));

  const selectedColumnNames = selectedColumns.map((c) => c.value.toLowerCase());

  if (roundDecimalMatch) {
    const partialNumber = roundDecimalMatch[2] || "";
    const decimalOptions = ["0", "1", "2", "3", "4"].filter((num) =>
      partialNumber ? num.startsWith(partialNumber) : true
    );
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

  if (roundNestedFuncMatch) {
    const partialColumn = roundNestedFuncMatch[2]
      ? stripQuotes(roundNestedFuncMatch[2])
      : "";
    const innerFunc = roundNestedFuncMatch[0].match(
      /ROUND\((AVG|SUM|MAX|MIN|COUNT)\(/i
    )?.[1];

    const filteredColumns = allColumns.filter((column) => {
      const colLower = column.toLowerCase();
      return (
        !selectedColumnNames.includes(colLower) &&
        (partialColumn
          ? colLower.startsWith(partialColumn.toLowerCase())
          : true)
      );
    });

    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: (
            view: EditorView,
            completion: Completion,
            from: number,
            to: number
          ) => {
            const applyText = needsQuotes(column)
              ? `"${column}"), `
              : `${column}), `;
            view.dispatch({
              changes: { from, to, insert: applyText },
            });
            if (onColumnSelect && innerFunc) {
              const newSelectedColumns = [
                ...selectedColumns.filter((c) => c.value !== "*"),
                {
                  value: `ROUND(${innerFunc}(${needsQuotes(column) ? `"${column}"` : column}), 2)`,
                  label: `ROUND(${innerFunc}(${column}), 2)`,
                  isAggregate: true,
                  targetColumn: column,
                },
              ];
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

  if (aggrMatch || roundFuncMatch) {
    const partialColumn = aggrMatch
      ? aggrMatch[2]
        ? stripQuotes(aggrMatch[2])
        : ""
      : roundFuncMatch
      ? roundFuncMatch[2]
        ? stripQuotes(roundFuncMatch[2])
        : ""
      : "";
    const isRoundFunction = aggrMatch
      ? aggrMatch[0].toUpperCase().includes("ROUND(")
      : roundFuncMatch
      ? true
      : false;
    const isCountFunction = aggrMatch
      ? aggrMatch[0].toUpperCase().includes("COUNT(")
      : false;

    const filteredColumns = allColumns.filter((column) => {
      const colLower = column.toLowerCase();
      return (
        !selectedColumnNames.includes(colLower) &&
        (partialColumn
          ? colLower.startsWith(partialColumn.toLowerCase())
          : true)
      );
    });

    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: (
            view: EditorView,
            completion: Completion,
            from: number,
            to: number
          ) => {
            const func = aggrMatch
              ? aggrMatch[0].match(/(SUM|MAX|MIN|AVG|COUNT)/i)?.[1]
              : "ROUND";
            const applyText = needsQuotes(column)
              ? isRoundFunction
                ? `"${column}", `
                : isCountFunction && func === "COUNT"
                ? `"${column}"), `
                : `"${column}"), `
              : isRoundFunction
              ? `${column}, `
              : `${column}), `;
            view.dispatch({
              changes: { from, to, insert: applyText },
            });
            if (onColumnSelect) {
              const newSelectedColumns = [
                ...selectedColumns.filter((c) => c.value !== "*"),
                {
                  value: isRoundFunction
                    ? `ROUND(${needsQuotes(column) ? `"${column}"` : column}, 2)`
                    : `${func}(${needsQuotes(column) ? `"${column}"` : column})`,
                  label: isRoundFunction
                    ? `ROUND(${column}, 2)`
                    : `${func}(${column})`,
                  isAggregate: !isRoundFunction,
                  targetColumn: column,
                },
              ];
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

  if (selectStarMatch) {
    const options = [
      {
        label: "FROM",
        type: "keyword",
        apply: "FROM ",
        detail: "Specify table to select from",
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
      validFor: /^(FROM|\))$/i,
    };
  }

  if (
    isInSelectClause ||
    selectRegex.test(docText.trim()) ||
    unionSelectRegex.test(docText.trim()) ||
    cteSelectRegex.test(docText) ||
    afterSelectColumnMatch
  ) {
    const selectMatch = docText.match(
      /SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i
    );
    const existingColumns = selectMatch
      ? selectMatch[2]
          .split(",")
          .map((col) => stripQuotes(col.trim()))
          .filter((col) => col && (col === "*" || allColumns.includes(col)))
      : [];

    const filteredColumns = allColumns.filter((column) => {
      const colLower = column.toLowerCase();
      return (
        !existingColumns.includes(column) &&
        (currentWord
          ? colLower.startsWith(stripQuotes(currentWord).toLowerCase())
          : true)
      );
    });

    const options = [
      ...(!isDistinctPresent
        ? [
            {
              label: "DISTINCT",
              type: "keyword",
              apply: (
                view: EditorView,
                completion: Completion,
                from: number,
                to: number
              ) => {
                const currentQuery = view.state.doc.toString();
                let newQuery = currentQuery;

                if (newQuery.match(/^\s*SELECT\s+/i)) {
                  const selectMatch = newQuery.match(/^\s*SELECT\s+/i);
                  if (selectMatch) {
                    const insertPos = selectMatch[0].length;
                    newQuery =
                      newQuery.slice(0, insertPos) +
                      "DISTINCT " +
                      newQuery.slice(insertPos);
                  }
                } else {
                  newQuery = `SELECT DISTINCT ${newQuery}`;
                }

                view.dispatch({
                  changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: newQuery,
                  },
                });

                if (onDistinctSelect) {
                  onDistinctSelect(true);
                }
              },
              detail: "Select unique values",
            },
            {
              label: "COUNT(*)",
              type: "function",
              apply: (
                view: EditorView,
                completion: Completion,
                from: number,
                to: number
              ) => {
                view.dispatch({
                  changes: { from, to, insert: "COUNT(*), " },
                });
                if (onColumnSelect) {
                  onColumnSelect([
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
            {
              label: "*",
              type: "field",
              apply: (
                view: EditorView,
                completion: Completion,
                from: number,
                to: number
              ) => {
                const currentQuery = view.state.doc.toString();
                let newQuery = currentQuery;
                if (newQuery.match(/^\s*SELECT\s+(DISTINCT\s+)?/i)) {
                  newQuery = newQuery.replace(
                    /^\s*SELECT\s+(DISTINCT\s+)?/i,
                    `SELECT ${isDistinctPresent ? "DISTINCT " : ""}* `
                  );
                } else {
                  newQuery = `SELECT ${isDistinctPresent ? "DISTINCT " : ""}* `;
                }
                view.dispatch({
                  changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: newQuery,
                  },
                });
                if (onColumnSelect) {
                  onColumnSelect([{ value: "*", label: "All Columns (*)" }]);
                }
              },
              detail: "All columns",
              boost: 10,
            },
          ]
        : []),
      ...filteredColumns.map((column) => ({
        label: column,
        type: "field",
        apply: (
          view: EditorView,
          completion: Completion,
          from: number,
          to: number
        ) => {
          const currentQuery = view.state.doc.toString();
          const applyText = needsQuotes(column)
            ? `"${column}", `
            : `${column}, `;
          let newQuery = currentQuery;

          if (newQuery.match(/^\s*SELECT\s+(DISTINCT\s+)?/i)) {
            if (newQuery.match(/^\s*SELECT\s+(DISTINCT\s+)?\*\s*/i)) {
              newQuery = newQuery.replace(
                /^\s*SELECT\s+(DISTINCT\s+)?\*\s*/i,
                `SELECT ${isDistinctPresent ? "DISTINCT " : ""}${applyText}`
              );
            } else if (newQuery.match(/,\s*$/)) {
              newQuery = newQuery.replace(/,\s*$/, ` ${applyText}`);
            } else {
              newQuery = newQuery.replace(
                /^\s*SELECT\s+(DISTINCT\s+)?([^;]*?)(,)?\s*(FROM|$)/i,
                (match, distinct, columns, comma, suffix) =>
                  `SELECT ${distinct || ""}${columns}${
                    comma || ""
                  } ${applyText} ${suffix}`
              );
            }
          } else {
            newQuery = `SELECT ${
              isDistinctPresent ? "DISTINCT " : ""
            }${applyText}`;
          }

          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: newQuery },
          });

          if (onColumnSelect) {
            const newSelectedColumns = [
              ...selectedColumns.filter((c) => c.value !== "*"),
              { value: column, label: column },
            ];
            onColumnSelect(newSelectedColumns);
          }
        },
        detail: "Column name",
      })),
      ...filteredColumns.flatMap((column) => {
        const aggregates = [
          {
            label: `COUNT(${column})`,
            type: "function",
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `COUNT("${column}"), `
                : `COUNT(${column}), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `COUNT(DISTINCT "${column}"), `
                : `COUNT(DISTINCT ${column}), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
              if (onColumnSelect) {
                onColumnSelect([
                  ...selectedColumns.filter((c) => c.value !== "*"),
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `SUM("${column}"), `
                : `SUM(${column}), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `AVG("${column}"), `
                : `AVG(${column}), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `MAX("${column}"), `
                : `MAX(${column}), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `MIN("${column}"), `
                : `MIN(${column}), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 0), `
                : `ROUND(${column}, 0), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 1), `
                : `ROUND(${column}, 1), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 2), `
                : `ROUND(${column}, 2), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 3), `
                : `ROUND(${column}, 3), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND("${column}", 4), `
                : `ROUND(${column}, 4), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 0), `
                : `ROUND(AVG(${column}), 0), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 1), `
                : `ROUND(AVG(${column}), 1), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 2), `
                : `ROUND(AVG(${column}), 2), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 3), `
                : `ROUND(AVG(${column}), 3), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
              });
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
            apply: (
              view: EditorView,
              completion: Completion,
              from: number,
              to: number
            ) => {
              const applyText = needsQuotes(column)
                ? `ROUND(AVG("${column}"), 4), `
                : `ROUND(AVG(${column}), 4), `;
              view.dispatch({
                changes: { from, to, insert: applyText },
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

        if (isMySQL) {
          aggregates.push(
            {
              label: `SUM(DISTINCT ${column})`,
              type: "function",
              apply: (
                view: EditorView,
                completion: Completion,
                from: number,
                to: number
              ) => {
                const applyText = needsQuotes(column)
                  ? `SUM(DISTINCT "${column}"), `
                  : `SUM(DISTINCT ${column}), `;
                view.dispatch({
                  changes: { from, to, insert: applyText },
                });
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
              apply: (
                view: EditorView,
                completion: Completion,
                from: number,
                to: number
              ) => {
                const applyText = needsQuotes(column)
                  ? `AVG(DISTINCT "${column}"), `
                  : `AVG(DISTINCT ${column}), `;
                view.dispatch({
                  changes: { from, to, insert: applyText },
                });
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
              apply: (
                view: EditorView,
                completion: Completion,
                from: number,
                to: number
              ) => {
                const applyText = needsQuotes(column)
                  ? `MAX(DISTINCT "${column}"), `
                  : `MAX(DISTINCT ${column}), `;
                view.dispatch({
                  changes: { from, to, insert: applyText },
                });
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
              apply: (
                view: EditorView,
                completion: Completion,
                from: number,
                to: number
              ) => {
                const applyText = needsQuotes(column)
                  ? `MIN(DISTINCT "${column}"), `
                  : `MIN(DISTINCT ${column}), `;
                view.dispatch({
                  changes: { from, to, insert: applyText },
                });
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

        return aggregates;
      }),
    ];

    if (afterColumnMatch && !afterSelectColumnMatch) {
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

    if (isInCteSubquery && parenCount > 0) {
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }

    if (options.length > 0) {
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^["'\w.*()]*$/,
      };
    }
  }

  return null;
};
import { CompletionResult } from "@codemirror/autocomplete";
import { Select, ColumnRefExpr } from "node-sql-parser";
import { SelectOption, TableColumn } from "@/app/types/query";
import { EditorView } from "codemirror";
import { getValidTablesForColumns } from "../getValidTables";

// Set the column ref expr fixed to the column ref expr fixed
interface ColumnRefExprFixed extends Omit<ColumnRefExpr, "type"> {
  type: "column_ref";
  column: string;
  table?: string;
}

// Set the aggr func expr to the aggr func expr
interface AggrFuncExpr {
  type: "aggr_func";
  name: string;
  args:
    | {
        expr:
          | ColumnRefExprFixed
          | { type: "distinct"; expr: ColumnRefExprFixed };
      }
    | { expr: ColumnRefExprFixed; decimals: number };
}

// Set the case when to the case when
interface CaseWhen {
  cond?: {
    type: string;
    left?: ColumnRefExprFixed;
    right?: unknown;
  };
  result?: unknown;
}

export const suggestTablesAfterFrom = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  getValidTables: (
    selectedColumn: string | null,
    tableColumns: TableColumn,
    dataType?: string
  ) => string[],
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  tableColumns: TableColumn,
  ast: Select | Select[] | null,
  onTableSelect?: (value: SelectOption | null) => void,
  tableNames?: string[]
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

  // Set the is column ref expr to the is column ref expr
  const isColumnRefExpr = (expr: unknown): expr is ColumnRefExprFixed =>
    // If the expr is undefined, return false
    !!expr &&
    // If the expr is not an object, return false
    typeof expr === "object" &&
    // If the expr does not have a type, return false
    "type" in expr &&
    // If the expr does not have a column, return false
    (expr as { type: unknown }).type === "column_ref" &&
    "column" in (expr as Record<string, unknown>);


  // Set the is aggr func expr to the is aggr func expr
  const isAggrFuncExpr = (expr: unknown): expr is AggrFuncExpr =>
    // If the expr is undefined, return false
    !!expr &&
    // If the expr is not an object, return false
    typeof expr === "object" &&
    // If the expr does not have a type, return false
    "type" in expr &&
    (expr as { type: unknown }).type === "aggr_func" &&
    "name" in expr &&
    // If the expr does not have a name, return false
    ["COUNT", "SUM", "MAX", "MIN", "AVG", "ROUND"].includes(
      (expr as { name: string }).name.toUpperCase()
    );


  // Set the is distinct expr to the is distinct expr
  const isDistinctExpr = (
    // If the expr is undefined, return false
    expr: unknown
  ): expr is { type: "distinct"; expr: ColumnRefExprFixed } =>
    // If the expr is undefined, return false
    !!expr &&
    // If the expr is not an object, return false
    typeof expr === "object" &&
    // If the expr does not have a type, return false
    "type" in expr &&
    (expr as { type: unknown }).type === "distinct" &&
    // If the expr does not have a expr, return false
    "expr" in expr &&
    isColumnRefExpr((expr as { expr: unknown }).expr);


  // Set the get selected columns to the get selected columns
  const getSelectedColumns = (
    selectText: string,
    ast: Select | null
  ): string[] => {
    // If the ast is true and the ast has columns
    if (ast && ast.columns) {
      // Return the ast columns
      return ast.columns
        .map((col) => {
          // If the col has a expr and the col expr is a column ref expr
          if (col.expr && isColumnRefExpr(col.expr)) {
            return stripQuotes(col.expr.column);
          } else if (col.expr && col.expr.type === "case") {
            // Return the case when list
            return (
              (col.expr.when_list as CaseWhen[])
                ?.map((when) =>
                  // If the when has a cond and the when cond 
                  // is a binary expr
                  // and the when cond left is a column ref expr
                  when.cond?.type === "binary_expr" &&
                  isColumnRefExpr(when.cond.left)
                    ? stripQuotes(when.cond.left.column)
                    : null
                )
                // Filter the case when list by the col
                .filter((col): col is string => !!col) || []
            );
          } else if (col.expr && isAggrFuncExpr(col.expr)) {
            // Set the args to the args
            const args = col.expr.args;
            // If the args expr is a column ref expr
            if (isColumnRefExpr(args.expr)) {
              // Return the strip quotes column
              return stripQuotes(args.expr.column);
            } else if (isDistinctExpr(args.expr)) {
              // Return the strip quotes column
              return stripQuotes(args.expr.expr.column);
            }
          }
          // Return null
          return null;
        })
        // Flat the select text
        .flat()
        // Filter the select text by the col
        .filter((col): col is string => !!col);
    }

    // Return the select text
    return selectText
      // Split the select text by the comma
      .split(",")
      .map((col) => {
        // Set the aggr match to the aggr match
        const aggrMatch = col.match(
          /(?:COUNT|SUM|MAX|MIN|AVG|ROUND)\(\s*(?:DISTINCT\s+)?(?:("[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))\s*(?:,\s*\d+)?\)/i
        );
        // If the aggr match is true
        if (aggrMatch) {
          // Return the strip quotes column
          return stripQuotes(aggrMatch[1]);
        }
        // Return the strip quotes column
        return stripQuotes(col.trim());
      })
      .filter((col) => col && col !== "*" && !col.match(/\bCASE\b/i));
  };

  // Set the after from regex to the after from regex
  // const afterFromRegex =
  //   /\bSELECT\s+(DISTINCT\s+)?(.+?)(?:\s+AS\s+"[^"]*")?\s+FROM\s*$/i;
  // Set the after table regex to the after table regex
  const afterTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_"]*)\s*$/i;
  // Set the after case end or alias regex to the after case end or alias regex
  const afterCaseEndOrAliasRegex =
    /\bCASE\s+.*?\bEND(\s+AS\s+"[^"]*")?\s+FROM\s*$/i;
  // Set the select from regex to the select from regex
  const selectFromRegex =
    /\bSELECT\s*(DISTINCT\s*)?([\w\s()*,"']*?)\s+FROM\s*$/i;
  // Set the is in cte subquery to the is in cte subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Set the paren count to the paren count
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;


  // If the select from regex is true
  if (selectFromRegex.test(docText)) {
    // Set the match to the match
    const match = docText.match(selectFromRegex);
    // Set the selected columns to the selected columns
    let selectedColumns: string[] = [];
    // Set the select node to the select node
    const selectNode = Array.isArray(ast)
      ? ast.find(isSelectNode) ?? null
      : ast;
    // If the match is true
    if (match) {
      selectedColumns = getSelectedColumns(match[2], selectNode);
    }
    // Set the is after cte closed to the is after cte closed
    const isAfterCteClosed =
      /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*?\)\s*SELECT\s*(DISTINCT\s*)?(.*?)\s+FROM\s*$/i.test(
        docText
      );
    // Set the valid tables to the valid tables 
    let validTables: string[] = [];
    // If the is after cte closed is true
    if (isAfterCteClosed) {
      // Set the cte alias match to the cte alias match
      const cteAliasMatch = docText.match(/\bWITH\s+([\w"]+)\s+AS\s*\(/i);
      // Set the cte alias to the cte alias
      const cteAlias = cteAliasMatch
        // If the cte alias match is true
        // Strip the quotes from the cte alias
        ? stripQuotes(cteAliasMatch[1])
        : "previous_query";
      // Set the valid tables to the valid tables
      // Include CTE alias plus regular tables (filtered by columns if any)
      const regularTables = tableNames && selectedColumns.length > 0
        ? getValidTablesForColumns(tableNames, tableColumns, selectedColumns)
        : getValidTables(null, tableColumns);
      validTables = [cteAlias, ...regularTables];
      // If the selected columns length is greater than 0
    } else {
      // Use new function to filter by ALL selected columns when tableNames is provided
      if (tableNames && selectedColumns.length > 0) {
        validTables = getValidTablesForColumns(tableNames, tableColumns, selectedColumns);
      } else if (tableNames) {
        // No columns selected, return all tables
        validTables = tableNames;
      } else {
        // Fallback to callback (old behavior for backward compatibility)
        validTables = selectedColumns.length
          ? getValidTables(selectedColumns[0], tableColumns)
          : getValidTables(null, tableColumns);
      }
    }

    // Set the filtered tables to the filtered tables
    const filteredTables = validTables.filter((table) =>
      // If the current word is true
    currentWord
    // Strip the quotes from the table
      ? stripQuotes(table)
      // Lowercase the table
      .toLowerCase()
      // Start with the strip quotes current word
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // If the filtered tables length is greater than 0
    if (filteredTables.length > 0) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: filteredTables.map((table) => ({
          label: table,
          type: "table",
          apply: (view: EditorView) => {
            // Set the table name to the table name
            const tableName = needsQuotes(table) ? `"${table}"` : table;
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${tableName} `,
              },
            });
            // If the on table select is not null
            // On table select the table
            if (onTableSelect) {
              // On table select the table
              onTableSelect({ value: table, label: table });
            }
          },
          detail: "Table name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // If the after table regex is true
  if (afterTableRegex.test(docText)) {
    // Set the table name to the table name
    const tableName = docText.match(afterTableRegex)![3];
    // Set the filtered tables to the filtered tables
    const filteredTables = getValidTables(null, tableColumns).filter(
      // If the table is true
      // Strip the quotes from the table
      // Lowercase the table
      // Start with the strip quotes current word
      (table) => table.toLowerCase() === stripQuotes(tableName).toLowerCase()
    );
    // If the filtered tables length is greater than 0
    if (filteredTables.length > 0) {
      // Set the options to the options
      const options = [
        {
          label: ")",
          type: "keyword",
          apply: ") ",
          detail: "Close CTE subquery",
        },
        {
          label: "INNER JOIN",
          type: "keyword",
          apply: "INNER JOIN ",
          detail: "Join tables with matching records",
        },
        {
          label: "LEFT JOIN",
          type: "keyword",
          apply: "LEFT JOIN ",
          detail: "Join tables, keeping all records from the left table",
        },
        {
          label: "RIGHT JOIN",
          type: "keyword",
          apply: "RIGHT JOIN ",
          detail: "Join tables, keeping all records from the right table",
        },
        {
          label: "CROSS JOIN",
          type: "keyword",
          apply: "CROSS JOIN ",
          detail: "Combine all rows from both tables",
        },
        {
          label: "WHERE",
          type: "keyword",
          apply: "WHERE ",
          detail: "Filter results",
        },
        {
          label: "GROUP BY",
          type: "keyword",
          apply: "GROUP BY ",
          detail: "Group results by column",
        },
        {
          label: "ORDER BY",
          type: "keyword",
          apply: "ORDER BY ",
          detail: "Sort results by column",
        },
      ];
      // Return the options
      return {
        from: word ? word.from : pos,
        options:
          isInCteSubquery && parenCount > 0
            ? options
            : options.filter((opt) => opt.label !== ")"),
        filter: true,
        validFor:
          /^(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN|WHERE|GROUP\s+BY|ORDER\s+BY|\))$/i,
      };
    }
  }

  // If the after case end or alias regex is true
  if (afterCaseEndOrAliasRegex.test(docText)) {
    // Set the select node to the select node
    const selectNode = Array.isArray(ast)
      // If the ast is an array, find the first select node
      ? ast.find(isSelectNode) ?? null
      : ast;
    // Set the selected columns to the selected columns
    const selectedColumns = getSelectedColumns("", selectNode);
    // Set the valid tables to the valid tables
    // Filter by ALL selected columns when tableNames is provided
    const validTables = tableNames && selectedColumns.length > 0
      ? getValidTablesForColumns(tableNames, tableColumns, selectedColumns)
      : tableNames
        ? tableNames
        : selectedColumns.length
          ? getValidTables(selectedColumns[0], tableColumns)
          : getValidTables(null, tableColumns);
    // Set the filtered tables to the filtered tables
    // Filter tables based on current word
    const filteredTables = validTables.filter((table) =>
      // If the current word is true
    currentWord
    // Strip the quotes from the table
      ? stripQuotes(table)
      // Lowercase the table
      .toLowerCase()
      // Start with the strip quotes current word
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // If the filtered tables length is greater than 0
    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredTables.map((table) => ({
          label: table,
          type: "table",
          apply: (view: EditorView) => {
            // Set the table name to the table name
            const tableName = needsQuotes(table) ? `"${table}"` : table;
            // Dispatch the changes
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${tableName} `,
              },
            });
            // If the on table select is not null
            // On table select the table
            if (onTableSelect) {
              // On table select the table
              onTableSelect({ value: table, label: table });
            }
          },
          detail: "Table name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }
  // Return null
  return null;
};
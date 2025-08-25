import { CompletionResult } from "@codemirror/autocomplete";
import { Select, ColumnRefExpr } from "node-sql-parser";
import { SelectOption, TableColumn } from "@/app/types/query";
import { EditorView } from "codemirror";

interface ColumnRefExprFixed extends Omit<ColumnRefExpr, "type"> {
  type: "column_ref";
  column: string;
  table?: string;
}

interface AggrFuncExpr {
  type: "aggr_func";
  name: string;
  args:
    | { expr: ColumnRefExprFixed }
    | { expr: ColumnRefExprFixed; decimals: number };
}

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
  onTableSelect?: (value: SelectOption | null) => void
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Define type guards:
  //    - isSelectNode: check if node is a Select AST node
  //    - isColumnRefExpr: check if expression is a column reference
  //    - isAggrFuncExpr: check if expression is an aggregate function
  //
  // 2. Define helper getSelectedColumns:
  //    - If AST is available, iterate over columns
  //      - If column is a column_ref → extract column name
  //      - If column is a CASE expression → extract column(s) from WHEN conditions
  //      - If column is an aggregate function (COUNT, SUM, etc.) → extract inner column
  //    - Else fallback: parse raw SELECT text with regex/split
  //    - Return cleaned list of selected column names
  //
  // 3. Define regex patterns for contexts:
  //    - afterFromRegex: detect `SELECT ... FROM` position
  //    - afterTableRegex: detect `SELECT ... FROM table_name` position
  //    - afterCaseEndOrAliasRegex: detect `CASE ... END [AS alias] FROM`
  //    - selectFromRegex: detect `SELECT * FROM` or `SELECT columns FROM`
  //    - Also detect CTE subquery context (WITH ... AS (SELECT ...)) and count parentheses
  //
  // 4. Handle case: after `SELECT ... FROM`
  //    - Extract selected columns (from AST or regex parsing)
  //    - If query just closed a CTE, add CTE alias as valid table option
  //    - Else, get valid tables for the first selected column (or fallback to all tables)
  //    - Filter valid tables by current word typed
  //    - If matches exist, return table suggestions
  //
  // 5. Handle case: after a specific table in FROM clause
  //    - Match the table name in the FROM clause
  //    - If valid, suggest next possible keywords:
  //      - `)` (if still inside an open CTE subquery)
  //      - `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `CROSS JOIN`
  //      - `WHERE`, `GROUP BY`
  //    - Return filtered options
  //
  // 6. Handle case: after CASE END expression in SELECT
  //    - Extract selected columns from AST
  //    - Get valid tables for these columns (or fallback to all tables)
  //    - Filter tables by current word typed
  //    - If matches exist, return table suggestions
  //
  // 7. If no condition matched, return null (no suggestions)

  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for column reference expression
  const isColumnRefExpr = (expr: unknown): expr is ColumnRefExprFixed =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "column_ref" &&
    "column" in (expr as Record<string, unknown>);

  // Type guard for aggregate function expression
  const isAggrFuncExpr = (expr: unknown): expr is AggrFuncExpr =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "aggr_func" &&
    "name" in expr &&
    ["COUNT", "SUM", "MAX", "MIN", "AVG", "ROUND"].includes(
      (expr as { name: string }).name.toUpperCase()
    );

  // Extract selected columns from AST or SELECT clause text
  const getSelectedColumns = (
    selectText: string,
    ast: Select | null
  ): string[] => {
    if (ast && ast.columns) {
      return ast.columns
        .map((col) => {
          if (col.expr && isColumnRefExpr(col.expr)) {
            return stripQuotes(col.expr.column);
          } else if (col.expr && col.expr.type === "case") {
            return (
              (col.expr.when_list as CaseWhen[])
                ?.map((when) =>
                  when.cond?.type === "binary_expr" &&
                  isColumnRefExpr(when.cond.left)
                    ? stripQuotes(when.cond.left.column)
                    : null
                )
                .filter((col): col is string => !!col) || []
            );
          } else if (col.expr && isAggrFuncExpr(col.expr)) {
            if (isColumnRefExpr(col.expr.args.expr)) {
              return stripQuotes(col.expr.args.expr.column);
            }
          }
          return null;
        })
        .flat()
        .filter((col): col is string => !!col);
    }
    return selectText
      .split(",")
      .map((col) => stripQuotes(col.trim()))
      .filter((col) => col && col !== "*" && !col.match(/\bCASE\b/i));
  };

  // Regex patterns for context detection
  const afterFromRegex =
    /\bSELECT\s+(DISTINCT\s+)?(.+?)(?:\s+AS\s+"[^"]*")?\s+FROM\s*$/i;
  const afterTableRegex =
    /\bSELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_"]*)\s*$/i;
  const afterCaseEndOrAliasRegex =
    /\bCASE\s+.*?\bEND(\s+AS\s+"[^"]*")?\s+FROM\s*$/i;
  // Regex to match SELECT * FROM or SELECT columns FROM in any context
  const selectFromRegex = /\bSELECT\s*(DISTINCT\s*)?(.*?)\s+FROM\s*$/i;
  // Check if inside a CTE subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Count parentheses to ensure ) is only suggested with unbalanced parens
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  // Handle suggestions after SELECT * FROM or SELECT columns FROM
  if (selectFromRegex.test(docText)) {
    const match = docText.match(selectFromRegex);
    let selectedColumns: string[] = [];
    const selectNode = Array.isArray(ast)
      ? ast.find(isSelectNode) ?? null
      : ast;

    if (match) {
      selectedColumns = getSelectedColumns(match[2], selectNode);
    }

    // Get valid tables based on selected columns, ensuring CTE alias is included in main query
    const isAfterCteClosed =
      /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*?\)\s*SELECT\s*(DISTINCT\s*)?(.*?)\s+FROM\s*$/i.test(
        docText
      );
    let validTables: string[] = [];
    if (isAfterCteClosed) {
      const cteAliasMatch = docText.match(/\bWITH\s+([\w"]+)\s+AS\s*\(/i);
      const cteAlias = cteAliasMatch
        ? stripQuotes(cteAliasMatch[1])
        : "previous_query";
      validTables = [cteAlias, ...getValidTables(null, tableColumns)];
    } else {
      validTables = selectedColumns.length
        ? getValidTables(selectedColumns[0], tableColumns)
        : getValidTables(null, tableColumns);
    }

    // Filter tables based on current word
    const filteredTables = validTables.filter((table) =>
      currentWord
        ? stripQuotes(table)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // Always suggest actual tables if available
    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredTables.map((table) => ({
          label: table,
          type: "table",
          apply: (view: EditorView) => {
            const tableName = needsQuotes(table) ? `"${table}"` : table;
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${tableName} `,
              },
            });
            if (onTableSelect) {
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

  // Handle suggestions after a valid table in FROM clause
  if (afterTableRegex.test(docText)) {
    const tableName = docText.match(afterTableRegex)![3];
    const filteredTables = getValidTables(null, tableColumns).filter(
      (table) => table.toLowerCase() === tableName.toLowerCase()
    );

    if (filteredTables.length > 0) {
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
          detail: "Group results by column",
        },
      ];

      return {
        from: word ? word.from : pos,
        options:
          isInCteSubquery && parenCount > 0
            ? options
            : options.filter((opt) => opt.label !== ")"),
        filter: true,
        validFor:
          /^(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN|WHERE|GROUP\s+BY|\))$/i,
      };
    }
  }

  // Handle suggestions after FROM or CASE END (with or without AS)
  if (afterCaseEndOrAliasRegex.test(docText)) {
    const selectNode = Array.isArray(ast)
      ? ast.find(isSelectNode) ?? null
      : ast;
    const selectedColumns = getSelectedColumns("", selectNode);

    // Get valid tables based on selected columns
    const validTables = selectedColumns.length
      ? getValidTables(selectedColumns[0], tableColumns)
      : getValidTables(null, tableColumns);

    // Filter tables based on current word
    const filteredTables = validTables.filter((table) =>
      currentWord
        ? stripQuotes(table)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // Suggest actual tables if available
    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredTables.map((table) => ({
          label: table,
          type: "table",
          apply: (view: EditorView) => {
            const tableName = needsQuotes(table) ? `"${table}"` : table;
            view.dispatch({
              changes: {
                from: word ? word.from : pos,
                to: pos,
                insert: `${tableName} `,
              },
            });
            if (onTableSelect) {
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

  return null;
};

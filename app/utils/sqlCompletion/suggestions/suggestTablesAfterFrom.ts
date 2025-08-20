import { CompletionResult } from "@codemirror/autocomplete";
import { Select, ColumnRefExpr } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

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
  ast: Select | Select[] | null
): CompletionResult | null => {
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
    "column" in (expr as any);

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
    /\bSELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;
  const afterCaseEndOrAliasRegex =
    /\bCASE\s+.*?\bEND(\s+AS\s+"[^"]*")?\s+FROM\s*$/i;

  // Handle suggestions after a valid table in FROM clause
  if (afterTableRegex.test(docText)) {
    const tableName = docText.match(afterTableRegex)![3];
    const filteredTables = getValidTables(null, tableColumns).filter(
      (table) => table.toLowerCase() === tableName.toLowerCase()
    );

    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: [
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
            label: "UNION",
            type: "keyword",
            apply: "UNION ",
            detail: "Combine results with another SELECT query",
          },
          {
            label: "UNION ALL",
            type: "keyword",
            apply: "UNION ALL ",
            detail:
              "Combine results with another SELECT query, including duplicates",
          },
          {
            label: "WHERE",
            type: "keyword",
            apply: "WHERE ",
            detail: "Filter results",
          },
          {
            label: ";",
            type: "text",
            apply: ";",
            detail: "Complete query",
          },
        ],
        filter: true,
        validFor:
          /^(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN|WHERE|UNION\s+ALL|UNION|;)$/i,
      };
    }
  }

  // Handle suggestions after FROM or CASE END (with or without AS)
  if (afterFromRegex.test(docText) || afterCaseEndOrAliasRegex.test(docText)) {
    const match = docText.match(/\bSELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s*$/i);
    let selectedColumns: string[] = [];
    const selectNode = Array.isArray(ast)
      ? ast.find(isSelectNode) ?? null
      : ast;

    // Extract selected columns for table filtering
    if (match) {
      selectedColumns = getSelectedColumns(match[2], selectNode);
    } else if (selectNode && afterCaseEndOrAliasRegex.test(docText)) {
      selectedColumns = getSelectedColumns("", selectNode);
    }

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

    // Suggest tables or a placeholder if no valid tables
    if (filteredTables.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredTables.map((table) => ({
          label: table,
          type: "table",
          apply: needsQuotes(table) ? `"${table}" ` : `${table} `,
          detail: "Table name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    } else if (!currentWord) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "table_name",
            type: "table",
            apply: "table_name ",
            detail: "Enter a table name",
          },
        ],
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  return null;
};

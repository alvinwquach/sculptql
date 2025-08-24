import { CompletionResult } from "@codemirror/autocomplete";
import { Select, TableExpr, From } from "node-sql-parser";
import { SelectOption, TableColumn } from "@/app/types/query";
import { suggestColumnsAfterSelect } from "./suggestColumnsAfterSelect";
import { getAllColumns } from "../getAllColumns";
import { suggestTablesAfterFrom } from "./suggestTablesAfterFrom";
import { getValidTables } from "../getValidTables";
import { suggestGroupByClause } from "./suggestGroupByClause";
import { suggestJoinClause } from "./suggestJoinClause";
import { suggestWhereClause } from "./suggestWhereClause";
import { suggestUnionClause } from "./suggestUnionClause";
import { SingleValue } from "react-select";

export const suggestWithClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  ast: Select | Select[] | null,
  tableNames: string[],
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  uniqueValues: Record<string, SelectOption[]>,
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
  // 1. Define type guards for Select node and TableExpr
  // 2. Check if cursor is after WITH (suggest CTE alias and AS)
  // 3. If after AS (, suggest SELECT for subquery
  // 4. If inside CTE subquery (WITH ... AS ( SELECT ...)):
  //    a. Extract subquery text and count parentheses
  //    b. Check if subquery is valid for closure (e.g., after SELECT ... FROM table, JOIN, CROSS JOIN, WHERE, GROUP BY, HAVING, ORDER BY, or UNION)
  //    c. Delegate to suggestColumnsAfterSelect, suggestTablesAfterFrom, suggestGroupByClause, suggestJoinClause, suggestWhereClause, or suggestUnionClause
  //    d. If subquery is valid and parentheses are unbalanced, merge ) with delegated suggestions
  //    e. If no delegated suggestions, suggest ) and other valid clauses (JOIN, WHERE, etc.) when subquery is valid
  // 5. If after CTE is closed (WITH ... AS (...)), suggest SELECT for main query or delegate to column/table suggestions
  // 6. Extract CTE columns for main query suggestions if applicable
  // 7. Return null if no suggestions apply

  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for TableExpr with table property
  const isTableExprWithTable = (
    expr: unknown
  ): expr is TableExpr & { table: string } =>
    !!expr &&
    typeof expr === "object" &&
    "type" in expr &&
    (expr as { type: unknown }).type === "table" &&
    "table" in expr &&
    typeof (expr as { table: unknown }).table === "string";

  // === Case 1: Suggest CTE structure (alias and AS) after WITH ===
  const isInWithClause = /\bWITH\s+[\w"]*\s*$/i.test(docText.slice(0, pos));
  if (isInWithClause) {
    const isTypingAlias = /^[a-zA-Z_][a-zA-Z0-9_]*$/i.test(currentWord);
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "alias AS (",
          type: "keyword",
          apply: `${currentWord || "previous_query"} AS ( `,
          detail: "Define CTE alias and start subquery",
        },
      ],
      filter: isTypingAlias,
      validFor: /^[a-zA-Z_][a-zA-Z0-9_]*$/i,
    };
  }

  // === Case 2: After AS (, suggest SELECT for the subquery ===
  const isAfterAsParen = /\bWITH\s+[\w"]*\s+AS\s*\(\s*$/i.test(
    docText.slice(0, pos)
  );
  if (isAfterAsParen) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "SELECT",
          type: "keyword",
          apply: "SELECT ",
          detail: "Start CTE subquery",
        },
      ],
      filter: true,
      validFor: /^SELECT$/i,
    };
  }

  // === Case 3: Inside CTE subquery (WITH ... AS ( SELECT ...)) ===
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText.slice(0, pos)
  );
  if (isInCteSubquery) {
    // Extract the subquery text
    const subqueryText =
      docText.match(/\bWITH\s+[\w"]*\s+AS\s*\(\s*(SELECT\b.*)$/i)?.[1] || "";
    // Count parentheses within the entire query
    const openParens = (docText.match(/\(/g) || []).length;
    const closeParens = (docText.match(/\)/g) || []).length;

    // Check if subquery is in a valid state to suggest closing parenthesis
    // Ensure SELECT has at least a FROM clause to be considered valid
    const isValidSubqueryForClosure =
      /\bSELECT\s+(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_"]*)\s*(?:$|\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+[\w.]+\s*(?:ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+)?\s*$|\bWHERE\s+.*$|\bGROUP\s+BY\s+.*$|\bHAVING\s+.*$|\bORDER\s+BY\s+.*$|\bUNION\s*(ALL\s*)?$)/i.test(
        subqueryText
      );

    if (openParens > closeParens) {
      // Inside the subquery, reuse existing suggestion functions
      const delegatedSuggestions =
        suggestColumnsAfterSelect(
          subqueryText,
          currentWord,
          pos,
          word,
          getAllColumns(tableNames, tableColumns),
          needsQuotes,
          ast
        ) ||
        suggestTablesAfterFrom(
          subqueryText,
          currentWord,
          pos,
          word,
          (selectedColumn) =>
            getValidTables(tableNames, tableColumns, selectedColumn),
          stripQuotes,
          needsQuotes,
          tableColumns,
          ast
        ) ||
        suggestGroupByClause(
          subqueryText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestJoinClause(
          subqueryText,
          currentWord,
          pos,
          word,
          tableNames,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestWhereClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          uniqueValues,
          stripQuotes,
          needsQuotes,
          ast,
          onWhereColumnSelect,
          onOperatorSelect,
          onValueSelect,
          onLogicalOperatorSelect
        ) ||
        suggestUnionClause(subqueryText, currentWord, pos, word, ast);

      // Merge ) with delegated suggestions if subquery is valid
      if (delegatedSuggestions && isValidSubqueryForClosure) {
        const newValidFor =
          delegatedSuggestions.validFor instanceof RegExp
            ? new RegExp(`${delegatedSuggestions.validFor.source}|\\)$`, "i")
            : /^[a-zA-Z0-9_"]+$|^\)$/i; // Fixed fallback pattern
        return {
          ...delegatedSuggestions,
          options: [
            ...delegatedSuggestions.options,
            {
              label: ")",
              type: "keyword",
              apply: ") ",
              detail: "Close CTE subquery",
              boost: 5, // Prioritize closing parenthesis
            },
          ],
          validFor: newValidFor,
        };
      }

      // If no delegated suggestions and subquery is valid, suggest ) and other valid clauses
      if (isValidSubqueryForClosure) {
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: ")",
              type: "keyword",
              apply: ") ",
              detail: "Close CTE subquery",
              boost: 5, // Prioritize closing parenthesis
            },
            {
              label: "INNER JOIN",
              type: "keyword",
              apply: "INNER JOIN ",
              detail: "Join with matching rows",
            },
            {
              label: "LEFT JOIN",
              type: "keyword",
              apply: "LEFT JOIN ",
              detail: "Include all rows from left table",
            },
            {
              label: "RIGHT JOIN",
              type: "keyword",
              apply: "RIGHT JOIN ",
              detail: "Include all rows from right table",
            },
            {
              label: "CROSS JOIN",
              type: "keyword",
              apply: "CROSS JOIN ",
              detail: "Cartesian product of tables",
            },
            {
              label: "WHERE",
              type: "keyword",
              apply: "WHERE ",
              detail: "Filter results",
            },
          ],
          filter: true,
          validFor: /^\)$|^(INNER|LEFT|RIGHT|CROSS|WHERE)$/i,
        };
      }

      // If no valid subquery closure state, return delegated suggestions without )
      return delegatedSuggestions || null;
    }
  }

  // === Case 4: After CTE is closed, suggest main query components ===
  const isAfterCteClosed =
    /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*?\)\s*$/i.test(
      docText.slice(0, pos)
    );
  if (isAfterCteClosed) {
    // Extract CTE alias
    const cteAliasMatch = docText.match(/\bWITH\s+([\w"]+)\s+AS\s*\(/i);
    const cteAlias = cteAliasMatch
      ? stripQuotes(cteAliasMatch[1])
      : "previous_query";

    // Get columns from the CTE's SELECT statement
    let cteColumns: string[] = [];
    if (ast) {
      const selectNode = Array.isArray(ast)
        ? ast.find(isSelectNode)
        : isSelectNode(ast)
        ? ast
        : null;
      if (selectNode && selectNode.with) {
        const withClauses = Array.isArray(selectNode.with)
          ? selectNode.with
          : [selectNode.with];
        const cte = withClauses.find(
          (w) => w.name && stripQuotes(w.name.value) === cteAlias
        );
        if (cte && cte.stmt) {
          const cteStmt = Array.isArray(cte.stmt)
            ? cte.stmt.find(isSelectNode)
            : isSelectNode(cte.stmt)
            ? cte.stmt
            : null;
          if (cteStmt && cteStmt.columns) {
            cteColumns = cteStmt.columns
              .map((col) => {
                if (col.as) {
                  return stripQuotes(col.as);
                } else if (col.expr?.type === "column_ref") {
                  return stripQuotes(col.expr.column);
                } else if (col.expr?.type === "star") {
                  // Handle SELECT * by including all columns from the FROM clause
                  if (cteStmt.from) {
                    let fromArray: From[] = [];
                    if (Array.isArray(cteStmt.from)) {
                      fromArray = cteStmt.from;
                    } else if (isTableExprWithTable(cteStmt.from)) {
                      fromArray = [
                        {
                          table: cteStmt.from.table,
                          as: cteStmt.from.as,
                        } as From,
                      ];
                    }
                    if (
                      fromArray.length > 0 &&
                      isTableExprWithTable(fromArray[0])
                    ) {
                      const tableName = stripQuotes(fromArray[0].table);
                      return tableColumns[tableName] || [];
                    }
                  }
                }
                return null;
              })
              .flat()
              .filter((col): col is string => !!col);
          }
        }
      }
    }

    // Use the substring after the CTE for main query suggestions
    const mainQueryText =
      docText.match(
        /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*?\)\s*(.*)$/i
      )?.[1] || "";
    // Ensure CTE alias and all table names are available
    const validTables = [cteAlias, ...tableNames];
    return (
      suggestColumnsAfterSelect(
        mainQueryText,
        currentWord,
        pos,
        word,
        cteColumns.length > 0
          ? cteColumns
          : getAllColumns(tableNames, tableColumns),
        needsQuotes,
        ast
      ) ||
      suggestTablesAfterFrom(
        mainQueryText,
        currentWord,
        pos,
        word,
        () => validTables,
        stripQuotes,
        needsQuotes,
        {
          ...tableColumns,
          [cteAlias]:
            cteColumns.length > 0
              ? cteColumns
              : tableColumns[tableNames[0]] || [],
        },
        ast
      ) ||
      suggestUnionClause(mainQueryText, currentWord, pos, word, ast) ||
      suggestWhereClause(
        docText,
        currentWord,
        pos,
        word,
        tableColumns,
        uniqueValues,
        stripQuotes,
        needsQuotes,
        ast,
        onWhereColumnSelect,
        onOperatorSelect,
        onValueSelect,
        onLogicalOperatorSelect
      ) || {
        from: word ? word.from : pos,
        options: [
          {
            label: "SELECT",
            type: "keyword",
            apply: "SELECT ",
            detail: "Start main query after CTE",
          },
        ],
        filter: true,
        validFor: /^SELECT$/i,
      }
    );
  }

  return null;
};

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

  // Set the is table expr with table to the is table expr with table
  const isTableExprWithTable = (
    expr: unknown
  ): expr is TableExpr & { table: string } =>
    // If the expr is undefined, return false
    !!expr &&
    // If the expr is not an object, return false
    typeof expr === "object" &&
    // If the expr does not have a type, return false
    "type" in expr &&
    // If the expr does not have a type of table, return false
    (expr as { type: unknown }).type === "table" &&
    // If the expr does not have a table, return false
    "table" in expr &&
    typeof (expr as { table: unknown }).table === "string";

  // Set the is in with clause to the is in with clause
  const isInWithClause = /\bWITH\s+[\w"]*\s*$/i.test(docText.slice(0, pos));
  // If the is in with clause is true
  if (isInWithClause) {
    // Set the is typing alias to the is typing alias
    const isTypingAlias = /^[a-zA-Z_][a-zA-Z0-9_]*$/i.test(currentWord);
    // Return the options
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

  // Set the is after as paren to the is after as paren
  const isAfterAsParen = /\bWITH\s+[\w"]*\s+AS\s*\(\s*$/i.test(
    docText.slice(0, pos)
  );
  // If the is after as paren is true
  if (isAfterAsParen) {
    // Return the options
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

  // Set the is in cte subquery to the is in cte subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText.slice(0, pos)
  );
  // If the is in cte subquery is true
  if (isInCteSubquery) {
    // Set the subquery text to the subquery text
    const subqueryText =
      docText.match(/\bWITH\s+[\w"]*\s+AS\s*\(\s*(SELECT\b.*)$/i)?.[1] || "";
   
    // Set the open parens to the open parens
    const openParens = (docText.match(/\(/g) || []).length;
    // Set the close parens to the close parens
    const closeParens = (docText.match(/\)/g) || []).length;

    // Set the is valid subquery for closure 
    // to the is valid subquery for closure
    const isValidSubqueryForClosure =
      /\bSELECT\s+(.+?)\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_"]*)\s*(?:$|\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+[\w.]+\s*(?:ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+)?\s*$|\bWHERE\s+.*$|\bGROUP\s+BY\s+.*$|\bHAVING\s+.*$|\bORDER\s+BY\s+.*$|\bUNION\s*(ALL\s*)?$)/i.test(
        subqueryText
      );

    // If the open parens is greater than the close parens
    if (openParens > closeParens) {
      // Set the delegated suggestions to the delegated suggestions
      const delegatedSuggestions =
        suggestColumnsAfterSelect(
          subqueryText,
          currentWord,
          pos,
          word,
          getAllColumns(tableNames, tableColumns),
          [],
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
          subqueryText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast,
          onWhereColumnSelect,
          onOperatorSelect,
          onValueSelect,
          onLogicalOperatorSelect
        ) ||
        suggestUnionClause(subqueryText, currentWord, pos, word, ast);

      // If the delegated suggestions is true and 
      // the is valid subquery for closure is true
      if (delegatedSuggestions && isValidSubqueryForClosure) {
        // Set the new valid for to the new valid for
        const newValidFor =
          delegatedSuggestions.validFor instanceof RegExp
            ? new RegExp(`${delegatedSuggestions.validFor.source}|\\)$`, "i")
            : /^[a-zA-Z0-9_"]+$|^\)$/i;
        // Return the options
        return {
          ...delegatedSuggestions,
          options: [
            ...delegatedSuggestions.options,
            {
              label: ")",
              type: "keyword",
              apply: ") ",
              detail: "Close CTE subquery",
              boost: 5,
            },
          ],
          validFor: newValidFor,
        };
      }
      // If the is valid subquery for closure is true
      if (isValidSubqueryForClosure) {
        // Return the options
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: ")",
              type: "keyword",
              apply: ") ",
              detail: "Close CTE subquery",
              boost: 5,
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

      // Return the delegated suggestions
      return delegatedSuggestions || null;
    }
  }

  // Set the is after cte closed to the is after cte closed
  const isAfterCteClosed =
    /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*?\)\s*$/i.test(
      docText.slice(0, pos)
    );
  // If the is after cte closed is true
  if (isAfterCteClosed) {
    // Set the cte alias match to the cte alias match
    const cteAliasMatch = docText.match(/\bWITH\s+([\w"]+)\s+AS\s*\(/i);
    // Set the cte alias to the cte alias
    const cteAlias = cteAliasMatch
      ? stripQuotes(cteAliasMatch[1])
      : "previous_query";
    // Set the cte columns to the cte columns
    let cteColumns: string[] = [];
    // If the ast is true
    if (ast) {
      // Set the select node to the select node
      const selectNode = Array.isArray(ast)
        // If the ast is an array, 
        // set the select node to the first item
        ? ast.find(isSelectNode)
        // If the ast is not an array, 
        // set the select node to the select node 
        : isSelectNode(ast)
        // If the ast is not a select node, 
        ? ast
        // set the select node to null
        : null;
      // If the select node has a with clause
      if (selectNode && selectNode.with) {
        // Set the with clauses to the with clauses
        const withClauses = Array.isArray(selectNode.with)
        // If the with clauses is an array, 
        // set the with clauses to the with clauses
        ? selectNode.with
        // If the with clauses is not an array, 
        // set the with clauses to the with clauses
          : [selectNode.with];
        // Set the cte to the cte
        const cte = withClauses.find(
          (w) => w.name && stripQuotes(w.name.value) === cteAlias
        );
        // If the cte is true and the cte statement is true
        if (cte && cte.stmt) {
          // Set the cte statement to the cte statement
          // If the cte statement is an array, 
          // set the cte statement to the first item
          const cteStmt = Array.isArray(cte.stmt)
          ? cte.stmt.find(isSelectNode)
          : isSelectNode(cte.stmt)
          // If the cte statement is not an array, 
          // set the cte statement to the cte statement
          ? cte.stmt
          // If the cte statement is not a select node, 
          // set the cte statement to null
            : null;
          // If the cte statement has columns
          if (cteStmt && cteStmt.columns) {
            // Set the cte columns to the cte columns
            cteColumns = cteStmt.columns
              .map((col) => {
                if (col.as) {
                  return stripQuotes(col.as);
                } else if (col.expr?.type === "column_ref") {
                  return stripQuotes(col.expr.column);
                } else if (col.expr?.type === "star") {
                  // If the cte statement has a from
                  if (cteStmt.from) {
                    // Set the from array to the from array
                    let fromArray: From[] = [];
                    // If the cte statement has a from 
                    // and the from is an array
                    if (Array.isArray(cteStmt.from)) {
                      // Set the from array to the from array
                      fromArray = cteStmt.from;
                    } else if (isTableExprWithTable(cteStmt.from)) {
                      // Set the from array to the from array
                      fromArray = [cteStmt.from];
                    } else if (isTableExprWithTable(cteStmt.from)) {
                      // Set the from array to the from array
                      fromArray = [
                        {
                          table: cteStmt.from.table,
                          as: cteStmt.from.as,
                        } as From,
                      ];
                    }
                    // If the from array length is greater than 0 
                    // and the from array has a table expr with table
                    if (
                      fromArray.length > 0 &&
                      isTableExprWithTable(fromArray[0])
                    ) {
                      // Set the table name to the table name
                      const tableName = stripQuotes(fromArray[0].table);
                      // Return the table columns
                      return tableColumns[tableName] || [];
                    }
                  }
                }
                // Return null
                return null;
              })
              // Flatten the columns
              .flat()
              // Filter the columns
              .filter((col): col is string => !!col);
          }
        }
      }
    }

    // Set the main query text to the main query text
    const mainQueryText =
      docText.match(
        /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*?\)\s*(.*)$/i
      )?.[1] || "";
    // Set the valid tables to the valid tables
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
        [],
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
        mainQueryText,
        currentWord,
        pos,
        word,
        tableColumns,
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

  // Return null
  return null;
};
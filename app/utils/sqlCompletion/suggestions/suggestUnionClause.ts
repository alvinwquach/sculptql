import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

export const suggestUnionClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  ast: Select | Select[] | null
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

  // Set the is in cte subquery to the is in cte subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Set the paren count to the paren count
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  // Set the primary table to the primary table null
  let primaryTable: string | null = null;
  // If the ast is a select node
  if (ast) {
    // Set the select node to the select node
    const selectNode = Array.isArray(ast)
      // If the ast is an array, find the first select node
      ? ast.find((node: Select) => isSelectNode(node))
      // If the ast is a select node, return the ast
      : isSelectNode(ast)
      // If the ast is not a select node, return null
      ? ast
      // If the ast is null, return null
      : null;
    // If the select node has a from clause
    if (selectNode && selectNode.from) {
      // Set the from clause to the from clause if it is an array
      const fromClause = Array.isArray(selectNode.from)
        // If the from clause is an array, 
        // set the from clause to the first item
        ? selectNode.from[0]
        // If the from clause is not an array, 
        // set the from clause to the from clause
        : selectNode.from;
      // If the from clause is a table reference
      if (isTableReference(fromClause)) {
        // Set the primary table to the table
        primaryTable = fromClause.table;
      }
    }
  } else {
    // Set the from match to the from match
    const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
    // Set the primary table to the from match
    primaryTable = fromMatch ? fromMatch[1] : null;
  }

  // If the primary table is null
  if (!primaryTable) {
    // Return null
    return null;
  }

  // Set the has where to the has where
  const hasWhere = /\bWHERE\b/i.test(docText);
  // Set the has group by to the has group by
  const hasGroupBy = /\bGROUP\s+BY\b/i.test(docText);
  // Set the has having to the has having
  const hasHaving = /\bHAVING\b/i.test(docText);
  // Set the has order by to the has order by
  const hasOrderBy = /\bORDER\s+BY\b/i.test(docText);
  // Set the has limit to the has limit
  const hasLimit = /\bLIMIT\b/i.test(docText);
  // Set the has union to the has union
  const hasUnion = /\bUNION\b/i.test(docText);
  // Set the after from regex to the after from regex
  const afterFromRegex = /\bFROM\s+[\w.]+\s*$/i;
  
  if (
    afterFromRegex.test(docText) &&
    !hasWhere &&
    !hasGroupBy &&
    !hasHaving &&
    !hasOrderBy &&
    !hasLimit &&
    !hasUnion
  ) {
    // Set the options to the options
    const options = [
      {
        label: "UNION",
        type: "keyword",
        apply: "UNION ",
        detail:
          "Combine results with another SELECT query (removes duplicates)",
      },
      {
        label: "UNION ALL",
        type: "keyword",
        apply: "UNION ALL ",
        detail: "Combine results with another SELECT query (keeps duplicates)",
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
      validFor: /^(UNION|UNION\s+ALL|WHERE|;|\))$/i,
    };
  }

  // Set the after join clause regex to the after join clause regex
  const afterJoinClauseRegex =
    // If the after join clause regex is true
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s+ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+\s*$|\bCROSS\s+JOIN\s+[\w.]+\s*$/i;
  if (
    afterJoinClauseRegex.test(docText) &&
    !hasWhere &&
    !hasGroupBy &&
    !hasHaving &&
    !hasOrderBy &&
    !hasLimit &&
    !hasUnion
  ) {
    // Set the options to the options
    const options = [
      {
        label: "UNION",
        type: "keyword",
        apply: "UNION ",
        detail:
          "Combine results with another SELECT query (removes duplicates)",
      },
      {
        label: "UNION ALL",
        type: "keyword",
        apply: "UNION ALL ",
        detail: "Combine results with another SELECT query (keeps duplicates)",
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
      validFor: /^(UNION|UNION\s+ALL|WHERE|;|\))$/i,
    };
  }

  // Set the after union regex to the after union regex
  const afterUnionRegex = /\bUNION\s*(ALL\s*)?$/i;
  // If the after union regex is true
  if (afterUnionRegex.test(docText)) {
    // Return the options
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "SELECT",
          type: "keyword",
          apply: "SELECT ",
          detail: "Start a new SELECT query for UNION",
        },
      ],
      filter: true,
      validFor: /^SELECT$/i,
    };
  }

  // Set the after union all regex to the after union all regex
  const afterUnionAllRegex = /\bUNION\s+ALL\s*$/i;
  // If the after union all regex is true
  if (afterUnionAllRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "UNION",
          type: "keyword",
          apply: "UNION ",
          detail:
            "Combine results with another SELECT query (removes duplicates)",
        },
      ],
      filter: true,
      validFor: /^UNION$/i,
    };
  }
  // Return null
  return null;
};
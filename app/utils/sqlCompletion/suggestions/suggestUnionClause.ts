import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

export const suggestUnionClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for FROM clause
  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    !!fromItem &&
    typeof fromItem === "object" &&
    "table" in fromItem &&
    (typeof (fromItem as { table: unknown }).table === "string" ||
      (fromItem as { table: unknown }).table === null);

  // Get the primary table from the FROM clause
  let primaryTable: string | null = null;
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
        primaryTable = fromClause.table;
      }
    }
  } else {
    const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
    primaryTable = fromMatch ? fromMatch[1] : null;
  }

  if (!primaryTable) {
    return null;
  }

  // Check for presence of other clauses
  const hasWhere = /\bWHERE\b/i.test(docText);
  const hasGroupBy = /\bGROUP\s+BY\b/i.test(docText);
  const hasHaving = /\bHAVING\b/i.test(docText);
  const hasOrderBy = /\bORDER\s+BY\b/i.test(docText);
  const hasLimit = /\bLIMIT\b/i.test(docText);
  const hasUnion = /\bUNION\b/i.test(docText);

  // Suggest UNION, WHERE, or ; after FROM table_name
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
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "UNION",
          type: "keyword",
          apply: "UNION ",
          detail: "Combine results with another SELECT query",
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
      validFor: /^(UNION|WHERE|;)$/i,
    };
  }

  // Suggest UNION, WHERE, or ; after complete JOIN clause or CROSS JOIN
  const afterJoinClauseRegex =
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
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "UNION",
          type: "keyword",
          apply: "UNION ",
          detail: "Combine results with another SELECT query",
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
      validFor: /^(UNION|WHERE|;)$/i,
    };
  }

  // Suggest SELECT after UNION
  const afterUnionRegex = /\bUNION\s*$/i;
  if (afterUnionRegex.test(docText)) {
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

  return null;
};

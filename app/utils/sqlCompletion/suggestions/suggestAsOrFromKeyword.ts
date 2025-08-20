import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

export const suggestAsOrFromKeyword = (
  docText: string,
  pos: number,
  word: { from: number; to: number; text: string } | null,
  ast: unknown | null
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Check if input is a valid SELECT node
  // 2. If query ends with "SELECT *" or "SELECT DISTINCT *", suggest "FROM"
  // 3. If after a complete CASE statement without alias, suggest "AS" or "FROM"
  // 4. If after AS "", a partial alias, or complete alias in SELECT, suggest "FROM"
  // 5. If inside a SELECT clause with columns but no FROM, suggest "AS" (if no alias) and "FROM"
  // 6. Return null if no suggestions apply

  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Suggest "FROM" if the query ends with "SELECT *" or "SELECT DISTINCT *"
  const selectStarRegex = /\bSELECT\s+(DISTINCT\s+)?\*\s*$/i;
  if (selectStarRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "FROM",
          type: "keyword",
          apply: "FROM ",
          detail: "Specify table",
        },
      ],
      validFor: /^FROM$/i,
    };
  }

  // Suggest "AS" or "FROM" after a complete CASE statement without an alias
  const afterCaseEndRegex = /\bCASE\s+.*?\bEND\s*$/i;
  if (afterCaseEndRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "AS",
          type: "keyword",
          apply: 'AS "" ',
          detail: "Alias the CASE expression",
        },
        {
          label: "FROM",
          type: "keyword",
          apply: "FROM ",
          detail: "Specify table",
        },
      ],
      validFor: /^(AS|FROM)$/i,
    };
  }

  // Suggest "FROM" after AS "", a partial alias, or a complete alias in a SELECT clause
  const afterAsOrAliasRegex =
    /\bSELECT\s+(DISTINCT\s+)?(?:[^;]+,)?(?:[^;]*?\bCASE\s+.*?\bEND|[^,;\s]+)\s+AS\s+(""|"[^"]*"?)\s*$/i;
  if (afterAsOrAliasRegex.test(docText)) {
    return {
      from: pos,
      options: [
        {
          label: "FROM",
          type: "keyword",
          apply: "FROM ",
          detail: "Specify table",
        },
      ],
      validFor: /^FROM$/i,
    };
  }

  // If we’re inside a SELECT clause that has columns but no FROM clause yet
  if (
    ast &&
    isSelectNode(ast) &&
    ast.columns &&
    ast.columns.length > 0 &&
    !ast.from
  ) {
    const selectAst = ast as Select;
    const lastColumn = selectAst.columns[selectAst.columns.length - 1];

    // If last column is a "*", suggest "FROM" only
    if (lastColumn.expr?.type === "star") {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "FROM",
            type: "keyword",
            apply: "FROM ",
            detail: "Specify table",
          },
        ],
        validFor: /^FROM$/i,
      };
    }

    // Otherwise, build a suggestion list for "AS" and "FROM"
    const options: {
      label: string;
      type: string;
      apply: string;
      detail: string;
      boost?: number;
      info?: () => HTMLElement;
    }[] = [];

    // Suggest "AS" only if the last column doesn’t already have an alias
    if (!lastColumn.as) {
      options.push({
        label: "AS",
        type: "keyword",
        apply: 'AS ""',
        detail: "Alias column",
        boost: 1,
        info: () => {
          const node = document.createElement("div");
          node.textContent = "Enter alias name inside double quotes";
          return node;
        },
      });
    }

    // Always suggest "FROM" as the next clause
    options.push({
      label: "FROM",
      type: "keyword",
      apply: "FROM ",
      detail: "Specify table",
    });

    return {
      from: word ? word.from : pos,
      options,
      validFor: /^(AS|FROM)$/i,
    };
  }

  return null;
};
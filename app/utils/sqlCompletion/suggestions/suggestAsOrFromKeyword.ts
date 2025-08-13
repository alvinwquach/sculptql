import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

// This function provides autocomplete suggestions for the SQL keywords `AS` and `FROM`
// depending on the context within a SELECT query.
export const suggestAsOrFromKeyword = (
  docText: string, // The full text of the current SQL document
  pos: number, // Current cursor position
  word: { from: number; to: number; text: string } | null, // The word currently being typed at the cursor
  ast: unknown | null // The parsed SQL Abstract Syntax Tree
): CompletionResult | null => {
  // === STEP 1: Type guard to check if the AST node is a "SELECT" type ===
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // === STEP 2: Suggest "FROM" if the query ends with "SELECT *" or "SELECT DISTINCT *" ===
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
      validFor: /^FROM$/i, // Only trigger for matching "FROM"
    };
  }

  // === STEP 3: If we’re inside a SELECT clause that has columns but no FROM clause yet ===
  if (
    ast &&
    isSelectNode(ast) &&
    ast.columns &&
    ast.columns.length > 0 &&
    !ast.from
  ) {
    const selectAst = ast as Select;
    const lastColumn = selectAst.columns[selectAst.columns.length - 1];

    // === STEP 3a: If last column is a "*" (select all), suggest "FROM" only ===
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

    // === STEP 3b: Otherwise, build a suggestion list for "AS" and "FROM" ===
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
        apply: 'AS ""', // Template for alias name
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
      validFor: /^(AS|FROM)$/i, // Valid if the user is typing "AS" or "FROM"
    };
  }

  // === STEP 4: Special case – after typing AS "" (empty alias), suggest FROM ===
  // Matches something like: SELECT [DISTINCT] column AS ""
  const afterAsRegex =
    /\bSELECT\s+(DISTINCT\s+)?((?:"[^"]+"|'[^']+'|[\w_][\w\d_]*))\s+AS\s+("")\s*$/i;
  if (afterAsRegex.test(docText)) {
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

  // === STEP 5: If none of the above conditions are met, return no suggestions ===
  return null;
};
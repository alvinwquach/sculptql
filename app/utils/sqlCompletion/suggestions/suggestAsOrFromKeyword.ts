import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

// Function to suggest the as or from keyword
export const suggestAsOrFromKeyword = (
  docText: string,
  pos: number,
  word: { from: number; to: number; text: string } | null,
  ast: unknown | null
): CompletionResult | null => {
  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    // If the node is undefined, return false
    !!node &&
    // If the node is not an object, return false
    typeof node === "object" &&
    // If the node does not have a type, return false
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Check if the query ends with "SELECT *" or "SELECT DISTINCT *" 
  const selectStarRegex = /\bSELECT\s+(DISTINCT\s+)?\*\s*$/i;
  if (selectStarRegex.test(docText)) {
    // Return the options
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

  // Check if the query ends with "CASE" and "END"
  const afterCaseEndRegex = /\bCASE\s+.*?\bEND\s*$/i;
  // If the query ends with "CASE" and "END"
  if (afterCaseEndRegex.test(docText)) {
    // Return the options
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

  // Check if the query ends with "AS" or "alias"
  const afterAsOrAliasRegex =
    /\bSELECT\s+(DISTINCT\s+)?(?:[^;]+,)?(?:[^;]*?\bCASE\s+.*?\bEND|[^,;\s]+)\s+AS\s+(""|"[^"]*"?)\s*$/i;
  if (afterAsOrAliasRegex.test(docText)) {
    // Return the options
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

  // Check if the ast is a select node, has columns, and has no from
  if (
    ast &&
    isSelectNode(ast) &&
    ast.columns &&
    ast.columns.length > 0 &&
    !ast.from
  ) {
    // Set the select ast to the ast
    const selectAst = ast as Select;
    // Set the last column to the last column of the select ast
    const lastColumn = selectAst.columns[selectAst.columns.length - 1];
    // Check if the last column is a star
    if (lastColumn.expr?.type === "star") {
      // Return the options
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

    // Create the options array
    const options: {
      label: string;
      type: string;
      apply: string;
      detail: string;
      boost?: number;
      info?: () => HTMLElement;
    }[] = [];

    // Check if the last column does not have an alias
    if (!lastColumn.as) {
      // Push the as option to the options array
      options.push({
        label: "AS",
        type: "keyword",
        apply: 'AS ""',
        detail: "Alias column",
        boost: 1,
        // Create the info function
        info: () => {
          // Create the node
          const node = document.createElement("div");
          // Set the text content to
          // "Enter alias name inside double quotes"
          node.textContent = "Enter alias name inside double quotes";
          // Return the node
          return node;
        },
      });
    }
    // Push the from option to the options array
    options.push({
      label: "FROM",
      type: "keyword",
      apply: "FROM ",
      detail: "Specify table",
    });
    // Return the options
    return {
      from: word ? word.from : pos,
      options,
      validFor: /^(AS|FROM)$/i,
    };
  }
  // Return null
  return null;
};
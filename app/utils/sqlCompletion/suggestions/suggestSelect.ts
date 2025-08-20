import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

export const suggestSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Check if user is typing SELECT or partial SELECT (e.g., "s", "se")
  // 2. Verify no existing SELECT clause in AST
  // 3. If conditions met, suggest SELECT keyword
  // 4. Return null if no suggestions apply

  // Conditions:
  // - Either the query is empty or the user is typing something like "s", "se", or "select"
  // - AND there is no SELECT clause already in the parsed AST

  const isTypingSelect = !docText || /^s(el(ect)?)?$/i.test(currentWord);

  const hasNoSelectInAst =
    !ast ||
    (Array.isArray(ast)
      ? // If AST is an array of statements, none are SELECT
        ast.every((node: Select) => node.type !== "select")
      : // Or, if single AST node, it's not a SELECT
        ast.type !== "select");

  if (isTypingSelect && hasNoSelectInAst) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "SELECT",
          type: "keyword",
          apply: "SELECT ",
          detail: "Select data from a table",
        },
      ],
    };
  }

  return null;
};
import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

export const suggestSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // Conditions:
  // - Query is empty or user is typing something like "s", "se", "select", "w", "wi", "with"
  // - AND there is no SELECT or WITH clause already in the parsed AST or text
  const isTypingSelectOrWith =
    !docText || /^[sw](el(ect)?|i(th)?)?$/i.test(currentWord);
  const hasNoSelectOrWithInAst =
    !ast ||
    (Array.isArray(ast)
      ? ast.every((node: Select) => node.type !== "select" && !node.with)
      : ast.type !== "select" && !ast.with);
  const hasNoSelectOrWithInText = !/\b(SELECT|WITH)\b/i.test(docText);

  if (
    isTypingSelectOrWith &&
    hasNoSelectOrWithInAst &&
    hasNoSelectOrWithInText
  ) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "SELECT",
          type: "keyword",
          apply: "SELECT ",
          detail: "Select data from a table",
        },
        {
          label: "WITH",
          type: "keyword",
          apply: "WITH ",
          detail: "Define a Common Table Expression (CTE)",
        },
      ],
      filter: true,
      validFor: /^(SELECT|WITH)$/i,
    };
  }
  return null;
};
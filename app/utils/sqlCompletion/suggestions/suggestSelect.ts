import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";

export const suggestSelect = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  ast: Select | Select[] | null
): CompletionResult | null => {

  // Only suggest SELECT/WITH at query start (beginning or after semicolon)
  const isAtQueryStart = !docText.trim() || /;\s*$/.test(docText.substring(0, pos));

  // Set the is typing select or with to the
  // is typing select or with
  const isTypingSelectOrWith =
    // If the doc text is undefined or the
    // current word matches the regex
    !docText || /^[sw](el(ect)?|i(th)?)?$/i.test(currentWord);
  // Set the has no select or with in ast to the
  // has no select or with in ast
  const hasNoSelectOrWithInAst =
    // If the ast is undefined or the ast is an array
    !ast ||
    (Array.isArray(ast)
      // If the ast is an array, check if every node
      // is not a select and not a with
      ? ast.every((node: Select) => node.type !== "select" && !node.with)
      : ast.type !== "select" && !ast.with);
  // Set the has no select or with in text to the
  // has no select or with in text
  const hasNoSelectOrWithInText = !/\b(SELECT|WITH)\b/i.test(docText);

  if (
    isAtQueryStart &&
    isTypingSelectOrWith &&
    hasNoSelectOrWithInAst &&
    hasNoSelectOrWithInText
  ) {
    // Return the options
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
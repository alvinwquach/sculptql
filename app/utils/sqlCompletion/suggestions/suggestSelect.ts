import { CompletionResult } from "@codemirror/autocomplete";

// This function suggests the "SELECT" keyword when the user is starting a new SQL query.
export const suggestSelect = (
  docText: string, // The full current SQL text in the editor
  currentWord: string, // The current word the user is typing
  pos: number, // Current cursor position
  word: { from: number } | null, // The range of the current word
  ast: any // The parsed SQL Abstract Syntax Tree (AST)
): CompletionResult | null => {
  // === STEP 1: Check if we should suggest "SELECT" ===

  // Conditions:
  // - Either the query is empty or the user is typing something like "s", "se", or "select"
  // - AND there is no SELECT clause already in the parsed AST

  const isTypingSelect = !docText || /^s(el(ect)?)?$/i.test(currentWord);

  const hasNoSelectInAst =
    !ast ||
    (Array.isArray(ast)
      ? ast.every((node: any) => node.type !== "select") // If AST is an array of statements, none are SELECT
      : ast.type !== "select"); // Or, if single AST node, it's not a SELECT

  if (isTypingSelect && hasNoSelectInAst) {
    // === STEP 2: Suggest the SELECT keyword ===
    return {
      from: word ? word.from : pos, // Where the suggestion starts from
      options: [
        {
          label: "SELECT", // The text shown in the autocomplete dropdown
          type: "keyword", // Tells the UI it's a keyword
          apply: "SELECT ", // What gets inserted if the user chooses this suggestion
          detail: "Select data from a table", // Description shown in the autocomplete
        },
      ],
    };
  }

  // === STEP 3: Otherwise, don't suggest anything ===
  return null;
};

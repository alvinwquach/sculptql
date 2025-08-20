import { CompletionResult } from "@codemirror/autocomplete";

export const suggestLimitClause = (
  docText: string,
  pos: number,
  word: { from: number } | null,
  tableNames: string[]
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Extract table name from FROM clause using regex
  // 2. Validate table name against provided tableNames
  // 3. If after FROM, WHERE, or ORDER BY and no LIMIT, suggest LIMIT
  // 4. If after LIMIT with no number, suggest numeric values (1, 3, 5, etc.)
  // 5. Return null if no suggestions apply

  // Get the table name from the FROM clause using regex
  const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
  const selectedTable = fromMatch ? fromMatch[1] : null;

  // Ensure a valid table is present
  if (!selectedTable || !tableNames.includes(selectedTable)) {
    return null;
  }

  // Check if LIMIT (with or without a number) exists in the query
  const hasLimit = /\bLIMIT\b/i.test(docText);

  // Suggest LIMIT after FROM, WHERE, or ORDER BY (ASC/DESC) if no LIMIT exists
  const afterFromOrWhereOrOrderByRegex =
    /\b(FROM\s+\w+(\s+WHERE\s+[^;]*?)?(\s+ORDER\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(ASC|DESC)?)?\s*)$/i;
  if (!hasLimit && afterFromOrWhereOrOrderByRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "LIMIT",
          type: "keyword",
          apply: "LIMIT ",
          detail: "Limit the number of rows returned",
        },
      ],
      filter: true,
      validFor: /^LIMIT$/i,
    };
  }

  // Suggest numeric values after LIMIT, but only if no number follows LIMIT
  const afterLimitRegex = /\bLIMIT\s*(\d*)$/i;
  const hasNumberAfterLimit = /\bLIMIT\s+\d+\b/i.test(docText);
  if (afterLimitRegex.test(docText) && !hasNumberAfterLimit) {
    const limitSuggestions = [
      { label: "1", detail: "Limit to 1 row" },
      { label: "3", detail: "Limit to 3 rows" },
      { label: "5", detail: "Limit to 5 rows" },
      { label: "10", detail: "Limit to 10 rows" },
      { label: "25", detail: "Limit to 25 rows" },
      { label: "50", detail: "Limit to 50 rows" },
      { label: "100", detail: "Limit to 100 rows" },
    ];

    return {
      from: word ? word.from : pos,
      options: limitSuggestions.map((suggestion) => ({
        label: suggestion.label,
        type: "text",
        apply: suggestion.label,
        detail: suggestion.detail,
      })),
      filter: true,
      validFor: /^\d*$/,
    };
  }

  return null;
};
import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";
import { getAvailableColumns } from "./helpers";

export function getWhereCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  context: CompletionContext
): CompletionResult | null {
  // Set the after operator match to the after operator match
  const afterOperatorMatch = textBeforeCursor.match(
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|BETWEEN)\s*$/i
  );
  // If the after operator match is true
  if (afterOperatorMatch) {
    return {
      from: word ? word.from : pos,
      options: [
        { label: "'value'", type: "text", apply: "'value' ", detail: "String value" },
        { label: "0", type: "text", apply: "0 ", detail: "Numeric value" },
      ],
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Set the after column match to the after column match
  const afterColumnMatch = textBeforeCursor.match(
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*$/i
  );
  // If the after column match is true
  if (afterColumnMatch) {
    const operators = [
      { label: "=", apply: "= ", detail: "Equals" },
      { label: "!=", apply: "!= ", detail: "Not equals" },
      { label: ">", apply: "> ", detail: "Greater than" },
      { label: "<", apply: "< ", detail: "Less than" },
      { label: ">=", apply: ">= ", detail: "Greater than or equal" },
      { label: "<=", apply: "<= ", detail: "Less than or equal" },
      { label: "LIKE", apply: "LIKE ", detail: "Pattern matching" },
      { label: "IN", apply: "IN (", detail: "Value in list" },
      { label: "BETWEEN", apply: "BETWEEN ", detail: "Range of values" },
      { label: "IS NULL", apply: "IS NULL ", detail: "Check for null" },
      { label: "IS NOT NULL", apply: "IS NOT NULL ", detail: "Check for not null" },
    ];
    // Set the filtered operators to the filtered operators
    const filteredOperators = operators.filter((op) =>
      currentWord
        ? op.label.toLowerCase().startsWith(currentWord.toLowerCase())
        : true
    );
    // Return the options
    return {
      from: word ? word.from : pos,
      options: filteredOperators.map(op => ({ ...op, type: "keyword" })),
      filter: true,
      validFor: /^[=!><ILBiln]*$/i,
    };
  }

  // Set the after value match to the after value match
  const afterValueMatch = textBeforeCursor.match(
    /WHERE\s+[\w"']+\s*[=!><]+\s*["'\w]+\s*$/i
  );

  // If the after value match is true
  if (afterValueMatch) {
    // Set the keywords to the keywords array
    const keywords = [
      { label: "AND", type: "keyword", apply: "AND ", detail: "Logical AND" },
      { label: "OR", type: "keyword", apply: "OR ", detail: "Logical OR" },
      { label: "GROUP BY", type: "keyword", apply: "GROUP BY ", detail: "Group rows" },
      { label: "ORDER BY", type: "keyword", apply: "ORDER BY ", detail: "Sort results" },
      { label: "LIMIT", type: "keyword", apply: "LIMIT ", detail: "Limit results" }
    ];

    // Set the filtered keywords to the filtered keywords
    const filteredKeywords = keywords.filter((keyword) =>
      // If the current word is true
      currentWord
        ? keyword.label.toLowerCase().startsWith(currentWord.toLowerCase())
        : true
    );

    // Return the options
    return {
      from: word ? word.from : pos,
      options: filteredKeywords,
      filter: true,
      validFor: /^[\w\s]*$/,
    };
  }

  const options = [];

  const logicalOperators = [
    { label: "AND", apply: "AND ", detail: "Logical AND" },
    { label: "OR", apply: "OR ", detail: "Logical OR" },
  ];

  options.push(...logicalOperators);

  const availableColumns = getAvailableColumns(context);
  options.push(
    ...availableColumns.map((col) => ({
      label: col,
      type: "field",
      apply: context.needsQuotes(col) ? `"${col}"` : col,
      detail: "Column",
    }))
  );

  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^[\w"']*$/,
  };
}

import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";
import { getAvailableColumns, getExistingTablesFromQuery } from "./helpers";
import { getValidTablesForJoin } from "../getValidTables";

export function getJoinCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  context: CompletionContext
): CompletionResult | null {
  
  // Set the options to the options array empty
  const options = [];

  // Set the after join table match to the after join table match
  const afterJoinTableMatch = textBeforeCursor.match(
    /\b(?:INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*$/i
  );

  // If the after join table match is true
  if (afterJoinTableMatch) {
    const keywords = [
      { label: "ON", type: "keyword", apply: "ON ", detail: "Join condition" },
      { label: "AS", type: "keyword", apply: "AS ", detail: "Alias table" },
    ];

    // Set the filtered keywords to the filtered keywords
    const filteredKeywords = keywords.filter((keyword) =>
      currentWord
        ? keyword.label.toLowerCase().startsWith(currentWord.toLowerCase())
        : true
    );

    return {
      from: word ? word.from : pos,
      options: filteredKeywords,
      filter: true,
      validFor: /^[\w]*$/i,
    };
  }

  // Set the after on match to the after on match
  const afterOnMatch = textBeforeCursor.match(
    /\b(?:INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+[\w"']+\s+(?:AS\s+[\w]+\s+)?ON\s*$/i
  );

  // If the after on match is true
  if (afterOnMatch) {
    // Set the available columns to the available columns
    const availableColumns = getAvailableColumns(context);
    return {
      from: word ? word.from : pos,
      options: availableColumns.map((col) => ({
        label: col,
        type: "field",
        apply: context.needsQuotes(col) ? `"${col}"` : col,
        detail: "Column for join condition",
      })),
      filter: true,
      validFor: /^[\w"']*$/,
    };
  }

  // Set the join condition match to the join condition match
  const joinConditionMatch = textBeforeCursor.match(
    /\bON\s+[\w"'.]+\s*$/i
  );

  // If the join condition match is true
  if (joinConditionMatch) {
    return {
      from: word ? word.from : pos,
      options: [
        { label: "=", type: "keyword", apply: "= ", detail: "Equals" },
      ],
      filter: true,
      validFor: /^=$/,
    };
  }

  // Set the existing tables to the existing tables
  const existingTables = getExistingTablesFromQuery(textBeforeCursor, context.stripQuotes);

  // Set the compatible tables to the compatible tables
  const compatibleTables = getValidTablesForJoin(
    context.tableNames,
    context.tableColumns,
    existingTables
  );

  // Set the filtered tables to the filtered tables
  const filteredTables = compatibleTables.filter((table) =>
    // If the current word is true
    currentWord
      ? context.stripQuotes(table)
          .toLowerCase()
          .startsWith(context.stripQuotes(currentWord).toLowerCase())
      : true
  );

  // Push the filtered tables to the options
  options.push(
    ...filteredTables.map((table) => ({
      label: table,
      type: "table",
      apply: context.needsQuotes(table) ? `"${table}"` : table,
      detail: "Table to join",
    }))
  );

  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^[\w"']*$/,
  };
}

import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";
import { getValidTablesForColumns } from "../getValidTables";

export function getFromCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  context: CompletionContext
): CompletionResult | null {

  // Set the after table match to the after table match
  const afterTableMatch = textBeforeCursor.match(
    // If the after table match is true
    /\bFROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*$/i
  );

  // If the after table match is true
  if (afterTableMatch) {
    // Return the options
    return {
      from: word ? word.from : pos,
      options: [
        { label: "AS", type: "keyword", apply: "AS ", detail: "Alias table" },
        { label: "WHERE", type: "keyword", apply: "WHERE ", detail: "Filter rows" },
        { label: "INNER JOIN", type: "keyword", apply: "INNER JOIN ", detail: "Inner join" },
        { label: "LEFT JOIN", type: "keyword", apply: "LEFT JOIN ", detail: "Left join" },
        { label: "RIGHT JOIN", type: "keyword", apply: "RIGHT JOIN ", detail: "Right join" },
        { label: "CROSS JOIN", type: "keyword", apply: "CROSS JOIN ", detail: "Cross join" },
        { label: "GROUP BY", type: "keyword", apply: "GROUP BY ", detail: "Group rows" },
        { label: "ORDER BY", type: "keyword", apply: "ORDER BY ", detail: "Sort results" },
      ],
      filter: true,
      validFor: /^(AS|WHERE|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN|GROUP\s+BY|ORDER\s+BY)$/i,
    };
  }

  // Set the select match to the select match
  const selectMatch = textBeforeCursor.match(/\bSELECT\s+(DISTINCT\s+)?(.+?)\s+FROM/i);
  // Set the valid tables to the valid tables
  let validTables = context.tableNames;

  // If the select match is true and the select match has a 2
  if (selectMatch && selectMatch[2]) {
    // Set the columns text to the columns text
    const columnsText = selectMatch[2];
    // Set the selected columns to the selected columns
    const selectedColumns = columnsText
      .split(',')
      .map(col => {
        // Set the cleaned to the cleaned
        const cleaned = col.trim().replace(/^['"]|['"]$/g, '');
        // Set the aggr match to the aggr match
        const aggrMatch = cleaned.match(/(?:COUNT|SUM|AVG|MIN|MAX|ROUND)\s*\(\s*(?:DISTINCT\s+)?([^)]+)\s*\)/i);
        // If the aggr match is true
        if (aggrMatch) {
          return aggrMatch[1].trim().replace(/^['"]|['"]$/g, '');
        }
        // Return the cleaned
        return cleaned;
      })
      // Filter the selected columns by the col
      .filter(col => col && col !== '*');

    if (selectedColumns.length > 0) {
      // Set the valid tables to the valid tables
      validTables = getValidTablesForColumns(context.tableNames, context.tableColumns, selectedColumns);
    }
  }

  
  // Set the filtered tables to the filtered tables
  const filteredTables = validTables.filter((table) =>
    // If the current word is true
    currentWord
      ? context.stripQuotes(table)
          .toLowerCase()
          .startsWith(context.stripQuotes(currentWord).toLowerCase())
      : true
  );

  return {
    from: word ? word.from : pos,
    options: filteredTables.map((table) => ({
      label: table,
      type: "table",
      apply: context.needsQuotes(table) ? `"${table}"` : table,
      detail: "Table",
    })),
    filter: true,
    validFor: /^[\w"']*$/,
  };
}

export function getNeedFromCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  _textBeforeCursor: string,
  _context: CompletionContext
): CompletionResult | null {
  const keywords = [
    {
      label: "FROM",
      type: "keyword",
      apply: "FROM ",
      detail: "Specify table to select from",
    },
    {
      label: ",",
      type: "keyword",
      apply: ", ",
      detail: "Add another column",
    },
    {
      label: "AS",
      type: "keyword",
      apply: "AS ",
      detail: "Alias column",
    },
  ];

  // Set the filtered keywords to the filtered keywords
  const filteredKeywords = keywords.filter((keyword) =>
    // If the current word is true
    currentWord
      ? keyword.label.toLowerCase().startsWith(currentWord.toLowerCase())
      : true
  );

  return {
    from: word ? word.from : pos,
    options: filteredKeywords,
    filter: true,
    validFor: /^[\w,]*$/i,
  };
}

export function getAfterFromCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  _textBeforeCursor: string,
  _context: CompletionContext
): CompletionResult | null {
  const keywords = [
    { label: "WHERE", apply: "WHERE ", detail: "Filter rows" },
    { label: "GROUP BY", apply: "GROUP BY ", detail: "Group rows" },
    { label: "ORDER BY", apply: "ORDER BY ", detail: "Sort results" },
    { label: "LIMIT", apply: "LIMIT ", detail: "Limit number of rows" },
    { label: "JOIN", apply: "JOIN ", detail: "Join with another table" },
    { label: "INNER JOIN", apply: "INNER JOIN ", detail: "Inner join" },
    { label: "LEFT JOIN", apply: "LEFT JOIN ", detail: "Left join" },
    { label: "RIGHT JOIN", apply: "RIGHT JOIN ", detail: "Right join" },
    { label: "CROSS JOIN", apply: "CROSS JOIN ", detail: "Cross join" },
    { label: "UNION", apply: "UNION ", detail: "Combine results" },
    {
      label: "UNION ALL",
      apply: "UNION ALL ",
      detail: "Combine all results",
    },
  ];
  // Set the filtered keywords to the filtered keywords
  const filteredKeywords = keywords.filter((keyword) =>
    // If the current word is true
    currentWord
      ? keyword.label.toLowerCase().startsWith(currentWord.toLowerCase())
      : true
  );

  return {
    from: word ? word.from : pos,
    options: filteredKeywords.map((opt) => ({
      ...opt,
      type: "keyword",
    })),
    filter: true,
    validFor: /^[\w\s]*$/,
  };
}

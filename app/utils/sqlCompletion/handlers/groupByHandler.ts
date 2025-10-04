import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";
import { getAvailableColumns } from "./helpers";

export function getGroupByCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  context: CompletionContext
): CompletionResult | null {
  // Set the options to the options array empty
  const options = [];
  // Set the group by match to the group by match
  const groupByMatch = textBeforeCursor.match(/GROUP\s+BY\s+(.+?)(?:\s+HAVING|\s+ORDER|\s+LIMIT|$)/i);
  // Set the already selected columns to the already selected columns array empty
  const alreadySelectedColumns: string[] = [];

  // If the group by match is true
  if (groupByMatch) {
    // Set the group by part to the group by part
    const groupByPart = groupByMatch[1];
    // Set the column matches to the column matches array empty
    const columnMatches = groupByPart.match(/(?:"[\w]+"|'[\w]+'|[\w_]+)/gi);
    // If the column matches is true
    if (columnMatches) {
      // Loop through the column matches
      columnMatches.forEach((match) => {
        // Set the col match to the col match
        const colMatch = match.match(/^(?:"([\w]+)"|'([\w]+)'|([\w_]+))/i);
        // If the col match is true
        if (colMatch) {
          // Set the column name to the column name
          const columnName = colMatch[1] || colMatch[2] || colMatch[3];
          // If the column name is true and the column name is not a comma
          if (columnName && columnName !== ',') {
            // Push the column name to the already selected columns
            alreadySelectedColumns.push(columnName.toLowerCase());
          }
        }
      });
    }
  }

  // Set the after column match to the after column match
  const afterColumnMatch = textBeforeCursor.match(
    // If the after column match is true
    /GROUP\s+BY\s+.*?(?:"[\w]+"|'[\w]+'|[\w_]+)\s*$/i
  );

  // If the after column match is true and the text before cursor does not end with a comma
  if (afterColumnMatch && !/,\s*$/i.test(textBeforeCursor)) {
    // Set the keywords to the keywords array
    const keywords = [
      { label: ",", type: "keyword", apply: ", ", detail: "Add another column" },
      { label: "HAVING", type: "keyword", apply: "HAVING ", detail: "Filter groups" },
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

    return {
      from: word ? word.from : pos,
      options: filteredKeywords,
      filter: true,
      validFor: /^[\w,\s]*$/i,
    };
  }

  // Set the after comma match to the after comma match
  const afterCommaMatch = textBeforeCursor.match(/GROUP\s+BY\s+.*,\s*$/i);

  // If the after comma match is true or the text before cursor ends with a group by
  if (afterCommaMatch || /GROUP\s+BY\s*$/i.test(textBeforeCursor)) {
    // Set the available columns to the available columns
    const availableColumns = getAvailableColumns(context).filter(
      (col) => !alreadySelectedColumns.includes(col.toLowerCase())
    );

    // Push the available columns to the options
    options.push(
      ...availableColumns.map((col) => ({
        label: col,
        type: "field",
        apply: context.needsQuotes(col) ? `"${col}"` : col,
        detail: "Group by column",
      }))
    );

    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^[\w"']*$/,
    };
  }

  // Set the available columns to the available columns
  const availableColumns = getAvailableColumns(context).filter(
    // If the already selected columns does not include the column
    (col) => !alreadySelectedColumns.includes(col.toLowerCase())
  );

  return {
    from: word ? word.from : pos,
    options: availableColumns.map((col) => ({
      label: col,
      type: "field",
      apply: context.needsQuotes(col) ? `"${col}"` : col,
      detail: "Group by column",
    })),
    filter: true,
    validFor: /^[\w"']*$/,
  };
}

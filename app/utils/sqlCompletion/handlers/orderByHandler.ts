import { CompletionResult } from "@codemirror/autocomplete";
import { CompletionContext } from "./types";
import { getAvailableColumns } from "./helpers";

export function getOrderByCompletion(
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  context: CompletionContext
): CompletionResult | null {
  // Set the options to the options array empty
  const options = [];
  // Set the order by match to the order by match
  const orderByMatch = textBeforeCursor.match(/ORDER\s+BY\s+(.+)$/i);
  // Set the already selected columns to the already selected columns array empty
  const alreadySelectedColumns: string[] = [];
  // If the order by match is true
  if (orderByMatch) {
    // Set the order by part to the order by part
    const orderByPart = orderByMatch[1];
    // Set the column matches to the column matches array empty
    const columnMatches = orderByPart.match(/(?:"[\w]+"|'[\w]+'|[\w_]+)(?:\s+(?:ASC|DESC))?/gi);
    // If the column matches is true
    if (columnMatches) {
      // Loop through the column matches
      columnMatches.forEach((match) => {
        // Set the col match to the col match
        const colMatch = match.match(/^(?:"([\w]+)"|'([\w]+)'|([\w_]+))/i);
        if (colMatch) {
          // Set the column name to the column name
          const columnName = colMatch[1] || colMatch[2] || colMatch[3];
          // Push the column name to the already selected columns
          alreadySelectedColumns.push(columnName.toLowerCase());
        }
      });
    }
  }

  // Set the after column match to the after column match
  const afterColumnMatch = textBeforeCursor.match(
    /ORDER\s+BY\s+.*?(?:"[\w]+"|'[\w]+'|[\w_]+)\s*$/i
  );
  // If the after column match is true and the text before cursor 
  // does not end with a direction
  if (afterColumnMatch && !/\s+(ASC|DESC)\s*$/i.test(textBeforeCursor)) {
    // Push the options to the options
    options.push(
      { label: "ASC", type: "keyword", apply: "ASC ", detail: "Ascending order" },
      { label: "DESC", type: "keyword", apply: "DESC ", detail: "Descending order" },
      { label: ",", type: "keyword", apply: ", ", detail: "Add another column" },
      { label: "LIMIT", type: "keyword", apply: "LIMIT ", detail: "Limit results" }
    );

    // Return the options
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(ASC|DESC|,|LIMIT)$/i,
    };
  }

  // Set the after direction match to the after direction match
  const afterDirectionMatch = textBeforeCursor.match(
    /ORDER\s+BY\s+.*?(?:"[\w]+"|'[\w]+'|[\w_]+)\s+(ASC|DESC)\s*$/i
  );
  // If the after direction match is true
  if (afterDirectionMatch) {
    // Push the options to the options
    options.push(
      { label: ",", type: "keyword", apply: ", ", detail: "Add another column" },
      { label: "LIMIT", type: "keyword", apply: "LIMIT ", detail: "Limit results" }
    );

    // Return the options
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(,|LIMIT)$/i,
    };
  }

  // Set the after comma match to the after comma match
  const afterCommaMatch = textBeforeCursor.match(/ORDER\s+BY\s+.*,\s*$/i);
  // If the after comma match is true or the text before cursor ends with a order by

  if (afterCommaMatch || /ORDER\s+BY\s*$/i.test(textBeforeCursor)) {
    // Set the available columns to the available columns
    const availableColumns = getAvailableColumns(context).filter(
      // If the already selected columns does not include the column
      (col) => !alreadySelectedColumns.includes(col.toLowerCase())
    );

    // Push the available columns to the options
    options.push(
      ...availableColumns.map((col) => ({
        label: col,
        type: "field",
        apply: context.needsQuotes(col) ? `"${col}"` : col,
        detail: "Order by column",
      }))
    );

    // Return the options
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

  // Push the available columns to the options
  options.push(
    ...availableColumns.map((col) => ({
      label: col,
      type: "field",
      apply: context.needsQuotes(col) ? `"${col}"` : col,
      detail: "Order by column",
    }))
  );

  // Return the options
  return {
    from: word ? word.from : pos,
    options,
    filter: true,
    validFor: /^[\w"']*$/,
  };
}

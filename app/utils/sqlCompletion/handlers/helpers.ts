import { CompletionContext } from "./types";

export function getAvailableColumns(context: CompletionContext): string[] {
  
  // Set the columns to the columns array empty
  const columns = [];
// Loop through the context table names
  for (const tableName of context.tableNames) {
    // If the context table columns has the table name
    if (context.tableColumns[tableName]) {
      // Push the context table columns to the columns
      columns.push(...context.tableColumns[tableName]);
    }
  }

  return [...new Set(columns)];
}

export function getSelectedTable(textBeforeCursor: string): string | null {
  const fromMatch = textBeforeCursor.match(/\bFROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i);
  return fromMatch ? fromMatch[1] : null;
}

export function getExistingTablesFromQuery(textBeforeCursor: string, stripQuotes: (s: string) => string): string[] {
  const tables: string[] = [];

  const fromMatch = textBeforeCursor.match(/\bFROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i);
  if (fromMatch) {
    tables.push(stripQuotes(fromMatch[1]));
  }

  const joinRegex = /\b(?:INNER|LEFT|RIGHT|CROSS|FULL)\s+(?:OUTER\s+)?JOIN\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/gi;
  let joinMatch;
  while ((joinMatch = joinRegex.exec(textBeforeCursor)) !== null) {
    tables.push(stripQuotes(joinMatch[1]));
  }

  return tables;
}

import { TableSchema } from "../../types/query";

// Function to get all columns from schema
export function getAllColumns(schema: TableSchema[]) {
  // Set the columns to an empty array
  const columns: Array<{ column_name: string; data_type: string }> = [];
  // Loop through the schema
  schema.forEach(table => {
    // If the table has columns
    if (table.columns) {
      // Loop through the columns
      table.columns.forEach(column => {
        // Push the column name and data type to the columns array
        columns.push({
          column_name: column.column_name,
          data_type: column.data_type
        });
      });
    }
  });
  // Return the columns
  return columns;
}

// Function to get valid table names from schema
export function getValidTables(schema: TableSchema[]): string[] {
  // Map the schema to the table names and filter out any empty names
  return schema
    .map(table => table.table_name)
    .filter(name => name && name.trim() !== '');
}

// Function to check if a value needs quotes
export function needsQuotes(value: string): boolean {
  if (!value) return false;
  // Check if it's just whitespace
  if (value.trim() === '') return false;
  // Check if it's a number
  if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
    return false;
  }
  // Check if it's a boolean
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return false;
  }
  // Check if it's null
  if (value.toLowerCase() === 'null') {
    return false;
  }
  // Return true
  return true;
}

// Function to strip quotes from a string
export function stripQuotes(value: string): string {
  // If the value is undefined, return the value
  if (!value) return value;
  // If the value starts with a double quote and ends with a double quote
  if (value.startsWith('"') && value.endsWith('"')) {
    // Remove the double quotes and replace double quotes with single quotes
    return value.slice(1, -1).replace(/""/g, '"');
  }
  // If the value starts with a single quote and ends with a single quote
  if (value.startsWith("'") && value.endsWith("'")) {
    // Remove the single quotes and replace single quotes with double quotes
    return value.slice(1, -1).replace(/''/g, "'");
  }
  // Return the value
  return value;
}

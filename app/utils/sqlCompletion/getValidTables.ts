import { TableColumn } from "@/app/types/query";

// Get valid tables from the table names and table columns
export const getValidTables = (
   tableNames: string[],
   tableColumns: TableColumn,
   selectedColumn: string | null
 ): string[] => {
   // If no column is selected, return all table names
   if (!selectedColumn) return tableNames;

   // Return the filtered table names
   return tableNames
     // Filter the table names by the table columns
     .filter((tableName) =>
       // Check if the table columns has the table name
       tableColumns[tableName]?.some(
         // Check if the column name is the same as the selected column
         (col) => col.toLowerCase() === selectedColumn.toLowerCase()
       )
     )
     // Sort the table names
     .sort();
 };

// Get valid tables that contain ALL selected columns
export const getValidTablesForColumns = (
  tableNames: string[],
  tableColumns: TableColumn,
  selectedColumns: string[]
): string[] => {
  // If no columns selected, return all tables
  if (!selectedColumns || selectedColumns.length === 0) {
    return tableNames;
  }

  // Clean and normalize column names
  const cleanColumns = selectedColumns
    .map((col) => {
      // Remove quotes and trim whitespace
      let clean = col.trim().replace(/^['"]|['"]$/g, '');
      
      const aggrMatch = clean.match(/(?:COUNT|SUM|AVG|MIN|MAX|ROUND)\s*\(\s*(?:DISTINCT\s+)?([^)]+)\s*\)/i);
      // If the column is an aggregate function, 
      // extract the column name
      if (aggrMatch) {
        clean = aggrMatch[1].trim().replace(/^['"]|['"]$/g, '');
      }
      // Return the clean column
      return clean;
    })
    // Filter out any columns that are empty or the wildcard
    .filter((col) => col && col !== '*'); 

  // If no valid columns after cleaning
  if (cleanColumns.length === 0) {
    // Return all tables
    return tableNames;
  }

  // Return tables that contain ALL selected columns
  return tableNames
    .filter((tableName) => {
      // Get the table columns list
      const tableColumnsList = tableColumns[tableName] || [];
      // Get the table columns list in lowercase
      const tableColumnsLower = tableColumnsList.map((c) => c.toLowerCase());

      // Return true if the table has all the selected columns
      return cleanColumns.every((selectedCol) =>
        // Check if the table columns list in lowercase 
        // includes the selected column in lowercase
        tableColumnsLower.includes(selectedCol.toLowerCase())
      );
    })
    // Sort the tables
    .sort();
};

// Get valid tables for join 
// based on tables already in the query
// and columns that are already in the query
export const getValidTablesForJoin = (
  tableNames: string[],
  tableColumns: TableColumn,
  existingTables: string[]
): string[] => {
  // If no existing tables, return empty array
  if (!existingTables.length) return [];

  // Get all columns from existing tables
  const existingColumns = new Set<string>();
  // Add the columns from the existing tables to the set
  existingTables.forEach((table) => {
    // Get the columns from the table
    const columns = tableColumns[table] || [];
    // Add the columns to the set
    columns.forEach((col) => existingColumns.add(col.toLowerCase()));
  });
// Return tables that share at least one column with existing tables
  return tableNames
    .filter((tableName) => {
      // Exclude tables already in the query
      if (existingTables.includes(tableName)) return false;

      // Check if this table has any column that matches existing tables
      const columns = tableColumns[tableName] || [];
      return columns.some((col) => existingColumns.has(col.toLowerCase()));
    })
    // Sort the tables
    .sort();
};

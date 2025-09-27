import { TableColumn } from "@/app/types/query";

// Get all columns from the table names and table columns
export const getAllColumns = (
   tableNames: string[],
   tableColumns: TableColumn
 ): string[] => {
   // Create a set of all columns to avoid duplicates
   const allColumns = new Set<string>();

   // For each table name
   for (const tableName of tableNames) {
     // If the table columns has the table name
     if (tableColumns[tableName]) {
       // For each column in the table columns
       tableColumns[tableName].forEach((column) => allColumns.add(column));
     }
   }
   // Return the all columns sorted
   return Array.from(allColumns).sort();
 };
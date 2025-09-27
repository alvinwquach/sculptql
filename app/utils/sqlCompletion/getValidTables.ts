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

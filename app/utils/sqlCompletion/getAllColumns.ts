import { TableColumn } from "@/app/types/query";

/**
 * getAllColumns
 *
 * Purpose:
 *  - Collect and return every column across all provided tables.
 *
 * Steps:
 *  1. Create a set (to avoid duplicate column names).
 *  2. For each table:
 *     - Check if the table has any columns.
 *     - If yes, add each column to the set.
 *  3. Convert the set into a sorted array and return it.
 */
 export const getAllColumns = (
   tableNames: string[],
   tableColumns: TableColumn
 ): string[] => {
   const allColumns = new Set<string>();

   for (const tableName of tableNames) {
     if (tableColumns[tableName]) {
       tableColumns[tableName].forEach((column) => allColumns.add(column));
     }
   }

   return Array.from(allColumns).sort();
 };
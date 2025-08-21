import { TableColumn } from "@/app/types/query";

/**
 * getValidTables
 *
 * Purpose:
 *  - Given a list of table names and their columns,
 *    return only the tables that contain the selected column.
 *
 * Steps:
 *  1. If no column is selected, return all table names.
 *  2. Otherwise, check each table:
 *     - Look at its list of columns.
 *     - If any column matches the selected column (case-insensitive),
 *       keep that table.
 *  3. Return the filtered table names, sorted alphabetically.
 */
 export const getValidTables = (
   tableNames: string[],
   tableColumns: TableColumn,
   selectedColumn: string | null
 ): string[] => {
   if (!selectedColumn) return tableNames;

   return tableNames
     .filter((tableName) =>
       tableColumns[tableName]?.some(
         (col) => col.toLowerCase() === selectedColumn.toLowerCase()
       )
     )
     .sort();
 };

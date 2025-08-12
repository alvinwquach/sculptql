import { TableColumn } from "@/app/types/query";

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

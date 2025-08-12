import { TableColumn } from "@/app/types/query";

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

import { TableSchema } from "@/app/types/query";

export function filterSchema(
  schema: TableSchema[],
  tableSearch: string,
  columnSearch: string
): TableSchema[] {
  let filtered = schema;
  if (tableSearch) {
    const lowerTableTerm = tableSearch.toLowerCase();
    filtered = filtered.filter((table) =>
      table.table_name.toLowerCase().includes(lowerTableTerm)
    );
  }
  if (columnSearch) {
    const lowerColumnTerm = columnSearch.toLowerCase();
    filtered = filtered
      .map((table) => ({
        ...table,
        columns: table.columns.filter(
          (column) =>
            column.column_name.toLowerCase().includes(lowerColumnTerm) ||
            column.data_type.toLowerCase().includes(lowerColumnTerm) ||
            (column.is_primary_key && "primary".includes(lowerColumnTerm)) ||
            (table.foreign_keys.some(
              (fk) => fk.column_name === column.column_name
            ) &&
              "foreign".includes(lowerColumnTerm))
        ),
      }))
      .filter((table) => table.columns.length > 0);
  }
  return filtered;
}

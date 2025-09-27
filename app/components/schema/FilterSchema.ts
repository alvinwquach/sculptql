import { TableSchema } from "@/app/types/query";

export function filterSchema(
  schema: TableSchema[],
  tableSearch: string,
  columnSearch: string
): TableSchema[] {
  // Set the filtered to the schema
  let filtered = schema;
  // If the table search
  if (tableSearch) {
    // Create the lower table term by the table search and the to lowercase
    const lowerTableTerm = tableSearch.toLowerCase();
    // Filter the filtered by the table name and the lower table term
    filtered = filtered.filter((table) =>
      // Append the table name and the to lowercase and the includes the lower table term
      table.table_name.toLowerCase().includes(lowerTableTerm)
    );
  }
  // If the column search
  if (columnSearch) {
    // Create the lower column term by the column search and the to lowercase
    const lowerColumnTerm = columnSearch.toLowerCase();
    filtered = filtered
      .map((table) => ({
        ...table,
        // Filter the columns by the column name and the data type and the primary key and the lower column term
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
      // Filter the filtered by the table columns length greater than 0
      .filter((table) => table.columns.length > 0);
  }
  // Return the filtered
  return filtered;
}

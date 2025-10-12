"use client";

import { useMemo } from "react";
import { TableSchema, SelectOption, TableDescription } from "@/app/types/query";

// Interface for the computed values
export interface ComputedValues {
  tableNames: string[];
  tableColumns: Record<string, string[]>;
  table: TableSchema[];
  tableDescription: TableDescription | null;
}

export function useComputedValues(
  schema: TableSchema[],
  selectedTable: SelectOption | null
): ComputedValues {
  // Get the table names from the schema
  const tableNames = useMemo(() => schema.map((table) => table.table_name), [schema]);
  
  // Get the table columns from the schema
  const tableColumns = useMemo(() => {
          // Reduce the schema to the table columns
    return schema.reduce((acc, table) => {
      // Add the table columns to the accumulator
      acc[table.table_name] = table.columns.map((col) => col.column_name);
      // Return the accumulator
      return acc;
      // Return the accumulator
    }, {} as Record<string, string[]>);
  }, [schema]);

  // Get the table from the schema
  const table = useMemo(() => {
    // Get the selected table name
    const selectedTableName = selectedTable?.value || "";
    // Return the table from the schema
    return schema.filter((t) => t.table_name === selectedTableName);
  }, [schema, selectedTable]);
  // Get the table description from the schema
  const tableDescription = useMemo(() => {
    // Get the selected table name
    const selectedTableName = selectedTable?.value || "";
    // Get the selected table from the schema
    const selected = schema.find((t) => t.table_name === selectedTableName);
    // If the selected table is not found, return null
    if (!selected) return null;

    return {
      table_name: selected.table_name,
      columns: selected.columns.map((col) => ({
        column_name: col.column_name,
        data_type: col.data_type,
        is_nullable: col.is_nullable,
        column_default: col.column_default,
        is_primary_key: col.is_primary_key,
        is_indexed: col.is_indexed,
        index_names: col.index_names,
      })),
      primary_keys: selected.primary_keys || [],
      foreign_keys: selected.foreign_keys || [],
    };
  }, [schema, selectedTable]);

  return {
    tableNames,
    tableColumns,
    table,
    tableDescription,
  };
}

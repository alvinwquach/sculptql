"use client";

import { useMemo } from "react";
import { TableSchema, SelectOption, TableDescription } from "@/app/types/query";

// Interface for the computed values
export interface ComputedValues {
  tableNames: string[];
  tableColumns: Record<string, string[]>;
  uniqueValues: Record<string, SelectOption[]>;
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

  // Get the unique values from the schema
  const uniqueValues = useMemo(() => {
    // Reduce the schema to the unique values
    return schema.reduce((acc: Record<string, SelectOption[]>, table) => {

      // For each column in the table
      table.columns.forEach((col) => {
        // Add the unique values to the accumulator
        acc[`${table.table_name}.${col.column_name}`] =
          // If the values are not null and the values is an array
          table.values && Array.isArray(table.values)
            ? [
                // Create a new set of unique values
                ...new Set(
                  // Map the values to the unique values
                  table.values
                    // For each row in the table
                    .map((row: Record<string, string | number | null>) => {
                      // Get the value from the row
                      const value = row[col.column_name] ?? "";
                      // Return the value
                      return {
                        value: String(value),
                        label: String(value),
                      };
                    })
                    // Filter the unique values to remove the empty values
                    .filter((v: SelectOption) => v.value !== "")
                    // Map the unique values to the unique values
                    .map((v: SelectOption) => v.value)
                ),
                // Map the unique values to the unique values
              ].map((value) => ({ value, label: value }))
            : [
                // Provide fallback options when no data is available
                { value: "'value'", label: "'value'" },
                { value: "'text'", label: "'text'" },
                { value: "1", label: "1" },
                { value: "0", label: "0" },
                { value: "true", label: "true" },
                { value: "false", label: "false" },
                { value: "NULL", label: "NULL" },
                { value: "'%'", label: "'%' (LIKE wildcard)" },
                { value: "'_'", label: "'_' (LIKE single char)" },
                ...(col.data_type?.toLowerCase().includes('int') || col.data_type?.toLowerCase().includes('number') ? [
                  { value: "1", label: "1" },
                  { value: "0", label: "0" },
                  { value: "-1", label: "-1" },
                  { value: "100", label: "100" },
                  { value: "1000", label: "1000" },
                ] : []),
                ...(col.data_type?.toLowerCase().includes('varchar') || col.data_type?.toLowerCase().includes('text') || col.data_type?.toLowerCase().includes('char') ? [
                  { value: "'example'", label: "'example'" },
                  { value: "'test'", label: "'test'" },
                  { value: "'sample'", label: "'sample'" },
                  { value: "'data'", label: "'data'" },
                  { value: "'value'", label: "'value'" },
                ] : []),
                ...(col.data_type?.toLowerCase().includes('date') || col.data_type?.toLowerCase().includes('time') ? [
                  { value: "'2024-01-01'", label: "'2024-01-01'" },
                  { value: "'2023-12-31'", label: "'2023-12-31'" },
                  { value: "CURRENT_DATE", label: "CURRENT_DATE" },
                  { value: "NOW()", label: "NOW()" },
                ] : []),
                ...(col.data_type?.toLowerCase().includes('bool') || col.data_type?.toLowerCase().includes('bit') ? [
                  { value: "true", label: "true" },
                  { value: "false", label: "false" },
                  { value: "1", label: "1" },
                  { value: "0", label: "0" },
                ] : []),
                ...(col.data_type?.toLowerCase().includes('decimal') || col.data_type?.toLowerCase().includes('float') || col.data_type?.toLowerCase().includes('double') ? [
                  { value: "1.0", label: "1.0" },
                  { value: "0.0", label: "0.0" },
                  { value: "100.5", label: "100.5" },
                  { value: "-1.5", label: "-1.5" },
                ] : []),
              ];
      });
      // Return the accumulator
      return acc;
    }, {} as Record<string, SelectOption[]>);
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
        uniqueValues: col.uniqueValues,
      })),
      primary_keys: selected.primary_keys || [],
      foreign_keys: selected.foreign_keys || [],
    };
  }, [schema, selectedTable]);

  return {
    tableNames,
    tableColumns,
    uniqueValues,
    table,
    tableDescription,
  };
}

import { TableSchema, ForeignKeySchema } from "@/app/types/query";

/**
 * Result of join validation
 */
export interface JoinValidationResult {
  isValid: boolean;
  error?: string;
  suggestedColumns?: {
    column1: string;
    column2: string;
  };
}

/**
 * Get all valid join options for a table based on foreign key relationships
 */
export function getValidJoinTables(
  schema: TableSchema[],
  selectedTable: string
): string[] {
  const table = schema.find((t) => t.table_name === selectedTable);
  if (!table) return [];

  const validTables = new Set<string>();

  // Tables this table has foreign keys to
  table.foreign_keys.forEach((fk) => {
    validTables.add(fk.referenced_table);
  });

  // Tables that have foreign keys to this table
  schema.forEach((otherTable) => {
    if (otherTable.table_name === selectedTable) return;
    otherTable.foreign_keys.forEach((fk) => {
      if (fk.referenced_table === selectedTable) {
        validTables.add(otherTable.table_name);
      }
    });
  });

  return Array.from(validTables);
}

/**
 * Get suggested column pairs for joining two tables based on foreign keys
 */
export function getSuggestedJoinColumns(
  schema: TableSchema[],
  table1: string,
  table2: string
): Array<{ column1: string; column2: string; constraintName: string }> {
  const t1 = schema.find((t) => t.table_name === table1);
  const t2 = schema.find((t) => t.table_name === table2);

  if (!t1 || !t2) return [];

  const suggestions: Array<{
    column1: string;
    column2: string;
    constraintName: string;
  }> = [];

  // Check if table1 has FK to table2
  t1.foreign_keys.forEach((fk) => {
    if (fk.referenced_table === table2) {
      suggestions.push({
        column1: fk.column_name,
        column2: fk.referenced_column,
        constraintName: fk.constraint_name,
      });
    }
  });

  // Check if table2 has FK to table1
  t2.foreign_keys.forEach((fk) => {
    if (fk.referenced_table === table1) {
      suggestions.push({
        column1: fk.referenced_column,
        column2: fk.column_name,
        constraintName: fk.constraint_name,
      });
    }
  });

  return suggestions;
}

/**
 * Validate if a join between two tables on specific columns is valid
 * based on foreign key relationships
 */
export function validateJoin(
  schema: TableSchema[],
  table1: string,
  table2: string,
  column1?: string | null,
  column2?: string | null,
  enforceFK: boolean = true
): JoinValidationResult {
  // Basic validation
  if (!table1 || !table2) {
    return {
      isValid: false,
      error: "Both tables must be selected",
    };
  }

  if (table1 === table2) {
    return {
      isValid: false,
      error: "Cannot join a table with itself",
    };
  }

  const t1 = schema.find((t) => t.table_name === table1);
  const t2 = schema.find((t) => t.table_name === table2);

  if (!t1 || !t2) {
    return {
      isValid: false,
      error: "One or both tables not found in schema",
    };
  }

  // If columns not specified, check if tables CAN be joined
  if (!column1 || !column2) {
    if (enforceFK) {
      const suggestions = getSuggestedJoinColumns(schema, table1, table2);
      if (suggestions.length === 0) {
        return {
          isValid: false,
          error: `No foreign key relationship exists between ${table1} and ${table2}`,
        };
      }
      return {
        isValid: true,
        suggestedColumns: suggestions[0],
      };
    }
    return { isValid: true };
  }

  // Validate columns exist
  const t1Column = t1.columns.find((c) => c.column_name === column1);
  const t2Column = t2.columns.find((c) => c.column_name === column2);

  if (!t1Column) {
    return {
      isValid: false,
      error: `Column ${column1} not found in table ${table1}`,
    };
  }

  if (!t2Column) {
    return {
      isValid: false,
      error: `Column ${column2} not found in table ${table2}`,
    };
  }

  // If enforcing FK relationships, check if this is a valid FK join
  if (enforceFK) {
    const isValidFK =
      t1.foreign_keys.some(
        (fk) =>
          fk.column_name === column1 &&
          fk.referenced_table === table2 &&
          fk.referenced_column === column2
      ) ||
      t2.foreign_keys.some(
        (fk) =>
          fk.column_name === column2 &&
          fk.referenced_table === table1 &&
          fk.referenced_column === column1
      );

    if (!isValidFK) {
      const suggestions = getSuggestedJoinColumns(schema, table1, table2);
      return {
        isValid: false,
        error: `No foreign key relationship exists between ${table1}.${column1} and ${table2}.${column2}`,
        suggestedColumns: suggestions[0],
      };
    }
  }

  // Check data type compatibility (basic check)
  if (t1Column.data_type !== t2Column.data_type) {
    return {
      isValid: false,
      error: `Column types do not match: ${table1}.${column1} (${t1Column.data_type}) vs ${table2}.${column2} (${t2Column.data_type})`,
    };
  }

  return { isValid: true };
}

/**
 * Check if a table has any foreign key relationships
 */
export function hasAnyForeignKeys(
  schema: TableSchema[],
  tableName: string
): boolean {
  const table = schema.find((t) => t.table_name === tableName);
  if (!table) return false;

  // Has outgoing foreign keys
  if (table.foreign_keys.length > 0) return true;

  // Has incoming foreign keys
  return schema.some((t) =>
    t.foreign_keys.some((fk) => fk.referenced_table === tableName)
  );
}

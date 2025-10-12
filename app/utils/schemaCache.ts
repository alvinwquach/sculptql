import { TableSchema, ApiTableSchema } from "@/app/types/query";

interface SchemaCacheEntry {
  schema: TableSchema[];
  timestamp: number;
  apiSchema?: ApiTableSchema[];
}

// Class for the schema cache manager
class SchemaCacheManager {
  // Private cache property
  private cache = new Map<string, SchemaCacheEntry>();
  // Private cache duration property
  // 5 minutes
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  // Private generate key method
  private generateKey(tableSearch?: string, columnSearch?: string): string {
    // Return the schema key
    return `schema-${tableSearch || ""}-${columnSearch || ""}`;
  }

  // Get method for the schema cache
  get(tableSearch?: string, columnSearch?: string): TableSchema[] | null {
    // Generate the key
    const key = this.generateKey(tableSearch, columnSearch);
    // Get the entry from the cache
    const entry = this.cache.get(key);
    // If the entry is not found, return null
    if (!entry) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      // Delete the entry from the cache
      this.cache.delete(key);
      return null;
    }

    // Return the cached schema
    return entry.schema;
  }

  // Set method for the schema cache
  set(
    schema: TableSchema[],
    tableSearch?: string,
    columnSearch?: string
  ): void {
    // Generate the key
    const key = this.generateKey(tableSearch, columnSearch);
    // Set the entry in the cache
    this.cache.set(key, {
      schema,
      timestamp: Date.now(),
    });
  }

  // Clear method for the schema cache
  clear(): void {
    // Clear the cache
    this.cache.clear();
  }

  // Get all cached schemas
  getAllCachedSchemas(): Array<{ key: string; entry: SchemaCacheEntry }> {
    // Get the current time
    const now = Date.now();
    // Create the valid entries array
    const validEntries: Array<{ key: string; entry: SchemaCacheEntry }> = [];
    // Iterate over the cache entries
    for (const [key, entry] of this.cache.entries()) {
      // If the entry is not expired, add it to the valid entries
      if (now - entry.timestamp <= this.CACHE_DURATION) {
        // Add the entry to the valid entries
        validEntries.push({ key, entry });
      } else {
        // Delete the entry from the cache
        this.cache.delete(key);
      }
    }

    return validEntries;
  }

  // Find a compatible schema cache entry
  findCompatible(
    tableSearch?: string,
    columnSearch?: string
  ): TableSchema[] | null {
    const compatibleEntries = this.getAllCachedSchemas();

    // If the compatible entries length is greater than 0
    if (compatibleEntries.length > 0) {
      // Return the most recent compatible entry
      const mostRecent = compatibleEntries.sort(
        (a, b) => b.entry.timestamp - a.entry.timestamp
      )[0];
      // Return the most recent compatible entry
      return mostRecent.entry.schema;
    }
    // Return null
    return null;
  }
}

// Export singleton instance
export const schemaCache = new SchemaCacheManager();

// Function to check if schemas are compatible
export function areSchemasCompatible(
  schema1: TableSchema[],
  schema2: TableSchema[]
): boolean {
  // If the schema1 length is not equal to the schema2 length, return false
  if (schema1.length !== schema2.length) {
    return false;
  }
  // Iterate over the schema1
  for (let i = 0; i < schema1.length; i++) {
    const table1 = schema1[i];
    const table2 = schema2[i];
    // If the table1 table name is not equal to the table2 table name, return false
    if (table1.table_name !== table2.table_name) {
      return false;
    }
    // If the table1 columns length is not equal to the table2 columns length, return false
    if (table1.columns.length !== table2.columns.length) {
      return false;
    }
    // Iterate over the table1 columns
    for (let j = 0; j < table1.columns.length; j++) {
      const col1 = table1.columns[j];
      const col2 = table2.columns[j];
      // If the col1 column name is not equal to the col2 column name
      // or the col1 data type is not equal to the col2 data type, return false
      if (
        col1.column_name !== col2.column_name ||
        col1.data_type !== col2.data_type
      ) {
        return false;
      }
    }
  }
  // Return true
  return true;
}

/**
 * Convert internal TableSchema format to API format for GraphQL communication
 */
export function transformToApiSchema(schema: TableSchema[]): ApiTableSchema[] {
  return schema.map((table) => ({
    table_name: table.table_name,
    columns: table.columns.map((col) => ({
      column_name: col.column_name,
      data_type: col.data_type,
      is_nullable: col.is_nullable,
      is_primary_key: col.is_primary_key ?? false,
    })),
    primary_keys: table.primary_keys,
    foreign_keys: table.foreign_keys.map((fk) => ({
      column_name: fk.column_name,
      referenced_table: fk.referenced_table,
      referenced_column: fk.referenced_column,
      constraint_name: fk.constraint_name,
    })),
  }));
}

/**
 * Get cached API schema or transform and cache it
 */

export function getCachedApiSchema(
  schema: TableSchema[],
  cache: SchemaCacheManager
): ApiTableSchema[] {
  const cacheKey = "api-schema";
  const cached = cache.get(cacheKey) as SchemaCacheEntry | null;

  if (!cached?.apiSchema) {
  }

  return cached?.apiSchema || transformToApiSchema(schema);
}

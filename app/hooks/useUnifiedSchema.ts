"use client";

import { useQuery } from "@apollo/client/react";
import { GET_SCHEMA } from "@/app/graphql/queries/getSchema";
import { useEffect, useState } from "react";
import { useApolloCachePersistence } from "@/app/hooks/useApolloCachePersistence";
import { useSchemaVersioning } from "@/app/hooks/useSchemaVersioning";
import { TableSchema } from "@/app/types/query";
import { schemaCache, areSchemasCompatible } from "@/app/utils/schemaCache";

/**
 * Unified schema loading hook that ensures consistent caching across all pages
 */
export function useUnifiedSchema(options: {
  includeSampleData?: boolean;
  tableSearch?: string;
  columnSearch?: string;
  limit?: number;
} = {}) {
  const {
    includeSampleData = false,
    tableSearch,
    columnSearch,
    limit = 100,
  } = options;

  // Enable cache persistence
  useApolloCachePersistence();
  
  // Enable automatic schema versioning and cache invalidation
  useSchemaVersioning();

  // Use Apollo query for schema with proper caching
  const { data, loading, error, refetch } = useQuery<{ schema: TableSchema[] }>(GET_SCHEMA, {
    variables: {
      includeSampleData,
      limit,
      tableSearch: tableSearch || undefined,
      columnSearch: columnSearch || undefined,
    },
    fetchPolicy: "cache-first", // This ensures we use cache if available
    errorPolicy: "all",
    notifyOnNetworkStatusChange: false,
    // Use a consistent cache key regardless of includeSampleData
    context: {
      // This helps with cache consistency across different query variants
      cacheKey: `schema-${limit}-${tableSearch || ''}-${columnSearch || ''}`,
    },
  });

  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Initialize schema from cache if available and check version
  useEffect(() => {
    const cachedSchema = schemaCache.findCompatible(tableSearch, columnSearch, includeSampleData);
    if (cachedSchema && cachedSchema.length > 0) {
      setSchema(cachedSchema);
      setSchemaError(null);
      console.log('📋 Using cached schema on initialization');
    }
  }, [tableSearch, columnSearch, includeSampleData]);

  // Update schema when Apollo query completes
  useEffect(() => {
    if (data?.schema && data.schema.length > 0) {
      // Cache the schema
      schemaCache.set(data.schema, tableSearch, columnSearch, includeSampleData);
      setSchema(data.schema);
      setSchemaError(null);
    } else if (error) {
      setSchemaError(error.message);
    }
  }, [data?.schema, error, tableSearch, columnSearch, includeSampleData]);

  return {
    schema,
    loading,
    error: schemaError,
    refetch,
  };
}

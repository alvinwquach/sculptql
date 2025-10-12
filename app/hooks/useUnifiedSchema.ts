"use client";

import { useQuery } from "@apollo/client/react";
import { GET_SCHEMA } from "@/app/graphql/queries/getSchema";
import { useEffect, useState } from "react";
import { useApolloCachePersistence } from "@/app/hooks/useApolloCachePersistence";
import { useSchemaVersioning } from "@/app/hooks/useSchemaVersioning";
import { TableSchema } from "@/app/types/query";
import { schemaCache } from "@/app/utils/schemaCache";

/**
 * Unified schema loading hook that ensures consistent caching across all pages
 */
export function useUnifiedSchema(options: {
  tableSearch?: string;
  columnSearch?: string;
  limit?: number;
} = {}) {
  const {
    tableSearch,
    columnSearch,
    limit = 100,
  } = options;
  useApolloCachePersistence();
  useSchemaVersioning();

  console.log('📤 useUnifiedSchema calling GraphQL with:', {
    limit,
    tableSearch: tableSearch || undefined,
    columnSearch: columnSearch || undefined,
  });

  const { data, loading, error, refetch } = useQuery<{ schema: TableSchema[] }>(
    GET_SCHEMA,
    {
      variables: {
        limit,
        tableSearch: tableSearch || undefined,
        columnSearch: columnSearch || undefined,
      },
      fetchPolicy: "cache-first",
      errorPolicy: "all",
      notifyOnNetworkStatusChange: false,
      context: {
        cacheKey: `schema-${limit}-${tableSearch || ""}-${columnSearch || ""}`,
      },
    }
  );

  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const cachedSchema = schemaCache.findCompatible(tableSearch, columnSearch);
    if (cachedSchema && cachedSchema.length > 0) {
      setSchema(cachedSchema);
      setSchemaError(null);
      setHasLoadedOnce(true);
      console.log('📋 Using cached schema on initialization');
    }
  }, [tableSearch, columnSearch]);

  useEffect(() => {
    if (data?.schema && data.schema.length > 0) {
      schemaCache.set(data.schema, tableSearch, columnSearch);
      setSchema(data.schema);
      setSchemaError(null);
      setHasLoadedOnce(true);
    } else if (error) {
      setSchemaError(error.message);
      setHasLoadedOnce(true);
    } else if (data && !loading) {
      setHasLoadedOnce(true);
    }
  }, [data, error, loading, tableSearch, columnSearch]);

  return {
    schema,
    loading: loading || !hasLoadedOnce,
    error: schemaError,
    refetch,
  };
}

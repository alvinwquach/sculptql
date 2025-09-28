"use client";

import { useApolloClient } from "@apollo/client/react";
import { useCallback } from "react";
import { INVALIDATE_SCHEMA_CACHE } from "@/app/graphql/mutations/invalidateSchemaCache";
import { unifiedCache } from "@/app/utils/unifiedCache";

export function useCacheInvalidation() {
  const client = useApolloClient();

  const invalidateAllCaches = useCallback(async () => {
    try {
      console.log('🔄 Starting cache invalidation...');
      
      // 1. Invalidate server-side API cache
      const { data } = await client.mutate<{ invalidateSchemaCache: boolean }>({
        mutation: INVALIDATE_SCHEMA_CACHE,
      });
      
      if (data?.invalidateSchemaCache === true) {
        console.log('✅ Server-side cache invalidated');
      }
      
      // 2. Clear client-side Apollo cache
      await client.clearStore();
      console.log('✅ Apollo cache cleared');
      
      // 3. Clear IndexedDB cache
      await unifiedCache.clearSchemaCache();
      await unifiedCache.clearApolloCache();
      console.log('✅ IndexedDB cache cleared');
      
      // 4. Refetch schema data
      await client.refetchQueries({
        include: ['GetSchema', 'GetSchemaWithData'],
      });
      console.log('✅ Schema data refetched');
      
      return true;
    } catch (error) {
      console.error('❌ Cache invalidation failed:', error);
      return false;
    }
  }, [client]);

  const invalidateSchemaCache = useCallback(async () => {
    try {
      console.log('🔄 Invalidating schema cache...');
      
      // Invalidate server-side API cache
      const { data } = await client.mutate<{ invalidateSchemaCache: boolean }>({
        mutation: INVALIDATE_SCHEMA_CACHE,
      });
      
      if (data?.invalidateSchemaCache === true) {
        console.log('✅ Schema cache invalidated');
      }
      
      // Clear client-side schema cache
      await unifiedCache.clearSchemaCache();
      
      // Refetch schema data with a more conservative approach
      await client.refetchQueries({
        include: ['GetSchema'],
      });
      
      return true;
    } catch (error) {
      console.error('❌ Schema cache invalidation failed:', error);
      return false;
    }
  }, [client]);

  return {
    invalidateAllCaches,
    invalidateSchemaCache,
  };
}

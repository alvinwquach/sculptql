"use client";

import { indexedDBCache } from "./indexedDBCache";
import { NormalizedCacheObject } from "@apollo/client";
import { TableSchema } from "@/app/types/query";

// Class for the unified cache
class UnifiedCache {
  // Default TTL for the cache
  private readonly DEFAULT_TTL = 10 * 60 * 1000;
  async get<T>(key: string): Promise<T | null> {
    try {
      // Get the cache from the indexedDBCache with the key
      return await indexedDBCache.get<T>(key);
    } catch (error) {
      // Log the error
      console.error(`UnifiedCache get failed for ${key}:`, error);
      // Return null
      return null;
    }
  }
  // Set method for the cache
  async set<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      // Set the cache with the key, data, and ttl
      await indexedDBCache.set(key, data, ttl);
    } catch (error) {
      // Log the error
      console.error(`UnifiedCache set failed for ${key}:`, error);
    }
  }
  // Get method for the apollo cache
  async getApolloCache(): Promise<NormalizedCacheObject | null> {
    // Get the apollo cache from the indexedDBCache with the key "apollo-cache"
    return this.get<NormalizedCacheObject>("apollo-cache");
  }
  // Set method for the apollo cache
  async setApolloCache(
    data: NormalizedCacheObject,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    // Set the apollo cache with the key, data, and ttl
    return this.set("apollo-cache", data, ttl);
  }
  // Get method for the schema cache
  async getSchema(key: string): Promise<TableSchema[] | null> {
    // Get the schema cache from the indexedDBCache with the key "schema-${key}"
    return this.get<TableSchema[]>(`schema-${key}`);
  }
  // Set method for the schema cache
  async setSchema(
    key: string,
    schema: TableSchema[],
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    // Set the schema cache with the key, schema, and ttl
    return this.set(`schema-${key}`, schema, ttl);
  }
  // Clear method for the schema cache
  async clearSchemaCache(): Promise<void> {
    try {
      // Get all keys from the indexedDBCache
      const keys = await indexedDBCache.getAllKeys();
      // Filter the keys to only include schema keys
      const schemaKeys = keys.filter(key => key.startsWith('schema-'));
      // Loop through the schema keys and delete each one
      for (const key of schemaKeys) {
        // Delete the schema key
        await indexedDBCache.delete(key);
      }
      // Log the success
      console.log('✅ Schema cache cleared from IndexedDB');
    } catch (error) {
      // Log the error
      console.error('❌ Failed to clear schema cache from IndexedDB:', error);
    }
  }
  // Clear method for the apollo cache
  async clearApolloCache(): Promise<void> {
    try {
      // Delete the apollo cache with the key "apollo-cache"
      await indexedDBCache.delete('apollo-cache');
      // Log the success
      console.log('✅ Apollo cache cleared from IndexedDB');
    } catch (error) {
      // Log the error
      console.error('❌ Failed to clear Apollo cache from IndexedDB:', error);
    }
  }
}
// Export the unified cache
export const unifiedCache = new UnifiedCache();

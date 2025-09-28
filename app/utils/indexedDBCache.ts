"use client";

import { TableSchema } from "@/app/types/query";


// Interface for the cache entry
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Class for the indexedDB cache
class IndexedDBCache {
  // Private dbName property
  private dbName = 'sculptql-cache';
  // Private version property
  private version = 1;
  // Private db property
  private db: IDBDatabase | null = null;
  // Private default TTL property
  private readonly DEFAULT_TTL = 10 * 60 * 1000; 
  // Init method to initialize the indexedDB cache
  async init(): Promise<void> {
    // If the window is undefined, return
    if (typeof window === 'undefined') return;
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Open the indexedDB cache
      const request = indexedDB.open(this.dbName, this.version);
      // On error, reject the promise
      request.onerror = () => reject(request.error);
      // On success, set the db to the request result 
      // and resolve the promise
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      // On upgrade needed, set the db to the request result
      // and create the object stores
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // If the apollo cache object store does not exist, create it
        if (!db.objectStoreNames.contains('apollo-cache')) {
          // Create the apollo cache object store
          db.createObjectStore('apollo-cache', { keyPath: 'key' });
        }
        // If the schema cache object store does not exist, create it
        if (!db.objectStoreNames.contains('schema-cache')) {
          // Create the schema cache object store
          db.createObjectStore('schema-cache', { keyPath: 'key' });
        }
      };
    });
  }
  // Private ensureDB method to ensure the indexedDB cache is initialized
  private async ensureDB(): Promise<void> {
    // If the db is not initialized, initialize it
    if (!this.db) {
      // Initialize the indexedDB cache
      await this.init();
    }
  }
  // Set method to set the data, timestamp, and ttl in the indexedDB cache
  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return
    if (!this.db) return;
    // Create the entry with the data, timestamp, and ttl
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the apollo cache object store
      const transaction = this.db!.transaction(['apollo-cache'], 'readwrite');
      // Get the apollo cache object store
      const store = transaction.objectStore('apollo-cache');
      // Put the entry with the key and the entry
      const request = store.put({ key, ...entry });
      // On success, resolve the promise
      request.onsuccess = () => resolve();
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }
  // Get method to get the data from the indexedDB cache
  async get<T>(key: string): Promise<T | null> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return null
    if (!this.db) return null;
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the apollo cache object store
      const transaction = this.db!.transaction(['apollo-cache'], 'readonly');
      // Get the apollo cache object store
      const store = transaction.objectStore('apollo-cache');
      // Get the entry with the key
      const request = store.get(key);
      // On success, resolve the promise
      // On error, reject the promise
      request.onsuccess = () => {
        // Get the result
        const result = request.result;
        // If the result is not found, resolve the promise
        if (!result) {
          // Resolve the promise with null
          resolve(null);
          return;
        }
        // Get the current time
        const now = Date.now();
        // Check if the entry is expired
        const isExpired = now - result.timestamp > result.ttl;
        // If the entry is expired, delete the entry and resolve the promise
        if (isExpired) {
          // Delete the entry
          this.delete(key); 
          // Resolve the promise with null
          resolve(null);
        } else {
          // Resolve the promise with the data
          resolve(result.data);
        }
      };
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }

  // Delete method to delete the data from the indexedDB cache
  async delete(key: string): Promise<void> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return
    if (!this.db) return;
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the apollo cache object store
      const transaction = this.db!.transaction(['apollo-cache'], 'readwrite');
      // Get the apollo cache object store
      const store = transaction.objectStore('apollo-cache');
      // Delete the entry with the key
      const request = store.delete(key);
      // On success, resolve the promise
      request.onsuccess = () => resolve();
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }

  // Clear method to clear the indexedDB cache
  async clear(): Promise<void> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return
    if (!this.db) return;
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the apollo cache object store
      const transaction = this.db!.transaction(['apollo-cache'], 'readwrite');
      // Get the apollo cache object store
      const store = transaction.objectStore('apollo-cache');
      // Clear the apollo cache object store
      const request = store.clear();
      // On success, resolve the promise
      request.onsuccess = () => resolve();
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }
  // Has method to check if the indexedDB cache has the data
  async has(key: string): Promise<boolean> {
    // Get the data from the indexedDB cache
    const data = await this.get(key);
    // Return true if the data is not null
    return data !== null;
  }
  // Set schema method to set the schema in the indexedDB cache
  async setSchema(key: string, schema: TableSchema[], ttl: number = this.DEFAULT_TTL): Promise<void> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return
    if (!this.db) return;
    // Create the entry with the schema, timestamp, and ttl
    const entry: CacheEntry<TableSchema[]> = {
      data: schema,
      timestamp: Date.now(),
      ttl
    };  
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the schema cache object store
      const transaction = this.db!.transaction(['schema-cache'], 'readwrite');
      // Get the schema cache object store
      const store = transaction.objectStore('schema-cache');
      // Put the entry with the key and the entry
      const request = store.put({ key, ...entry });
      // On success, resolve the promise
      request.onsuccess = () => resolve();
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }
  // Get schema method to get the schema from the indexedDB cache
  async getSchema(key: string): Promise<TableSchema[] | null> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return null
    if (!this.db) return null;
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the schema cache object store
      const transaction = this.db!.transaction(['schema-cache'], 'readonly');
      // Get the schema cache object store
      const store = transaction.objectStore('schema-cache');
      // Get the entry with the key
      const request = store.get(key);
      // On success, resolve the promise
      request.onsuccess = () => {
        // Get the result
        const result = request.result;
        // If the result is not found, resolve the promise
        if (!result) {
          // Resolve the promise with null
          resolve(null);
          // Return
          return;
        }
        // Get the current time
        const now = Date.now();
        // Check if the entry is expired
        const isExpired = now - result.timestamp > result.ttl;
        // If the entry is expired
        if (isExpired) {
          // Delete the entry
          this.deleteSchema(key); 
          // Resolve the promise with null
          resolve(null);
          // Return
          return;
        } else {
          // Resolve the promise with the data
          resolve(result.data);
        }
      };
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }
  // Delete schema method to delete the schema from the indexedDB cache
  async deleteSchema(key: string): Promise<void> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return
    if (!this.db) return;
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the schema cache object store
      const transaction = this.db!.transaction(['schema-cache'], 'readwrite');
      // Get the schema cache object store
      const store = transaction.objectStore('schema-cache');
      // Delete the entry with the key
      const request = store.delete(key);
      // On success, resolve the promise
      request.onsuccess = () => resolve();
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }
  // Get all keys method to get all keys from the indexedDB cache
  async getAllKeys(): Promise<string[]> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return empty array
    if (!this.db) return [];
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the apollo cache object store
      const transaction = this.db!.transaction(['apollo-cache'], 'readonly');
      // Get the apollo cache object store
      const store = transaction.objectStore('apollo-cache');
      // Get all keys
      const request = store.getAllKeys();
      // On success, resolve the promise
      request.onsuccess = () => {
        // Resolve the promise with the keys
        resolve(request.result as string[]);
      };
      // On error, reject the promise
      request.onerror = () => reject(request.error);
    });
  }
  // Get stats method to get the stats of the indexedDB cache
  async getStats(): Promise<{ apolloSize: number; schemaSize: number }> {
    // Ensure the indexedDB cache is initialized
    await this.ensureDB();
    // If the db is not initialized, return the size of 0
    if (!this.db) return { apolloSize: 0, schemaSize: 0 };
    // Return a new promise
    return new Promise((resolve, reject) => {
      // Create the transaction with the apollo cache and schema cache object stores
      const transaction = this.db!.transaction(['apollo-cache', 'schema-cache'], 'readonly');
      // Get the apollo cache object store
       const apolloStore = transaction.objectStore('apollo-cache');
      // Get the schema cache object store
      const schemaStore = transaction.objectStore('schema-cache');
      // Get the apollo count
      const apolloRequest = apolloStore.count();
      // Get the schema count
      const schemaRequest = schemaStore.count();
      // Set the apollo count to 0
      let apolloCount = 0;
      // Set the schema count to 0
      let schemaCount = 0;
      // Set the completed to 0
      let completed = 0;
      // Function to check if the transaction is complete
      const checkComplete = () => {
        // Increment the completed
        completed++;
        // If the completed is 2
        if (completed === 2) {
          // Resolve the promise with the apollo count and schema count
          resolve({ apolloSize: apolloCount, schemaSize: schemaCount });
        }
      };
      // On success
      apolloRequest.onsuccess = () => {
        // Set the apollo count to the apollo request result
        apolloCount = apolloRequest.result;
        // Check if the transaction is complete
        checkComplete();
      };
      // On success
      schemaRequest.onsuccess = () => {
        // Set the schema count to the schema request result
        schemaCount = schemaRequest.result;
        // Check if the transaction is complete
        checkComplete();
      };
      // On error, reject the promise
      apolloRequest.onerror = () => reject(apolloRequest.error);
      // On error, reject the promise
      schemaRequest.onerror = () => reject(schemaRequest.error);
    });
  }
}
// Export the indexedDB cache
export const indexedDBCache = new IndexedDBCache();
// If the window is not undefined, initialize the indexedDB cache
if (typeof window !== 'undefined') {
  // Initialize the indexedDB cache
  indexedDBCache.init().catch(console.error);
}

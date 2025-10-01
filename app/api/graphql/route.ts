import {
  Column,
  ExplainAnalyzeJSON,
  ForeignKey,
  Table,
  QueryResult,
} from "@/app/types/query";
import { createSchema, createYoga } from "graphql-yoga";
import { FieldDef, Pool as PgPool } from "pg";
import mysql, { Pool as MySqlPool, RowDataPacket, FieldPacket } from "mysql2/promise";
import * as mssql from "mssql";
import { open, Database as SqliteDatabase } from "sqlite";
import * as sqlite3 from "sqlite3";
import oracledb, { Pool as OraclePool } from "oracledb";
import { generateSqlFromNaturalLanguage } from "@/app/lib/llm/openai";
import { ApiTableSchema } from "@/app/types/query";

// Interface for the schema cache entry
interface SchemaCacheEntry {
  data: Table[];
  timestamp: number;
  ttl: number;
}

// Class for the api schema cache
class ApiSchemaCache {
  // Private cache
  private cache: Map<string, SchemaCacheEntry> = new Map();
  // Private default ttl is 10 minutes
  private readonly DEFAULT_TTL = 10 * 60 * 1000;
  // Private max cache size
  private readonly MAX_CACHE_SIZE = 50; 
  // Generate the key
  generateKey(dialect: string, tableSearch?: string, columnSearch?: string): string {
    // Return the key
    return `schema_${dialect}_${tableSearch ?? 'all'}_${columnSearch ?? 'all'}`;
  }
  // Get the data from the cache
  get(key: string): Table[] | null {
    // Get the entry from the cache
    const entry = this.cache.get(key);
    // If the entry is not found, return null
    if (!entry) return null;
    // Get the current time
    // If the current time is greater than the timestamp plus the ttl, 
    // delete the entry and return null
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    // Return the data
    return entry.data;
  }

  // Set the data to the cache
  set(key: string, data: Table[], ttl: number = this.DEFAULT_TTL): void {
    // If the cache size is greater than the max cache size,
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Get the oldest key
      const oldestKey = this.cache.keys().next().value;
      // If the oldest key is not null, delete the entry
      // Delete the entry
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    // Set the data to the cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  // Clear the cache
  clear(): void {
    // Clear the cache
    this.cache.clear();
  }
  // Get the stats
  getStats(): { size: number; keys: string[] } {
    // Return the size and the keys
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create the api schema cache
const apiSchemaCache = new ApiSchemaCache();

// Query result cache for frequently accessed data
class QueryResultCache {
  // Private cache 
  private cache: Map<string, { data: QueryResult; timestamp: number; ttl: number }> = new Map();
  // Default ttl for the query result cache
  // Max cache size for the query result cache
  private readonly DEFAULT_TTL = 5 * 60 * 1000; 
  // Max cache size for the query result cache
  private readonly MAX_CACHE_SIZE = 100;

  // Generate the key for the query result cache
  generateKey(query: string, params: (string | number)[]): string {
    // Generate the key for the query result cache
    return `query_${Buffer.from(query + JSON.stringify(params)).toString('base64')}`;
  }

  // Get the data from the query result cache
  get(key: string): QueryResult | null {
    // Get the entry from the cache
    const entry = this.cache.get(key);
    // If the entry is not found, return null 
    if (!entry) return null;
    // Get the current time
    const now = Date.now();
    // If the current time is greater than the timestamp plus the ttl, 
    // delete the entry and return null
    if (now - entry.timestamp > entry.ttl) {
      // Delete the entry and return null
      this.cache.delete(key);
      return null;
    }
    // Return the data
    return entry.data;
  }

  // Set the data to the query result cache   
  set(key: string, data: QueryResult, ttl: number = this.DEFAULT_TTL): void {
    // If the cache size is greater than the max cache size,
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Get the oldest key
      const oldestKey = this.cache.keys().next().value;
      // If the oldest key is not null, delete the entry
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    // Set the data to the query result cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Clear the query result cache
  clear(): void {
    this.cache.clear();
  }
}

// Create the query result cache
const queryResultCache = new QueryResultCache();


// Class for the connection pool manager
class ConnectionPoolManager {
  // Private instance
  private static instance: ConnectionPoolManager;
  // Private active connections
  private activeConnections = 0;
  // Private max concurrent connections
  private maxConcurrentConnections = 30;

  // Get the instance of the connection pool manager
  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  async acquireConnection(): Promise<boolean> {
    if (this.activeConnections >= this.maxConcurrentConnections) {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
      return false;
    }
    this.activeConnections++;
    return true;
  }

  releaseConnection(): void {
    if (this.activeConnections > 0) {
      this.activeConnections--;
    }
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }
}

const connectionManager = ConnectionPoolManager.getInstance();

// Batch connection pool for reusing connections within batches
class BatchConnectionPool {
  private adapters: DatabaseAdapter[] = [];
  private maxAdapters = 5; // Maximum number of adapters to keep in pool
  private availableAdapters: DatabaseAdapter[] = [];

  async getAdapter(): Promise<DatabaseAdapter> {
    if (this.availableAdapters.length > 0) {
      return this.availableAdapters.pop()!;
    }
    
    if (this.adapters.length < this.maxAdapters) {
      const adapter = await getDatabaseAdapter();
      this.adapters.push(adapter);
      return adapter;
    }
    
    // If pool is full, create a new adapter
    return await getDatabaseAdapter();
  }

  releaseAdapter(adapter: DatabaseAdapter): void {
    if (this.availableAdapters.length < this.maxAdapters) {
      this.availableAdapters.push(adapter);
    } else {
      adapter.release();
    }
  }

  async releaseAll(): Promise<void> {
    const allAdapters = [...this.adapters, ...this.availableAdapters];
    await Promise.all(allAdapters.map(adapter => {
      adapter.release();
      return Promise.resolve();
    }));
    this.adapters = [];
    this.availableAdapters = [];
  }
}

const batchConnectionPool = new BatchConnectionPool();

// Helper function to execute queries with caching and performance tracking
async function executeQueryWithCache<T extends Record<string, unknown>>(
  adapter: DatabaseAdapter,
  query: string,
  params: (string | number)[],
  cacheKey?: string,
  ttl?: number,
  performanceTracker?: { queryCount: number; cacheHits: number }
): Promise<{ rows: T[]; rowCount?: number; fields?: { name: string }[] }> {
  // Check cache first if cacheKey is provided
  if (cacheKey) {
    const cached = queryResultCache.get(cacheKey);
    if (cached) {
      if (performanceTracker) {
        performanceTracker.cacheHits++;
      }
      return {
        rows: cached.rows as T[],
        rowCount: cached.rowCount,
        fields: cached.fields?.map(name => ({ name }))
      };
    }
  }

  // Track query execution
  if (performanceTracker) {
    performanceTracker.queryCount++;
  }

  // Execute query
  const result = await adapter.query<T>(query, params);

  // Cache result if cacheKey is provided
  if (cacheKey) {
    const cacheResult: QueryResult = {
      rows: result.rows as Record<string, unknown>[],
      rowCount: result.rowCount,
      fields: result.fields?.map(field => field.name) || []
    };
    queryResultCache.set(cacheKey, cacheResult, ttl);
  }

  return result;
}

// Interface for the next context
interface NextContext {
  params: Promise<Record<string, string>>;
}

// Custom response type
const CustomResponse = Response as typeof Response & {
  json: (data: unknown, init?: ResponseInit) => Response;
};

// Supported dialects
type SupportedDialect = "postgres" | "mysql" | "mssql" | "sqlite" | "oracle";

// Database pool
type DatabasePool = PgPool | MySqlPool | mssql.ConnectionPool | SqliteDatabase | OraclePool;

// Interface for the database adapter
interface DatabaseAdapter {
  query<T = unknown>(text: string, params?: (string | number)[]): Promise<{
    rows: T[];
    rowCount?: number;
    fields?: { name: string }[];
  }>;
  release(): void;
}

// PostgreSQL adapter
class PostgresAdapter implements DatabaseAdapter {
  // Constructor for the postgres adapter
  constructor(private client: import('pg').PoolClient) {}
  // Query method for the postgres adapter
  async query<T = unknown>(text: string, params?: (string | number)[]) {
    // Query the client and the text and the params
    const result = await this.client.query(text, params);
    // Return the result
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? undefined,
      fields: result.fields?.map((field: FieldDef) => ({ name: field.name })) || []
    };
  }
  // Release method for the postgres adapter
  release() {
    // Release the client
    this.client.release();
    // Release the connection from the manager
    connectionManager.releaseConnection();
  }
}

// MySQL adapter
class MySqlAdapter implements DatabaseAdapter {
  // Constructor for the mysql adapter
  constructor(private connection: import('mysql2/promise').PoolConnection) {}
  // Query method for the mysql adapter
  async query<T = unknown>(text: string, params?: (string | number)[]) {
    // Execute the connection and the text and the params
    const [rows, fields] = await this.connection.execute(text, params) as [RowDataPacket[], FieldPacket[]];
    // Return the result
    return {
      rows: rows as T[],
      rowCount: rows.length,
      fields: fields.map((field) => ({ name: field.name }))
    };
  }

  // Release method for the mysql adapter
  release() {
    // Release the connection
    this.connection.release();
    // Release the connection from the manager
    connectionManager.releaseConnection();
  }
}

// SQL Server adapter
class SqlServerAdapter implements DatabaseAdapter {
  // Constructor for the sql server adapter
  constructor(private pool: mssql.ConnectionPool) {}
  // Query method for the sql server adapter
  async query<T = unknown>(text: string, params?: (string | number)[]) {
    // Create the request from the pool
    const request = this.pool.request();
    // If the params is not null
    if (params) {
      // Loop through the params and set the input
      params.forEach((param, index) => {
        // Set the input
        request.input(`param${index}`, param);
      });
    }
    // Execute the request and the text
    const result = await request.query(text);
    // Return the result
    return {
      rows: result.recordset as T[],
      rowCount: result.rowsAffected[0] || result.recordset.length,
      fields: result.recordset.columns ? Object.keys(result.recordset.columns).map(name => ({ name })) : []
    };
  }
  // Release method for the sql server adapter
  release() {
    // SQL Server pool doesn't need individual connection release
    // The pool manages connections automatically
    // Release the connection from the manager
    connectionManager.releaseConnection();
  }
}

// SQLite adapter
class SqliteAdapter implements DatabaseAdapter {
  // Constructor for the sqlite adapter
  constructor(private db: SqliteDatabase) {}
  // Query method for the sqlite adapter
  async query<T = unknown>(text: string, params?: (string | number)[]) {
    try {
      // Execute the db and the text and the params
      const result = await this.db.all(text, params || []);
      // Set the fields to an empty array
      let fields: { name: string }[] = [];
      // If the result length is greater than 0
      if (result.length > 0) {
        fields = Object.keys(result[0] as Record<string, unknown>).map(name => ({ name }));
      }
      // Return the result
      return {
        rows: result as T[],
        rowCount: result.length,
        fields
      };
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  }

  release() {
    // SQLite database doesn't need individual connection release
    // The database connection is managed by the pool
    // Release the connection from the manager
    connectionManager.releaseConnection();
  }
}

// Oracle adapter
class OracleAdapter implements DatabaseAdapter {
  // Constructor for the oracle adapter
  constructor(private connection: import('oracledb').Connection) {}
  // Query method for the oracle adapter
  async query<T = unknown>(text: string, params?: (string | number)[]) {
    try {
      // Execute the connection and the text and the params
      const result = await this.connection.execute(text, params || []);
      // Return the result
      return {
        rows: result.rows as T[],
        rowCount: result.rowsAffected || result.rows?.length || 0,
        fields: result.metaData?.map((field) => ({ name: field.name })) || []
      };
    } catch (error) {
      console.error('Oracle query error:', error);
      throw error;
    }
  }

  // Release method for the oracle adapter
  release() {
    // Release the connection
    this.connection.close();
    // Release the connection from the manager
    connectionManager.releaseConnection();
  }
}

// Get the dialect from the environment variables
const dialect = (process.env.DB_DIALECT as SupportedDialect) || "postgres";

// Function to create the database pool with optimized settings
async function createDatabasePool(): Promise<DatabasePool> {
  const commonPoolSettings = {
    max: 50, // Increased for better concurrency
    min: 10, // Increased minimum connections
    acquireTimeoutMillis: 5000, // Increased timeout for better reliability
    idleTimeoutMillis: 600000, // 10 minutes - increased for better reuse
  };

  // If the dialect is mysql
  if (dialect === "mysql") {
    return mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: commonPoolSettings.max,
      queueLimit: 50,
      charset: 'utf8mb4',
      timezone: '+00:00',
      multipleStatements: false,
      dateStrings: false,
    });
  } else if (dialect === "mssql") {
    const config: mssql.config = {
      server: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT) || 1433,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      options: { 
        encrypt: true, 
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 10000, 
      },
      pool: { 
        max: commonPoolSettings.max,
        min: commonPoolSettings.min,
        idleTimeoutMillis: commonPoolSettings.idleTimeoutMillis,
        acquireTimeoutMillis: commonPoolSettings.acquireTimeoutMillis,
      },
      connectionTimeout: 5000, 
    };
    return new mssql.ConnectionPool(config);
  } else if (dialect === "sqlite") {
    // Get the db file from the environment variables
    const dbFile = process.env.DB_FILE || process.env.DB_DATABASE;
    // If the db file is not found, throw an error
    if (!dbFile) {
      throw new Error("DB_FILE or DB_DATABASE environment variable is required for SQLite");
    }
    // Open the sqlite database with performance settings
    // Return the sqlite database
    return await open({
      filename: dbFile,
      driver: sqlite3.Database,
    });
  } else if (dialect === "oracle") {
    // Oracle connection pool
    return await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST}:${process.env.DB_PORT || 1521}/${process.env.DB_DATABASE}`,
      poolMin: commonPoolSettings.min,
      poolMax: commonPoolSettings.max,
      poolIncrement: 1,
      poolTimeout: 60,
      stmtCacheSize: 30,
    });
  } else {
    return new PgPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: commonPoolSettings.max,
      min: commonPoolSettings.min,
      idleTimeoutMillis: commonPoolSettings.idleTimeoutMillis,
      connectionTimeoutMillis: 10000, // Increased for better reliability
      query_timeout: 60000, // Increased to 60 seconds for schema operations
      statement_timeout: 60000, // Increased to 60 seconds for schema operations
      application_name: "sculptql-api",
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: true,
    });
  }
} 

let pool: DatabasePool;

(async () => {
  try {
    // Create the database pool
    pool = await createDatabasePool();
  } catch (error) {
    // Log the failed to create database pool error
    console.error("Failed to create database pool:", error);
  }
})();


// Set the pool initialized to false
let poolInitialized = false;
// Set the pool initialization promise to null
let poolInitializationPromise: Promise<void> | null = null;

// Function to initialize the pool
async function initializePool(): Promise<void> {
  // If the pool is initialized, return
  if (poolInitialized) return;
  // If the pool initialization promise is not null, return the pool initialization promise
  if (poolInitializationPromise) {
    return poolInitializationPromise;
  }
  // Set the pool initialization promise
  poolInitializationPromise = (async () => {
    try {
      console.log('Creating database pool...');
      // Create the database pool
      pool = await createDatabasePool();
      // Set the pool initialized to true
      poolInitialized = true;
      // Log the database pool created successfully
      console.log('Database pool created successfully');
    } catch (error) {
      // Log the failed to create database pool error
      console.error('Failed to create database pool:', error);
      // Set the pool initialized to false
      poolInitialized = false;
      // Set the pool initialization promise to null
      poolInitializationPromise = null;
      // Throw the error
      throw error;
    }
  })();
  // Return the pool initialization promise
  return poolInitializationPromise;
}

// Function to get the database adapter with connection management
async function getDatabaseAdapter(): Promise<DatabaseAdapter> {
  // Ensure pool is initialized
  await initializePool();
  // If the pool is not available, throw an error
  if (!pool) {
    throw new Error('Database pool not available');
  }
  
  // Wait for available connection
  let connectionAcquired = false;
  let retries = 0;
  const maxRetries = 10;
  
  while (!connectionAcquired && retries < maxRetries) {
    connectionAcquired = await connectionManager.acquireConnection();
    if (!connectionAcquired) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, 50 * retries)); // Exponential backoff
    }
  }
  
  if (!connectionAcquired) {
    throw new Error('Failed to acquire database connection after maximum retries');
  }
  
  try {
    // If the dialect is mysql
    if (dialect === "mysql") {
      // Get the connection from the pool
      const connection = await (pool as MySqlPool).getConnection();
      // Return the mysql adapter
      return new MySqlAdapter(connection);
    } else if (dialect === "mssql") {
      // Get the mssql pool from the pool
      const mssqlPool = pool as mssql.ConnectionPool;
      // If the mssql pool is not connected, connect it
      if (!mssqlPool.connected) {
        // Connect the mssql pool
        await mssqlPool.connect();
      }
      // Return the sql server adapter
      return new SqlServerAdapter(mssqlPool);
    } else if (dialect === "sqlite") {
      // Return the sqlite adapter
      return new SqliteAdapter(pool as SqliteDatabase);
    } else if (dialect === "oracle") {
      // Get the connection from the oracle pool
      const connection = await (pool as OraclePool).getConnection();
      // Return the oracle adapter
      return new OracleAdapter(connection);
    } else {
      // Get the client from the pool
      const client = await (pool as PgPool).connect();
      // Return the postgres adapter
      return new PostgresAdapter(client);
    }
  } catch (error) {
    console.error('Failed to get database adapter:', error);
    connectionManager.releaseConnection();
    throw error;
  }
}

// Class for the sql queries
class SqlQueries {
  // Function to get the tables query
  static getTablesQuery(dialect: SupportedDialect, tableSearch?: string): { query: string; params: (string | number)[] } {
    // Set the params to an empty array
    const params: (string | number)[] = [];
    // If the dialect is mysql
    if (dialect === "mysql") {
      // Set the query to the mysql tables query
      let query = `
        SELECT 
          table_catalog,
          table_schema,
          table_name,
          table_type
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `;
      // If the table search is not null
      if (tableSearch) {
        query += ` AND table_name LIKE ?`;
        // Append the table search to the params
        params.push(`%${tableSearch}%`);
      }
      // Append the order by table name
      query += ` ORDER BY table_name`;
      // Return the query and the params
      return { query, params };
    } else if (dialect === "mssql") {
      // SQL Server
      // Set the query to the mssql tables query
      let query = `
        SELECT 
          TABLE_CATALOG as table_catalog,
          TABLE_SCHEMA as table_schema,
          TABLE_NAME as table_name,
          TABLE_TYPE as table_type
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
      `;
      // If the table search is not null
      if (tableSearch) {
        query += ` AND TABLE_NAME LIKE @param0`;
        // Append the table search to the params
        params.push(`%${tableSearch}%`);
      }
      // Append the order by table name
      query += ` ORDER BY TABLE_NAME`;
      // Return the query and the params
      return { query, params };
    } else if (dialect === "sqlite") {
      // SQLite
      let query = `
        SELECT 
          'main' as table_catalog,
          'main' as table_schema,
          name as table_name,
          type as table_type
        FROM sqlite_master
        WHERE type = 'table'
      `;
      // If the table search is not null
      if (tableSearch) {
        // Append the table search to the query
        query += ` AND name LIKE ?`;
        // Append the table search to the params
        params.push(`%${tableSearch}%`);
      }
      // Append the order by table name
      query += ` ORDER BY name`;
      // Return the query and the params
      return { query, params };
    } else if (dialect === "oracle") {
      // Oracle
      let query = `
        SELECT 
          owner as table_catalog,
          owner as table_schema,
          table_name,
          'BASE TABLE' as table_type
        FROM all_tables
        WHERE owner = USER
      `;
      // If the table search is not null
      if (tableSearch) {
        query += ` AND table_name LIKE :1`;
        // Append the table search to the params
        params.push(`%${tableSearch}%`);
      }
      // Append the order by table name
      query += ` ORDER BY table_name`;
      // Return the query and the params
      return { query, params };
    } else {
      // PostgreSQL
      let query = `
        SELECT table_catalog, table_schema, table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;
      // If the table search is not null
      // Append the table search to the query
      if (tableSearch) {
        query += ` AND table_name ILIKE $${params.length + 1}`;
        // Append the table search to the params
        params.push(`%${tableSearch}%`);
      }
      // Append the order by table name
      query += ` ORDER BY table_name;`;
      // Return the query and the params
      return { query, params };
    }
  }
  // Function to get the columns query
  static getColumnsQuery(dialect: SupportedDialect, tableName: string, columnSearch?: string): { query: string; params: (string | number)[] } {
    const params: (string | number)[] = [tableName];
      // If the dialect is mysql
    if (dialect === "mysql") {
      // Set the query to the mysql columns query
      let query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ?
      `;
      // If the column search is not null
      if (columnSearch) {
        query += ` AND (column_name LIKE ? OR data_type LIKE ?)`;
        // Append the column search to the query
        params.push(`%${columnSearch}%`, `%${columnSearch}%`);
      }
      // Append the order by ordinal position
      query += ` ORDER BY ordinal_position`;
      // Return the query and the params
      return { query, params };
    } else if (dialect === "mssql") {
      // Set the query to the mssql columns query
      let query = `
        SELECT 
          COLUMN_NAME as column_name, 
          DATA_TYPE as data_type, 
          IS_NULLABLE as is_nullable
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @param0
      `;
      // If the column search is not null
      if (columnSearch) {
        query += ` AND (COLUMN_NAME LIKE @param1 OR DATA_TYPE LIKE @param1)`;
        // Append the column search to the params
        params.push(`%${columnSearch}%`);
      }
      // Append the order by ordinal position
      query += ` ORDER BY ORDINAL_POSITION`;
      // Return the query and the params
      return { query, params };
    } else if (dialect === "sqlite") {
      // Set the query to the sqlite primary keys query
      let query = `
        SELECT 
          name as column_name, 
          type as data_type, 
          CASE WHEN "notnull" = 0 THEN 'YES' ELSE 'NO' END as is_nullable
        FROM pragma_table_info(?)
      `;
      // If the column search is not null
      if (columnSearch) {
        query += ` WHERE (name LIKE ? OR type LIKE ?)`;
        // Append the column search to the params
        params.push(`%${columnSearch}%`, `%${columnSearch}%`);
      }
      // Append the order by cid
      query += ` ORDER BY cid`;
      // Return the query and the params
      return { query, params };
    } else if (dialect === "oracle") {
      // Set the query to the oracle columns query
      let query = `
        SELECT 
          column_name, 
          data_type, 
          CASE WHEN nullable = 'Y' THEN 'YES' ELSE 'NO' END as is_nullable
        FROM user_tab_columns
        WHERE table_name = :1
      `;
      // If the column search is not null
      if (columnSearch) {
        query += ` AND (column_name LIKE :2 OR data_type LIKE :2)`;
        // Append the column search to the params
        params.push(`%${columnSearch}%`);
      }
      // Append the order by column_id
      query += ` ORDER BY column_id`;
      // Return the query and the params
      return { query, params };
    } else {
      // PostgreSQL
      let query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `;
      // If the column search is not null
      if (columnSearch) {
        // Append the column search to the query
        query += ` AND (column_name ILIKE $${params.length + 1} OR data_type ILIKE $${params.length + 1})`;
        // Append the column search to the params
        params.push(`%${columnSearch}%`);
      }
      // Append the order by ordinal position
      query += ` ORDER BY ordinal_position;`;
      // Return the query and the params
      return { query, params };
    }
  }
  // Function to get the primary keys query
  static getPrimaryKeysQuery(dialect: SupportedDialect, tableName: string): { query: string; params: (string | number)[] } {
    // If the dialect is mysql
    if (dialect === "mysql") {
      // Set the query to the mysql primary keys query
      return {
        query: `
          SELECT column_name
          FROM information_schema.key_column_usage
          WHERE table_schema = DATABASE() 
            AND table_name = ?
            AND constraint_name = 'PRIMARY'
          ORDER BY ordinal_position
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else if (dialect === "mssql") {
      // Set the query to the mssql primary keys query
      return {
        query: `
          SELECT COLUMN_NAME as column_name
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_NAME = @param0
            AND CONSTRAINT_NAME LIKE 'PK_%'
          ORDER BY ORDINAL_POSITION
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else if (dialect === "sqlite") {
      // SQLite
      // Set the query to the sqlite primary keys query
      return {
        query: `
          SELECT name as column_name
          FROM pragma_table_info(?)
          WHERE pk = 1
          ORDER BY cid
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else if (dialect === "oracle") {
      // Set the query to the oracle primary keys query
      return {
        query: `
          SELECT column_name
          FROM user_cons_columns ucc
          JOIN user_constraints uc ON ucc.constraint_name = uc.constraint_name
          WHERE uc.constraint_type = 'P' AND ucc.table_name = :1
          ORDER BY ucc.position
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else {
      // Set the query to the postgres primary keys query
      return {
        query: `
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = $1;
        `,
        params: [tableName]
      };
    }
  }

  // Function to get the foreign keys query
  static getForeignKeysQuery(dialect: SupportedDialect, tableName: string): { query: string; params: (string | number)[] } {
    // If the dialect is mysql
    if (dialect === "mysql") {
      // Set the query to the mysql foreign keys query
      return {
        query: `
          SELECT 
            kcu.column_name,
            kcu.referenced_table_name as referenced_table,
            kcu.referenced_column_name as referenced_column,
            kcu.constraint_name
          FROM information_schema.key_column_usage kcu
          WHERE kcu.table_schema = DATABASE()
            AND kcu.table_name = ?
            AND kcu.referenced_table_name IS NOT NULL
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else if (dialect === "mssql") {
      // Set the query to the mssql foreign keys query
      return {
        query: `
          SELECT 
            kcu.COLUMN_NAME as column_name,
            ccu.TABLE_NAME as referenced_table,
            ccu.COLUMN_NAME as referenced_column,
            kcu.CONSTRAINT_NAME as constraint_name
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
          JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
            ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ccu
            ON rc.UNIQUE_CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
            AND kcu.ORDINAL_POSITION = ccu.ORDINAL_POSITION
          WHERE kcu.TABLE_NAME = @param0
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else if (dialect === "sqlite") {
      // Set the query to the sqlite foreign keys query
      return {
        query: `
          SELECT 
            "from" as column_name,
            "table" as referenced_table,
            "to" as referenced_column,
            id as constraint_name
          FROM pragma_foreign_key_list(?)
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else if (dialect === "oracle") {
      // Set the query to the oracle foreign keys query
      return {
        query: `
          SELECT 
            ucc.column_name,
            ucc2.table_name as referenced_table,
            ucc2.column_name as referenced_column,
            ucc.constraint_name
          FROM user_cons_columns ucc
          JOIN user_constraints uc ON ucc.constraint_name = uc.constraint_name
          JOIN user_cons_columns ucc2 ON uc.r_constraint_name = ucc2.constraint_name
          WHERE uc.constraint_type = 'R' AND ucc.table_name = :1
        `,
        // Append the table name to the params
        params: [tableName]
      };
    } else {
      // Set the query to the postgres foreign keys query
      return {
        query: `
          SELECT kcu.column_name, ccu.table_name AS referenced_table, 
                 ccu.column_name AS referenced_column, tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
            AND tc.table_schema = ccu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = $1;
        `,
        // Append the table name to the params
        params: [tableName]
      };
    }
  }
  // Function to get a combined query for all table metadata
  static getCombinedTableMetadataQuery(dialect: SupportedDialect, tableNames: string[], columnSearch?: string): { query: string; params: (string | number)[] } {
    const params: (string | number)[] = [];
    
    if (dialect === "postgres") {
      // Create a single query that gets all metadata for multiple tables
      const tableNamesParam = tableNames.map((_, index) => `$${index + 1}`).join(',');
      params.push(...tableNames);
      
      let query = `
        WITH table_columns AS (
          SELECT 
            c.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.ordinal_position,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT kcu.column_name, kcu.table_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'public'
          ) pk ON c.column_name = pk.column_name AND c.table_name = pk.table_name
          WHERE c.table_schema = 'public' 
            AND c.table_name IN (${tableNamesParam})
      `;
      
      if (columnSearch) {
        query += ` AND (c.column_name ILIKE $${params.length + 1} OR c.data_type ILIKE $${params.length + 1})`;
        params.push(`%${columnSearch}%`);
      }
      
      query += `
        ),
        table_foreign_keys AS (
          SELECT 
            kcu.table_name,
            kcu.column_name,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column,
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
            AND tc.table_schema = ccu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND kcu.table_name IN (${tableNamesParam})
        )
        SELECT 
          tc.table_name,
          tc.column_name,
          tc.data_type,
          tc.is_nullable,
          tc.ordinal_position,
          tc.is_primary_key,
          fk.referenced_table,
          fk.referenced_column,
          fk.constraint_name
        FROM table_columns tc
        LEFT JOIN table_foreign_keys fk ON tc.table_name = fk.table_name AND tc.column_name = fk.column_name
        ORDER BY tc.table_name, tc.ordinal_position
      `;
      
      return { query, params };
    }
    
    // For other dialects, fall back to individual queries
    return { query: '', params: [] };
  }

  // Function to get the sample data query
  static getSampleDataQuery(dialect: SupportedDialect, tableName: string, limit?: number): { query: string; params: (string | number)[] } {
    // If the dialect is mysql
    if (dialect === "mysql") {
      // Set the query to the mysql sample data query
      let query = `SELECT * FROM \`${tableName}\``;
      // Set the params to an empty array
      const params: (string | number)[] = [];
      // If the limit is a number
      if (typeof limit === "number") {
        // Append the limit to the query
        query += ` LIMIT ?`;
        // Append the limit to the params
        params.push(limit);
      }
      // Return the query and the params
      return { query, params };
    } else if (dialect === "mssql") {
      // Set the query to the mssql sample data query
      const query = `SELECT TOP ${limit || 100} * FROM [${tableName}]`;
      // Set the params to an empty array
      const params: (string | number)[] = [];
      // Return the query and the params
      return { query, params };
    } else if (dialect === "sqlite") {
      // Set the query to the sqlite sample data query
      let query = `SELECT * FROM "${tableName}"`;
      // Set the params to an empty array
      const params: (string | number)[] = [];
      // If the limit is a number
      if (typeof limit === "number") {
        // Append the limit to the query
        query += ` LIMIT ?`;
        // Append the limit to the params
        params.push(limit);
      }
      // Return the query and the params
      return { query, params };
    } else if (dialect === "oracle") {
      // Set the query to the oracle sample data query
      let query = `SELECT * FROM ${tableName}`;
      // Set the params to an empty array
      const params: (string | number)[] = [];
      // If the limit is a number
      if (typeof limit === "number") {
        // Append the limit to the query
        query += ` WHERE ROWNUM <= :1`;
        // Append the limit to the params
        params.push(limit);
      }
      // Return the query and the params
      return { query, params };
    } else {
      // Set the query to the postgres sample data query
      let query = `SELECT * FROM public.${tableName}`;
      // Set the params to an empty array
      const params: (string | number)[] = [];
      // If the limit is a number
      if (typeof limit === "number") {
        // Append the limit to the query
        query += ` LIMIT $1`;
        // Append the limit to the params
        params.push(limit);
      }
      // Return the query and the params
      return { query, params };
    }
  }

  // Function to get the explain query
  static getExplainQuery(dialect: SupportedDialect, originalQuery: string): string | null {
    // If the dialect is mysql
    if (dialect === "mysql") {
      // Set the query to the mysql explain query
      return `EXPLAIN FORMAT=JSON ${originalQuery}`;
    } else if (dialect === "mssql") {
      // SQL Server - SET SHOWPLAN_XML ON doesn't work with parameters
      return null;
    } else if (dialect === "sqlite") {
      // SQLite - EXPLAIN QUERY PLAN provides basic query analysis
      return `EXPLAIN QUERY PLAN ${originalQuery}`;
    } else if (dialect === "oracle") {
      // Oracle - EXPLAIN PLAN provides query analysis
      return `EXPLAIN PLAN FOR ${originalQuery}`;
    } else {
      // PostgreSQL
      return `EXPLAIN (ANALYZE, FORMAT JSON) ${originalQuery}`;
    }
  }
}

// Interface for the schema args
interface SchemaArgs {
  tableSearch?: string;
  columnSearch?: string; 
  limit?: number;
  includeSampleData?: boolean;
}

// Define the type definitions
const typeDefs = /* GraphQL */ `
  # Column metadata
  type Column {
    column_name: String!
    data_type: String!
    is_nullable: String!
    is_primary_key: Boolean!
  }

  # Foreign key metadata
  type ForeignKey {
    column_name: String!
    referenced_table: String!
    referenced_column: String!
    constraint_name: String!
  }

  # Table metadata + sample values
  type Table {
    table_catalog: String!
    table_schema: String!
    table_name: String!
    table_type: String!
    comment: String
    columns: [Column!]!
    primary_keys: [String!]!
    foreign_keys: [ForeignKey!]!
    values(limit: Int): [JSON!]!
  }

  # Query execution result
  type QueryResult {
    rows: [JSON!]!
    rowCount: Int
    fields: [String!]!
    payloadSize: Float
    totalTime: Float
    errorsCount: Int!
    error: String
  }

  # JSON scalar for dynamic row data
  scalar JSON

  # Schema version info
  type SchemaVersion {
    version: String!
    lastModified: String!
    tableCount: Int!
  }

  # Root query type
  type Query {
    schema(tableSearch: String, columnSearch: String, limit: Int, includeSampleData: Boolean = false): [Table!]!
    schemaVersion: SchemaVersion!
    dialect: String!
  }

  # Input types for mutations
  input ColumnSchemaInput {
    column_name: String!
    data_type: String!
    is_nullable: String!
    is_primary_key: Boolean!
  }

  input ForeignKeySchemaInput {
    column_name: String!
    referenced_table: String!
    referenced_column: String!
    constraint_name: String!
  }

  input TableSchemaInput {
    table_name: String!
    columns: [ColumnSchemaInput!]!
    primary_keys: [String!]
    foreign_keys: [ForeignKeySchemaInput!]!
  }

  type GenerateSqlResult {
    sql: String!
  }

  type Mutation {
    runQuery(query: String!): QueryResult!
    generateSqlFromNaturalLanguage(
      naturalLanguage: String!
      schema: [TableSchemaInput!]!
      dialect: String
    ): GenerateSqlResult!
    invalidateSchemaCache: Boolean!
  }
`;

const resolvers = {
  Query: {
    dialect: async (): Promise<string> => {
      return dialect;
    },
    schema: async (
      _: unknown,
      { tableSearch = "", columnSearch = "", limit, includeSampleData = false }: SchemaArgs
    ): Promise<Table[]> => {
      try {
        // Generate the cache key
        const cacheKey = apiSchemaCache.generateKey(dialect, tableSearch, columnSearch);
        // Get the cached result from the cache
        const cachedResult = apiSchemaCache.get(cacheKey);
        // If the cached result is not null and the include sample data is false,
        if (cachedResult && !includeSampleData) {
          // Log the schema loaded from the cache
          console.log('Schema loaded from cache');
          // Return the cached result
          return cachedResult;
        }
        // Set the timing id
        const timingId = `Schema fetch from database ${Date.now()}-${Math.random()}`;
        // Start the timing
        console.time(timingId);
        // Log the fetching schema with dialect
        console.log(`Fetching schema with dialect: ${dialect}`);
        
        // Performance monitoring
        const performanceStart = performance.now();
        const queryCount = 0;
        const cacheHits = 0;
        // Get the database adapter
        const adapter = await getDatabaseAdapter();
        // If the adapter is not found, throw an error
        if (!adapter) {
          // Log the failed to get database adapter error
          console.error('Failed to get database adapter');
          // Throw the error
          throw new Error('Failed to get database adapter');
        }
        
        try {
          // Get the tables query and the tables params
        const { query: tablesQuery, params: tablesParams } = SqlQueries.getTablesQuery(dialect, tableSearch);
        // Log the executing tables query
        console.log(`Executing tables query: ${tablesQuery}`);
        // Get the tables result from the adapter
        const tablesResult = await adapter.query<{
          table_catalog: string;
          table_schema: string;
          table_name: string;
          table_type: string;
        }>(tablesQuery, tablesParams);
        // Log the found tables
        console.log(`Found ${tablesResult.rows.length} tables`);
        // Set the schema to an empty array
        const schema: Table[] = [];
        // Use optimized combined query for PostgreSQL
        if (dialect === "postgres") {
          const tableNames = tablesResult.rows.map(table => table.table_name);
          const { query: combinedQuery, params: combinedParams } = SqlQueries.getCombinedTableMetadataQuery(dialect, tableNames, columnSearch);
          
          if (combinedQuery) {
            console.log('Using optimized combined query for all tables');
            
            // Execute the single combined query
            const combinedResult = await executeQueryWithCache<{
              table_name: string;
              column_name: string;
              data_type: string;
              is_nullable: string;
              ordinal_position: number;
              is_primary_key: boolean;
              referenced_table: string | null;
              referenced_column: string | null;
              constraint_name: string | null;
            }>(adapter, combinedQuery, combinedParams, 
               queryResultCache.generateKey(combinedQuery, combinedParams), 300000, 
               { queryCount, cacheHits });
            
            // Group results by table
            const tableMetadata = new Map<string, {
              columns: Column[];
              primaryKeys: string[];
              foreignKeys: ForeignKey[];
            }>();
            
            for (const row of combinedResult.rows) {
              if (!tableMetadata.has(row.table_name)) {
                tableMetadata.set(row.table_name, {
                  columns: [],
                  primaryKeys: [],
                  foreignKeys: []
                });
              }
              
              const tableData = tableMetadata.get(row.table_name)!;
              
              // Add column
              tableData.columns.push({
                column_name: row.column_name,
                data_type: row.data_type,
                is_nullable: row.is_nullable,
                is_primary_key: row.is_primary_key
              });
              
              // Add primary key
              if (row.is_primary_key) {
                tableData.primaryKeys.push(row.column_name);
              }
              
              // Add foreign key
              if (row.referenced_table && row.referenced_column && row.constraint_name) {
                tableData.foreignKeys.push({
                  column_name: row.column_name,
                  referenced_table: row.referenced_table,
                  referenced_column: row.referenced_column,
                  constraint_name: row.constraint_name
                });
              }
            }
            
            // Process sample data if needed
            const sampleDataPromises = includeSampleData ?
              tableNames.map(async (tableName) => {
                const { query: sampleQuery, params: sampleParams } = SqlQueries.getSampleDataQuery(dialect, tableName, limit);
                console.log(`Fetching sample data for table: ${tableName}`);
                console.log(`Sample query: ${sampleQuery}`);
                const sampleResult = await executeQueryWithCache<Record<string, unknown>>(
                  adapter, sampleQuery, sampleParams,
                  queryResultCache.generateKey(sampleQuery, sampleParams), 60000
                );
                console.log(`Sample data for ${tableName}:`, sampleResult.rows.length, 'rows');
                return { tableName, values: sampleResult.rows };
              }) :
              tableNames.map(tableName => ({ tableName, values: [] }));
            
            const sampleDataResults = await Promise.all(sampleDataPromises);
            const sampleDataMap = new Map(sampleDataResults.map(result => [result.tableName, result.values]));
            
            // Build final schema
            for (const table of tablesResult.rows) {
              const tableData = tableMetadata.get(table.table_name);
              if (!tableData) continue;
              
              // Filter columns if column search is active and no matches
              if (columnSearch && tableData.columns.length === 0) {
                continue;
              }
              
              const tableValues = sampleDataMap.get(table.table_name) || [];
              const tableResult: Table = {
                table_catalog: table.table_catalog,
                table_schema: table.table_schema,
                table_name: table.table_name,
                table_type: table.table_type,
                comment: null,
                columns: tableData.columns,
                primary_keys: tableData.primaryKeys,
                foreign_keys: tableData.foreignKeys,
                values: tableValues
              };

              console.log(`Table ${table.table_name} sample data:`, tableValues.length, 'rows');
              if (tableValues.length > 0) {
                console.log(`Sample row:`, tableValues[0]);
              }

              schema.push(tableResult);
              console.log(`Successfully processed table: ${table.table_name} with ${tableData.columns.length} columns`);
            }
          } else {
            // Fallback to individual queries if combined query not supported
            console.log('Falling back to individual queries');
            await processTablesIndividually();
          }
        } else {
          // For non-PostgreSQL databases, use individual queries
          await processTablesIndividually();
        }
        
        async function processTablesIndividually() {
          try {
            // Pre-compute all queries to avoid redundant calls
            const tableQueries = tablesResult.rows.map(table => {
              const { table_name } = table;
              return {
                table,
                table_name,
                columnsQuery: SqlQueries.getColumnsQuery(dialect, table_name, columnSearch),
                primaryKeyQuery: SqlQueries.getPrimaryKeysQuery(dialect, table_name),
                foreignKeyQuery: SqlQueries.getForeignKeysQuery(dialect, table_name),
                sampleDataQuery: includeSampleData ? SqlQueries.getSampleDataQuery(dialect, table_name, limit) : null
              };
            });

            // Process tables in parallel with optimized batching and connection reuse
            const BATCH_SIZE = 15; // Increased batch size for better efficiency
            const tableProcessingPromises = [];
            
            for (let i = 0; i < tableQueries.length; i += BATCH_SIZE) {
              const batch = tableQueries.slice(i, i + BATCH_SIZE);
              
              // Get a shared adapter for this batch
              const batchAdapter = await batchConnectionPool.getAdapter();
              
              const batchPromises = batch.map(async ({ table, table_name, columnsQuery, primaryKeyQuery, foreignKeyQuery, sampleDataQuery }) => {
                try {
                  // Log the processing table
                  console.log(`Processing table: ${table_name}`);
                  
                  // Execute all queries for this table in parallel with caching
                  const [columnsResult, primaryKeyResult, foreignKeyResult, valuesResult] = await Promise.all([
                    executeQueryWithCache<{
                      column_name: string;
                      data_type: string;
                      is_nullable: string;
                    }>(batchAdapter, columnsQuery.query, columnsQuery.params, 
                       queryResultCache.generateKey(columnsQuery.query, columnsQuery.params), 300000, 
                       { queryCount, cacheHits }), // 5 min cache
                    executeQueryWithCache<{ column_name: string }>(batchAdapter, primaryKeyQuery.query, primaryKeyQuery.params,
                       queryResultCache.generateKey(primaryKeyQuery.query, primaryKeyQuery.params), 300000, 
                       { queryCount, cacheHits }), // 5 min cache
                    executeQueryWithCache<Record<string, unknown>>(batchAdapter, foreignKeyQuery.query, foreignKeyQuery.params,
                       queryResultCache.generateKey(foreignKeyQuery.query, foreignKeyQuery.params), 300000, 
                       { queryCount, cacheHits }), // 5 min cache
                    sampleDataQuery 
                      ? executeQueryWithCache<Record<string, unknown>>(batchAdapter, sampleDataQuery.query, sampleDataQuery.params,
                         queryResultCache.generateKey(sampleDataQuery.query, sampleDataQuery.params), 60000, 
                         { queryCount, cacheHits }) // 1 min cache for sample data
                      : Promise.resolve({ rows: [] })
                  ]);
                  // If the column search is not null and the columns result rows length is 0,
                  if (columnSearch && columnsResult.rows.length === 0) {
                    // Return null
                    return null;
                  }
                  // Get the primary keys from the primary key result rows
                  const primaryKeys = primaryKeyResult.rows.map((r) => r.column_name);
                  // Get the values from the values result rows 
                  // and the include sample data is true 
                  // or an empty array if the include sample data is false
                  const values = includeSampleData ? valuesResult.rows : [];
                  // Get the columns from the columns result rows
                  // and the primary keys includes the column name
                  const columns: Column[] = columnsResult.rows.map((col) => ({
                    ...col,
                    is_primary_key: primaryKeys.includes(col.column_name),
                  }));
                  // Get the table result
                  const tableResult: Table = {
                    table_catalog: table.table_catalog,
                    table_schema: table.table_schema,
                    table_name: table.table_name,
                    table_type: table.table_type,
                    comment: null, 
                    columns,
                    primary_keys: primaryKeys,
                    foreign_keys: foreignKeyResult.rows as unknown as ForeignKey[],
                    values,
                  };
                  // Log the successfully processed table
                  console.log(`Successfully processed table: ${table_name} with ${columns.length} columns`);
                  return tableResult;
                } catch (error) {
                  console.error(`Error processing table ${table.table_name}:`, error);
                  return null; 
                }
              });
              
              // Wait for this batch to complete
              const batchResults = await Promise.all(batchPromises);
              tableProcessingPromises.push(...batchResults);
              
              // Release the batch adapter back to the pool
              batchConnectionPool.releaseAdapter(batchAdapter);
            }
            
            // Filter out null results (failed tables)
            // Push the table results to the schema
            schema.push(...tableProcessingPromises.filter((result): result is Table => result !== null));
          } finally {
            // Clean up batch connection pool
            await batchConnectionPool.releaseAll();
          }
        }
        // Cache the result (only if not including sample data)
        if (!includeSampleData) {
          // Set the schema to the cache
          apiSchemaCache.set(cacheKey, schema);
        }
        // End the timing 
        console.timeEnd(timingId);
        
        // Log performance metrics
        const performanceEnd = performance.now();
        const totalTime = performanceEnd - performanceStart;
        console.log(`🚀 Performance Metrics:`);
        console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
        console.log(`   Database queries: ${queryCount}`);
        console.log(`   Cache hits: ${cacheHits}`);
        console.log(`   Cache hit rate: ${queryCount > 0 ? ((cacheHits / queryCount) * 100).toFixed(1) : 0}%`);
        console.log(`   Tables processed: ${schema.length}`);
        console.log(`   Average time per table: ${schema.length > 0 ? (totalTime / schema.length).toFixed(2) : 0}ms`);
        
        // Return the schema
        return schema;
        } finally {
          // Release the adapter
          adapter.release();
        }
      } catch (error) {
        console.error('Schema resolver error:', error);
        // Return empty schema on error instead of throwing
        return [];
      }
    },
    schemaVersion: async (): Promise<{ version: string; lastModified: string; tableCount: number }> => {
      try {
        // Get the database adapter
        const adapter = await getDatabaseAdapter();
        if (!adapter) {
          throw new Error('Failed to get database adapter');
        }
        
        try {
          // Get table count to detect schema changes
          const { query: tablesQuery, params: tablesParams } = SqlQueries.getTablesQuery(dialect, "");
          const tablesResult = await adapter.query<{
            table_catalog: string;
            table_schema: string;
            table_name: string;
            table_type: string;
          }>(tablesQuery, tablesParams);
          const tableCount = tablesResult.rows.length;
          
          // Get total column count across all tables in parallel
          const columnCountPromises = tablesResult.rows.map(async (table) => {
            const { query: columnsQuery, params: columnsParams } = SqlQueries.getColumnsQuery(dialect, table.table_name);
            const columnsResult = await adapter.query(columnsQuery, columnsParams);
            return columnsResult.rows.length;
          });
          
          const columnCounts = await Promise.all(columnCountPromises);
          const totalColumnCount = columnCounts.reduce((sum, count) => sum + count, 0);
          
          // Create a version hash based on table count, column count, and current timestamp
          const version = `${tableCount}-${totalColumnCount}-${Date.now()}`;
          const lastModified = new Date().toISOString();
          
          return {
            version,
            lastModified,
            tableCount
          };
        } finally {
          adapter.release();
        }
      } catch (error) {
        console.error('Failed to get schema version:', error);
        return {
          version: 'error',
          lastModified: new Date().toISOString(),
          tableCount: 0
        };
      }
    },
  },
  Mutation: {
    generateSqlFromNaturalLanguage: async (
      _: unknown,
      { naturalLanguage, schema, dialect }: {
        naturalLanguage: string;
        schema: ApiTableSchema[];
        dialect?: string;
      }
    ): Promise<{ sql: string }> => {
      try {
        // If the natural language is not null and the natural language is not empty, throw an error
        if (!naturalLanguage?.trim()) {
          throw new Error('Natural language query is required');
        }

        // If the schema is not null and the schema length is 0, throw an error
        if (!schema || schema.length === 0) {
          throw new Error('Database schema is required');
        }

        // Schema is already processed and in correct format

        // Log the generating sql from natural language
        console.log(`Generating SQL from natural language: "${naturalLanguage}"`);
        // Log the using dialect
        console.log(`Using dialect: ${dialect || 'postgres'}`);

        // Generate the sql from natural language
        const generatedSql = await generateSqlFromNaturalLanguage({
          naturalLanguage,
          schema,
          dialect: dialect || 'postgres'
        });
        // Log the generated sql
        console.log(`Generated SQL: ${generatedSql}`);
        // Return the generated sql
        return { sql: generatedSql };
      } catch (error) {
        // Log the error generating sql from natural language
        console.error('Error generating SQL from natural language:', error);
        // Throw the error
        throw new Error(`Failed to generate SQL: ${(error as Error).message}`);
      }
    },
    runQuery: async (
      _: unknown,
      { query }: { query: string }
    ): Promise<QueryResult> => {
      // If the query is missing, return an error
      if (!query) {
        // Return the missing required field error
        return {
          error: "Missing required field: query",
          errorsCount: 1,
          rows: [],
          fields: [],
          rowCount: 0,
          payloadSize: 0,
          totalTime: 0,
        };
      }
      // Get the database adapter
      const adapter = await getDatabaseAdapter();
      // Set the errors count to 0
      let errorsCount = 0;

      try {
        // Execute the query from the adapter and the query
        const response = await adapter.query(query);
        // Set the planning time to 0
        let planningTime = 0;
        // Set the execution time from explain to 0
        let executionTimeFromExplain = 0;
        try {
          // Try to get the explain query from the dialect and the query
          const explainQuery = SqlQueries.getExplainQuery(dialect, query);
          // If the explain query is not null
          if (explainQuery) {
            // Get the explain result from the adapter and the explain query
            const explainResult = await adapter.query(explainQuery);
            // If the dialect is mysql
            if (dialect === "mysql") {
              // MySQL EXPLAIN FORMAT=JSON returns different structure
              // MySQL doesn't provide timing info in the same way as PostgreSQL
            } else if (dialect === "mssql") {
              // SQL Server
            } else if (dialect === "sqlite") {
              // SQLite - EXPLAIN QUERY PLAN provides basic query analysis
              // SQLite doesn't provide timing info in the same way as PostgreSQL
            } else {
              // PostgreSQL
              // Get the explain row from the explain result rows
              const explainRow = explainResult.rows[0] as Record<string, unknown>;
              // Get the plans from the explain row
              const plans = explainRow["QUERY PLAN"] as ExplainAnalyzeJSON[];
              // Get the plan from the plans
              const plan = plans[0];
              // Set the planning time to the plan planning time
              planningTime = plan.PlanningTime ?? 0;
              // Set the execution time from explain to the plan execution time
              executionTimeFromExplain = plan.ExecutionTime ?? 0;
            }
          }
        } catch {
          // Increment the errors count
          errorsCount += 1;
        }
        // Get the payload string from the response rows
        const payloadString = JSON.stringify(response.rows);
        // Get the payload size from the payload string
        const payloadSize = Buffer.byteLength(payloadString, "utf8") / 1024;
        // Get the total time from the planning time and the execution time from explain
        const totalTime = planningTime + executionTimeFromExplain;
        // Return the query result
        return {
          rows: response.rows as Record<string, unknown>[],
          rowCount: response.rowCount ?? undefined,
          fields: (response.fields?.map((field) => field.name) || []) as string[],
          payloadSize: Number(payloadSize.toFixed(4)),
          totalTime: Number(totalTime.toFixed(4)),
          errorsCount,
        };
      } catch (error) {
        // Increment the errors count
        errorsCount += 1;
        // Return the query result
        return {
          error: (error as Error).message || "Unknown error",
          errorsCount,
          rows: [],
          fields: [],
          rowCount: 0,
          payloadSize: 0,
          totalTime: 0,
        };
      } finally {
        // Release the adapter
        adapter.release();
      }
    },
    invalidateSchemaCache: async (): Promise<boolean> => {
      try {
        // Clear the API schema cache
        apiSchemaCache.clear();
        // Clear the query result cache
        queryResultCache.clear();
        console.log('✅ Schema cache and query result cache invalidated successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to invalidate schema cache:', error);
        return false;
      }
    },
  },
};

// Create Yoga GraphQL server
const { handleRequest } = createYoga<NextContext>({
  // Create the schema
  schema: createSchema({ typeDefs, resolvers }),
  // Set the graphql endpoint
  graphqlEndpoint: "/api/graphql",
  // Set the fetch api
  fetchAPI: {
    Response: CustomResponse,
  },
});

// Export handlers for Next.js API route
export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};
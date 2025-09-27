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



// Interface for the next context
interface NextContext {
  params: Promise<Record<string, string>>;
}

// Custom response type
const CustomResponse = Response as typeof Response & {
  json: (data: unknown, init?: ResponseInit) => Response;
};


// Supported dialects
type SupportedDialect = "postgres" | "mysql" | "mssql" | "sqlite";

// Database pool
type DatabasePool = PgPool | MySqlPool | mssql.ConnectionPool | SqliteDatabase;



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
  }
}

// Get the dialect from the environment variables
const dialect = (process.env.DB_DIALECT as SupportedDialect) || "postgres";

// Function to create the database pool
async function createDatabasePool(): Promise<DatabasePool> {
  // If the dialect is mysql
  if (dialect === "mysql") {
    // Create the mysql pool
    return mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  } else if (dialect === "mssql") {
    // Create the sql server pool
    const config: mssql.config = {
      server: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT) || 1433,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      options: { 
        encrypt: true, 
        trustServerCertificate: true 
      },
      pool: { 
        max: 5, 
        min: 0, 
        idleTimeoutMillis: 30000 
      },
    };
    return new mssql.ConnectionPool(config);
  } else if (dialect === "sqlite") {
    // Create the sqlite pool
    const dbFile = process.env.DB_FILE || process.env.DB_DATABASE;
    if (!dbFile) {
      throw new Error("DB_FILE or DB_DATABASE environment variable is required for SQLite");
    }
    // Open the sqlite database
    return await open({
      filename: dbFile,
      driver: sqlite3.Database,
    });
  } else {
    // Create the postgres pool
    return new PgPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      application_name: "sculptql-api",
    });
  }
} 

// Set the pool to the database pool
let pool: DatabasePool;

// Function to create the database pool
(async () => {
  // Try to create the database pool
  try {
    pool = await createDatabasePool();
  } catch (error) {
    // Log the failed to create database pool error
    console.error("Failed to create database pool:", error);
  }
})();

// Function to get the database adapter
async function getDatabaseAdapter(): Promise<DatabaseAdapter> {
  // If the pool is not set
  if (!pool) {
    pool = await createDatabasePool();
  }
  
  // If the dialect is mysql
  if (dialect === "mysql") {
    // Get the connection from the pool
    const connection = await (pool as MySqlPool).getConnection();
    return new MySqlAdapter(connection);
  } else if (dialect === "mssql") {
    // Get the mssql pool from the pool
    const mssqlPool = pool as mssql.ConnectionPool;
    if (!mssqlPool.connected) {
      // Connect the mssql pool
      await mssqlPool.connect();
    }
    return new SqlServerAdapter(mssqlPool);
  } else if (dialect === "sqlite") {
    // Return the sqlite adapter
    return new SqliteAdapter(pool as SqliteDatabase);
  } else {
    // Get the client from the pool
    const client = await (pool as PgPool).connect();
    // Return the postgres adapter
    return new PostgresAdapter(client);
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

  # Root query type
  type Query {
    schema(tableSearch: String, columnSearch: String, limit: Int): [Table!]!
  }

  # Root mutation type
  type Mutation {
    runQuery(query: String!): QueryResult!
  }
`;

const resolvers = {
  Query: {
    schema: async (
      _: unknown,
      { tableSearch = "", columnSearch = "", limit }: SchemaArgs
    ): Promise<Table[]> => {
      // Get the database adapter
      const adapter = await getDatabaseAdapter();
      try {
        // Get the tables query and the parameters for the tables query from the dialect and the table search
        const { query: tablesQuery, params: tablesParams } = SqlQueries.getTablesQuery(dialect, tableSearch);
        // Get the tables result from the adapter and the tables query and the parameters
        const tablesResult = await adapter.query<{
          table_catalog: string;
          table_schema: string;
          table_name: string;
          table_type: string;
        }>(tablesQuery, tablesParams);

        // Set the schema to an empty array
        const schema: Table[] = [];

        // Loop through the tables result and fetch the details
        for (const table of tablesResult.rows) {
          // Get the table name from the table
          const { table_name } = table;
          // Get the columns query and the parameters for the columns query from the dialect and the table name and the column search
          const { query: columnsQuery, params: columnsParams } = SqlQueries.getColumnsQuery(dialect, table_name, columnSearch);
          // Get the columns result from the adapter and the columns query and the parameters
          const columnsResult = await adapter.query<{
            column_name: string;
            data_type: string;
            is_nullable: string;
          }>(columnsQuery, columnsParams);
          // If the column search and the columns result rows length is 0, continue
          if (columnSearch && columnsResult.rows.length === 0) continue;
          // Get the primary key query and the parameters for the primary key query from the dialect and the table name
          const { query: primaryKeyQuery, params: primaryKeyParams } = SqlQueries.getPrimaryKeysQuery(dialect, table_name);
          // Get the primary key result from the adapter and the primary key query and the parameters
          const primaryKeyResult = await adapter.query<{ column_name: string }>(primaryKeyQuery, primaryKeyParams);
          // Get the primary keys from the primary key result rows
          const primaryKeys = primaryKeyResult.rows.map((r) => r.column_name);
          // Get the foreign key query and the parameters for the foreign key query from the dialect and the table name
          const { query: foreignKeyQuery, params: foreignKeyParams } = SqlQueries.getForeignKeysQuery(dialect, table_name);
          // Get the foreign key result from the adapter and the foreign key query and the parameters
          const foreignKeyResult = await adapter.query<ForeignKey>(foreignKeyQuery, foreignKeyParams);
          // Get the values query and the parameters for the values query from the dialect and the table name and the limit
          const { query: valuesQuery, params: valuesParams } = SqlQueries.getSampleDataQuery(dialect, table_name, limit);
          // Get the values result from the adapter and the values query and the parameters
          const valuesResult = await adapter.query<Record<string, unknown>>(valuesQuery, valuesParams);
          // Get the values from the values result rows
          const values = valuesResult.rows;
          // Construct the columns
          const columns: Column[] = columnsResult.rows.map((col) => ({
            ...col,
            is_primary_key: primaryKeys.includes(col.column_name),
          }));
          // Construct the table object and append to the schema
          schema.push({
            ...table,
            comment: null,
            columns,
            primary_keys: primaryKeys,
            foreign_keys: foreignKeyResult.rows,
            values,
          });
        }
        // Return the schema
        return schema;
      } finally {
        adapter.release();
      }
    },
  },
  Mutation: {
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
        errorsCount += 1;
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
        adapter.release();
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
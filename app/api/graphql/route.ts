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
import { Database as SqliteDatabase } from "sqlite";

// Define the Next.js context type
interface NextContext {
  params: Promise<Record<string, string>>;
}

// Custom Response type to ensure compatibility
const CustomResponse = Response as typeof Response & {
  json: (data: unknown, init?: ResponseInit) => Response;
};

// Database types
type SupportedDialect = "postgres" | "mysql" | "sqlite";
type DatabasePool = PgPool | MySqlPool | SqliteDatabase;

// Database abstraction interface
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
  constructor(private client: import('pg').PoolClient) {}

  async query<T = unknown>(text: string, params?: (string | number)[]) {
    const result = await this.client.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? undefined,
      fields: result.fields?.map((field: FieldDef) => ({ name: field.name })) || []
    };
  }

  release() {
    this.client.release();
  }
}

// MySQL adapter
class MySqlAdapter implements DatabaseAdapter {
  constructor(private connection: import('mysql2/promise').PoolConnection) {}

  async query<T = unknown>(text: string, params?: (string | number)[]) {
    const [rows, fields] = await this.connection.execute(text, params) as [RowDataPacket[], FieldPacket[]];
    return {
      rows: rows as T[],
      rowCount: rows.length,
      fields: fields.map((field) => ({ name: field.name }))
    };
  }

  release() {
    this.connection.release();
  }
}

// SQLite adapter
class SqliteAdapter implements DatabaseAdapter {
  constructor(private db: SqliteDatabase) {}

  async query<T = unknown>(text: string, params?: (string | number)[]) {
    const rows = await this.db.all(text, params || []);
    
    // For SQLite, we need to extract field names from the first row
    // or use a separate query to get column information
    let fields: { name: string }[] = [];
    
    if (rows.length > 0) {
      // Extract field names from the first row
      fields = Object.keys(rows[0] as Record<string, unknown>).map(name => ({ name }));
    } else {
      // If no rows, we can't easily get column info without executing the query
      // For now, return empty fields - this will be handled by the calling code
      fields = [];
    }
    
    return {
      rows: rows as T[],
      rowCount: rows.length,
      fields
    };
  }

  release() {
    // SQLite doesn't need connection release like connection pools
    // The database connection is managed at the pool level
  }
}

// Get database dialect from environment
const dialect = (process.env.DB_DIALECT as SupportedDialect) || "postgres";

// Create connection pool based on dialect
function createDatabasePool(): DatabasePool {
  if (dialect === "mysql") {
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
  } else if (dialect === "sqlite") {
    // For SQLite, we'll create the database connection in getDatabaseAdapter
    // since SQLite doesn't use connection pools the same way
    return null as any; // This will be handled in getDatabaseAdapter
  } else {
    // Default to PostgreSQL
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

const pool = createDatabasePool();

// Get database adapter
async function getDatabaseAdapter(): Promise<DatabaseAdapter> {
  if (dialect === "mysql") {
    const connection = await (pool as MySqlPool).getConnection();
    return new MySqlAdapter(connection);
  } else if (dialect === "sqlite") {
    // For SQLite, we need to import and create the database connection
    const { open } = await import("sqlite");
    const sqlite3 = await import("sqlite3");
    const db = await open({
      filename: process.env.DB_FILE!,
      driver: sqlite3.Database,
    });
    return new SqliteAdapter(db);
  } else {
    const client = await (pool as PgPool).connect();
    return new PostgresAdapter(client);
  }
}

// Database-specific SQL queries
class SqlQueries {
  static getTablesQuery(dialect: SupportedDialect, tableSearch?: string): { query: string; params: (string | number)[] } {
    const params: (string | number)[] = [];
    
    if (dialect === "mysql") {
      let query = `
        SELECT 
          table_catalog,
          table_schema,
          table_name,
          table_type
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `;
      
      if (tableSearch) {
        query += ` AND table_name LIKE ?`;
        params.push(`%${tableSearch}%`);
      }
      query += ` ORDER BY table_name`;
      
      return { query, params };
    } else if (dialect === "sqlite") {
      // SQLite uses sqlite_master table for schema information
      let query = `
        SELECT 
          'main' as table_catalog,
          'main' as table_schema,
          name as table_name,
          type as table_type
        FROM sqlite_master
        WHERE type IN ('table', 'view')
      `;
      
      if (tableSearch) {
        query += ` AND name LIKE ?`;
        params.push(`%${tableSearch}%`);
      }
      query += ` ORDER BY name`;
      
      return { query, params };
    } else {
      // PostgreSQL
      let query = `
        SELECT table_catalog, table_schema, table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;
      
      if (tableSearch) {
        query += ` AND table_name ILIKE $${params.length + 1}`;
        params.push(`%${tableSearch}%`);
      }
      query += ` ORDER BY table_name;`;
      
      return { query, params };
    }
  }

  static getColumnsQuery(dialect: SupportedDialect, tableName: string, columnSearch?: string): { query: string; params: (string | number)[] } {
    const params: (string | number)[] = [tableName];
    
    if (dialect === "mysql") {
      let query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ?
      `;
      
      if (columnSearch) {
        query += ` AND (column_name LIKE ? OR data_type LIKE ?)`;
        params.push(`%${columnSearch}%`, `%${columnSearch}%`);
      }
      
      query += ` ORDER BY ordinal_position`;
      
      return { query, params };
    } else if (dialect === "sqlite") {
      // SQLite uses PRAGMA table_info for column information
      let query = `
        SELECT 
          name as column_name,
          type as data_type,
          CASE WHEN "notnull" = 0 THEN 'YES' ELSE 'NO' END as is_nullable
        FROM pragma_table_info(?)
      `;
      
      if (columnSearch) {
        query += ` WHERE (name LIKE ? OR type LIKE ?)`;
        params.push(`%${columnSearch}%`, `%${columnSearch}%`);
      }
      
      query += ` ORDER BY cid`;
      
      return { query, params };
    } else {
      // PostgreSQL
      let query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `;
      
      if (columnSearch) {
        query += ` AND (column_name ILIKE $${params.length + 1} OR data_type ILIKE $${params.length + 1})`;
        params.push(`%${columnSearch}%`);
      }
      
      query += ` ORDER BY ordinal_position;`;
      
      return { query, params };
    }
  }

  static getPrimaryKeysQuery(dialect: SupportedDialect, tableName: string): { query: string; params: (string | number)[] } {
    if (dialect === "mysql") {
      return {
        query: `
          SELECT column_name
          FROM information_schema.key_column_usage
          WHERE table_schema = DATABASE() 
            AND table_name = ?
            AND constraint_name = 'PRIMARY'
          ORDER BY ordinal_position
        `,
        params: [tableName]
      };
    } else if (dialect === "sqlite") {
      // SQLite uses PRAGMA table_info to get primary key information
      return {
        query: `
          SELECT name as column_name
          FROM pragma_table_info(?)
          WHERE pk = 1
          ORDER BY cid
        `,
        params: [tableName]
      };
    } else {
      // PostgreSQL
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

  static getForeignKeysQuery(dialect: SupportedDialect, tableName: string): { query: string; params: (string | number)[] } {
    if (dialect === "mysql") {
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
        params: [tableName]
      };
    } else if (dialect === "sqlite") {
      // SQLite uses PRAGMA foreign_key_list for foreign key information
      return {
        query: `
          SELECT 
            "from" as column_name,
            "table" as referenced_table,
            "to" as referenced_column,
            'fk_' || "from" as constraint_name
          FROM pragma_foreign_key_list(?)
        `,
        params: [tableName]
      };
    } else {
      // PostgreSQL
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
        params: [tableName]
      };
    }
  }

  static getSampleDataQuery(dialect: SupportedDialect, tableName: string, limit?: number): { query: string; params: (string | number)[] } {
    if (dialect === "mysql") {
      let query = `SELECT * FROM \`${tableName}\``;
      const params: (string | number)[] = [];
      
      if (typeof limit === "number") {
        query += ` LIMIT ?`;
        params.push(limit);
      }
      
      return { query, params };
    } else if (dialect === "sqlite") {
      // SQLite uses standard SQL syntax
      let query = `SELECT * FROM "${tableName}"`;
      const params: (string | number)[] = [];
      
      if (typeof limit === "number") {
        query += ` LIMIT ?`;
        params.push(limit);
      }
      
      return { query, params };
    } else {
      // PostgreSQL
      let query = `SELECT * FROM public.${tableName}`;
      const params: (string | number)[] = [];
      
      if (typeof limit === "number") {
        query += ` LIMIT $1`;
        params.push(limit);
      }
      
      return { query, params };
    }
  }

  static getExplainQuery(dialect: SupportedDialect, originalQuery: string): string | null {
    if (dialect === "mysql") {
      return `EXPLAIN FORMAT=JSON ${originalQuery}`;
    } else if (dialect === "sqlite") {
      // SQLite uses EXPLAIN QUERY PLAN for query analysis
      return `EXPLAIN QUERY PLAN ${originalQuery}`;
    } else {
      // PostgreSQL
      return `EXPLAIN (ANALYZE, FORMAT JSON) ${originalQuery}`;
    }
  }
}

interface SchemaArgs {
  tableSearch?: string; // optional filter for table names
  columnSearch?: string; // optional filter for column names
  limit?: number; // optional row limit
}

// Step 1: Define GraphQL type definitions
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

// Step 2: Define resolver functions for GraphQL
const resolvers = {
  Query: {
    // Resolver: fetch schema metadata (tables, columns, PKs, FKs, sample data)
    schema: async (
      _: unknown,
      { tableSearch = "", columnSearch = "", limit }: SchemaArgs
    ): Promise<Table[]> => {
      const adapter = await getDatabaseAdapter();
      try {
        // Step 2a: Query tables from information_schema
        const { query: tablesQuery, params: tablesParams } = SqlQueries.getTablesQuery(dialect, tableSearch);

        const tablesResult = await adapter.query<{
          table_catalog: string;
          table_schema: string;
          table_name: string;
          table_type: string;
        }>(tablesQuery, tablesParams);

        const schema: Table[] = [];

        // Step 2b: Loop through tables and fetch details
        for (const table of tablesResult.rows) {
          const { table_name } = table;

          // Fetch columns
          const { query: columnsQuery, params: columnsParams } = SqlQueries.getColumnsQuery(dialect, table_name, columnSearch);
          const columnsResult = await adapter.query<{
            column_name: string;
            data_type: string;
            is_nullable: string;
          }>(columnsQuery, columnsParams);

          if (columnSearch && columnsResult.rows.length === 0) continue;

          // Fetch primary keys
          const { query: primaryKeyQuery, params: primaryKeyParams } = SqlQueries.getPrimaryKeysQuery(dialect, table_name);
          const primaryKeyResult = await adapter.query<{ column_name: string }>(primaryKeyQuery, primaryKeyParams);
          const primaryKeys = primaryKeyResult.rows.map((r) => r.column_name);

          // Fetch foreign keys
          const { query: foreignKeyQuery, params: foreignKeyParams } = SqlQueries.getForeignKeysQuery(dialect, table_name);
          const foreignKeyResult = await adapter.query<ForeignKey>(foreignKeyQuery, foreignKeyParams);

          // Fetch sample values
          const { query: valuesQuery, params: valuesParams } = SqlQueries.getSampleDataQuery(dialect, table_name, limit);
          const valuesResult = await adapter.query<Record<string, unknown>>(valuesQuery, valuesParams);
          const values = valuesResult.rows;

          // Construct Column objects
          const columns: Column[] = columnsResult.rows.map((col) => ({
            ...col,
            is_primary_key: primaryKeys.includes(col.column_name),
          }));

          // Construct Table object
          schema.push({
            ...table,
            comment: null,
            columns,
            primary_keys: primaryKeys,
            foreign_keys: foreignKeyResult.rows,
            values,
          });
        }

        return schema;
      } finally {
        adapter.release();
      }
    },
  },

  Mutation: {
    // Resolver: run arbitrary SQL query and return result
    runQuery: async (
      _: unknown,
      { query }: { query: string }
    ): Promise<QueryResult> => {
      if (!query) {
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

      const adapter = await getDatabaseAdapter();
      let errorsCount = 0;

      try {
        // Execute query
        const response = await adapter.query(query);

        // Try to run EXPLAIN ANALYZE for timings
        let planningTime = 0;
        let executionTimeFromExplain = 0;
        try {
          const explainQuery = SqlQueries.getExplainQuery(dialect, query);
          if (explainQuery) {
            const explainResult = await adapter.query(explainQuery);
            
            if (dialect === "mysql") {
              // MySQL EXPLAIN FORMAT=JSON returns different structure
              // MySQL doesn't provide timing info in the same way as PostgreSQL
              // We'll skip timing for MySQL for now
            } else {
              // PostgreSQL
              const explainRow = explainResult.rows[0] as Record<string, unknown>;
              const plans = explainRow["QUERY PLAN"] as ExplainAnalyzeJSON[];
              const plan = plans[0];
              planningTime = plan.PlanningTime ?? 0;
              executionTimeFromExplain = plan.ExecutionTime ?? 0;
            }
          }
        } catch {
          errorsCount += 1;
        }

        // Calculate payload size and total time
        const payloadString = JSON.stringify(response.rows);
        const payloadSize = Buffer.byteLength(payloadString, "utf8") / 1024;
        const totalTime = planningTime + executionTimeFromExplain;

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

// Step 3: Create Yoga GraphQL server
const { handleRequest } = createYoga<NextContext>({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: {
    Response: CustomResponse,
  },
});

// Step 4: Export handlers for Next.js API route
export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};
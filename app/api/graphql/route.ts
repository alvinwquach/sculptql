import {
  Column,
  ExplainAnalyzeJSON,
  ForeignKey,
  Table,
  QueryResult,
} from "@/app/types/query";
import { createSchema, createYoga } from "graphql-yoga";
import { FieldDef, Pool as PgPool } from "pg";
import mysql, { Pool as MySqlPool } from "mysql2/promise";

// Define the Next.js context type
interface NextContext {
  params: Promise<Record<string, string>>;
}

// Custom Response type to ensure compatibility
const CustomResponse = Response as typeof Response & {
  json: (data: unknown, init?: ResponseInit) => Response;
};

// Database dialect type
type SupportedDialect = "postgres" | "mysql";

// Determine database dialect from environment variable
const dialect: SupportedDialect =
  (process.env.DB_DIALECT as SupportedDialect) || "postgres";

// Configure database connection pool based on dialect
let pool: PgPool | MySqlPool;

if (dialect === "postgres") {
  pool = new PgPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    application_name: "sculptql-api",
  });
} else if (dialect === "mysql") {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
} else {
  throw new Error(`Unsupported database dialect: ${dialect}`);
}

interface SchemaArgs {
  tableSearch?: string;
  columnSearch?: string;
  limit?: number;
}

// GraphQL type definitions (unchanged)
const typeDefs = /* GraphQL */ `
  type Column {
    column_name: String!
    data_type: String!
    is_nullable: String!
    is_primary_key: Boolean!
  }

  type ForeignKey {
    column_name: String!
    referenced_table: String!
    referenced_column: String!
    constraint_name: String!
  }

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

  type QueryResult {
    rows: [JSON!]!
    rowCount: Int
    fields: [String!]!
    payloadSize: Float
    totalTime: Float
    errorsCount: Int!
    error: String
  }

  scalar JSON

  type Query {
    schema(tableSearch: String, columnSearch: String, limit: Int): [Table!]!
  }

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
      let client: any;
      try {
        if (dialect === "postgres") {
          client = await(pool as PgPool).connect();
        } else {
          client = await(pool as MySqlPool).getConnection();
        }

        const schema: Table[] = [];

        let tablesQuery: string;
        const queryParams: (string | number)[] = [];

        if (dialect === "postgres") {
          tablesQuery = `
            SELECT table_catalog, table_schema, table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
          `;
          if (tableSearch) {
            tablesQuery += ` AND table_name ILIKE $1`;
            queryParams.push(`%${tableSearch}%`);
          }
          tablesQuery += ` ORDER BY table_name;`;
        } else {
          tablesQuery = `
            SELECT table_catalog, table_schema, table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
          `;
          if (tableSearch) {
            tablesQuery += ` AND table_name LIKE ?`;
            queryParams.push(`%${tableSearch}%`);
          }
          tablesQuery += ` ORDER BY table_name;`;
        }

        const tablesResult = await(
          dialect === "postgres"
            ? client.query(tablesQuery, queryParams)
            : client.query(tablesQuery, [queryParams])[0]
        );

        // Step 2b: Loop through tables and fetch details
        for (const table of tablesResult.rows || tablesResult) {
          const { table_name } = table;

          // Fetch columns
          let columnsQuery: string;
          const columnParams: (string | number)[] = [table_name];

          if (dialect === "postgres") {
            columnsQuery = `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = $1
            `;
            if (columnSearch) {
              columnsQuery += ` AND (column_name ILIKE $2 OR data_type ILIKE $2)`;
              columnParams.push(`%${columnSearch}%`);
            }
            columnsQuery += ` ORDER BY ordinal_position;`;
          } else {
            columnsQuery = `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = DATABASE() AND table_name = ?
            `;
            if (columnSearch) {
              columnsQuery += ` AND (column_name LIKE ? OR data_type LIKE ?)`;
              columnParams.push(`%${columnSearch}%`, `%${columnSearch}%`);
            }
            columnsQuery += ` ORDER BY ordinal_position;`;
          }

          const columnsResult = await(
            dialect === "postgres"
              ? client.query(columnsQuery, columnParams)
              : client.query(columnsQuery, columnParams)[0]
          );

          if (columnSearch && columnsResult.rows?.length === 0) continue;

          // Fetch primary keys
          let primaryKeyQuery: string;
          if (dialect === "postgres") {
            primaryKeyQuery = `
              SELECT kcu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = $1;
            `;
          } else {
            primaryKeyQuery = `
              SELECT column_name
              FROM information_schema.key_column_usage
              WHERE table_schema = DATABASE()
                AND table_name = ?
                AND constraint_name = 'PRIMARY';
            `;
          }

          const primaryKeyResult = await(
            dialect === "postgres"
              ? client.query(primaryKeyQuery, [table_name])
              : client.query(primaryKeyQuery, [table_name])[0]
          );
          const primaryKeys = (primaryKeyResult.rows || primaryKeyResult).map(
            (r: any) => r.column_name
          );

          // Fetch foreign keys
          let foreignKeyQuery: string;
          if (dialect === "postgres") {
            foreignKeyQuery = `
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
            `;
          } else {
            foreignKeyQuery = `
              SELECT kcu.column_name, kcu.referenced_table_name AS referenced_table,
                     kcu.referenced_column_name AS referenced_column, kcu.constraint_name
              FROM information_schema.key_column_usage kcu
              WHERE kcu.table_schema = DATABASE()
                AND kcu.table_name = ?
                AND kcu.referenced_table_name IS NOT NULL;
            `;
          }

          const foreignKeyResult = await(
            dialect === "postgres"
              ? client.query(foreignKeyQuery, [table_name])
              : client.query(foreignKeyQuery, [table_name])[0]
          );

          // Fetch sample values
          let valuesQuery = `SELECT * FROM ${
            dialect === "postgres" ? `public.${table_name}` : table_name
          }`;
          const valuesParams: number[] = [];
          if (typeof limit === "number") {
            valuesQuery += dialect === "postgres" ? ` LIMIT $1` : ` LIMIT ?`;
            valuesParams.push(limit);
          }
          const valuesResult = await(
            dialect === "postgres"
              ? client.query(valuesQuery, valuesParams)
              : client.query(valuesQuery, valuesParams)[0]
          );
          const values = valuesResult.rows || valuesResult;

          // Construct Column objects
          const columns: Column[] = (columnsResult.rows || columnsResult).map(
            (col: any) => ({
              ...col,
              is_primary_key: primaryKeys.includes(col.column_name),
            })
          );

          // Construct Table object
          schema.push({
            ...table,
            comment: null,
            columns,
            primary_keys: primaryKeys,
            foreign_keys: foreignKeyResult.rows || foreignKeyResult,
            values,
          });
        }

        return schema;
      } finally {
        if (dialect === "postgres") {
          client.release();
        } else {
          client.release();
        }
      }
    },
  },

  Mutation: {
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

      let client: any;
      let errorsCount = 0;

      try {
        if (dialect === "postgres") {
          client = await(pool as PgPool).connect();
        } else {
          client = await(pool as MySqlPool).getConnection();
        }

        // Execute query
        const response = await(
          dialect === "postgres" ? client.query(query) : client.query(query)[0]
        );

        // Try to run EXPLAIN ANALYZE for timings
        let planningTime = 0;
        let executionTimeFromExplain = 0;
        try {
          const explainQuery =
            dialect === "postgres"
              ? `EXPLAIN (ANALYZE, FORMAT JSON) ${query}`
              : `EXPLAIN ANALYZE ${query}`;
          const explainResult = await(
            dialect === "postgres"
              ? client.query(explainQuery)
              : client.query(explainQuery)[0]
          );

          if (dialect === "postgres") {
            const plans = explainResult.rows[0][
              "QUERY PLAN"
            ] as ExplainAnalyzeJSON[];
            const plan = plans[0];
            planningTime = plan.PlanningTime ?? 0;
            executionTimeFromExplain = plan.ExecutionTime ?? 0;
          }
        } catch {
          errorsCount += 1;
        }

        // Calculate payload size and total time
        const payloadString = JSON.stringify(response.rows || response);
        const payloadSize = Buffer.byteLength(payloadString, "utf8") / 1024;
        const totalTime = planningTime + executionTimeFromExplain;

        return {
          rows: (response.rows || response) as Record<string, unknown>[],
          rowCount: response.rowCount ?? response.length,
          fields:
            dialect === "postgres"
              ? response.fields.map((field: FieldDef) => field.name)
              : response.fields?.map((field: any) => field.name) || [],
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
        if (dialect === "postgres") {
          client.release();
        } else {
          client.release();
        }
      }
    },
  },
};

// Create Yoga GraphQL server
const { handleRequest } = createYoga<NextContext>({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
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
import {
  Column,
  ExplainAnalyzeJSON,
  ForeignKey,
  Table,
  QueryResult,
} from "@/app/types/query";
import { createSchema, createYoga } from "graphql-yoga";
import { FieldDef, Pool } from "pg";

// Define the Next.js context type
interface NextContext {
  params: Promise<Record<string, string>>;
}

// Custom Response type to ensure compatibility
const CustomResponse = Response as typeof Response & {
  json: (data: unknown, init?: ResponseInit) => Response;
};

// Configure PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  application_name: "sculptql-api",
});

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
      const client = await pool.connect();
      try {
        // Step 2a: Query tables from PostgreSQL information_schema
        let tablesQuery = `
          SELECT table_catalog, table_schema, table_name, table_type
          FROM information_schema.tables
          WHERE table_schema = 'public'
        `;
        const queryParams: string[] = [];

        if (tableSearch) {
          tablesQuery += ` AND table_name ILIKE $1`;
          queryParams.push(`%${tableSearch}%`);
        }
        tablesQuery += ` ORDER BY table_name;`;

        const tablesResult = await client.query<{
          table_catalog: string;
          table_schema: string;
          table_name: string;
          table_type: string;
        }>(tablesQuery, queryParams);

        const schema: Table[] = [];

        // Step 2b: Loop through tables and fetch details
        for (const table of tablesResult.rows) {
          const { table_name } = table;

          // Fetch columns
          let columnsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
          `;
          const columnParams: string[] = [table_name];

          if (columnSearch) {
            columnsQuery += ` AND (column_name ILIKE $2 OR data_type ILIKE $2)`;
            columnParams.push(`%${columnSearch}%`);
          }

          columnsQuery += ` ORDER BY ordinal_position;`;
          const columnsResult = await client.query<{
            column_name: string;
            data_type: string;
            is_nullable: string;
          }>(columnsQuery, columnParams);

          if (columnSearch && columnsResult.rows.length === 0) continue;

          // Fetch primary keys
          const primaryKeyQuery = `
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'public'
              AND tc.table_name = $1;
          `;
          const primaryKeyResult = await client.query<{ column_name: string }>(
            primaryKeyQuery,
            [table_name]
          );
          const primaryKeys = primaryKeyResult.rows.map((r) => r.column_name);

          // Fetch foreign keys
          const foreignKeyQuery = `
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
          const foreignKeyResult = await client.query<ForeignKey>(
            foreignKeyQuery,
            [table_name]
          );

          // Fetch sample values
          let valuesQuery = `SELECT * FROM public.${table_name}`;
          const valuesParams: number[] = [];
          if (typeof limit === "number") {
            valuesQuery += ` LIMIT $1`;
            valuesParams.push(limit);
          }
          const valuesResult = await client.query(valuesQuery, valuesParams);
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
        client.release();
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

      const client = await pool.connect();
      let errorsCount = 0;

      try {
        // Execute query
        const response = await client.query(query);

        // Try to run EXPLAIN ANALYZE for timings
        let planningTime = 0;
        let executionTimeFromExplain = 0;
        try {
          const explainQuery = `EXPLAIN (ANALYZE, FORMAT JSON) ${query}`;
          const explainResult = await client.query(explainQuery);
          const plans = explainResult.rows[0][
            "QUERY PLAN"
          ] as ExplainAnalyzeJSON[];
          const plan = plans[0];
          planningTime = plan.PlanningTime ?? 0;
          executionTimeFromExplain = plan.ExecutionTime ?? 0;
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
          fields: response.fields.map((field: FieldDef) => field.name),
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
        client.release();
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

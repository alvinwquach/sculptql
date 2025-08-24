import { Column, ForeignKey, Table } from "@/app/types/query";
import { createSchema, createYoga } from "graphql-yoga";
import { Pool } from "pg";

// Define the Next.js context type
interface NextContext {
  params: Promise<Record<string, string>>;
}

// Custom Response type to ensure compatibility
const CustomResponse = Response as typeof Response & {
  json: (data: unknown, init?: ResponseInit) => Response;
};

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
  // Optional search string to filter tables
  tableSearch?: string;
  // Optional search string to filter columns
  columnSearch?: string;

  // Optional limit for number of rows to fetch
  limit?: number;
}

// Define GraphQL type definitions
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
  # JSON scalar for row data
  scalar JSON
  type Query {
    schema(tableSearch: String, columnSearch: String, limit: Int): [Table!]!
  }
`;

// Resolver functions for GraphQL queries
const resolvers = {
  Query: {
    schema: async (
      _: unknown,
      { tableSearch = "", columnSearch = "", limit }: SchemaArgs
    ): Promise<Table[]> => {
      const client = await pool.connect();
      try {
        // Step 1: Query tables from PostgreSQL information_schema
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

        // Step 2: Loop through each table and fetch columns, keys, and data
        for (const table of tablesResult.rows) {
          const { table_name } = table;

          // Step 2a: Fetch columns for the current table
          let columnsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
          `;
          const columnParams: string[] = [table_name];

          if (columnSearch) {
            columnsQuery += ` AND (column_name ILIKE $2 OR data_type ILIKE $2`;
            if (columnSearch.includes("primary")) {
              columnsQuery += ` OR EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = $1
                  AND kcu.column_name = columns.column_name
              )`;
            }
            if (columnSearch.includes("foreign")) {
              columnsQuery += ` OR EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = $1
                  AND kcu.column_name = columns.column_name
              )`;
            }
            columnsQuery += `)`;
            columnParams.push(`%${columnSearch}%`);
          }

          columnsQuery += ` ORDER BY ordinal_position;`;
          const columnsResult = await client.query<{
            column_name: string;
            data_type: string;
            is_nullable: string;
          }>(columnsQuery, columnParams);

          if (columnSearch && columnsResult.rows.length === 0) continue;

          // Step 2b: Fetch primary keys
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

          // Step 2c: Fetch foreign keys
          const foreignKeyQuery = `
            SELECT kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column, tc.constraint_name
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

          // Step 2d: Fetch table data (values)
          let valuesQuery = `SELECT * FROM public.${table_name}`;
          const valuesParams: any[] = [];
          if (limit) {
            valuesQuery += ` LIMIT $1`;
            valuesParams.push(limit);
          }
          const valuesResult = await client.query(valuesQuery, valuesParams);
          // Rows as JSON objects
          const values = valuesResult.rows;

          // Step 2e: Construct Column objects
          const columns: Column[] = columnsResult.rows.map((col) => ({
            ...col,
            is_primary_key: primaryKeys.includes(col.column_name),
          }));

          // Step 2f: Construct Table object
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
};

// Step 3: Create Yoga GraphQL server
const { handleRequest } = createYoga<NextContext>({
  schema: createSchema({ typeDefs, resolvers }),
  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: "/api/graphql",
  fetchAPI: {
    Response: CustomResponse,
  },
});

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};
import {
  Column,
  ExplainAnalyzeJSON,
  ForeignKey,
  Table,
  QueryResult,
} from "@/app/types/query";
import { createSchema, createYoga } from "graphql-yoga";
import {
  FieldDef,
  Pool as PgPool,
  PoolClient as PgClient,
  QueryResult as PgQueryResult,
} from "pg";
import mysql, {
  PoolConnection,
  RowDataPacket,
  FieldPacket,
} from "mysql2/promise";

const dialect = process.env.DB_DIALECT ?? "postgres";

interface NextContext {
  params: Promise<Record<string, string>>;
}

const CustomResponse = Response as typeof Response & {
  json: (data: unknown, init?: ResponseInit) => Response;
};

const pgPool =
  dialect === "postgres"
    ? new PgPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        application_name: "sculptql-api",
      })
    : null;

const myPool =
  dialect === "mysql"
    ? mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 5,
      })
    : null;

interface SchemaArgs {
  tableSearch?: string;
  columnSearch?: string;
  limit?: number;
}

type DatabaseQueryResult =
  | PgQueryResult<Record<string, unknown>>
  | [RowDataPacket[], FieldPacket[]];

const typeDefs = `
  scalar JSON

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

  type Query {
    schema(tableSearch: String, columnSearch: String, limit: Int): [Table!]!
  }

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
      if (dialect === "postgres") {
        const client: PgClient = await pgPool!.connect();
        try {
          const tablesResult = await client.query<{
            table_catalog: string;
            table_schema: string;
            table_name: string;
            table_type: string;
          }>(
            `
            SELECT table_catalog, table_schema, table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
              ${tableSearch ? "AND table_name ILIKE $1" : ""}
            ORDER BY table_name;
          `,
            tableSearch ? [`%${tableSearch}%`] : []
          );

          const schema: Table[] = [];
          for (const table of tablesResult.rows) {
            const { table_name } = table;

            const columnsResult = await client.query<{
              column_name: string;
              data_type: string;
              is_nullable: string;
            }>(
              `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = $1
                ${
                  columnSearch
                    ? "AND (column_name ILIKE $2 OR data_type ILIKE $2)"
                    : ""
                }
              ORDER BY ordinal_position;
            `,
              columnSearch ? [table_name, `%${columnSearch}%`] : [table_name]
            );

            if (columnSearch && columnsResult.rows.length === 0) continue;

            const primaryKeyResult = await client.query<{
              column_name: string;
            }>(
              `
              SELECT kcu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = $1;
            `,
              [table_name]
            );

            const primaryKeys = primaryKeyResult.rows.map((r) => r.column_name);

            const foreignKeyResult = await client.query<ForeignKey>(
              `
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
              [table_name]
            );

            const valuesResult = await client.query<Record<string, unknown>>(
              `SELECT * FROM public.${table_name} ${limit ? "LIMIT $1" : ""}`,
              limit ? [limit] : []
            );

            const columns: Column[] = columnsResult.rows.map((col) => ({
              ...col,
              is_primary_key: primaryKeys.includes(col.column_name),
            }));

            schema.push({
              ...table,
              comment: null,
              columns,
              primary_keys: primaryKeys,
              foreign_keys: foreignKeyResult.rows,
              values: valuesResult.rows.map((row) =>
                JSON.parse(JSON.stringify(row))
              ),
            });
          }

          return schema;
        } finally {
          client.release();
        }
      } else {
        const client: PoolConnection = await myPool!.getConnection();
        try {
          const [tablesResult] = await client.query<RowDataPacket[]>(
            `
            SELECT table_catalog, table_schema, table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              ${tableSearch ? "AND table_name LIKE ?" : ""}
            ORDER BY table_name;
          `,
            tableSearch ? [`%${tableSearch}%`] : []
          );

          const schema: Table[] = [];
          for (const table of tablesResult) {
            const { table_name } = table as { table_name: string };

            const [columnsResult] = await client.query<RowDataPacket[]>(
              `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = DATABASE() AND table_name = ?
                ${
                  columnSearch
                    ? "AND (column_name LIKE ? OR data_type LIKE ?)"
                    : ""
                }
              ORDER BY ordinal_position;
            `,
              columnSearch
                ? [table_name, `%${columnSearch}%`, `%${columnSearch}%`]
                : [table_name]
            );

            if (columnSearch && columnsResult.length === 0) continue;

            const [primaryKeyResult] = await client.query<RowDataPacket[]>(
              `
              SELECT column_name
              FROM information_schema.key_column_usage
              WHERE table_schema = DATABASE()
                AND table_name = ?
                AND constraint_name = 'PRIMARY';
            `,
              [table_name]
            );

            const primaryKeys = primaryKeyResult.map(
              (r) => (r as { column_name: string }).column_name
            );

            const [foreignKeyResult] = await client.query<RowDataPacket[]>(
              `
              SELECT kcu.column_name, kcu.referenced_table_name AS referenced_table,
                     kcu.referenced_column_name AS referenced_column, kcu.constraint_name
              FROM information_schema.key_column_usage kcu
              WHERE kcu.table_schema = DATABASE()
                AND kcu.table_name = ?
                AND kcu.referenced_table_name IS NOT NULL;
            `,
              [table_name]
            );

            const [valuesResult] = await client.query<RowDataPacket[]>(
              `SELECT * FROM ${table_name} ${limit ? "LIMIT ?" : ""}`,
              limit ? [limit] : []
            );

            const columns: Column[] = columnsResult.map((col) => ({
              ...(col as {
                column_name: string;
                data_type: string;
                is_nullable: string;
              }),
              is_primary_key: primaryKeys.includes(
                (col as { column_name: string }).column_name
              ),
            }));

            schema.push({
              ...(table as {
                table_catalog: string;
                table_schema: string;
                table_name: string;
                table_type: string;
              }),
              comment: null,
              columns,
              primary_keys: primaryKeys,
              foreign_keys: foreignKeyResult as ForeignKey[],
              values: valuesResult.map((row) =>
                JSON.parse(JSON.stringify(row))
              ),
            });
          }

          return schema;
        } finally {
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

      const client = await(
        dialect === "postgres" ? pgPool!.connect() : myPool!.getConnection()
      );

      let errorsCount = 0;

      try {
        const response: DatabaseQueryResult = await(
          dialect === "postgres"
            ? (client as PgClient).query(query)
            : (client as PoolConnection).execute(query)
        );

        let planningTime = 0;
        let executionTimeFromExplain = 0;

        try {
          if (dialect === "postgres") {
            const explainQuery = `EXPLAIN (ANALYZE, FORMAT JSON) ${query}`;
            const explainResult = await(client as PgClient).query(explainQuery);
            const plans = explainResult.rows[0][
              "QUERY PLAN"
            ] as ExplainAnalyzeJSON[];
            const plan = plans[0];
            planningTime = plan.PlanningTime ?? 0;
            executionTimeFromExplain = plan.ExecutionTime ?? 0;
          } else {
            await(client as PoolConnection).execute("SET PROFILING = 1");
            await(client as PoolConnection).execute(query);
            const [profileResults] = await(client as PoolConnection).execute(
              "SHOW PROFILES"
            ) as RowDataPacket[][];

            if (profileResults.length > 0) {
              const lastProfile = profileResults[profileResults.length - 1];
              planningTime = parseFloat(lastProfile.Query_time ?? "0");
              executionTimeFromExplain = parseFloat(
                lastProfile.Lock_time ?? "0"
              );
            }
          }
        } catch {
          errorsCount += 1;
        }

        let rows: Record<string, unknown>[] = [];
        let rowCount: number | undefined = 0;
        let fields: string[] = [];

        if (dialect === "postgres") {
          const pgResponse = response as PgQueryResult<Record<string, unknown>>;
          rows = pgResponse.rows || [];
          rowCount = pgResponse.rowCount ?? undefined;
          fields =
            pgResponse.fields?.map((field: FieldDef) => field.name) || [];
        } else {
          const [mySqlRows, mySqlFields] = response as [
            RowDataPacket[],
            FieldPacket[]
          ];
          rows = mySqlRows.map((row) => ({ ...row }));
          rowCount = mySqlRows.length;
          fields = mySqlFields?.map((field) => field.name) || [];
        }

        const payloadString = JSON.stringify(rows);
        const payloadSize = Buffer.byteLength(payloadString, "utf8") / 1024;

        return {
          rows,
          rowCount,
          fields,
          payloadSize: Number(payloadSize.toFixed(4)),
          totalTime: Number(
            (planningTime + executionTimeFromExplain).toFixed(4)
          ),
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

const { handleRequest } = createYoga<NextContext>({
  schema: createSchema({ typeDefs, resolvers }),
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

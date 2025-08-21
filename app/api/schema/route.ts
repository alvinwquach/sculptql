import { TableSchema, ColumnSchema } from "@/app/types/query";
import { NextResponse } from "next/server";
import { Pool } from "pg";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableSearch = searchParams.get("tableSearch")?.toLowerCase() || "";
  const columnSearch = searchParams.get("columnSearch")?.toLowerCase() || "";

  try {
    const client = await pool.connect();
    try {
      // Fetch tables with optional table search
      let tablesQuery = `
        SELECT 
          table_catalog,
          table_schema,
          table_name,
          table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;
      const queryParams: string[] = [];
      if (tableSearch) {
        tablesQuery += ` AND table_name ILIKE $1`;
        queryParams.push(`%${tableSearch}%`);
      }
      tablesQuery += ` ORDER BY table_name;`;
      const tablesResult = await client.query(tablesQuery, queryParams);
      const tables = tablesResult.rows;

      const schema: TableSchema[] = [];

      for (const table of tables) {
        const { table_name } = table;

        // Fetch columns with optional column search
        let columnsQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
        `;
        const columnParams = [table_name];
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
        const columnsResult = await client.query(columnsQuery, columnParams);

        // Skip tables with no matching columns if column search is provided
        if (columnSearch && columnsResult.rows.length === 0) {
          continue;
        }

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
        const primaryKeyResult = await client.query(primaryKeyQuery, [
          table_name,
        ]);
        const primaryKeys = primaryKeyResult.rows.map((row) => row.column_name);

        // Fetch foreign keys
        const foreignKeyQuery = `
          SELECT
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
            AND tc.table_name = $1;
        `;
        const foreignKeyResult = await client.query(foreignKeyQuery, [
          table_name,
        ]);

        const columns: ColumnSchema[] = columnsResult.rows.map((column) => ({
          ...column,
          is_primary_key: primaryKeys.includes(column.column_name),
        }));

        schema.push({
          ...table,
          comment: null,
          columns,
          primary_keys: primaryKeys,
          foreign_keys: foreignKeyResult.rows,
        });
      }

      return NextResponse.json({ schema });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching schema:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}

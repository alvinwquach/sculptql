import { ColumnSchema, TableDescription } from "@/app/types/query";
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
  connectionTimeoutMillis: 2000,
  application_name: "sculptql-api",
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tableName = searchParams.get("table");

  if (!tableName) {
    return NextResponse.json(
      { error: "Missing 'table' query parameter" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();
    try {
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const columnsResult = await client.query(columnsQuery, [tableName]);

      if (columnsResult.rows.length === 0) {
        return NextResponse.json(
          { error: `Table '${tableName}' not found` },
          { status: 404 }
        );
      }

      const primaryKeyQuery = `
        SELECT 
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `;
      const primaryKeyResult = await client.query(primaryKeyQuery, [tableName]);
      const primaryKeys = primaryKeyResult.rows.map((row) => row.column_name);

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
      const foreignKeyResult = await client.query(foreignKeyQuery, [tableName]);

      const columns: ColumnSchema[] = columnsResult.rows.map((column) => ({
        ...column,
        is_primary_key: primaryKeys.includes(column.column_name),
      }));

      const schema: TableDescription = {
        table_name: tableName,
        columns,
        primary_keys: primaryKeys,
        foreign_keys: foreignKeyResult.rows,
      };

      return NextResponse.json(schema);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}

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

interface TableSchema {
  table_name: string;
  table_catalog: string;
  table_schema: string;
  table_type: string;
  comment: string | null;
}

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
      const tablesQuery = `
        SELECT 
          table_name,
          table_catalog,
          table_schema,
          table_type,
          NULL AS comment
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY table_name;
      `;
      const tablesResult = await client.query(tablesQuery, [tableName]);

      if (tablesResult.rows.length === 0) {
        return NextResponse.json(
          { error: `Table '${tableName}' not found` },
          { status: 404 }
        );
      }

      const table: TableSchema = tablesResult.rows[0];
      return NextResponse.json({ tables: [table] });
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
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

interface ColumnSchema {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableDescription {
  table_name: string;
  columns: ColumnSchema[];
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

      const schema: TableDescription = {
        table_name: tableName,
        columns: columnsResult.rows,
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

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

interface TableSchema {
  table_name: string;
  columns: ColumnSchema[];
}

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const tablesQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      const tablesResult = await client.query(tablesQuery);
      const tables = tablesResult.rows.map((row) => row.table_name);

      const schemas: TableSchema[] = [];

      for (const table of tables) {
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
        const columnsResult = await client.query(columnsQuery, [table]);
        schemas.push({
          table_name: table,
          columns: columnsResult.rows,
        });
      }

      return NextResponse.json({ tables: schemas });
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

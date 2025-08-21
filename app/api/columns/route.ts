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
  const tableName = searchParams.get("table");

  if (!tableName) {
    return NextResponse.json(
      { error: "Table name is required" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();
    try {
      const columnsQuery = `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY column_name;
        `;
      const columnsResult = await client.query(columnsQuery, [tableName]);
      const columnNames = columnsResult.rows.map((row) => row.column_name);
      return NextResponse.json({ columns: columnNames });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching columns:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Unknown error" },
      { status: 500 }
    );
  }
}

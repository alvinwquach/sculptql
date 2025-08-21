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

function isValidName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get("table");
  const columnName = searchParams.get("column");

  if (!tableName || !columnName) {
    return NextResponse.json(
      { error: "Table and column names are required" },
      { status: 400 }
    );
  }

  if (!isValidName(tableName) || !isValidName(columnName)) {
    return NextResponse.json(
      { error: "Invalid table or column name" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT DISTINCT ${columnName}
        FROM ${tableName}
        WHERE ${columnName} IS NOT NULL
        ORDER BY ${columnName}
        LIMIT 100;
      `;

      const result = await client.query(query);

      const values = result.rows.map((row) => String(row[columnName]));
      return NextResponse.json({ values });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching unique values:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch unique values" },
      { status: 500 }
    );
  }
}

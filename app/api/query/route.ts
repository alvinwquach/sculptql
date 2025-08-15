import { NextRequest, NextResponse } from "next/server";
import { Pool, FieldDef } from "pg";
import { ExplainAnalyzeJSON, QueryResult } from "../../types/query";

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

export async function POST(request: NextRequest) {
  let errorsCount = 0;

  try {
    const { query } = (await request.json()) as { query: string };

    if (!query) {
      errorsCount += 1;
      return NextResponse.json(
        { error: "Missing required field: query", errorsCount },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const response = await client.query(query);

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

      const payloadString = JSON.stringify(response.rows);
      const payloadSize = Buffer.byteLength(payloadString, "utf8") / 1024;

      const totalTime = planningTime + executionTimeFromExplain;

      return NextResponse.json({
        rows: response.rows as Record<string, unknown>[],
        rowCount: response.rowCount ?? undefined,
        fields: response.fields.map((field: FieldDef) => field.name),
        payloadSize: Number(payloadSize.toFixed(4)),
        totalTime: Number(totalTime.toFixed(4)),
        errorsCount,
      } as QueryResult);
    } finally {
      client.release();
    }
  } catch (error) {
    errorsCount += 1;
    return NextResponse.json(
      {
        error: (error as Error).message || "Unknown error",
        errorsCount,
      },
      { status: 500 }
    );
  }
}
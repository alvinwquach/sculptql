import { sumPlanStat } from "@/app/utils/formatTime";
import { NextRequest, NextResponse } from "next/server";
import { Pool, FieldDef, Client } from "pg";
import {
  QueryResult,
  ExplainPlanNode,
  ExplainAnalyzeJSON,
} from "../../types/query";

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
  let warningsCount = 0;
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

    let locksWaitTime = 0;
    const lockStartTime = performance.now();
    const lockQuery = `
      SELECT wait_event_type, wait_event 
      FROM pg_stat_activity 
      WHERE query = $1 AND state = 'active' AND wait_event IS NOT NULL
    `;
    const lockResult = await pool.query(lockQuery, [query]);
    if (lockResult.rows.length > 0) {
      locksWaitTime = performance.now() - lockStartTime;
    }

    const startExecTime = performance.now();
    const client = await pool.connect();

    const noticeListener = () => {
      warningsCount += 1;
    };
    client.on("notice", noticeListener);

    try {
      const response = await client.query(query);
      const executionDuration = performance.now() - startExecTime;

      let queryPlan = "";
      let indexUsed = false;
      let estimatedCost = 0;
      let planningTime = 0;
      let executionTimeFromExplain = 0;
      let tablesInvolved: string[] = [];
      let rowsFiltered = 0;
      let parallelWorkers = 0;
      let tempFilesSize = 0;
      let sharedHitBlocks = 0;
      let sharedReadBlocks = 0;
      let cacheHit = false;

      try {
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
        const explainResult = await client.query(explainQuery);

        const plans = explainResult.rows[0][
          "QUERY PLAN"
        ] as ExplainAnalyzeJSON[];
        const plan = plans[0];

        queryPlan = JSON.stringify(plan, null, 2);

        planningTime = plan.PlanningTime ?? 0;
        executionTimeFromExplain = plan.ExecutionTime ?? 0;
        estimatedCost = plan.Plan?.["Total Cost"] ?? 0;

        const planIncludesIndexScan = (node: ExplainPlanNode): boolean => {
          if (node["Node Type"].toLowerCase().includes("index scan"))
            return true;
          if (!node.Plans) return false;
          return node.Plans.some(planIncludesIndexScan);
        };
        indexUsed = planIncludesIndexScan(plan.Plan);

        const extractTables = (node: ExplainPlanNode) => {
          if (node["Relation Name"]) tablesInvolved.push(node["Relation Name"]);
          if (node.Plans) node.Plans.forEach(extractTables);
        };
        extractTables(plan.Plan);
        tablesInvolved = [...new Set(tablesInvolved)];

        rowsFiltered = sumPlanStat(plan.Plan, "Rows Removed by Filter");

        parallelWorkers =
          sumPlanStat(plan.Plan, "Workers Planned") +
          sumPlanStat(plan.Plan, "Workers Launched");

        tempFilesSize = sumPlanStat(plan.Plan, "Temp File Size") / 1024 || 0;

        sharedHitBlocks = sumPlanStat(plan.Plan, "Shared Hit Blocks");
        sharedReadBlocks = sumPlanStat(plan.Plan, "Shared Read Blocks");

        cacheHit = sharedHitBlocks > 0;
      } catch {
        queryPlan = "Unable to retrieve query plan";
        tablesInvolved = [];
        warningsCount += 1;
      }

      const payloadString = JSON.stringify(response.rows);
      const payloadSize = Buffer.byteLength(payloadString, "utf8") / 1024;

      const rowsMatched = response.rowCount ?? 0;
      const averageRowSize =
        response.rows.length > 0
          ? (payloadSize * 1024) / response.rows.length
          : 0;

      const responseTime = executionDuration;

      const rowProcessingTime =
        response.rows.length > 0 ? responseTime / response.rows.length : 0;

      const totalTime = planningTime + executionTimeFromExplain;

      const queryType = query.trim().split(/\s+/)[0].toUpperCase();

      return NextResponse.json({
        rows: response.rows,
        rowCount: response.rowCount ?? undefined,
        fields: response.fields.map((field: FieldDef) => field.name),
        payloadSize: Number(payloadSize.toFixed(4)),
        parsingTime: Number(planningTime.toFixed(4)),
        executionTime: Number(executionTimeFromExplain.toFixed(4)),
        responseTime: Number(responseTime.toFixed(4)),
        totalTime: Number(totalTime.toFixed(4)),
        indexUsed,
        rowsFiltered,
        rowsMatched,
        cacheHit,
        queryPlan,
        warningsCount,
        errorsCount,
        averageRowSize: Number(averageRowSize.toFixed(4)),
        rowProcessingTime: Number(rowProcessingTime.toFixed(4)),
        queryType,
        estimatedCost: Number(estimatedCost.toFixed(4)),
        tablesInvolved,
        locksWaitTime: Number(locksWaitTime.toFixed(4)),
        parallelWorkers,
        tempFilesSize: Number(tempFilesSize.toFixed(4)),
        ioStats: {
          sharedHitBlocks,
          sharedReadBlocks,
        },
      } as QueryResult);
    } finally {
      client.off("notice", noticeListener);
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

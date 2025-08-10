export interface ExplainPlanNode {
  "Node Type": string;
  "Relation Name"?: string;
  "Total Cost"?: number;
  "Rows Removed by Filter"?: number;
  "Workers Planned"?: number;
  "Workers Launched"?: number;
  "Temp Files"?: number;
  "Temp File Size"?: number;
  "Shared Hit Blocks"?: number;
  "Shared Read Blocks"?: number;
  Plans?: ExplainPlanNode[];
}

export interface ExplainAnalyzeJSON {
  Plan: ExplainPlanNode;
  PlanningTime?: number;
  ExecutionTime?: number;
}

export interface QueryResult {
  rows: Record<string, string | number | boolean | null>[];
  rowCount?: number;
  fields: string[];
  payloadSize?: number;
  parsingTime?: number;
  executionTime?: number;
  responseTime?: number;
  totalTime?: number;
  indexUsed?: boolean;
  averageRowSize?: number;
  rowsMatched?: number;
  rowsFiltered?: number;
  cacheHit?: boolean;
  queryPlan?: string;
  warningsCount?: number;
  errorsCount?: number;
  rowProcessingTime?: number;
  queryType?: string;
  estimatedCost?: number;
  tablesInvolved?: string[];
  locksWaitTime?: number;
  parallelWorkers?: number;
  tempFilesSize?: number;
  ioStats?: {
    sharedHitBlocks?: number;
    sharedReadBlocks?: number;
  };
}

export type ViewMode = "table" | "json" | "stats";

export interface ChartDataItem {
  name: string;
  value: number;
  unit?: string;
}

export interface Stat {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}

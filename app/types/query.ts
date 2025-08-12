import { LucideIcon } from "lucide-react";

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount?: number;
  fields: string[];
  payloadSize?: number;
  parsingTime?: number;
  executionTime?: number;
  responseTime?: number;
  totalTime?: number;
  indexUsed?: boolean;
  rowsFiltered?: number;
  rowsMatched?: number;
  cacheHit?: boolean;
  queryPlan?: string;
  warningsCount?: number;
  errorsCount?: number;
  averageRowSize?: number;
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


export interface ExplainPlanNode {
  "Node Type": string;
  "Relation Name"?: string;
  Plans?: ExplainPlanNode[];
  "Total Cost"?: number;
  "Rows Removed by Filter"?: number;
  "Workers Planned"?: number;
  "Workers Launched"?: number;
  "Temp File Size"?: number;
  "Shared Hit Blocks"?: number;
  "Shared Read Blocks"?: number;
}

export interface ExplainAnalyzeJSON {
  Plan: ExplainPlanNode;
  PlanningTime?: number;
  ExecutionTime?: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
  unit: string;
}

export type ViewMode = "table" | "json" | "stats" | "show" | "describe";

export interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

export interface ColumnSchema {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface TableSchema {
  table_name: string;
  table_catalog: string;
  table_schema: string;
  table_type: string;
  comment: string | null;
}

export interface TableDescription {
  table_name: string;
  columns: ColumnSchema[];
}

export interface Column {
  column_name: string;
}

export interface TableColumn {
  [tableName: string]: string[];
}

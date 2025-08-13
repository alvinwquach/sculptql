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

export type TableColumn = Record<string, string[]>;

export interface QueryHistoryItem {
  query: string;
  timestamp: string;
}

export interface Tab {
  id: number;
  title: string;
  query: string;
}

export interface SqlColumn {
  expr: {
    column?: string;
    value?: string;
  };
}

export interface SqlFromItem {
  table: string;
  alias?: string;
}

export interface SelectAst {
  type: "select";
  columns: SqlColumn[];
  from: SqlFromItem[];
  where?: unknown;
  orderby?: unknown;
  groupby?: unknown;
  limit?: unknown;
}

export interface ASTNode {
  type: string;
  from?: Array<{ table?: string }>;
  columns?: Array<{ expr?: { column?: string; value?: string } }>;
}

export type SqlAst = SelectAst | SelectAst[] | ASTNode | ASTNode[] | null;

import { LucideIcon } from "lucide-react";
import { Select } from "node-sql-parser";

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
  unit?: string;
  color?: string;
}

export type ViewMode =
  | "table"
  | "json"
  | "stats"
  | "show"
  | "describe"
  | "bar"
  | "pie"
  | "line";

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
  is_primary_key?: boolean;
}

export interface ForeignKeySchema {
  column_name: string;
  referenced_table: string;
  referenced_column: string;
  constraint_name: string;
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
  primary_keys: string[];
  foreign_keys: ForeignKeySchema[];
}

export interface Column {
  column_name: string;
}

export type TableColumn = Record<string, string[]>;

export interface QueryHistoryItem {
  query: string;
  timestamp: string;
}

export interface PinnedQuery {
  query: string;
  timestamp: string;
}

export interface BookmarkedQuery {
  query: string;
  timestamp: string;
}

export interface LabeledQuery {
  label: string;
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

export interface TableReference {
  table: string | null;
  [key: string]: unknown;
}

export interface SelectOption {
  value: string;
  label: string;
  aggregate?: boolean;
  column?: string;
}

export interface WhereCondition {
  logicalOperator?: SelectOption | null;
  column?: SelectOption | null;
  operator?: SelectOption | null;
  value?: SelectOption | null;
  value2?: SelectOption | null;
}

export interface WhereClause {
  conditions: WhereCondition[];
}

export interface OrderByClause {
  column?: SelectOption | null;
  direction?: SelectOption | null;
}

export interface JoinClause {
  table: SelectOption | null;
  onColumn1: SelectOption | null;
  onColumn2: SelectOption | null;
  joinType?: SelectOption | null;
}

export interface UniqueValues {
  condition1: SelectOption[];
  condition2: SelectOption[];
}

export type OptionType = {
  value: string;
  label: string;
};

export interface JsonFilter {
  field?: string;
  value?: string;
}

export interface HavingCondition {
  aggregate: SelectOption | null;
  column: SelectOption | null;
  operator: SelectOption | null;
  value: string | null;
  logicalOperator: SelectOption | null;
}

export interface QueryState {
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  selectedAggregate: SelectOption | null;
  aggregateColumn: SelectOption | null;
  decimalPlaces: SelectOption | null;
  whereClause: WhereClause;
  havingClause: { conditions: HavingCondition[] };
  orderByClause: OrderByClause;
  groupByColumns: SelectOption[];
  limit: SelectOption | null;
  uniqueValues: Record<string, SelectOption[]>;
  fetchError: string | null;
  queryError: string | null;
  joinClauses: JoinClause[];
  unionClauses: UnionClause[];
}

export interface UnionClause {
  table: SelectOption | null;
  unionType?: { value: string; label: string };
}

export interface CaseCondition {
  column: SelectOption | null;
  operator: SelectOption | null;
  value: SelectOption | null;
  result: SelectOption | null;
}

export interface WhenClause {
  conditions: CaseCondition[];
  result: SelectOption | null;
}

export interface CaseCondition {
  column: SelectOption | null;
  operator: SelectOption | null;
  value: SelectOption | null;
  result: SelectOption | null;
}

export interface CaseClause {
  conditions: CaseCondition[];
  elseValue: SelectOption | null;
  alias: string | null;
}

export interface CteNode {
  name: { value: string } | null;
  stmt: Select | Select[] | null;
  [key: string]: unknown;
}

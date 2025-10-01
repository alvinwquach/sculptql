import { LucideIcon } from "lucide-react";
import { Select } from "node-sql-parser";

// Interface for the having clause
export interface HavingClause {
  condition: {
    aggregateColumn: SelectOption | null;
    operator: SelectOption | null;
    value: SelectOption | null;
  };
}

// Interface for the query result
export interface QueryResult {
  error?: string;
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

// Interface for the explain plan node
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

// Interface for the explain analyze json
export interface ExplainAnalyzeJSON {
  Plan: ExplainPlanNode;
  PlanningTime?: number;
  ExecutionTime?: number;
}

// Interface for the chart data item
export interface ChartDataItem {
  name: string;
  value: number;
  unit?: string;
  color?: string;
}

// Interface for the view mode
export type ViewMode =
  | "table"
  | "json"
  | "stats"
  | "show"
  | "describe"
  | "bar"
  | "pie"
  | "line";

// Interface for the stat
export interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

// Interface for the column schema
export interface ColumnSchema {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_primary_key: boolean | undefined;
  is_indexed: boolean | string;
  index_names?: string[];
  uniqueValues?: string[];
}

// Interface for the foreign key schema
export interface ForeignKeySchema {
  column_name: string;
  referenced_table: string;
  referenced_column: string;
  constraint_name: string;
}

// Interface for the table schema
export interface TableSchema {
  table_name: string;
  table_catalog: string;
  table_schema: string;
  table_type: string;
  comment: string | null;
  values?: Record<string, string | number | null>[];
}

// Interface for the table description
export interface TableDescription {
  table_name: string;
  columns: ColumnSchema[];
  primary_keys: string[];
  foreign_keys: ForeignKeySchema[];
}

// Interface for the column
export interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  is_primary_key: boolean;
}

// Interface for the table column
export type TableColumn = Record<string, string[]>;

// Interface for the query history item
export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: string;
}

// Interface for the pinned query
export interface PinnedQuery {
  id: string;
  query: string;
  timestamp: string;
}

// Interface for the bookmarked query
export interface BookmarkedQuery {
  id: string;
  query: string;
  timestamp: string;
}

// Interface for the labeled query
export interface LabeledQuery {
  id: string;
  label: string;
  historyItemId: string;
  timestamp: string;
}

// Interface for the tab
export interface Tab {
  id: number;
  title: string;
  query: string;
}

// Interface for the sql column
export interface SqlColumn {
  expr: {
    column?: string;
    value?: string;
  };
}

// Interface for the sql from item
export interface SqlFromItem {
  table: string;
  alias?: string;
}

// Interface for the select ast
export interface SelectAst {
  type: "select";
  columns: SqlColumn[];
  from: SqlFromItem[];
  where?: unknown;
  orderby?: unknown;
  groupby?: unknown;
  limit?: unknown;
}

// Interface for the ast node
export interface ASTNode {
  type: string;
  from?: Array<{ table?: string }>;
  columns?: Array<{ expr?: { column?: string; value?: string } }>;
}

// Interface for the sql ast
export type SqlAst = SelectAst | SelectAst[] | ASTNode | ASTNode[] | null;

// Interface for the table reference
export interface TableReference {
  table: string | null;
  [key: string]: unknown;
}

// Interface for the select option
export interface SelectOption {
  value: string;
  label: string;
  operator?: string;
  aggregate?: boolean;
  column?: string;
  alias?: string;
}

// Interface for the where condition
export interface WhereCondition {
  logicalOperator?: SelectOption | null;
  column?: SelectOption | null;
  operator?: SelectOption | null;
  value?: SelectOption | null;
  value2?: SelectOption | null;
}

// Interface for the where clause
export interface WhereClause {
  conditions: WhereCondition[];
}

// Interface for the order by clause
export interface OrderByClause {
  column?: SelectOption | null;
  direction?: SelectOption | null;
}

// Interface for the join clause
export interface JoinClause {
  table: SelectOption | null;
  onColumn1: SelectOption | null;
  onColumn2: SelectOption | null;
  joinType?: SelectOption | null;
}

// Interface for the unique values
export interface UniqueValues {
  condition1: SelectOption[];
  condition2: SelectOption[];
}

// Interface for the option type
export type OptionType = {
  value: string;
  label: string;
};

// Interface for the json filter
export interface JsonFilter {
  field?: string;
  value?: string;
}

// Interface for the having condition
export interface HavingCondition {
  aggregateColumn: SelectOption | null;
  operator: SelectOption | null;
  value: SelectOption | null;
  logicalOperator: SelectOption | null;
}

// Interface for the query state
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
  caseClause: CaseClause;
}

// Interface for the union clause
export interface UnionClause {
  table: SelectOption | null;
  unionType?: { value: string; label: string };
}

// Interface for the case condition
export interface CaseCondition {
  column: SelectOption | null;
  operator: SelectOption | null;
  value: SelectOption | null;
  result: SelectOption | null;
}

// Interface for the when clause
export interface WhenClause {
  conditions: CaseCondition[];
  result: SelectOption | null;
}

// Interface for the case condition
export interface CaseCondition {
  column: SelectOption | null;
  operator: SelectOption | null;
  value: SelectOption | null;
  result: SelectOption | null;
}

// Interface for the case clause
export interface CaseClause {
  conditions: CaseCondition[];
  elseValue: SelectOption | null;
  alias: string | null;
}

// Interface for the cte node
export interface CteNode {
  name: { value: string } | null;
  stmt: Select | Select[] | null;
  [key: string]: unknown;
}

// Interface for the cte clause
export interface CteClause {
  alias: string | null;
  selectedColumns: SelectOption[];
  fromTable: SelectOption | null;
  whereClause: WhereClause;
  groupByColumns: SelectOption[];
  havingClause: { conditions: HavingCondition[] };
}

// Interface for the column type
export type ColumnType = string | SelectOption;

// Interface for the table schema
export interface TableSchema {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  table_type: string;
  comment: string | null;
  columns: ColumnSchema[];
  primary_keys: string[];
  foreign_keys: {
    column_name: string;
    referenced_table: string;
    referenced_column: string;
    constraint_name: string;
  }[];
}

// Interface for the foreign key
export interface ForeignKey {
  column_name: string;
  referenced_table: string;
  referenced_column: string;
  constraint_name: string;
}

// Interface for the erd node
export interface ERDNode {
  id: string;
  type: string;
  data: {
    label: string;
    columns: ColumnSchema[];
    primary_keys: string[];
  };
  position: { x: number; y: number };
}

// Interface for the erd edge
export interface ERDEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: string;
  animated?: boolean;
}

// Interface for the table
export interface Table {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  table_type: string;
  comment: string | null;
  columns: Column[];
  primary_keys: string[];
  foreign_keys: ForeignKey[];
  values: Record<string, unknown>[];
}

// Interface for the database
export interface Database {
  src: string;
  alt: string;
  tooltip: string;
}

// Unified schema format for API communication (same as backend TableSchemaInput)
export interface ApiTableSchema {
  table_name: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    is_primary_key: boolean;
  }>;
  primary_keys?: string[];
  foreign_keys: Array<{
    column_name: string;
    referenced_table: string;
    referenced_column: string;
    constraint_name: string;
  }>;
}

// Schema context for AI prompts - optimized format for LLM understanding
export interface SchemaContext {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      primaryKey: boolean;
    }>;
    relationships: Array<{
      fromColumn: string;
      toTable: string;
      toColumn: string;
    }>;
  }>;
}
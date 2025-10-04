import { SelectOption, WhereCondition } from "@/app/types/query";

export type JoinClause = {
  table: SelectOption | null;
  type: SelectOption | null;
  onColumn1: SelectOption | null;
  onColumn2: SelectOption | null;
};

export type UnionClause = {
  table: SelectOption | null;
  type: SelectOption | null;
};

export type CaseCondition = {
  column: SelectOption | null;
  operator: SelectOption | null;
  value: SelectOption | null;
  result: SelectOption | null;
};

export type WithClause = {
  alias: string;
  table: SelectOption | null;
};

export interface QueryState {
  selectedTable: SelectOption | null;
  selectedColumns: SelectOption[];
  whereConditions: WhereCondition[];
  orderBy: SelectOption | null;
  groupBy: SelectOption[];
  havingConditions: WhereCondition[];
  joinClauses: JoinClause[];
  unionClauses: UnionClause[];
  caseConditions: CaseCondition[];
  withClauses: WithClause[];
}

export type DemoView = "joins" | "case" | "having" | "union" | "with";

import { SelectOption } from "@/app/types/query";
import { DemoView, QueryState, JoinClause, CaseCondition, UnionClause } from "./types";

const baseState: QueryState = {
  selectedTable: { value: "users", label: "users" },
  selectedColumns: [
    { value: "user_name", label: "user_name" },
    { value: "email", label: "email" },
  ],
  whereConditions: [
    {
      column: { value: "status", label: "status" },
      operator: { value: "=", label: "=" },
      value: { value: "'active'", label: "'active'" },
    },
  ],
  orderBy: { value: "created_at DESC", label: "created_at DESC" },
  groupBy: [],
  havingConditions: [],
  joinClauses: [],
  unionClauses: [],
  caseConditions: [],
  withClauses: [],
};

const viewStateMap: Record<DemoView, QueryState> = {
  joins: {
    ...baseState,
    joinClauses: [
      {
        table: { value: "orders", label: "orders" },
        type: { value: "INNER JOIN", label: "INNER JOIN" },
        onColumn1: { value: "users.id", label: "users.id" },
        onColumn2: { value: "orders.user_id", label: "orders.user_id" },
      },
    ],
  },
  case: {
    ...baseState,
    selectedColumns: [
      { value: "user_name", label: "user_name" },
      { value: "email", label: "email" },
      { value: "status", label: "status" },
    ],
    caseConditions: [
      {
        column: { value: "status", label: "status" },
        operator: { value: "=", label: "=" },
        value: { value: "'premium'", label: "'premium'" },
        result: { value: "'VIP'", label: "'VIP'" },
      },
    ],
  },
  having: {
    ...baseState,
    selectedColumns: [
      { value: "user_name", label: "user_name" },
      { value: "email", label: "email" },
      { value: "COUNT(*)", label: "COUNT(*)" },
    ],
    groupBy: [
      { value: "user_name", label: "user_name" },
      { value: "email", label: "email" },
    ],
    havingConditions: [
      {
        column: { value: "COUNT(*)", label: "COUNT(*)" },
        operator: { value: ">", label: ">" },
        value: { value: "5", label: "5" },
      },
    ],
  },
  union: {
    ...baseState,
    unionClauses: [
      {
        table: { value: "archived_users", label: "archived_users" },
        type: { value: "UNION", label: "UNION" },
      },
    ],
  },
  with: {
    ...baseState,
    withClauses: [
      {
        alias: "active_users",
        table: { value: "users", label: "users" },
      },
    ],
  },
};

export const getInitialStateForView = (view: DemoView): QueryState => {
  return viewStateMap[view] ?? baseState;
};

export type QueryAction =
  | { type: "SET_VIEW"; view: DemoView }
  | { type: "UPDATE_BASE"; updates: Partial<QueryState> }
  | {
      type: "UPDATE_JOIN";
      index: number;
      field: keyof JoinClause;
      value: SelectOption | null;
    }
  | {
      type: "UPDATE_CASE";
      index: number;
      field: keyof CaseCondition;
      value: SelectOption | null;
    }
  | {
      type: "UPDATE_HAVING";
      index: number;
      field: "column" | "operator" | "value";
      value: SelectOption | null;
    }
  | {
      type: "UPDATE_UNION";
      index: number;
      field: keyof UnionClause;
      value: SelectOption | null;
    }
  | { type: "UPDATE_WITH_ALIAS"; index: number; alias: string }
  | { type: "UPDATE_WITH_TABLE"; index: number; table: SelectOption | null };

type ActionHandler<T extends QueryAction> = (
  state: QueryState,
  action: T
) => QueryState;

const actionHandlers: {
  [K in QueryAction["type"]]: ActionHandler<Extract<QueryAction, { type: K }>>;
} = {
  SET_VIEW: (state, action) => getInitialStateForView(action.view),

  UPDATE_BASE: (state, action) => ({ ...state, ...action.updates }),

  UPDATE_JOIN: (state, action) => ({
    ...state,
    joinClauses: state.joinClauses.map((join, i) =>
      i === action.index ? { ...join, [action.field]: action.value } : join
    ),
  }),

  UPDATE_CASE: (state, action) => ({
    ...state,
    caseConditions: state.caseConditions.map((cond, i) =>
      i === action.index ? { ...cond, [action.field]: action.value } : cond
    ),
  }),

  UPDATE_HAVING: (state, action) => ({
    ...state,
    havingConditions: state.havingConditions.map((cond, i) =>
      i === action.index ? { ...cond, [action.field]: action.value } : cond
    ),
  }),

  UPDATE_UNION: (state, action) => ({
    ...state,
    unionClauses: state.unionClauses.map((union, i) =>
      i === action.index ? { ...union, [action.field]: action.value } : union
    ),
  }),

  UPDATE_WITH_ALIAS: (state, action) => ({
    ...state,
    withClauses: state.withClauses.map((c, i) =>
      i === action.index ? { ...c, alias: action.alias } : c
    ),
  }),

  UPDATE_WITH_TABLE: (state, action) => ({
    ...state,
    withClauses: state.withClauses.map((c, i) =>
      i === action.index ? { ...c, table: action.table } : c
    ),
  }),
};

export const queryReducer = (state: QueryState, action: QueryAction): QueryState => {
  const handler = actionHandlers[action.type];
  return handler ? handler(state, action as any) : state;
};

export const tabs = [
  { id: "joins" as DemoView, label: "JOINs", description: "Multi-table queries" },
  { id: "case" as DemoView, label: "CASE", description: "Conditional logic" },
  { id: "having" as DemoView, label: "HAVING", description: "Aggregate filters" },
  { id: "union" as DemoView, label: "UNION", description: "Combine results" },
  { id: "with" as DemoView, label: "WITH", description: "CTEs" },
];

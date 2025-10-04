import { SelectOption } from "@/app/types/query";
import { DemoView, QueryState, JoinClause, CaseCondition, UnionClause } from "./types";

// Base state for the query builder
const baseState: QueryState = {
  // Default selected table
  selectedTable: { value: "users", label: "users" },
  // Default selected columns
  selectedColumns: [
    { value: "user_name", label: "user_name" },
    { value: "email", label: "email" }
  ],
  // Default where conditions
  whereConditions: [
    {
      column: { value: "status", label: "status" },
      operator: { value: "=", label: "=" },
      value: { value: "'active'", label: "'active'" },
    },
  ],
  // Default order by
  orderBy: { value: "created_at DESC", label: "created_at DESC" },
  // Default group by
  groupBy: [],
  // Default having conditions
  havingConditions: [],
  // Default join clauses
  joinClauses: [],
  // Default union clauses
  unionClauses: [],
  // Default case conditions
  caseConditions: [],
  // Default with clauses
  withClauses: [],
};

// View state map for the query builder
const viewStateMap: Record<DemoView, QueryState> = {
  // Joins view state
  joins: {
    // Base state for joins view
    ...baseState,
    // Default join clauses for joins view
    joinClauses: [
      {
        table: { value: "orders", label: "orders" },
        type: { value: "INNER JOIN", label: "INNER JOIN" },
        onColumn1: { value: "users.id", label: "users.id" },
        onColumn2: { value: "orders.user_id", label: "orders.user_id" },
      }
    ],
  },
  // Case view state
  case: {
    // Base state for case view
    ...baseState,
    // Default selected columns for case view
    selectedColumns: [
      { value: "user_name", label: "user_name" },
      { value: "email", label: "email" },
      { value: "status", label: "status" }
    ],
    // Default case conditions for case view
    caseConditions: [
      {
        column: { value: "status", label: "status" },
        operator: { value: "=", label: "=" },
        value: { value: "'premium'", label: "'premium'" },
        result: { value: "'VIP'", label: "'VIP'" },
      }
    ],
  },
  // Having view state
  having: {
    ...baseState,
    // Default selected columns for having view
    selectedColumns: [
      { value: "user_name", label: "user_name" },
      { value: "email", label: "email" },
      { value: "COUNT(*)", label: "COUNT(*)" }
    ],
    // Default group by for having view
    groupBy: [{ value: "user_name", label: "user_name" }, { value: "email", label: "email" }],
    // Default having conditions for having view
    havingConditions: [
      {
        column: { value: "COUNT(*)", label: "COUNT(*)" },
        operator: { value: ">", label: ">" },
        value: { value: "5", label: "5" },
      }
    ],
  },
  // Union view state
  union: {
    // Base state for union view
    ...baseState,
    // Default union clauses for union view
    unionClauses: [
      {
        table: { value: "archived_users", label: "archived_users" },
        type: { value: "UNION", label: "UNION" },
      }
    ],
  },
  // With view state
  with: {
    // Base state for with view
    ...baseState,
    // Default with clauses for with view
    withClauses: [
      {
        alias: "active_users",
        table: { value: "users", label: "users" },
      }
    ],
  },
};

// Get initial state for a specific view
export const getInitialStateForView = (view: DemoView): QueryState => {
  // Return the view state map for the view 
  // or the base state if the view is not found
  return viewStateMap[view] ?? baseState;
};

// Type for the query action
export type QueryAction =
  // Set view action
  | { type: "SET_VIEW"; view: DemoView }
  // Update base action
  | { type: "UPDATE_BASE"; updates: Partial<QueryState> }
  // Update join action
  | { type: "UPDATE_JOIN"; index: number; field: keyof JoinClause; value: SelectOption | null }
  // Update case action
  | { type: "UPDATE_CASE"; index: number; field: keyof CaseCondition; value: SelectOption | null }
  // Update having action
  | { type: "UPDATE_HAVING"; index: number; field: "column" | "operator" | "value"; value: SelectOption | null }
  // Update union action
  | { type: "UPDATE_HAVING"; index: number; field: "column" | "operator" | "value"; value: SelectOption | null }
  // Update with alias action
  | { type: "UPDATE_UNION"; index: number; field: keyof UnionClause; value: SelectOption | null }
  // Update with alias action
  | { type: "UPDATE_WITH_ALIAS"; index: number; alias: string }
  // Update with table action
  | { type: "UPDATE_WITH_TABLE"; index: number; table: SelectOption | null };

// Type for the action handler
type ActionHandler = (state: QueryState, action: any) => QueryState;

// Action handlers for the query reducer
const actionHandlers: Record<QueryAction["type"], ActionHandler> = {
  // Set view action handler
  SET_VIEW: (state, action: Extract<QueryAction, { type: "SET_VIEW" }>) =>
    // Return the initial state for the view
    getInitialStateForView(action.view),
// Update base action handler
  UPDATE_BASE: (state, action: Extract<QueryAction, { type: "UPDATE_BASE" }>) =>
    // Return the updated state
    ({ ...state, ...action.updates }),
// Update join action handler
  UPDATE_JOIN: (state, action: Extract<QueryAction, { type: "UPDATE_JOIN" }>) => ({
    ...state,
    joinClauses: state.joinClauses.map((join, i) =>
      i === action.index ? { ...join, [action.field]: action.value } : join
    )
  }),
// Update case action handler
  UPDATE_CASE: (state, action: Extract<QueryAction, { type: "UPDATE_CASE" }>) => ({
    ...state,
    caseConditions: state.caseConditions.map((cond, i) =>
      i === action.index ? { ...cond, [action.field]: action.value } : cond
    )
  }),
  // Update having action handler
  UPDATE_HAVING: (state, action: Extract<QueryAction, { type: "UPDATE_HAVING" }>) => ({
    ...state,
    havingConditions: state.havingConditions.map((cond, i) =>
      i === action.index ? { ...cond, [action.field]: action.value } : cond
    )
  }),
  // Update union action handler
  UPDATE_UNION: (state, action: Extract<QueryAction, { type: "UPDATE_UNION" }>) => ({
    ...state,
    unionClauses: state.unionClauses.map((union, i) =>
      i === action.index ? { ...union, [action.field]: action.value } : union
    )
  }),
  // Update with alias action handler
  UPDATE_WITH_ALIAS: (state, action: Extract<QueryAction, { type: "UPDATE_WITH_ALIAS" }>) => ({
    ...state,
    withClauses: state.withClauses.map((c, i) =>
      i === action.index ? { ...c, alias: action.alias } : c
    )
  }),
  // Update with table action handler
  UPDATE_WITH_TABLE: (state, action: Extract<QueryAction, { type: "UPDATE_WITH_TABLE" }>) => ({
    ...state,
    withClauses: state.withClauses.map((c, i) =>
      i === action.index ? { ...c, table: action.table } : c
    )
  }),
};

export const queryReducer = (state: QueryState, action: QueryAction): QueryState => {
  // Get the handler for the action
  const handler = actionHandlers[action.type];
  // Return the handler if it exists, 
  // otherwise return the state
  return handler ? handler(state, action) : state;
};

// Tabs for the query builder
export const tabs = [
  { id: "joins" as DemoView, label: "JOINs", description: "Multi-table queries" },
  { id: "case" as DemoView, label: "CASE", description: "Conditional logic" },
  { id: "having" as DemoView, label: "HAVING", description: "Aggregate filters" },
  { id: "union" as DemoView, label: "UNION", description: "Combine results" },
  { id: "with" as DemoView, label: "WITH", description: "CTEs" },
];

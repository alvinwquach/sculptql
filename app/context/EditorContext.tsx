"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "react-toastify";
import {
  TableSchema,
  SelectOption,
  QueryResult,
  JoinClause,
  UnionClause,
  CteClause,
} from "@/app/types/query";
import { RUN_QUERY } from "@/app/graphql/mutations/runQuery";
import { GET_DIALECT } from "@/app/graphql/queries/getSchema";
import { useQueryState, QueryState } from "./hooks/useQueryState";
import { useQueryHistory, QueryHistoryState } from "./hooks/useQueryHistory";
import { useQueryResults, QueryResultsState } from "./hooks/useQueryResults";
import { useComputedValues, ComputedValues } from "./hooks/useComputedValues";
import { useQueryHandlers, QueryHandlers } from "./hooks/useQueryHandlers";
import { useExportFunctions, ExportFunctions } from "./hooks/useExportFunctions";

// Interface for the editor context type
interface EditorContextType extends QueryState, QueryHistoryState, QueryResultsState, ComputedValues, QueryHandlers, ExportFunctions {
  schema: TableSchema[];
  error: string | null;
  isMySQL: boolean;
  dialect: string;
  isManualEdit: boolean;
  setIsManualEdit: (isManual: boolean) => void;
  runQuery: (query: string) => Promise<void>;
  logQueryResultAsJson: () => void;
  exposeQueryResultsToConsole: () => void;
  refreshSchema: () => Promise<void>;
  handleQueryChange: (newQuery: string) => void;
   handleTableSelect: (value: SelectOption | null) => void;
  handleColumnSelect: (value: SelectOption[]) => void;
  handleDistinctChange: (value: boolean) => void;
  handleGroupByColumnSelect: (value: SelectOption[]) => void;
  handleWhereColumnSelect: (value: SelectOption | null, conditionIndex: number) => void;
  handleOperatorSelect: (value: SelectOption | null, conditionIndex: number) => void;
  handleValueSelect: (value: SelectOption | null, conditionIndex: number, isValue2?: boolean) => void;
  handleLogicalOperatorSelect: (value: SelectOption | null, conditionIndex: number) => void;
  handleOrderByColumnSelect: (value: SelectOption | null) => void;
  handleOrderByDirectionSelect: (value: SelectOption | null) => void;
  handleLimitSelect: (value: SelectOption | null) => void;
  handleAggregateColumnSelect: (value: SelectOption | null, conditionIndex: number) => void;
  handleHavingOperatorSelect: (value: SelectOption | null, conditionIndex: number) => void;
  handleHavingValueSelect: (value: SelectOption | null, conditionIndex: number) => void;
  onDeleteCondition: (conditionIndex: number) => void;
  // Join handlers
  onJoinTableSelect: (value: SelectOption | null, joinIndex: number) => void;
  onJoinTypeSelect: (value: SelectOption | null, joinIndex: number) => void;
  onJoinOnColumn1Select: (value: SelectOption | null, joinIndex: number) => void;
  onJoinOnColumn2Select: (value: SelectOption | null, joinIndex: number) => void;
  onAddJoinClause: () => void;
  onRemoveJoinClause: (joinIndex: number) => void;
  // Union handlers
  onUnionTableSelect: (value: SelectOption | null, unionIndex: number) => void;
  onUnionTypeSelect: (value: SelectOption | null, unionIndex: number) => void;
  onAddUnionClause: () => void;
  onRemoveUnionClause: (unionIndex: number) => void;
  // CTE handlers
  onCteAliasChange: (cteIndex: number, alias: string | null) => void;
  onCteTableSelect: (cteIndex: number, value: SelectOption | null) => void;
  onCteColumnSelect: (cteIndex: number, value: SelectOption[]) => void;
  onCteLogicalOperatorSelect: (cteIndex: number, value: SelectOption | null) => void;
  onCteWhereColumnSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null) => void;
  onCteOperatorSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null) => void;
  onCteValueSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null, isValue2: boolean) => void;
  onAddCteClause: () => void;
  onRemoveCteClause: (cteIndex: number) => void;
  operatorOptions: SelectOption[];
  logicalOperatorOptions: SelectOption[];
  orderByDirectionOptions: SelectOption[];
  limitOptions: SelectOption[];
}

// Create the editor context
const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Use the editor context
export function useEditorContext() {
  // Get the context
  const context = useContext(EditorContext);
  // If the context is not found
  if (!context) {
    // Throw an error
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  // Return the context
  return context;
}

// Props for the editor provider
interface EditorProviderProps {
  children: React.ReactNode;
  schema: TableSchema[];
  error: string | null;
  isMySQL?: boolean;
  refreshSchema?: () => Promise<void>;
}

export function EditorProvider({ children, schema, error, isMySQL = false, refreshSchema }: EditorProviderProps) {
  // Get the query state
  const queryState = useQueryState();
  // Get the query results
  const queryResults = useQueryResults();
  // Get the computed values
  const computedValues = useComputedValues(schema, queryState.selectedTable);
  // Get the query handlers
  const queryHandlers = useQueryHandlers(
    queryState.selectedTable,
    queryState.selectedColumns,
    queryState.selectedGroupByColumns,
    queryState.havingClause,
    queryState.orderByClause,
    queryState.limit,
    queryState.isDistinct,
    queryState.query,
    queryState.whereClause,
    isMySQL,
    queryState.setQuery
  );
  // Get the export functions
  const exportFunctions = useExportFunctions(queryResults.queryResult, queryState.query);
  // Get the run query mutation
  const [runQueryMutation] = useMutation<
    { runQuery: QueryResult },
    { query: string }
  >(RUN_QUERY);

  // Get the current dialect
  const { data: dialectData } = useQuery<{ dialect: string }>(GET_DIALECT);

  // State to track if the query is being manually edited (prevents race conditions)
  const [isManualEdit, setIsManualEdit] = useState(false);

  // Memoized options to prevent unnecessary re-renders
  const operatorOptions: SelectOption[] = useMemo(() => [
    { value: "=", label: "=" },
    { value: "!=", label: "!=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
    { value: "LIKE", label: "LIKE" },
    { value: "IS NULL", label: "IS NULL" },
    { value: "IS NOT NULL", label: "IS NOT NULL" },
    { value: "BETWEEN", label: "BETWEEN" },
  ], []);

  // Get the logical operator options
  const logicalOperatorOptions: SelectOption[] = useMemo(() => [
    { value: "AND", label: "AND" },
    { value: "OR", label: "OR" },
  ], []);

  // Get the order by direction options
  const orderByDirectionOptions: SelectOption[] = useMemo(() => [
    { value: "ASC", label: "Ascending (A-Z, low-high)" },
    { value: "DESC", label: "Descending (Z-A, high-low)" },
  ], []);

  // Get the limit options
  const limitOptions: SelectOption[] = useMemo(() => [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
    { value: "500", label: "500" },
    { value: "1000", label: "1000" },
  ], []);

  // Get the run query without history function
  const runQueryWithoutHistory = useCallback(
    // Run the query without history
    async (query: string) => {
      // If the query is not trimmed, throw an error
      if (!query.trim()) {
        // Show an error toast
        toast.error("Please enter a query");
        // Return
        return;
      }

      try {
        // Set the query error to null
        queryResults.setQueryError(null);
        // Run the query mutation
        const { data } = await runQueryMutation({
          // Set the query to the trimmed query and the variables to the query
          variables: { query: query.trim() },
        });
        // If the data is run query
        if (data?.runQuery) {
          // Set the query result to the run query
          queryResults.setQueryResult(data.runQuery);
        }
      } catch (error) {
        // Log the query execution error
        console.error("Query execution error:", error);
        // Set the query error to the error message
        const errorMessage = error instanceof Error ? error.message : "Query execution failed";
        queryResults.setQueryError(errorMessage);
        // Show an error toast
        toast.error(errorMessage);
      }
    },
    [runQueryMutation, queryResults]
  );

  // Get the query history
  const queryHistory = useQueryHistory({
    // Set the query to the query state set query
    setQuery: queryState.setQuery,
    // Set the run query to the run query without history
    runQuery: runQueryWithoutHistory,
  });

  // Create the final runQuery function that includes history
  const runQuery = useCallback(
    // Run the query
    async (query: string) => {
      // Run the query without history
      await runQueryWithoutHistory(query);
      // Add the query to the history
      queryHistory.addToHistory(query.trim());
    },
    [runQueryWithoutHistory, queryHistory]
  );

  // Get the log query result as json function
  const logQueryResultAsJson = useCallback(() => {
    // If the query result is not null
    if (queryResults.queryResult) {
      // Log the query result to the console
      console.log("Query Result:", JSON.stringify(queryResults.queryResult, null, 2));
      toast.success("Query result logged to console");
      // Return the query result
    } else {
      // Show an error toast
      toast.error("No query result to log");
    }
  }, [queryResults.queryResult]);

  // Get the expose query results to console function
  const exposeQueryResultsToConsole = useCallback(() => {
    // If the query result and the query result rows are not null
    if (queryResults.queryResult && queryResults.queryResult.rows) {
      // Expose the query results to the global window object for easy access in dev console
      (window as Window).QueryResults = {
        // Get the data
        data: queryResults.queryResult.rows,
        // Get the fields
        fields: queryResults.queryResult.fields,
        // Get the row count
        rowCount: queryResults.queryResult.rowCount,
        // Get the filter
        filter: (predicate: (row: Record<string, unknown>) => boolean) => {
          return queryResults.queryResult!.rows.filter(predicate);
        },
        // Get the map
        map: (mapper: (row: Record<string, unknown>) => unknown) => {
          return queryResults.queryResult!.rows.map(mapper);
        },
        // Get the find
        find: (predicate: (row: Record<string, unknown>) => boolean) => {
          return queryResults.queryResult!.rows.find(predicate);
        },
        // Get the column values
        getColumnValues: (columnName: string) => {
          return queryResults.queryResult!.rows.map(row => row[columnName]);
        },
        // Get the unique values
        getUniqueValues: (columnName: string) => {
          return [...new Set(queryResults.queryResult!.rows.map(row => row[columnName]))];
        },
        // Get the count
        count: () => {
          return queryResults.queryResult!.rows.length;
        },
        // Get the full result
        fullResult: queryResults.queryResult
      };

      // Log the query results to the console
      console.log("Query results exposed to console! Use QueryResults to access data:");
      // Log the query results data
      console.log("- QueryResults.data - array of all rows");
      // Log the query results filter
      console.log("- QueryResults.filter(row => condition) - filter rows");
      // Log the query results map
      console.log("- QueryResults.map(row => transformation) - transform rows");
      // Log the query results find
      console.log("- QueryResults.find(row => condition) - find first matching row");
      // Log the query results get column values
      console.log("- QueryResults.getColumnValues('columnName') - get all values for a column");
      // Log the query results get unique values
      console.log("- QueryResults.getUniqueValues('columnName') - get unique values for a column");
      // Log the query results count
      console.log("- QueryResults.count() - get total row count");
      // Log the query results full result
      console.log("- QueryResults.fullResult - complete result object");
      // Log the query results example
      console.log("Example: QueryResults.filter(row => row.username === 'john')");
      // Log the query results toast
      toast.success("Query results exposed to console! Check console for usage instructions.");
    } else {
      toast.error("No query result available to expose");
    }
  }, [queryResults.queryResult]);

  // Get the generate query from state function
  const generateQueryFromState = useCallback((
    selectedTable = queryState.selectedTable,
    selectedColumns = queryState.selectedColumns,
    isDistinct = queryState.isDistinct,
    whereClause = queryState.whereClause,
    selectedGroupByColumns = queryState.selectedGroupByColumns,
    havingClause = queryState.havingClause,
    orderByClause = queryState.orderByClause,
    limit = queryState.limit,
    joinClauses = queryState.joinClauses,
    unionClauses = queryState.unionClauses
  ) => {
    // If the selected table is not null
    if (!selectedTable) {
      // Return an empty string
      return "";
    }
    // Get the table name
    const tableName = selectedTable.value;
    // Get the columns string
    const columnsString = selectedColumns.length === 0 ||
      // If the selected columns is empty or some of the selected columns is *
      selectedColumns.some((col) => col.value === "*")
      ? "*"
      : // Otherwise, map the selected columns to the value and aggregate
        // Map the selected columns to the value and aggregate
        // Join the selected columns with a comma
        selectedColumns
          .map((col) => {
            const colValue = col.aggregate ? col.value : col.value;
            return col.alias ? `${colValue} AS '${col.alias}'` : colValue;
          })
          .join(", ");
    // Get the query string with the distinct and columns string and table name
    let query = `SELECT ${isDistinct ? "DISTINCT " : ""}${columnsString} FROM ${tableName}`;

    // Add JOIN clauses
    if (joinClauses && joinClauses.length > 0) {
      joinClauses.forEach((join) => {
        if (join.table && join.joinType) {
          const joinType = join.joinType.value || "INNER JOIN";
          query += ` ${joinType} ${join.table.value}`;

          // Add ON clause for all joins except CROSS JOIN
          if (joinType !== "CROSS JOIN" && join.onColumn1 && join.onColumn2) {
            query += ` ON ${tableName}.${join.onColumn1.value} = ${join.table.value}.${join.onColumn2.value}`;
          }
        }
      });
    }

    // Get the valid where conditions
    const validWhereConditions = whereClause.conditions.filter(cond =>
      cond.column && cond.operator && (cond.value || cond.operator.value === "IS NULL" || cond.operator.value === "IS NOT NULL")
    );
    // If the valid where conditions is not empty
    if (validWhereConditions.length > 0) {
      // Get the where conditions
      const whereConditions = validWhereConditions

        .map((cond, index) => {
          // Get the column name
          const colName = cond.column!.value;
          // Get the logical operator
          const logicalOp = index > 0 ? (cond.logicalOperator?.value || "AND") : "";
          // Get the operator
          const op = cond.operator!.value;
          // If the operator is IS NULL or IS NOT NULL
          if (op === "IS NULL" || op === "IS NOT NULL") {
            // Return the logical operator and column name and operator
            return `${logicalOp} ${colName} ${op}`.trim();
          }
          // If the operator is BETWEEN and the value and value2 is not null
          if (op === "BETWEEN" && cond.value && cond.value2) {
            const value1 = typeof cond.value.value === 'string' && !cond.value.value.match(/^['"]/)
              ? `'${cond.value.value}'` : cond.value.value;
            const value2 = typeof cond.value2.value === 'string' && !cond.value2.value.match(/^['"]/)
              ? `'${cond.value2.value}'` : cond.value2.value;
            return `${logicalOp} ${colName} BETWEEN ${value1} AND ${value2}`.trim();
          }
          // If the operator is BETWEEN and the value and value2 is not null
          if (cond.value) {
            // Properly quote string values for SQL
            const value = typeof cond.value.value === 'string' && !cond.value.value.match(/^['"]/)
              ? `'${cond.value.value}'` : cond.value.value;
            // Return the logical operator and column name and operator and value
            return `${logicalOp} ${colName} ${op} ${value}`.trim();
          }
          // Return the logical operator and column name and operator
          return `${logicalOp} ${colName} ${op}`.trim();
        });
      // If the where conditions is not empty
      if (whereConditions.length > 0) {
        // Add the where conditions to the query
        query += ` WHERE ${whereConditions.join(" ")}`;
      }
    }
    // If the selected group by columns length is greater than 0
    if (selectedGroupByColumns.length > 0) {
      // Get the group by string
      const groupByString = selectedGroupByColumns
        // Map the selected group by columns to the value
        .map(col => col.value)
        // Join the selected group by columns with a comma
        .join(", ");
      // Add the group by clause to the query with the group by string
      query += ` GROUP BY ${groupByString}`;
    }
    // If the having clause is not null and the aggregate column
    // and operator is not null
    if (havingClause.condition.aggregateColumn && havingClause.condition.operator) {
      // Get the aggregate column
      const agg = havingClause.condition.aggregateColumn.value;
      // Get the operator
      const op = havingClause.condition.operator.value;
      // If the operator is IS NULL or IS NOT NULL
      if (op === "IS NULL" || op === "IS NOT NULL") {
        // Add the having clause to the query
        query += ` HAVING ${agg} ${op}`;
      } else if (havingClause.condition.value) {
        // Get the value and properly quote string values
        const value = typeof havingClause.condition.value.value === 'string' && !havingClause.condition.value.value.match(/^['"]/)
          ? `'${havingClause.condition.value.value}'` : havingClause.condition.value.value;
        // Add the having clause to the query with proper value handling
        query += ` HAVING ${agg} ${op} ${value}`;
      } else {
        // Add the having clause to the query without value
        query += ` HAVING ${agg} ${op}`;
      }
    }
    // If the order by clause column is not null
    if (orderByClause.column) {
      // Get the column name
      const columnName = orderByClause.column.value;
      // Get the direction from the order by clause direction or an empty string
      const direction = orderByClause.direction?.value || "";
      // Add the order by clause to the query with the column name and direction
      query += ` ORDER BY ${columnName}${direction ? ` ${direction}` : ""}`;
    }
    // If the limit is not null
    if (limit) {
      // Add the limit clause to the query with the limit value
      query += ` LIMIT ${limit.value}`;
    }

    // Add UNION clauses
    if (unionClauses && unionClauses.length > 0) {
      unionClauses.forEach((union) => {
        if (union.table) {
          const unionType = union.unionType?.value || "UNION";
          query += ` ${unionType} SELECT ${columnsString} FROM ${union.table.value}`;
        }
      });
    }

    // Return the query with a semicolon
    return query + ";";
  }, [
    // Only depend on the actual state values, not the entire queryState object
    queryState.selectedTable,
    queryState.selectedColumns,
    queryState.isDistinct,
    queryState.whereClause,
    queryState.selectedGroupByColumns,
    queryState.havingClause,
    queryState.orderByClause,
    queryState.limit,
    queryState.joinClauses,
    queryState.unionClauses
  ]);

  // Handle the query change
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      // Set the manual edit flag to true when query is changed manually
      setIsManualEdit(true);
      // Set the query to the new query
      queryState.setQuery(newQuery);
    },
    [queryState]
  );

  // Handle the table select
  const handleTableSelect = useCallback(
    (value: SelectOption | null) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Only reset columns if no table was previously selected or if we're clearing the table
      const shouldResetColumns = !queryState.selectedTable || !value;
      const newSelectedColumns: SelectOption[] = shouldResetColumns 
        ? (value ? [{ value: "*", label: "All Columns (*)" }] : [])
        : queryState.selectedColumns;
      
      // Set the selected table
      queryState.setSelectedTable(value);
      
      // Only update columns if we need to reset them
      if (shouldResetColumns) {
        queryState.setSelectedColumns(newSelectedColumns);
      }
      
      // Generate a new query from the current state
      const newQuery = generateQueryFromState(
        value,
        newSelectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the column select
  const handleColumnSelect = useCallback(
    (value: SelectOption[]) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Set the selected columns
      queryState.setSelectedColumns(value);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        value,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the distinct change
  const handleDistinctChange = useCallback(
    (value: boolean) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Set the is distinct
      queryState.setIsDistinct(value);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        value,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the group by column select
  const handleGroupByColumnSelect = useCallback(
    (value: SelectOption[]) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Set the selected group by columns
      queryState.setSelectedGroupByColumns(value);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        value,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the where column select
  const handleWhereColumnSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new conditions array from the 
      // where clause conditions array
      const newConditions = [...queryState.whereClause.conditions];
      // Set the new conditions at the condition index 
      // to the new value and column
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        column: value,
      };
      // Create a new where clause with the new conditions
      const newWhereClause = { conditions: newConditions };
      // Set the where clause
      queryState.setWhereClause(newWhereClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        newWhereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the operator select
  const handleOperatorSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new conditions array from the 
      // where clause conditions array
      const newConditions = [...queryState.whereClause.conditions];
      // Set the new conditions at the condition index 
      // to the new value and operator
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        operator: value,
      };
      // Create a new where clause with the new conditions
      const newWhereClause = { conditions: newConditions };
      // Set the where clause
      queryState.setWhereClause(newWhereClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        newWhereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the value select
  const handleValueSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number, isValue2: boolean = false) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new conditions array from the where clause conditions array
      const newConditions = [...queryState.whereClause.conditions];
      // Set the new conditions at the condition index to the new value
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        ...(isValue2 ? { value2: value } : { value: value }),
      };
      // Create a new where clause with the new conditions
      const newWhereClause = { conditions: newConditions };
      // Set the where clause
      queryState.setWhereClause(newWhereClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        newWhereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the logical operator select
  const handleLogicalOperatorSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new conditions array from the 
      // where clause conditions array
      const newConditions = [...queryState.whereClause.conditions];
      // Set the new conditions at the condition index 
      // to the new value and logical operator
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        logicalOperator: value,
      };
      // Create a new where clause with the new conditions
      const newWhereClause = { conditions: newConditions };
      // Set the where clause
      queryState.setWhereClause(newWhereClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        newWhereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the order by column select
  const handleOrderByColumnSelect = useCallback(
    (value: SelectOption | null) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new order by clause with the new value and column
      const newOrderByClause = {
        ...queryState.orderByClause,
        column: value,
      };
      // Set the order by clause
      queryState.setOrderByClause(newOrderByClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        newOrderByClause,
        queryState.limit
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );


  // Handle the order by direction select
  const handleOrderByDirectionSelect = useCallback(
    (value: SelectOption | null) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new order by clause with the new value and direction
      const newOrderByClause = {
        ...queryState.orderByClause,
        direction: value,
      };
      // Set the order by clause
      queryState.setOrderByClause(newOrderByClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        newOrderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the limit select
  const handleLimitSelect = useCallback(
    (value: SelectOption | null) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      queryState.setLimit(value);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        value
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the aggregate column select
  const handleAggregateColumnSelect = useCallback(
    (value: SelectOption | null) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new condition with the new value and aggregate column
      const newCondition = {
        ...queryState.havingClause.condition,
        aggregateColumn: value,
      };
      // Create a new having clause with the new condition
      const newHavingClause = { condition: newCondition };
      // Set the having clause
      queryState.setHavingClause(newHavingClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        newHavingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the having operator select
  const handleHavingOperatorSelect = useCallback(
    // Handle the having operator select
    (value: SelectOption | null) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new condition with the new value and operator
      const newCondition = {
        ...queryState.havingClause.condition,
        operator: value,
      };
      // Create a new having clause with the new condition
      const newHavingClause = { condition: newCondition };
      // Set the having clause
      queryState.setHavingClause(newHavingClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        newHavingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the having value select
  const handleHavingValueSelect = useCallback(
    // Handle the having value select
    (value: SelectOption | null) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new condition with the new value
      const newCondition = {
        ...queryState.havingClause.condition,
        value: value,
      };
      // Create a new having clause with the new condition
      const newHavingClause = { condition: newCondition };
      // Set the having clause
      queryState.setHavingClause(newHavingClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        newHavingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the delete condition
  const onDeleteCondition = useCallback(
    (conditionIndex: number) => {
      // Reset manual edit flag when using visual query builder
      setIsManualEdit(false);
      
      // Create a new conditions array from the where clause conditions array
      const newConditions = queryState.whereClause.conditions.filter(
        // Filter the conditions by the condition index
        (_, index) => index !== conditionIndex
      );
      // If the new conditions array is empty, push a new condition
      // with null values
      if (newConditions.length === 0) {
        newConditions.push({
          column: null,
          operator: null,
          value: null,
          value2: null,
        });
      }
      // Create a new where clause with the new conditions
      const newWhereClause = { conditions: newConditions };
      // Set the where clause
      queryState.setWhereClause(newWhereClause);
      // Generate a new query from the state
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        newWhereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit
      );
      // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Join handlers
  const onJoinTableSelect = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      setIsManualEdit(false);
      const newJoinClauses = [...queryState.joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        table: value,
      };
      queryState.setJoinClauses(newJoinClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        newJoinClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  const onJoinTypeSelect = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      setIsManualEdit(false);
      const newJoinClauses = [...queryState.joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        joinType: value,
      };
      queryState.setJoinClauses(newJoinClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        newJoinClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  const onJoinOnColumn1Select = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      setIsManualEdit(false);
      const newJoinClauses = [...queryState.joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        onColumn1: value,
      };
      queryState.setJoinClauses(newJoinClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        newJoinClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  const onJoinOnColumn2Select = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      setIsManualEdit(false);
      const newJoinClauses = [...queryState.joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        onColumn2: value,
      };
      queryState.setJoinClauses(newJoinClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        newJoinClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  const onAddJoinClause = useCallback(() => {
    setIsManualEdit(false);
    const newJoinClause: JoinClause = {
      table: null,
      joinType: { value: "INNER JOIN", label: "INNER JOIN" },
      onColumn1: null,
      onColumn2: null,
    };
    const newJoinClauses = [...queryState.joinClauses, newJoinClause];
    queryState.setJoinClauses(newJoinClauses);
    const newQuery = generateQueryFromState(
      queryState.selectedTable,
      queryState.selectedColumns,
      queryState.isDistinct,
      queryState.whereClause,
      queryState.selectedGroupByColumns,
      queryState.havingClause,
      queryState.orderByClause,
      queryState.limit,
      newJoinClauses
    );
    queryState.setQuery(newQuery);
  }, [queryState, generateQueryFromState]);

  const onRemoveJoinClause = useCallback(
    (joinIndex: number) => {
      setIsManualEdit(false);
      const newJoinClauses = queryState.joinClauses.filter((_, index) => index !== joinIndex);
      queryState.setJoinClauses(newJoinClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        newJoinClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Union handlers
  const onUnionTableSelect = useCallback(
    (value: SelectOption | null, unionIndex: number) => {
      setIsManualEdit(false);
      const newUnionClauses = [...queryState.unionClauses];
      newUnionClauses[unionIndex] = {
        ...newUnionClauses[unionIndex],
        table: value,
      };
      queryState.setUnionClauses(newUnionClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        queryState.joinClauses,
        newUnionClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  const onUnionTypeSelect = useCallback(
    (value: SelectOption | null, unionIndex: number) => {
      setIsManualEdit(false);
      const newUnionClauses = [...queryState.unionClauses];
      newUnionClauses[unionIndex] = {
        ...newUnionClauses[unionIndex],
        unionType: value ?? undefined,
      };
      queryState.setUnionClauses(newUnionClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        queryState.joinClauses,
        newUnionClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  const onAddUnionClause = useCallback(() => {
    setIsManualEdit(false);
    const newUnionClause: UnionClause = {
      table: null,
      unionType: { value: "UNION", label: "UNION" },
    };
    const newUnionClauses = [...queryState.unionClauses, newUnionClause];
    queryState.setUnionClauses(newUnionClauses);
    const newQuery = generateQueryFromState(
      queryState.selectedTable,
      queryState.selectedColumns,
      queryState.isDistinct,
      queryState.whereClause,
      queryState.selectedGroupByColumns,
      queryState.havingClause,
      queryState.orderByClause,
      queryState.limit,
      queryState.joinClauses,
      newUnionClauses
    );
    queryState.setQuery(newQuery);
  }, [queryState, generateQueryFromState]);

  const onRemoveUnionClause = useCallback(
    (unionIndex: number) => {
      setIsManualEdit(false);
      const newUnionClauses = queryState.unionClauses.filter((_, index) => index !== unionIndex);
      queryState.setUnionClauses(newUnionClauses);
      const newQuery = generateQueryFromState(
        queryState.selectedTable,
        queryState.selectedColumns,
        queryState.isDistinct,
        queryState.whereClause,
        queryState.selectedGroupByColumns,
        queryState.havingClause,
        queryState.orderByClause,
        queryState.limit,
        queryState.joinClauses,
        newUnionClauses
      );
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // CTE handlers
  const onCteAliasChange = useCallback(
    (cteIndex: number, alias: string | null) => {
      const newCteClauses = [...queryState.cteClauses];
      newCteClauses[cteIndex] = {
        ...newCteClauses[cteIndex],
        alias,
      };
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  const onCteTableSelect = useCallback(
    (cteIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...queryState.cteClauses];
      newCteClauses[cteIndex] = {
        ...newCteClauses[cteIndex],
        fromTable: value,
      };
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  const onCteColumnSelect = useCallback(
    (cteIndex: number, value: SelectOption[]) => {
      const newCteClauses = [...queryState.cteClauses];
      newCteClauses[cteIndex] = {
        ...newCteClauses[cteIndex],
        selectedColumns: value,
      };
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  const onCteLogicalOperatorSelect = useCallback(
    (cteIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...queryState.cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions.length > 0) {
        newCteClauses[cteIndex].whereClause.conditions[0].logicalOperator = value;
      }
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  const onCteWhereColumnSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...queryState.cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions[conditionIndex]) {
        newCteClauses[cteIndex].whereClause.conditions[conditionIndex].column = value;
      }
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  const onCteOperatorSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...queryState.cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions[conditionIndex]) {
        newCteClauses[cteIndex].whereClause.conditions[conditionIndex].operator = value;
      }
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  const onCteValueSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null, isValue2: boolean) => {
      const newCteClauses = [...queryState.cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions[conditionIndex]) {
        if (isValue2) {
          newCteClauses[cteIndex].whereClause.conditions[conditionIndex].value2 = value;
        } else {
          newCteClauses[cteIndex].whereClause.conditions[conditionIndex].value = value;
        }
      }
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  const onAddCteClause = useCallback(() => {
    const newCteClause: CteClause = {
      alias: null,
      fromTable: null,
      selectedColumns: [],
      whereClause: {
        conditions: [
          { column: null, operator: null, value: null, value2: null },
        ],
      },
    };
    queryState.setCteClauses([...queryState.cteClauses, newCteClause]);
  }, [queryState]);

  const onRemoveCteClause = useCallback(
    (cteIndex: number) => {
      const newCteClauses = queryState.cteClauses.filter((_, index) => index !== cteIndex);
      queryState.setCteClauses(newCteClauses);
    },
    [queryState]
  );

  useEffect(() => {
    // Handle the key down
    const handleKeyDown = (event: KeyboardEvent) => {
      // If the ctrl or meta key is pressed and the enter key is pressed 
      // prevent the default behavior and run the query
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runQuery(queryState.query);
      }
      // If the ctrl or meta key is pressed and the h key is pressed 
      // prevent the default behavior and toggle the show history
      if ((event.ctrlKey || event.metaKey) && event.key === "h") {
        event.preventDefault();
        queryHistory.setShowHistory(!queryHistory.showHistory);
      }
      // If the ctrl or meta key is pressed and the r key is pressed 
      // prevent the default behavior and refresh the schema
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        if (refreshSchema) {
          refreshSchema();
        }
      }
    };
    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);
    // Remove the event listener
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runQuery, queryState.query, queryHistory, refreshSchema]);

  // Effect to generate initial query from visual builder state on mount
  useEffect(() => {
    // Check if we have visual builder state but no query (or mismatched query)
    if (queryState.selectedTable && queryState.selectedColumns.length > 0) {
      const expectedQuery = generateQueryFromState();
      
      // If the current query doesn't match what the visual builder should generate,
      // update it to match the visual builder state
      if (!queryState.query || queryState.query.trim() === "") {
        queryState.setQuery(expectedQuery);
      }
    }
  }, [queryState.selectedTable, queryState.selectedColumns, queryState.whereClause, queryState.query, generateQueryFromState, queryState]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue: EditorContextType = useMemo(() => ({
    schema,
    error,
    isMySQL,
    dialect: dialectData?.dialect || "postgres",
    isManualEdit,
    setIsManualEdit,
    ...queryState,
    ...queryHistory,
    ...queryResults,
    ...computedValues,
    ...queryHandlers,
    ...exportFunctions,
    runQuery,
    logQueryResultAsJson,
    exposeQueryResultsToConsole,
    refreshSchema: refreshSchema || (async () => {}),
    handleQueryChange,
    handleTableSelect,
    handleColumnSelect,
    handleDistinctChange,
    handleGroupByColumnSelect,
    handleWhereColumnSelect,
    handleOperatorSelect,
    handleValueSelect,
    handleLogicalOperatorSelect,
    handleOrderByColumnSelect,
    handleOrderByDirectionSelect,
    handleLimitSelect,
    handleAggregateColumnSelect,
    handleHavingOperatorSelect,
    handleHavingValueSelect,
    onDeleteCondition,
    // Join handlers
    onJoinTableSelect,
    onJoinTypeSelect,
    onJoinOnColumn1Select,
    onJoinOnColumn2Select,
    onAddJoinClause,
    onRemoveJoinClause,
    // Union handlers
    onUnionTableSelect,
    onUnionTypeSelect,
    onAddUnionClause,
    onRemoveUnionClause,
    // CTE handlers
    onCteAliasChange,
    onCteTableSelect,
    onCteColumnSelect,
    onCteLogicalOperatorSelect,
    onCteWhereColumnSelect,
    onCteOperatorSelect,
    onCteValueSelect,
    onAddCteClause,
    onRemoveCteClause,
    operatorOptions,
    logicalOperatorOptions,
    orderByDirectionOptions,
    limitOptions,
  }), [
    schema,
  error,
  isMySQL,
  isManualEdit,
  setIsManualEdit,
  queryState,
  queryHistory,
  queryResults,
  computedValues,
  queryHandlers,
  exportFunctions,
  runQuery,
  logQueryResultAsJson,
  exposeQueryResultsToConsole,
  refreshSchema,
  handleQueryChange,
  handleTableSelect,
  handleColumnSelect,
  handleDistinctChange,
  handleGroupByColumnSelect,
  handleWhereColumnSelect,
  handleOperatorSelect,
  handleValueSelect,
  handleLogicalOperatorSelect,
  handleOrderByColumnSelect,
  handleOrderByDirectionSelect,
  handleLimitSelect,
  handleAggregateColumnSelect,
  handleHavingOperatorSelect,
  handleHavingValueSelect,
  onDeleteCondition,
  // Join handlers
  onJoinTableSelect,
  onJoinTypeSelect,
  onJoinOnColumn1Select,
  onJoinOnColumn2Select,
  onAddJoinClause,
  onRemoveJoinClause,
  // Union handlers
  onUnionTableSelect,
  onUnionTypeSelect,
  onAddUnionClause,
  onRemoveUnionClause,
  // CTE handlers
  onCteAliasChange,
  onCteTableSelect,
  onCteColumnSelect,
  onCteLogicalOperatorSelect,
  onCteWhereColumnSelect,
  onCteOperatorSelect,
  onCteValueSelect,
  onAddCteClause,
  onRemoveCteClause,
  operatorOptions,
  logicalOperatorOptions,
  orderByDirectionOptions,
  limitOptions,
  ]);

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

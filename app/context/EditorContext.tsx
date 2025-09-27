"use client";

import { createContext, useContext, useCallback, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import {
  TableSchema,
  SelectOption,
  QueryResult,
} from "@/app/types/query";
import { RUN_QUERY } from "@/app/graphql/mutations/runQuery";
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
  runQuery: (query: string) => Promise<void>;
  logQueryResultAsJson: () => void;
  handleQueryChange: (newQuery: string) => void;
   handleTableSelect: (value: SelectOption | null) => void;
  handleColumnSelect: (value: SelectOption[]) => void;
  handleDistinctChange: (value: boolean) => void;
  handleGroupByColumnSelect: (value: SelectOption[]) => void;
  handleWhereColumnSelect: (value: SelectOption, conditionIndex: number) => void;
  handleOperatorSelect: (value: SelectOption, conditionIndex: number) => void;
  handleValueSelect: (value: SelectOption, conditionIndex: number) => void;
  handleLogicalOperatorSelect: (value: SelectOption, conditionIndex: number) => void;
  handleOrderByColumnSelect: (value: SelectOption) => void;
  handleOrderByDirectionSelect: (value: SelectOption) => void;
  handleLimitSelect: (value: SelectOption) => void;
  handleAggregateColumnSelect: (value: SelectOption, conditionIndex: number) => void;
  handleHavingOperatorSelect: (value: SelectOption, conditionIndex: number) => void;
  handleHavingValueSelect: (value: SelectOption, conditionIndex: number) => void;
  onDeleteCondition: (conditionIndex: number) => void;
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
  return context;
}

// Props for the editor provider
interface EditorProviderProps {
  children: React.ReactNode;
  schema: TableSchema[];
  error: string | null;
  isMySQL?: boolean;
}

export function EditorProvider({ children, schema, error, isMySQL = false }: EditorProviderProps) {
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

  // Options
  const operatorOptions: SelectOption[] = [
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
  ];

  // Get the logical operator options
  const logicalOperatorOptions: SelectOption[] = [
    { value: "AND", label: "AND" },
    { value: "OR", label: "OR" },
  ];

  // Get the order by direction options
  const orderByDirectionOptions: SelectOption[] = [
    { value: "ASC", label: "Ascending (A-Z, low-high)" },
    { value: "DESC", label: "Descending (Z-A, high-low)" },
  ];

  // Get the limit options
  const limitOptions: SelectOption[] = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
    { value: "500", label: "500" },
    { value: "1000", label: "1000" },
  ];

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

  // Get the generate query from state function
  const generateQueryFromState = useCallback((
    selectedTable = queryState.selectedTable,
    selectedColumns = queryState.selectedColumns,
    isDistinct = queryState.isDistinct,
    whereClause = queryState.whereClause,
    selectedGroupByColumns = queryState.selectedGroupByColumns,
    havingClause = queryState.havingClause,
    orderByClause = queryState.orderByClause,
    limit = queryState.limit
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
          .map((col) => col.aggregate ? col.value : col.value)
          .join(", ");
    // Get the query string with the distinct and columns string and table name
    let query = `SELECT ${isDistinct ? "DISTINCT " : ""}${columnsString} FROM ${tableName}`;
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
            return `${logicalOp} ${colName} BETWEEN ${cond.value.value} AND ${cond.value2.value}`.trim();
            // Return the logical operator and column name and operator and value and value2
          }
          // If the operator is BETWEEN and the value and value2 is not null
          if (cond.value) {
            // Return the logical operator and column name and operator and value
            return `${logicalOp} ${colName} ${op} ${cond.value.value}`.trim();
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
        // Get the value
        const value = havingClause.condition.value.value;
        // Add the having clause to the query
        query += ` HAVING ${agg} ${op} ${value}`;
      } else {
        // Add the having clause to the query
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
    // Return the query with a semicolon
    return query + ";";
  }, []);

  // Handle the query change
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      // Set the query to the new query
      queryState.setQuery(newQuery);
    },
    [queryState.setQuery]
  );

  // Handle the table select
  const handleTableSelect = useCallback(
    (value: SelectOption | null) => {
      // Create a new selected columns array
      const newSelectedColumns: SelectOption[] = [];
      // Create a new selected group by columns array
      const newSelectedGroupByColumns: SelectOption[] = [];
      // Create a new where clause
      const newWhereClause = {
        conditions: [
          { column: null, operator: null, value: null, value2: null },
        ],
      };
      // Create a new order by clause
      const newOrderByClause = { column: null, direction: null };
      // Create a new limit
      const newLimit = null;
      // Create a new having clause
      const newHavingClause = {
        condition: { aggregateColumn: null, operator: null, value: null },
      };
      // Create a new is distinct
      const newIsDistinct = false;
      // Set the selected table
      queryState.setSelectedTable(value);
      // Set the selected columns
      queryState.setSelectedColumns(newSelectedColumns);
      // Set the selected group by columns
      queryState.setSelectedGroupByColumns(newSelectedGroupByColumns);
      // Set the where clause
      queryState.setWhereClause(newWhereClause);
      // Set the order by clause
      queryState.setOrderByClause(newOrderByClause);
      // Set the limit
      queryState.setLimit(newLimit);
      // Set the having clause
      queryState.setHavingClause(newHavingClause);
      // Set the is distinct
      queryState.setIsDistinct(newIsDistinct);
    // Generate a new query from the state
      const newQuery = generateQueryFromState(
        value,
        newSelectedColumns,
        newIsDistinct,
        newWhereClause,
        newSelectedGroupByColumns,
        newHavingClause,
        newOrderByClause,
        newLimit
      );
          // Set the query
      queryState.setQuery(newQuery);
    },
    [queryState, generateQueryFromState]
  );

  // Handle the column select
  const handleColumnSelect = useCallback(
    (value: SelectOption[]) => {
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
    (value: SelectOption, conditionIndex: number) => {
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
    (value: SelectOption, conditionIndex: number) => {
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
    (value: SelectOption, conditionIndex: number) => {
      // Create a new conditions array from the where clause conditions array
      const newConditions = [...queryState.whereClause.conditions];
      // Set the new conditions at the condition index to the new value
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        value: value,
      };
      // Create a new where clause with the new conditions
      const newWhereClause = { conditions: newConditions };
      // Set the where clause
      queryState.setWhereClause(newWhereClause);
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
    (value: SelectOption, conditionIndex: number) => {
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
    (value: SelectOption) => {
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
    (value: SelectOption) => {
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
    (value: SelectOption) => {
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
    (value: SelectOption, conditionIndex: number) => {
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
    (value: SelectOption, conditionIndex: number) => {
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
    (value: SelectOption, conditionIndex: number) => {
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
      // Create a new conditions array from the where clause conditions array
      const newConditions = queryState.whereClause.conditions.filter(
        (_, index) => index !== conditionIndex
      );
      // If the new conditions array is empty, push a new condition
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
    };
    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);
    // Remove the event listener
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runQuery, queryState.query, queryHistory.showHistory, queryHistory.setShowHistory]);

  // Create the context value
  const contextValue: EditorContextType = {
    schema,
    error,
    isMySQL,
    ...queryState,
    ...queryHistory,
    ...queryResults,
    ...computedValues,
    ...queryHandlers,
    ...exportFunctions,
    runQuery,
    logQueryResultAsJson,
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
    operatorOptions,
    logicalOperatorOptions,
    orderByDirectionOptions,
    limitOptions,
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

import { create } from 'zustand';
import { toast } from 'react-toastify';
import { SelectOption } from '@/app/types/query';
import { useQueryStore } from './useQueryStore';
import { useHistoryStore } from './useHistoryStore';
import { useUIStore } from './useUIStore';

interface QueryActionsState {
  // Actions
  runQuery: (query: string) => Promise<void>;
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
  generateQueryFromState: () => string;
}

// This function will be used to generate the query from the current state
const generateQueryFromState = (): string => {
  const state = useQueryStore.getState();
  const {
    selectedTable,
    selectedColumns,
    isDistinct,
    whereClause,
    selectedGroupByColumns,
    havingClause,
    orderByClause,
    limit,
    joinClauses,
    unionClauses,
    caseClause,
    cteClauses,
  } = state;

  if (!selectedTable) return '';

  // Build WITH clause (CTEs)
  let withClause = '';
  if (cteClauses && cteClauses.length > 0) {
    const validCtes = cteClauses.filter((cte) => cte.alias && cte.fromTable);
    if (validCtes.length > 0) {
      withClause = 'WITH ';
      withClause += validCtes
        .map((cte) => {
          const cteColumns =
            cte.selectedColumns.length > 0 && !cte.selectedColumns.some((col) => col.value === '*')
              ? cte.selectedColumns.map((col) => col.value).join(', ')
              : '*';

          let cteQuery = `${cte.alias} AS (SELECT ${cteColumns} FROM ${cte.fromTable!.value}`;

          // Add WHERE clause for CTE
          const validCteWhere = cte.whereClause.conditions.filter(
            (cond) =>
              cond.column &&
              cond.operator &&
              (cond.value || cond.operator.value === 'IS NULL' || cond.operator.value === 'IS NOT NULL')
          );

          if (validCteWhere.length > 0) {
            const cteWhereConditions = validCteWhere.map((cond, idx) => {
              const colName = cond.column!.value;
              const logicalOp = idx > 0 ? cond.logicalOperator?.value || 'AND' : '';
              const op = cond.operator!.value;

              if (op === 'IS NULL' || op === 'IS NOT NULL') {
                return `${logicalOp} ${colName} ${op}`.trim();
              }

              if (op === 'BETWEEN' && cond.value && cond.value2) {
                const value1 =
                  typeof cond.value.value === 'string' && !cond.value.value.match(/^['"]/)
                    ? `'${cond.value.value}'`
                    : cond.value.value;
                const value2 =
                  typeof cond.value2.value === 'string' && !cond.value2.value.match(/^['"]/)
                    ? `'${cond.value2.value}'`
                    : cond.value2.value;
                return `${logicalOp} ${colName} BETWEEN ${value1} AND ${value2}`.trim();
              }

              if (cond.value) {
                const value =
                  typeof cond.value.value === 'string' && !cond.value.value.match(/^['"]/)
                    ? `'${cond.value.value}'`
                    : cond.value.value;
                return `${logicalOp} ${colName} ${op} ${value}`.trim();
              }

              return `${logicalOp} ${colName} ${op}`.trim();
            });

            if (cteWhereConditions.length > 0) {
              cteQuery += ` WHERE ${cteWhereConditions.join(' ')}`;
            }
          }

          // Add GROUP BY clause for CTE
          if (cte.groupByColumns && cte.groupByColumns.length > 0) {
            const groupByColumns = cte.groupByColumns.map((col) => col.value).join(', ');
            cteQuery += ` GROUP BY ${groupByColumns}`;

            // Add HAVING clause for CTE
            const validHaving = cte.havingClause.conditions.filter(
              (cond) => cond.aggregateColumn && cond.operator && cond.value
            );

            if (validHaving.length > 0) {
              const havingConditions = validHaving.map((cond) => {
                const aggregate = cond.aggregateColumn!.value;
                const op = cond.operator!.value;
                const value =
                  typeof cond.value!.value === 'string' && !cond.value!.value.match(/^['"]/)
                    ? `'${cond.value!.value}'`
                    : cond.value!.value;
                return `${aggregate} ${op} ${value}`;
              });

              if (havingConditions.length > 0) {
                cteQuery += ` HAVING ${havingConditions.join(' AND ')}`;
              }
            }
          }

          cteQuery += ')';
          return cteQuery;
        })
        .join(', ');
      withClause += ' ';
    }
  }

  const tableName = selectedTable.value;
  const columnsString =
    selectedColumns.length === 0 || selectedColumns.some((col) => col.value === '*')
      ? '*'
      : selectedColumns
          .map((col) => {
            // Extract the actual column expression from col.label (e.g., "SUM(id)", "AVG(price)", or just "id")
            // The label contains the display value which is what should be in the SQL
            let colExpression = col.label;

            // If the label contains "All Columns", use the actual value
            if (col.label === 'All Columns (*)') {
              colExpression = '*';
            }

            // Apply alias if provided
            return col.alias ? `${colExpression} AS '${col.alias}'` : colExpression;
          })
          .join(', ');

  let caseStatement = '';
  if (caseClause && caseClause.conditions.length > 0) {
    const validCaseConditions = caseClause.conditions.filter(
      (cond) => cond.column && cond.operator && cond.result
    );

    if (validCaseConditions.length > 0) {
      caseStatement = 'CASE';
      validCaseConditions.forEach((cond) => {
        const colName = cond.column!.value;
        const operator = cond.operator!.value;
        const result = cond.result!.value;

        const formattedResult =
          typeof result === 'string' && !result.match(/^['"]/) ? `'${result}'` : result;

        if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
          caseStatement += ` WHEN ${colName} ${operator} THEN ${formattedResult}`;
        } else if (cond.value) {
          const value =
            typeof cond.value.value === 'string' && !cond.value.value.match(/^['"]/)
              ? `'${cond.value.value}'`
              : cond.value.value;
          caseStatement += ` WHEN ${colName} ${operator} ${value} THEN ${formattedResult}`;
        }
      });

      if (caseClause.elseValue) {
        const elseVal =
          typeof caseClause.elseValue.value === 'string' && !caseClause.elseValue.value.match(/^['"]/)
            ? `'${caseClause.elseValue.value}'`
            : caseClause.elseValue.value;
        caseStatement += ` ELSE ${elseVal}`;
      }

      caseStatement += ' END';

      if (caseClause.alias) {
        caseStatement += ` AS '${caseClause.alias}'`;
      }
    }
  }

  let finalColumnsString = columnsString;
  if (caseStatement && columnsString !== '*') {
    finalColumnsString = `${columnsString}, ${caseStatement}`;
  } else if (caseStatement && columnsString === '*') {
    finalColumnsString = caseStatement;
  }

  let query = `${withClause}SELECT ${isDistinct ? 'DISTINCT ' : ''}${finalColumnsString} FROM ${tableName}`;

  // Add JOIN clauses
  if (joinClauses && joinClauses.length > 0) {
    joinClauses.forEach((join) => {
      if (join.table && join.joinType) {
        const joinType = join.joinType.value || 'INNER JOIN';
        query += ` ${joinType} ${join.table.value}`;

        if (joinType !== 'CROSS JOIN' && join.onColumn1 && join.onColumn2) {
          query += ` ON ${tableName}.${join.onColumn1.value} = ${join.table.value}.${join.onColumn2.value}`;
        }
      }
    });
  }

  // Add WHERE clause
  const validWhereConditions = whereClause.conditions.filter(
    (cond) =>
      cond.column &&
      cond.operator &&
      (cond.value || cond.operator.value === 'IS NULL' || cond.operator.value === 'IS NOT NULL')
  );

  if (validWhereConditions.length > 0) {
    const whereConditions = validWhereConditions.map((cond, index) => {
      const colName = cond.column!.value;
      const logicalOp = index > 0 ? cond.logicalOperator?.value || 'AND' : '';
      const op = cond.operator!.value;

      if (op === 'IS NULL' || op === 'IS NOT NULL') {
        return `${logicalOp} ${colName} ${op}`.trim();
      }

      if (op === 'BETWEEN' && cond.value && cond.value2) {
        const value1 =
          typeof cond.value.value === 'string' && !cond.value.value.match(/^['"]/)
            ? `'${cond.value.value}'`
            : cond.value.value;
        const value2 =
          typeof cond.value2.value === 'string' && !cond.value2.value.match(/^['"]/)
            ? `'${cond.value2.value}'`
            : cond.value2.value;
        return `${logicalOp} ${colName} BETWEEN ${value1} AND ${value2}`.trim();
      }

      if (cond.value) {
        const value =
          typeof cond.value.value === 'string' && !cond.value.value.match(/^['"]/)
            ? `'${cond.value.value}'`
            : cond.value.value;
        return `${logicalOp} ${colName} ${op} ${value}`.trim();
      }

      return `${logicalOp} ${colName} ${op}`.trim();
    });

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' ')}`;
    }
  }

  // Add GROUP BY clause
  if (selectedGroupByColumns.length > 0) {
    const groupByString = selectedGroupByColumns.map((col) => col.value).join(', ');
    query += ` GROUP BY ${groupByString}`;
  }

  // Add HAVING clause
  if (havingClause.condition.aggregateColumn && havingClause.condition.operator) {
    const agg = havingClause.condition.aggregateColumn.value;
    const op = havingClause.condition.operator.value;

    if (op === 'IS NULL' || op === 'IS NOT NULL') {
      query += ` HAVING ${agg} ${op}`;
    } else if (havingClause.condition.value) {
      const value =
        typeof havingClause.condition.value.value === 'string' &&
        !havingClause.condition.value.value.match(/^['"]/)
          ? `'${havingClause.condition.value.value}'`
          : havingClause.condition.value.value;
      query += ` HAVING ${agg} ${op} ${value}`;
    } else {
      query += ` HAVING ${agg} ${op}`;
    }
  }

  // Add ORDER BY clause
  if (orderByClause.column) {
    const columnName = orderByClause.column.value;
    const direction = orderByClause.direction?.value || '';
    query += ` ORDER BY ${columnName}${direction ? ` ${direction}` : ''}`;
  }

  // Add LIMIT clause
  if (limit) {
    query += ` LIMIT ${limit.value}`;
  }

  // Add UNION clauses
  if (unionClauses && unionClauses.length > 0) {
    unionClauses.forEach((union) => {
      if (union.table) {
        const unionType = union.unionType?.value || 'UNION';
        query += ` ${unionType} SELECT ${columnsString} FROM ${union.table.value}`;
      }
    });
  }

  return query + ';';
};

export const useQueryActionsStore = create<QueryActionsState>(() => ({
  runQuery: async (query: string) => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    // This will be called from the component with the mutation
    // For now, we'll just update the query
    useQueryStore.getState().setQuery(query);
    useHistoryStore.getState().addToHistory(query.trim());
  },

  handleQueryChange: (newQuery: string) => {
    useUIStore.getState().setIsManualEdit(true);
    const queryStore = useQueryStore.getState();
    queryStore.setQuery(newQuery);

    // Clear visual builder state to prevent it from regenerating the query
    queryStore.setSelectedTable(null);
    queryStore.setSelectedColumns([]);
    queryStore.setWhereClause({
      conditions: [
        { column: null, operator: null, value: null, value2: null },
      ],
    });
  },

  handleTableSelect: (value: SelectOption | null) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();

    const shouldResetColumns = !queryState.selectedTable || !value;
    const newSelectedColumns: SelectOption[] = shouldResetColumns
      ? value
        ? [{ value: '*', label: 'All Columns (*)' }]
        : []
      : queryState.selectedColumns;

    queryState.setSelectedTable(value);

    if (shouldResetColumns) {
      queryState.setSelectedColumns(newSelectedColumns);
    }

    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleColumnSelect: (value: SelectOption[]) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setSelectedColumns(value);
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleDistinctChange: (value: boolean) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setIsDistinct(value);
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleGroupByColumnSelect: (value: SelectOption[]) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setSelectedGroupByColumns(value);
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleWhereColumnSelect: (value: SelectOption | null, conditionIndex: number) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    const newConditions = [...queryState.whereClause.conditions];
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      column: value,
    };
    queryState.setWhereClause({ conditions: newConditions });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleOperatorSelect: (value: SelectOption | null, conditionIndex: number) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    const newConditions = [...queryState.whereClause.conditions];
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      operator: value,
    };
    queryState.setWhereClause({ conditions: newConditions });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleValueSelect: (value: SelectOption | null, conditionIndex: number, isValue2: boolean = false) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    const newConditions = [...queryState.whereClause.conditions];
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      ...(isValue2 ? { value2: value } : { value: value }),
    };
    queryState.setWhereClause({ conditions: newConditions });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleLogicalOperatorSelect: (value: SelectOption | null, conditionIndex: number) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    const newConditions = [...queryState.whereClause.conditions];
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      logicalOperator: value,
    };
    queryState.setWhereClause({ conditions: newConditions });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleOrderByColumnSelect: (value: SelectOption | null) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setOrderByClause({
      ...queryState.orderByClause,
      column: value,
    });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleOrderByDirectionSelect: (value: SelectOption | null) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setOrderByClause({
      ...queryState.orderByClause,
      direction: value,
    });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleLimitSelect: (value: SelectOption | null) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setLimit(value);
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleAggregateColumnSelect: (value: SelectOption | null, conditionIndex: number) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setHavingClause({
      condition: {
        ...queryState.havingClause.condition,
        aggregateColumn: value,
      },
    });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleHavingOperatorSelect: (value: SelectOption | null, conditionIndex: number) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setHavingClause({
      condition: {
        ...queryState.havingClause.condition,
        operator: value,
      },
    });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  handleHavingValueSelect: (value: SelectOption | null, conditionIndex: number) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    queryState.setHavingClause({
      condition: {
        ...queryState.havingClause.condition,
        value: value,
      },
    });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  onDeleteCondition: (conditionIndex: number) => {
    useUIStore.getState().setIsManualEdit(false);
    const queryState = useQueryStore.getState();
    const newConditions = queryState.whereClause.conditions.filter((_, index) => index !== conditionIndex);

    if (newConditions.length === 0) {
      newConditions.push({
        column: null,
        operator: null,
        value: null,
        value2: null,
      });
    }

    queryState.setWhereClause({ conditions: newConditions });
    const newQuery = generateQueryFromState();
    queryState.setQuery(newQuery);
  },

  generateQueryFromState,
}));

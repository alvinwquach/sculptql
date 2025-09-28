"use client"

import { useCallback } from "react";
import { useEditorContext } from "@/app/context/EditorContext";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";

export const useQueryHandlers = () => {
  // Get the selected table, selected columns, selected group by columns, where clause, order by clause, having clause, limit, is distinct, query, and set query from the editor context
  const {
    selectedTable,
    selectedColumns,
    selectedGroupByColumns,
    whereClause,
    orderByClause,
    havingClause,
    limit,
    isDistinct,
    query,
    setQuery,
  } = useEditorContext();

  // Function to update the query from the where clause
  const updateQueryFromWhereClause = useCallback(
    // Function to update the query from the where clause
    (updatedWhereClause: typeof whereClause) => {
      // If the selected table is not true
      if (!selectedTable) {
        // Log the no table selected, skipping query update
        console.log("No table selected, skipping query update.");
        // Return
        return;
      }

      // Get the table name and strip the quotes if needed 
      const tableName = needsQuotes(selectedTable.value)
        // If the selected table value is true
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      // Get the columns string
      const columnsString =
        // If the selected columns length is 0 or the selected columns some is true
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          // Otherwise get the columns string by mapping the selected columns 
          // and joining them with a comma
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      // Get the new query
      let newQuery = `SELECT ${
        // If the is distinct is true
        isDistinct ? "DISTINCT " : ""
      }${columnsString} FROM ${tableName}`;
     
      // Get the conditions strings
      const conditionsStrings = updatedWhereClause.conditions
        // Map the conditions strings
        .map((cond, index) => {
          // If the column is not true return null
          if (!cond.column) return null;
          // Get the column name and strip the quotes if needed
          const colName = needsQuotes(cond.column!.value)
            // If the column value is true
            ? `"${cond.column!.value}"`
            : cond.column!.value;
          // Get the logical operator
          const logicalOp =
            index > 0 ? cond.logicalOperator?.value || "AND" : "";
          // If the operator is not true 
          // return the logical operator and column name
          if (!cond.operator) {
            return `${logicalOp} ${colName}`.trim();
          }
          // Get the operator
          const op = cond.operator!.value.toUpperCase();
          // If the operator is is null or is not null 
          // return the logical operator and column name and operator
          if (op === "IS NULL" || op === "IS NOT NULL") {
            return `${logicalOp} ${colName} ${op}`.trim();
          }
          // If the operator is between and the condition value 
          // and condition value2 are true
          if (op === "BETWEEN" && cond.value && cond.value2) {
            // Get the value1 and strip the quotes if needed
            const val1 = needsQuotes(cond.value.value, true)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            // Get the value2 and strip the quotes if needed
            const val2 = needsQuotes(cond.value2.value, true)
              ? `'${stripQuotes(cond.value2.value)}'`
              : cond.value2.value;
            // Return the logical operator and column name 
            // and operator and value1 and value2
            return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
          }
          // If the condition value is true
          if (cond.value) {
            // Get the value and strip the quotes if needed
            const val = needsQuotes(cond.value.value, true, undefined)
              // If the value is true
              ? `'${stripQuotes(cond.value.value)}'`
              // Otherwise get the value
              : cond.value.value;
            // Return the logical operator and column name 
            return `${logicalOp} ${colName} ${op} ${val}`.trim();
          }
          return `${logicalOp} ${colName} ${op}`.trim();
        })
        // Filter the conditions strings by the boolean
        .filter(Boolean);

      // If the conditions strings length is greater than 0
      if (conditionsStrings.length > 0) {
        // Add the conditions strings to the new query
        newQuery += ` WHERE ${conditionsStrings.join(" ")}`;
      }

      // If the selected group by columns length is greater than 0
      if (selectedGroupByColumns.length > 0) {
        // Get the group by string by mapping the selected group by columns 
        // and joining them with a comma
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        // Add the group by string to the new query
        newQuery += ` GROUP BY ${groupByString}`;
      }

      // If the having clause condition aggregate column is true
      if (havingClause.condition.aggregateColumn) {
        // Get the aggregate column value
        const agg = havingClause.condition.aggregateColumn.value;
        // Get the having string
        let havingString = `HAVING ${agg}`;
        // If the having clause condition operator is true
        if (havingClause.condition.operator) {
          const op = havingClause.condition.operator.value.toUpperCase();
          // Add the operator to the having string
          havingString += ` ${op}`;
          // If the having clause condition value is true
          if (havingClause.condition.value) {
            const val = needsQuotes(havingClause.condition.value.value, true)
              // If the value is true
              ? `'${stripQuotes(havingClause.condition.value.value)}'`
              // Otherwise get the value
              : havingClause.condition.value.value;
            // Add the value to the having string
            havingString += ` ${val}`;
          }
        }
        // Add the having string to the new query
        newQuery += ` ${havingString}`;
      }

      // If the order by clause column is true
      if (orderByClause.column) {
        // Get the column name and strip the quotes if needed
        const columnName = needsQuotes(orderByClause.column.value)
          // If the column value is true
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        // Get the direction
        const direction = orderByClause.direction?.value || "";
        // Add the order by string to the new query
        newQuery += ` ORDER BY ${columnName}${
          direction ? ` ${direction}` : ""
        }`;
      }
      // If the limit is true
      if (limit) {
        // Add the limit value to the new query
        newQuery += ` LIMIT ${limit.value}`;
      }
      // Trim the new query
      newQuery = newQuery.trim();
      // If the new query matches the from where group by having order by limit regex
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        // Add the semicolon to the new query
        newQuery += ";";
      } else {
        // Otherwise add the space to the new query
        newQuery += " ";
      }
      // Set the query to the new query
      setQuery(newQuery);
      // Log the updated query from WHERE clause
      console.log("Updated query from WHERE clause:", newQuery);
    },
    [
      selectedTable,
      selectedColumns,
      selectedGroupByColumns,
      havingClause,
      orderByClause,
      limit,
      isDistinct,
      setQuery,
    ]
  );

  // Function to update the query from the having clause
  const updateQueryFromHavingClause = useCallback(
    // Function to update the query from the having clause
    (updatedHavingClause: typeof havingClause) => {
      // If the selected table is not true
      if (!selectedTable) {
        // Log the no table selected, skipping query update
        console.log("No table selected, skipping query update.");
        // Return
        return;
      }

      // Get the table name and strip the quotes if needed
      const tableName = needsQuotes(selectedTable.value)
        // If the selected table value is true
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      // Get the columns string
      const columnsString =
        // If the selected columns length is 0 or the selected columns some is true
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          // Otherwise get the columns string by mapping the selected columns 
          // and joining them with a comma
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");
      // Get the new query
      let newQuery = `SELECT ${
        // If the is distinct is true
        isDistinct ? "DISTINCT " : ""
      }${columnsString} FROM ${tableName}`;
      // Get the conditions strings
      const conditionsStrings = whereClause.conditions
        // Filter the conditions strings by the column
        .filter((cond) => cond.column)
        // Map the conditions strings
        .map((cond, index) => {
          // Get the column name and strip the quotes if needed
          const colName = needsQuotes(cond.column!.value)
            ? `"${cond.column!.value}"`
            : cond.column!.value;
          // Get the logical operator if the index is greater than 0
          const logicalOp =
            index > 0 ? cond.logicalOperator?.value || "AND" : "";
          // If the operator is not true 
          // return the logical operator and column name
          if (!cond.operator) return `${logicalOp} ${colName}`.trim();
          // Get the operator and convert to uppercase
          const op = cond.operator.value.toUpperCase();
          // If the operator is is null or is not null 
          if (op === "IS NULL" || op === "IS NOT NULL") {
            // Return the logical operator and column name and operator
            return `${logicalOp} ${colName} ${op}`.trim();
          }

          // If the operator is between and the condition value and condition value2 are true
          if (op === "BETWEEN" && cond.value && cond.value2) {
            // Get the value1 and strip the quotes if needed
            const val1 = needsQuotes(cond.value.value)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            // Get the value2 and strip the quotes if needed
            const val2 = needsQuotes(cond.value2.value)
              ? `'${stripQuotes(cond.value2.value)}'`
              : cond.value2.value;
            // Return the logical operator and column name and operator and value1 and value2
            return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
          }

          // If the condition value is true
          if (cond.value) {
            // Get the value and strip the quotes if needed
            const val = needsQuotes(cond.value.value)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            // Return the logical operator and column name and operator and value
            return `${logicalOp} ${colName} ${op} ${val}`.trim();
          }

          // Return the logical operator and column name and operator
          return `${logicalOp} ${colName} ${op}`.trim();
        });

      // If the conditions strings length is greater than 0
      if (conditionsStrings.length > 0) {
        // Add the conditions strings to the new query
        newQuery += " WHERE " + conditionsStrings.join(" ");
      }

      // If the selected group by columns length is greater than 0
      if (selectedGroupByColumns.length > 0) {
        // Get the group by string by mapping the selected group by columns 
        // and joining them with a comma
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        // Add the group by string to the new query
        newQuery += ` GROUP BY ${groupByString}`;
      }

      // If the updated having clause condition aggregate column is true
      if (updatedHavingClause.condition.aggregateColumn) {
        // Get the aggregate column value
        const aggName = updatedHavingClause.condition.aggregateColumn.value;
        // Get the having string
        let havingString = `HAVING ${aggName}`;
        // If the updated having clause condition operator is true
        if (updatedHavingClause.condition.operator) {
          // Get the operator and convert to uppercase
          const op = updatedHavingClause.condition.operator.value.toUpperCase();
          // Add the operator to the having string
          havingString += ` ${op}`;
          // If the updated having clause condition value is true
          if (updatedHavingClause.condition.value) {
            // Get the value and strip the quotes if needed 
            const val = needsQuotes(updatedHavingClause.condition.value.value)
              ? `'${stripQuotes(updatedHavingClause.condition.value.value)}'`
              : updatedHavingClause.condition.value.value;
            // Add the value to the having string
            havingString += ` ${val}`;
          }
        }
        // Add the having string to the new query
        newQuery += ` ${havingString}`;
      }
      // If the order by clause column is true
      if (orderByClause.column) {
        // Get the column name and strip the quotes if needed
        const col = needsQuotes(orderByClause.column.value)
          // If the column value is true
          ? `"${orderByClause.column.value}"`
          // Otherwise get the column value
          : orderByClause.column.value;
        // Get the direction or empty string if the order by clause direction is not true
        const dir = orderByClause.direction?.value || "";
        // Add the order by string to the new query
        newQuery += ` ORDER BY ${col} ${dir}`.trim();
      }
      // If the limit is true
      if (limit) {
        // Add the limit value to the new query
        newQuery += ` LIMIT ${limit.value}`;
      }
      // Trim the new query
      newQuery = newQuery.trim();
      // If the new query matches the from where group by having order by limit regex
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        // Add the semicolon to the new query
        newQuery += ";";
      } else {
        // Otherwise add the space to the new query
        newQuery += " ";
      }
      // Log the updated query from having clause
      console.log("Updated query from having clause:", newQuery);
      // Set the query to the new query
      setQuery(newQuery);
    },
    [
      selectedTable,
      selectedColumns,
      selectedGroupByColumns,
      whereClause,
      orderByClause,
      limit,
      isDistinct,
      setQuery,
    ]
  );

  // Function to update the query with the order by and limit
  const updateQueryWithOrderByAndLimit = useCallback(
    (updatedOrderBy: typeof orderByClause, updatedLimit: typeof limit) => {
      // If the selected table is not true
      if (!selectedTable) {
        // Log the no table selected, skipping query update
        console.log("No table selected, skipping query update.");
        // Return
        return;
      }

      // Get the table name and strip the quotes if needed
      const tableName = needsQuotes(selectedTable.value)
        ? `"${selectedTable.value}"`
        : selectedTable.value;

      // Get the columns string
      const columnsString =
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          : selectedColumns
              // Map the selected columns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      // Get the new query
      let newQuery = `SELECT ${
        // If the is distinct is true
        isDistinct ? "DISTINCT " : ""
      }${columnsString} FROM ${tableName}`;
      // Get the where clause string
      let whereClauseString = "";
      // Get the where match
      const whereMatch = query.match(
        /\bWHERE\s+(.+?)(?=\s*(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      // If the where match is true
      if (whereMatch) {
        // Get the where clause string and trim it
        whereClauseString = whereMatch[0].trim();
      } else {
        // If the where clause is true and the where clause conditions is true and the where clause conditions is an array
        if (
          whereClause &&
          whereClause.conditions &&
          Array.isArray(whereClause.conditions)
        ) {
          // Get the conditions strings
          const conditionsStrings = whereClause.conditions
            // Filter the conditions strings by the column, operator, and value
            .filter((cond) => cond.column && cond.operator && cond.value)
            // Map the conditions strings
            .map((cond, index) => {
              // Get the column name and strip the quotes if needed
              const colName = needsQuotes(cond.column!.value)
                ? `"${cond.column!.value}"`
                : cond.column!.value;
              // Get the logical operator if the index is greater than 0
              const logicalOp: string =
                index > 0 ? cond.logicalOperator?.value || "AND" : "";
              // Get the operator and convert to uppercase
              const op = cond.operator!.value.toUpperCase();
              // If the operator is is null or is not null 
              if (op === "IS NULL" || op === "IS NOT NULL") {
                return `${logicalOp} ${colName} ${op}`.trim();
              }
              // If the operator is between and the condition value and condition value2 are true
              if (op === "BETWEEN" && cond.value && cond.value2) {
                // Get the value1 and strip the quotes if needed  
                const val1 = needsQuotes(cond.value.value)
                  ? `'${stripQuotes(cond.value.value)}'`
                  : cond.value.value;
                // Get the value2 and strip the quotes if needed
                const val2 = needsQuotes(cond.value2.value)
                  ? `'${stripQuotes(cond.value2.value)}'`
                  : cond.value2.value;
                // Return the logical operator and column name and operator and value1 and value2
                return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
              }
              // Get the value and strip the quotes if needed
              const val = needsQuotes(cond.value!.value)
                ? `'${stripQuotes(cond.value!.value)}'`
                : cond.value!.value;
              // Return the logical operator and column name and operator and value
              return `${logicalOp} ${colName} ${op} ${val}`.trim();
            });
          // If the conditions strings length is greater than 0
          if (conditionsStrings.length > 0) {
            // Add the conditions strings to the where clause string
            whereClauseString = "WHERE " + conditionsStrings.join(" ");
          }
        }
      }
      // If the where clause string is true
      if (whereClauseString) {
        // Add the where clause string to the new query
        newQuery += ` ${whereClauseString}`;
      }
      // If the selected group by columns length is greater than 0
      if (selectedGroupByColumns.length > 0) {
        // Get the group by string by mapping the selected group by columns 
        // and joining them with a comma
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        newQuery += ` GROUP BY ${groupByString}`;
      }
      // If the having clause condition aggregate column is true
      if (havingClause.condition.aggregateColumn) {
        // Get the aggregate column value
        const aggName = havingClause.condition.aggregateColumn.value;
        // Get the having string
        let havingString = `HAVING ${aggName}`;
        // If the having clause condition operator is true
        if (havingClause.condition.operator) {
          // Get the operator and convert to uppercase
          const op = havingClause.condition.operator.value.toUpperCase();
          // Add the operator to the having string
          havingString += ` ${op}`;
          // If the having clause condition value is true
          if (havingClause.condition.value) {
            // Get the value and strip the quotes if needed
            const val = needsQuotes(havingClause.condition.value.value)
              ? `'${stripQuotes(havingClause.condition.value.value)}'`
              : havingClause.condition.value.value;
            // Add the value to the having string
            havingString += ` ${val}`;
          }
        }
        // Add the having string to the new query
        newQuery += ` ${havingString}`;
      }
      // If the updated order by clause column is true
      if (updatedOrderBy.column) {
        // Get the column name and strip the quotes if needed
        const columnName = needsQuotes(updatedOrderBy.column.value)
          ? `"${updatedOrderBy.column.value}"`
          : updatedOrderBy.column.value;
        // Get the direction or empty string if the order by clause direction is not true
        const direction = updatedOrderBy.direction?.value || "";
        // Add the order by string to the new query
        newQuery += ` ORDER BY ${columnName}${
          direction ? ` ${direction}` : ""
        }`;
      }
      // If the updated limit is true
      if (updatedLimit) {
        // Add the limit value to the new query
        newQuery += ` LIMIT ${updatedLimit.value}`;
      }
      // Trim the new query
      newQuery = newQuery.trim();
      // If the new query matches the from where group by having order by limit regex
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        // Add the semicolon to the new query
        newQuery += ";";
      } else {
        // Otherwise add the space to the new query
        newQuery += " ";
      }
      // Set the query to the new query
      setQuery(newQuery);
    },
    [
      selectedTable,
      selectedColumns,
      selectedGroupByColumns,
      query,
      isDistinct,
      whereClause,
      havingClause,
      setQuery,
    ]
  );

  return {
    updateQueryFromWhereClause,
    updateQueryFromHavingClause,
    updateQueryWithOrderByAndLimit,
  };
};

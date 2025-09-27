"use client";

import { useCallback } from "react";
import { SelectOption, WhereClause, HavingClause, OrderByClause } from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";


// Interface for the query handlers
export interface QueryHandlers {
  updateQueryFromWhereClause: (updatedWhereClause: WhereClause) => void;
  updateQueryFromHavingClause: (updatedHavingClause: HavingClause) => void;
  updateQueryWithOrderByAndLimit: (updatedOrderBy: OrderByClause, updatedLimit: SelectOption | null) => void;
}

export function useQueryHandlers(
  selectedTable: SelectOption | null,
  selectedColumns: SelectOption[],
  selectedGroupByColumns: SelectOption[],
  havingClause: HavingClause,
  orderByClause: OrderByClause,
  limit: SelectOption | null,
  isDistinct: boolean,
  query: string,
  whereClause: WhereClause,
  isMySQL: boolean,
  setQuery: (query: string) => void
): QueryHandlers {
  // Update the query from the where clause
  const updateQueryFromWhereClause = useCallback(
    // Function to update the query from the where clause
    (updatedWhereClause: WhereClause) => {
      // If the selected table is not null, update the query
      if (!selectedTable) {
        // Log a warning if the selected table is not null
        console.log("No table selected, skipping query update.");
        // Return if the selected table is not null
        return;
      }

      // Get the table name
      const tableName = needsQuotes(selectedTable.value)
        // If the table name needs quotes, add quotes to the table name
        ? `"${selectedTable.value}"`
        // If the table name does not need quotes, add the table name
        : selectedTable.value;

      // Get the columns string
      const columnsString =
        // If the selected columns length is 0 
        // or the selected columns some of the columns value is *, add *
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          // If the selected columns length is not 0 
          // and the selected columns some of the columns value is not *, 
          // add the columns string
          // Map the selected columns to the columns string
          // If the column is aggregate, add the column value
          // If the column needs quotes, add quotes to the column
          // If the column does not need quotes, add the column value
          // Join the columns string with a comma
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      // Create a new query
      let newQuery = `SELECT ${
        // If the isDistinct is true, add DISTINCT to the query
        isDistinct ? "DISTINCT " : ""
        // Add the columns string
        // Add the table name
      }${columnsString} FROM ${tableName}`;

      // Get the conditions strings
      const conditionsStrings = updatedWhereClause.conditions
        // Map the conditions to the conditions strings
        // If the condition column is not null, add the condition column
        // If the condition logical operator is not null, add the condition logical operator
        // If the condition operator is not null, add the condition operator
        // If the condition value is not null, add the condition value
        .map((cond, index) => {
          if (!cond.column) return null;
          // Get the column name
          // If the column name needs quotes, add quotes to the column name
          // If the column name does not need quotes, add the column name
          const colName = needsQuotes(cond.column!.value)
            ? `"${cond.column!.value}"`
            : cond.column!.value;
          // Get the logical operator
          const logicalOp =
            // If the index is greater than 0, add the logical operator
            // Otherwise, add AND by default 
            index > 0 ? cond.logicalOperator?.value || "AND" : "";

          // If the operator is not null, add the logical operator 
          // and column name to the conditions strings
          if (!cond.operator) {
            // Add the logical operator and column name to the conditions strings
            // Return the conditions strings
            return `${logicalOp} ${colName}`.trim();
          }
          // Get the operator and make it uppercase
          const op = cond.operator!.value.toUpperCase();
          // If the operator is IS NULL or IS NOT NULL, 
          // add the IS NULL or IS NOT NULL to the conditions strings
          if (op === "IS NULL" || op === "IS NOT NULL") {
            // Add the IS NULL or IS NOT NULL to the conditions strings
            // Add the logical operator and column name 
            // and operator to the conditions strings
            // Return the conditions strings
            return `${logicalOp} ${colName} ${op}`.trim();
          }
          // If the operator is BETWEEN and the value and value 2 are not null, 
          // add the BETWEEN to the conditions strings
          if (op === "BETWEEN" && cond.value && cond.value2) {
            const val1 = needsQuotes(cond.value.value, true)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            const val2 = needsQuotes(cond.value2.value, true)
              ? `'${stripQuotes(cond.value2.value)}'`
              : cond.value2.value;
            return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
          }
          // If the value is not null, add the value to the conditions strings
          if (cond.value) {
            // Get the value
            // If the value needs quotes, add quotes to the value
            const val = needsQuotes(cond.value.value, true, undefined)
            // If the value does not need quotes, add the value
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            // Add the logical operator and column name 
            // and operator and value to the conditions strings
            return `${logicalOp} ${colName} ${op} ${val}`.trim();
          }
          // Add the logical operator and column name 
          // and operator to the conditions strings
          return `${logicalOp} ${colName} ${op}`.trim();
        })
        // Filter the conditions strings to the conditions strings that are not null
        .filter(Boolean);

      // If the conditions strings length is not 0, 
      // add the conditions to the new query
      if (conditionsStrings.length > 0) {
        // Add the conditions to the new query
        newQuery += ` WHERE ${conditionsStrings.join(" ")}`;
      }

      // If the selected group by columns length is not 0, 
      // add the group by to the new query
      if (selectedGroupByColumns.length > 0) {
        // Get the group by string
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        newQuery += ` GROUP BY ${groupByString}`;
      }
      // If the having clause condition aggregate column is not null, 
      // add the having clause to the new query
      if (havingClause.condition.aggregateColumn) {
        // Get the aggregate column
        const agg = havingClause.condition.aggregateColumn.value;
        // Create a new having string
        let havingString = `HAVING ${agg}`;
        // If the having clause condition operator is not null, 
        if (havingClause.condition.operator) {
          // Get the operator
          const op = havingClause.condition.operator.value.toUpperCase();
          // Add the operator to the having string
          havingString += ` ${op}`;
          // If the having clause condition value is not null, 
          // add the value to the having string
          if (havingClause.condition.value) {
            // Get the value  
            // If the value needs quotes, add quotes to the value
            const val = needsQuotes(havingClause.condition.value.value, true)
              // If the value does not need quotes, add the value
            ? `'${stripQuotes(havingClause.condition.value.value)}'`
              : havingClause.condition.value.value;
            // Add the value to the having string
            havingString += ` ${val}`;
          }
        }
        // Add the having string to the new query
        newQuery += ` ${havingString}`;
      }
      // If the order by column is not null, add the order by to the new query
      if (orderByClause.column) {
        // Get the column name
        const columnName = needsQuotes(orderByClause.column.value)
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        // Get the direction
        const direction = orderByClause.direction?.value || "";
        // Add the order by to the new query
        newQuery += ` ORDER BY ${columnName}${
          direction ? ` ${direction}` : ""
        }`;
      }
      // If the limit is not null, add the limit to the new query
      if (limit) {
          
        newQuery += ` LIMIT ${limit.value}`;
      }

      newQuery = newQuery.trim();
      // If the new query matches the regex, add a semicolon
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        newQuery += ";";
      } else {
        newQuery += " ";
      }
      // Set the query
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

  // Update the query from the having clause
  const updateQueryFromHavingClause = useCallback(
    (updatedHavingClause: HavingClause) => {
      // If the selected table is not null, update the query
      if (!selectedTable) return;
      // Get the table name
      const tableName = needsQuotes(selectedTable.value)
        ? `"${selectedTable.value}"`
        : selectedTable.value;
      // Get the columns string
      const columnsString =
        // If the selected columns length is 0 
        // or the selected columns some of the columns value is *, add *
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");
      // Create a new query
      let newQuery = `SELECT ${
        // If the isDistinct is true, add DISTINCT to the query
        isDistinct ? "DISTINCT " : ""
        // Add the columns string
        // Add the table name
      }${columnsString} FROM ${tableName}`;
      // Get the conditions strings
      const conditionsStrings = whereClause.conditions
        // Filter the conditions to the conditions 
        // that have a column
        .filter((cond) => cond.column)
        .map((cond, index) => {
          // Get the column name
          // If the column name needs quotes, add quotes to the column name
          // If the column name does not need quotes, add the column name
          const colName = needsQuotes(cond.column!.value)
            ? `"${cond.column!.value}"`
            : cond.column!.value;
          // Get the logical operator
          const logicalOp =
            // If the index is greater than 0, 
            // add the logical operator
            // Otherwise, add AND
            index > 0 ? cond.logicalOperator?.value || "AND" : "";
          // If the operator is not null, 
          // add the logical operator and column name to the conditions strings
          if (!cond.operator) return `${logicalOp} ${colName}`.trim();
          // Get the operator and make it uppercase
          const op = cond.operator.value.toUpperCase();
          // If the operator is IS NULL or IS NOT NULL, 
          // add the IS NULL or IS NOT NULL to the conditions strings
          if (op === "IS NULL" || op === "IS NOT NULL") {
            // Add the IS NULL or IS NOT NULL to the conditions strings
            // Add the logical operator and column name 
            // and operator to the conditions strings
            // Return the conditions strings
            return `${logicalOp} ${colName} ${op}`.trim();
          }
          // If the operator is BETWEEN and the value and value 2 are not null, 
          // add the BETWEEN to the conditions strings
          if (op === "BETWEEN" && cond.value && cond.value2) {
            // Get the value 1
            // If the value 1 needs quotes, add quotes to the value 1
            // If the value 1 does not need quotes, add the value 1
            const val1 = needsQuotes(cond.value.value)
              ? `'${stripQuotes(cond.value.value)}'`
              : cond.value.value;
            // Get the value 2
            // If the value 2 needs quotes, add quotes to the value 2
            // If the value 2 does not need quotes, add the value 2
            const val2 = needsQuotes(cond.value2.value)
              ? `'${stripQuotes(cond.value2.value)}'`
              : cond.value2.value;
            // Add the BETWEEN to the conditions strings
            return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
          }
          // If the condition value is not null, 
          // add the condition value to the conditions strings
          if (cond.value) {
            // Get the value
            const val = needsQuotes(cond.value.value)
            // If the value needs quotes, add quotes to the value
            ? `'${stripQuotes(cond.value.value)}'`
            : cond.value.value;
            // If the value does not need quotes, add the value
            return `${logicalOp} ${colName} ${op} ${val}`.trim();
          }
          // Add the logical operator and column name 
          // and operator to the conditions strings
          return `${logicalOp} ${colName} ${op}`.trim();
        });

      // If the conditions strings length is not 0, 
      // add the conditions to the new query
      if (conditionsStrings.length > 0) {
        // Add the conditions to the new query
        newQuery += " WHERE " + conditionsStrings.join(" ");
      }

      // If the selected group by columns length is not 0, 
      // add the group by to the new query
      if (selectedGroupByColumns.length > 0) {
        // Get the group by string 
        const groupByString = selectedGroupByColumns
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          // Join the group by string with a comma
          .join(", ");
        // Add the group by to the new query
        newQuery += ` GROUP BY ${groupByString}`;
      }
      // If the having clause condition aggregate column is not null, 
      // add the having clause to the new query
      if (updatedHavingClause.condition.aggregateColumn) {
        // Get the aggregate name
        const aggName = updatedHavingClause.condition.aggregateColumn.value;
        // Create a new having string
        let havingString = `HAVING ${aggName}`;
        // If the having clause condition operator is not null, 
        // add the operator to the having string
        if (updatedHavingClause.condition.operator) {
          // Get the operator
          const op = updatedHavingClause.condition.operator.value.toUpperCase();
          // Add the operator to the having string
          havingString += ` ${op}`;
          // If the having clause condition value is not null, 
          // add the value to the having string
          if (updatedHavingClause.condition.value) {
            // Get the value
            const val = needsQuotes(updatedHavingClause.condition.value.value)
            // If the value needs quotes, add quotes to the value
            ? `'${stripQuotes(updatedHavingClause.condition.value.value)}'`
            // If the value does not need quotes, add the value
              : updatedHavingClause.condition.value.value;
            havingString += ` ${val}`;
          }
        }
        // Add the having string to the new query
        newQuery += ` ${havingString}`;
      }
      // If the order by column is not null, add the order by to the new query
      if (orderByClause.column) {
        // Get the column name
        const col = needsQuotes(orderByClause.column.value)
          // If the column name needs quotes, add quotes to the column name
          ? `"${orderByClause.column.value}"`
          : orderByClause.column.value;
        // Get the direction
        const dir = orderByClause.direction?.value || "";
        // Add the order by to the new query
        newQuery += ` ORDER BY ${col} ${dir}`.trim();
      }
      // If the limit is not null, add the limit to the new query
      if (limit) {
        newQuery += ` LIMIT ${limit.value}`;
      }

      newQuery = newQuery.trim();
      // If the new query matches the regex, add a semicolon
      if (
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        newQuery += ";";
      } else {
        newQuery += " ";
      }
      // Log the updated query from having clause
      console.log("Updated query from having clause:", newQuery);
      // Set the query
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

  // Update the query with the order by and limit
  const updateQueryWithOrderByAndLimit = useCallback(
    // Function to update the query with the order by and limit
    (updatedOrderBy: OrderByClause, updatedLimit: SelectOption | null) => {
      // If the selected table is not null, update the query
      if (!selectedTable) {
        // Log a warning if the selected table is not null
        console.log("No table selected, skipping query update.");
        // Return if the selected table is not null
        return;
      }

      // Get the table name
      const tableName = needsQuotes(selectedTable.value)
        // If the table name needs quotes, add quotes to the table name
        ? `"${selectedTable.value}"`
        // If the table name does not need quotes, add the table name
        : selectedTable.value;

      // Get the columns string
      const columnsString =
        // If the selected columns length is 0 
        // or the selected columns some of the columns value is *, add *
        selectedColumns.length === 0 ||
        selectedColumns.some((col) => col.value === "*")
          ? "*"
          // If the selected columns length is not 0 
          // and the selected columns some of the columns value is not *, 
          // add the columns string
          // Map the selected columns to the columns string
          // If the column is aggregate, add the column value
          // If the column needs quotes, add quotes to the column
          // If the column does not need quotes, add the column value
          // Join the columns string with a comma
          : selectedColumns
              .map((col) =>
                col.aggregate
                  ? col.value
                  : needsQuotes(col.value)
                  ? `"${col.value}"`
                  : col.value
              )
              .join(", ");

      // Create a new query
      let newQuery = `SELECT ${
        // If the isDistinct is true, add DISTINCT to the query
        isDistinct ? "DISTINCT " : ""
        // Add the columns string
        // Add the table name
      }${columnsString} FROM ${tableName}`;

      // Create a new where clause string
      let whereClauseString = "";
      // Get the where match
      const whereMatch = query.match(
        /\bWHERE\s+(.+?)(?=\s*(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      // If the where match is true, 
      // add the where clause string to the new query
      if (whereMatch) {
        whereClauseString = whereMatch[0].trim();
      } else {
        if (
          whereClause &&
          whereClause.conditions &&
          Array.isArray(whereClause.conditions)
        ) {
          // Get the conditions strings
          // Filter the conditions to the conditions 
          // that have a column, operator, and value
          const conditionsStrings = whereClause.conditions
            .filter((cond) => cond.column && cond.operator && cond.value)
            .map((cond, index) => {
              // Get the column name
              // If the column name needs quotes, add quotes to the column name
              // If the column name does not need quotes, add the column name
              const colName = needsQuotes(cond.column!.value)
                ? `"${cond.column!.value}"`
                : cond.column!.value;
              // Get the logical operator
              const logicalOp: string =
                index > 0 ? cond.logicalOperator?.value || "AND" : "";
              const op = cond.operator!.value.toUpperCase();
              // If the operator is IS NULL or IS NOT NULL, 
              // add the IS NULL or IS NOT NULL to the new query
              if (op === "IS NULL" || op === "IS NOT NULL") {
                // Add the IS NULL or IS NOT NULL to the new query
                return `${logicalOp} ${colName} ${op}`.trim();
              }
              // If the operator is BETWEEN and the value and value 2 are not null, 
              // add the BETWEEN to the new query
              if (op === "BETWEEN" && cond.value && cond.value2) {
                // Get the value 1
                // If the value 1 needs quotes, add quotes to the value 1
                // If the value 1 does not need quotes, add the value 1
                const val1 = needsQuotes(cond.value.value)
                  ? `'${stripQuotes(cond.value.value)}'`
                  : cond.value.value;
                // Get the value 2
                // If the value 2 needs quotes, add quotes to the value 2
                // If the value 2 does not need quotes, add the value 2
                const val2 = needsQuotes(cond.value2.value)
                  ? `'${stripQuotes(cond.value2.value)}'`
                  : cond.value2.value;
                // Add the BETWEEN to the new query
                return `${logicalOp} ${colName} BETWEEN ${val1} AND ${val2}`.trim();
              }
              // Get the value
              const val = needsQuotes(cond.value!.value)
                // If the value needs quotes, add quotes to the value
                ? `'${stripQuotes(cond.value!.value)}'`
                // If the value does not need quotes, add the value
                : cond.value!.value;
              return `${logicalOp} ${colName} ${op} ${val}`.trim();
            });
          // If the conditions strings length is not 0, 
          if (conditionsStrings.length > 0) {
            // Add the where clause string to the new query
            whereClauseString = "WHERE " + conditionsStrings.join(" ");
          }
        }
      }

      // If the where clause string is not null, 
      if (whereClauseString) {
        // add the where clause to the new query
        newQuery += ` ${whereClauseString}`;
      }

      // If the selected group by columns length is not 0, 
      // add the group by to the new query
      if (selectedGroupByColumns.length > 0) {
        // Get the group by string
        const groupByString = selectedGroupByColumns
          // Map the selected group by columns to the group by string
          // If the column value needs quotes, add quotes to the column value
          // If the column value does not need quotes, add the column value
          // Join the group by string with a comma
          .map((col) => (needsQuotes(col.value) ? `"${col.value}"` : col.value))
          .join(", ");
        newQuery += ` GROUP BY ${groupByString}`;
      }

      // If the having clause condition aggregate column is not null, 
      // add the having clauseto the new query
      if (havingClause.condition.aggregateColumn) {
        // Get the aggregate name
        const aggName = havingClause.condition.aggregateColumn.value;
        // Create a new having string
        let havingString = `HAVING ${aggName}`;
        // If the having clause condition operator is not null, 
        // add the operator to the having string
        if (havingClause.condition.operator) {
          const op = havingClause.condition.operator.value.toUpperCase();
          havingString += ` ${op}`;
          // If the having clause condition value is not null, 
          // add the value to the having string
          if (havingClause.condition.value) {
            const val = needsQuotes(havingClause.condition.value.value)
              ? `'${stripQuotes(havingClause.condition.value.value)}'`
              : havingClause.condition.value.value;
            havingString += ` ${val}`;
          }
        }
        // Add the having string to the new query
        newQuery += ` ${havingString}`;
      }
      // If the updated order by column is not null, add the order by to the new query
      if (updatedOrderBy.column) {
        // Get the column name
        const columnName = needsQuotes(updatedOrderBy.column.value)
          // If the column name needs quotes, add quotes to the column name
          ? `"${updatedOrderBy.column.value}"`
          // If the column name does not need quotes, add the column name
          : updatedOrderBy.column.value;
        // Get the direction
        const direction = updatedOrderBy.direction?.value || "";
        // Add the order by to the new query
        newQuery += ` ORDER BY ${columnName}${
          // If the direction is not null, add the direction to the new query
          direction ? ` ${direction}` : ""
        }`;
      }
      // If the updated limit is not null, add the limit to the new query
      if (updatedLimit) {
        // Add the limit to the new query
        newQuery += ` LIMIT ${updatedLimit.value}`;
      }
      // Trim the new query
      newQuery = newQuery.trim();
      if (
        // If the new query matches the regex, add a semicolon
        newQuery.match(/\b(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i)
      ) {
        // If the new query matches the regex, add a semicolon
        newQuery += ";";
      } else {
        // If the new query does not match the regex, add a space
        newQuery += " ";
      }
      // Set the query
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
}

import { useCallback } from "react";
import { useEditorContext } from "@/app/context/EditorContext";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { SelectOption, WhereClause, HavingClause } from "@/app/types/query";

export const useQueryParser = () => {
  const {
    tableNames,
    tableColumns,
    isMySQL,
    setQuery,
    setSelectedTable,
    setSelectedColumns,
    setSelectedGroupByColumns,
    setWhereClause,
    setOrderByClause,
    setLimit,
    setHavingClause,
    setIsDistinct,
  } = useEditorContext();

  // Function to handle query change
  const handleQueryChange = useCallback(
    // New query
    (newQuery: string) => {
      // Log the handling query change, input query
      console.log("Handling query change, input query:", newQuery);
      // Normalize the query
      let normalizedQuery = newQuery
        // Replace the order by, limit, where, from, group by, having with a space
        .replace(
          /;+\s*(?=ORDER\s+BY|LIMIT|WHERE|FROM|GROUP\s+BY|HAVING)/gi,
          " "
        )
        // Replace the end of the query with a space
        .replace(/;+$/, "")
        // Trim the query
        .trim();

      // If the normalized query matches the limit, order by, having clause
      if (
        normalizedQuery.match(/\b(LIMIT\s+\d+|ORDER\s+BY\s+.*|HAVING\s+.*)$/i)
      ) {
        normalizedQuery += ";";
      } else {
        normalizedQuery += " ";
      }
      // Log the normalized query
      console.log("Normalized query:", normalizedQuery);
      // Set the query
      setQuery(normalizedQuery);

      const isDistinctQuery = normalizedQuery.match(/\bSELECT\s+DISTINCT\b/i);
      // Set the is distinct
      setIsDistinct(!!isDistinctQuery);
      // Get the table match
      const tableMatch = normalizedQuery.match(
        /FROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i
      );
      // Get the table name
      const tableName = tableMatch ? stripQuotes(tableMatch[1]) : null;
      // If the table name is true and the table names includes the table name
      if (tableName && tableNames.includes(tableName)) {
        // If the table name is not true
        if (!tableName) {
          // Log the setting selected table
          console.log("Setting selected table:", tableName);
          // Set the selected table
          setSelectedTable({ value: tableName, label: tableName });
        }
      } else if (!normalizedQuery) {
        // Log the clearing state due to empty query
        console.log("Clearing state due to empty query.");
        // Set the selected table to null
        setSelectedTable(null);
        // Set the selected columns to empty array
        setSelectedColumns([]);
        // Set the selected group by columns to empty array
        setSelectedGroupByColumns([]);
        // Set the where clause to the conditions
        setWhereClause({
          conditions: [
            { column: null, operator: null, value: null, value2: null },
          ],
        });
        // Set the order by clause to null
        setOrderByClause({ column: null, direction: null });
        // Set the limit to null
        setLimit(null);
        // Set the having clause to the condition
        setHavingClause({
          condition: { aggregateColumn: null, operator: null, value: null },
        });
        // Set the is distinct to false
        setIsDistinct(false);
        // Return
        return;
      }

      // Parse SELECT clause
      const selectMatch = normalizedQuery.match(
        /SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i
      );
      // If the select match is true and the table name is true
      if (selectMatch && tableName) {
        // Get the columns string
        const columnsStr = selectMatch[2].trim();
        // If the columns string is * or empty
        if (columnsStr === "*" || columnsStr === "") {
          // Set the selected columns to the all columns
          setSelectedColumns([{ value: "*", label: "All Columns (*)" }]);
        } else {
          // Get the column regex
          const columnRegex =
            /(?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*|COUNT\(\*\)|ROUND\((?:AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(?:[^,)]+)\)(?:,\s*(\d+))?\)|(?:SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(?:[^,)]+)(?:,\s*(\d+))?\))/gi;
          // Set the parsed columns to the parsed columns
          const parsedColumns: SelectOption[] = [];
          // Set the match to the match
          let match;
          // While the match is not null
          while ((match = columnRegex.exec(columnsStr)) !== null) {
            const col = match[0];
            // If the col is *
            if (col === "*") {
              // Set the parsed columns to the all columns
              parsedColumns.push({ value: "*", label: "All Columns (*)" });
            } else if (col === "COUNT(*)") {
              // Set the parsed columns to the count
              parsedColumns.push({
                value: "COUNT(*)",
                label: "COUNT(*)",
                aggregate: true,
              });

              // If the col matches the sum, avg, max, min, round, count
            } else if (col.match(/^(SUM|AVG|MAX|MIN|ROUND|COUNT)\(/i)) {
              // Get the func match
              const funcMatch = col.match(
                /^(SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(.+?)(?:,\s*(\d+))?\)$/i
              );
              // Get the nested match
              const nestedMatch = col.match(
                /^ROUND\((AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(.+?)\)(?:,\s*(\d+))?\)$/i
              );
              // If the nested match is true
              if (nestedMatch) {
                // Get the inner func
                const innerFunc = nestedMatch[1];
                // Get the target col
                const targetCol = stripQuotes(nestedMatch[2]);
                // Get the decimals
                const decimals = nestedMatch[3] || null;
                // Get the is distinct
                const isDistinct = col.includes("DISTINCT");
                if (
                  tableColumns[tableName]?.includes(targetCol) &&
                  (!isDistinct || innerFunc === "COUNT" || isMySQL)
                ) {
                  // Set the parsed columns to the parsed columns
                  parsedColumns.push({
                    value: isDistinct
                      ? `ROUND(${innerFunc}(DISTINCT ${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        })${decimals ? `, ${decimals}` : ""})`
                      : `ROUND(${innerFunc}(${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        })${decimals ? `, ${decimals}` : ""})`,
                    label: isDistinct
                      ? `ROUND(${innerFunc}(DISTINCT ${targetCol})${
                          decimals ? `, ${decimals}` : ""
                        })`
                      : `ROUND(${innerFunc}(${targetCol})${
                          decimals ? `, ${decimals}` : ""
                        })`,
                    aggregate: true,
                    column: targetCol,
                  });
                }
              } else if (funcMatch) {
                // Get the func
                const func = funcMatch[1];
                // Get the target col
                const targetCol = stripQuotes(funcMatch[2]);
                // Get the decimals
                const decimals = funcMatch[3] || null;
                // Get the is distinct
                const isDistinct = col.includes("DISTINCT");
                // If the table columns includes the target col 
                // and the is distinct is false 
                // or the func is count or the is mysql
                if (
                  tableColumns[tableName]?.includes(targetCol) &&
                  (!isDistinct || func === "COUNT" || isMySQL)
                ) {
                  // Set the parsed columns to the parsed columns
                  // If the is distinct
                  // and the func is count or the is mysql
                  parsedColumns.push({
                    value: isDistinct
                      ? `${func}(DISTINCT ${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        }${decimals ? `, ${decimals}` : ""})`
                      : `${func}(${
                          needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                        }${decimals ? `, ${decimals}` : ""})`,
                    label: isDistinct
                      ? `${func}(DISTINCT ${targetCol}${
                          decimals ? `, ${decimals}` : ""
                        })`
                      : `${func}(${targetCol}${
                          decimals ? `, ${decimals}` : ""
                        })`,
                    aggregate: func !== "ROUND",
                    column: targetCol,
                  });
                }
              }
            } else {
              // Get the clean col
              const cleanCol = stripQuotes(col);
              // If the table columns includes the clean col
              if (tableColumns[tableName]?.includes(cleanCol)) {
                // Set the parsed columns to the parsed columns
                parsedColumns.push({ value: cleanCol, label: cleanCol });
              }
            }
          }
          // Set the selected columns to the parsed columns
          setSelectedColumns(
            // If the parsed columns length is greater than 0
            // then set the selected columns to the parsed columns
            // otherwise set the selected columns to the all columns
            parsedColumns.length > 0
              ? parsedColumns
              : [{ value: "*", label: "All Columns (*)" }]
          );
        }
      // If the normalized query is not true
      } else if (!normalizedQuery) {
        // Set the selected columns to empty array
        setSelectedColumns([]);
      }

      // Get the group by match
      const groupByMatch = normalizedQuery.match(
        /\bGROUP\s+BY\s+(.+?)(?=\s*(HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      // If the group by match is true and the table name is true
      if (groupByMatch && tableName) {
        // Get the group by string and trim it
        const groupByStr = groupByMatch[1].trim();
        // Get the group by columns 
        // by splitting the group by string by comma
        // and mapping the column to the clean column
        // and filtering the group by columns by the table columns
        // and mapping the group by columns to the parsed columns
        const groupByColumns = groupByStr
          .split(",")
          .map((col) => stripQuotes(col.trim()))
          .filter((col) => tableColumns[tableName]?.includes(col))
          .map((col) => ({ value: col, label: col }));
        // Set the selected group by columns to the group by columns
        setSelectedGroupByColumns(groupByColumns);
      // If the group by match is not true
      } else {
        // Set the selected group by columns to empty array
        setSelectedGroupByColumns([]);
      }

      // Get the having match
      const havingMatch = normalizedQuery.match(
        /\bHAVING\s+(.+?)(?=\s*(ORDER\s+BY|LIMIT|;|$))/i
      );
      // If the having match is true and the table name is true
      if (havingMatch && tableName) {
        // Get the having clause string and trim it
        const havingClauseStr = havingMatch[1].trim();
        // Log the parsing having clause
        console.log("Parsing HAVING clause:", havingClauseStr);
        // Set the condition to the null
        const condition: HavingClause["condition"] = {
          aggregateColumn: null,
          operator: null,
          value: null,
        };

        // Get the agg match
        const aggMatch = havingClauseStr.match(
          /^(COUNT\(\*\)|(?:SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(.+?)(?:,\s*(\d+))?\)|ROUND\((AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(.+?)\)(?:,\s*(\d+))?\))/i
        );
        // If the agg match is true
        if (aggMatch) {
          const fullAgg = aggMatch[0]?.match(
            /^(COUNT\(\*\)|(?:SUM|AVG|MAX|MIN|ROUND|COUNT)\((?:DISTINCT\s+)?(.+?)(?:,\s*(\d+))?\)|ROUND\((AVG|SUM|MAX|MIN|COUNT)\((?:DISTINCT\s+)?(.+?)\)(?:,\s*(\d+))?\))/i
          );
          // Set the target col to the null
          let targetCol: string | null = null;
          // If the full agg is true
          if (fullAgg?.[1] === "COUNT(*)") {
            // Set the aggregate column to the aggregate column
            condition.aggregateColumn = {
              value: "COUNT(*)",
              label: "COUNT(*)",
              aggregate: true,
            };
          } else if (aggMatch[4]) {
            // Set the inner func to the inner func
            const innerFunc = aggMatch[4];
            // Set the target col to the target col
            targetCol = stripQuotes(aggMatch[5]);
            // Set the decimals to the decimals
            const decimals = aggMatch[6] || null;
            // Set the is distinct to the is distinct
            const isDistinct = havingClauseStr.includes("DISTINCT");
            // If the table columns includes the target col 
            // and the is distinct is false
            // or the inner func is count or the is mysql
            if (
              tableColumns[tableName]?.includes(targetCol) &&
              (!isDistinct || innerFunc === "COUNT" || isMySQL)
            ) {
              // Set the aggregate column to the aggregate column
              // If the is distinct
              // and the inner func is count or the is mysql
              // then set the aggregate column to the aggregate column
              // otherwise set the aggregate column to the null
              // if the table columns includes the target col
              // and the is distinct is false
              // or the inner func is count or the is mysql
              // then set the aggregate column to the aggregate column
              // otherwise set the aggregate column to the null
              condition.aggregateColumn = {
                value: isDistinct
                  ? `ROUND(${innerFunc}(DISTINCT ${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    })${decimals ? `, ${decimals}` : ""})`
                  : `ROUND(${innerFunc}(${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    })${decimals ? `, ${decimals}` : ""})`,
                label: isDistinct
                  ? `ROUND(${innerFunc}(DISTINCT ${targetCol})${
                      decimals ? `, ${decimals}` : ""
                    })`
                  : `ROUND(${innerFunc}(${targetCol})${
                      decimals ? `, ${decimals}` : ""
                    })`,
                aggregate: true,
                column: targetCol,
              };
            }
          } else {
            // Set the func to the func
            const func = aggMatch[1];
            // Set the target col to the target col
            targetCol = stripQuotes(aggMatch[2]);
            // Set the decimals to the decimals
            const decimals = aggMatch[3] || null;
            // Set the is distinct to the is distinct
            const isDistinct = havingClauseStr.includes("DISTINCT");
            // If the table columns includes the target col 
            // and the is distinct is false 
            // or the func is count or the is mysql
            if (
              tableColumns[tableName]?.includes(targetCol) &&
              (!isDistinct || func === "COUNT" || isMySQL)
            ) {
              // Set the aggregate column to the aggregate column
              // If the is distinct
              // and the func is count or the is mysql
              // then set the aggregate column to the aggregate column
              // otherwise set the aggregate column to the null
              // if the table columns includes the target col
              // and the is distinct is false
              // or the func is count or the is mysql
              // then set the aggregate column to the aggregate column
              // otherwise set the aggregate column to the null
              condition.aggregateColumn = {
                value: isDistinct
                  ? `${func}(DISTINCT ${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    }${decimals ? `, ${decimals}` : ""})`
                  : `${func}(${
                      needsQuotes(targetCol) ? `"${targetCol}"` : targetCol
                    }${decimals ? `, ${decimals}` : ""})`,
                label: isDistinct
                  ? `${func}(DISTINCT ${targetCol}${
                      decimals ? `, ${decimals}` : ""
                    })`
                  : `${func}(${targetCol}${decimals ? `, ${decimals}` : ""})`,
                aggregate: func !== "ROUND",
                column: targetCol,
              };
            }
          }
          // Get the operator match
          const operatorMatch = havingClauseStr.match(
            /\b(=[!>=]?|<>|>|>=|<|<=)\s*(?:('[^']*'|[0-9]+(?:\.[0-9]+)?|[a-zA-Z_][a-zA-Z0-9_]*))?/i
          );
          // If the operator match is true
          if (operatorMatch) {
            // Set the operator to the operator
            const operator = operatorMatch[1].toUpperCase();
            // Set the operator to the operator
            condition.operator = { value: operator, label: operator };
            // If the operator match is true
            if (operatorMatch[2]) {
              // Set the value to the value
              const value = stripQuotes(operatorMatch[2]);
              // Set the value to the value
              condition.value = { value, label: value };
            }
          }
          // If the aggregate column is true
          if (condition.aggregateColumn) {
            // Log the parsed having clause condition
            console.log("Parsed HAVING clause condition:", condition);
            // Set the having clause to the condition
            setHavingClause({ condition });
          // If the aggregate column is not true
          } else {
            console.log("No valid HAVING clause condition found, resetting.");
            setHavingClause({
              condition: { aggregateColumn: null, operator: null, value: null },
            });
          }
        } else {
          // Log the no valid having clause found, resetting
          console.log("No valid HAVING clause found, resetting.");
          // Set the having clause to the condition null
          setHavingClause({
            condition: { aggregateColumn: null, operator: null, value: null },
          });
        }
      } else {
        // Log the no having clause found, resetting
        console.log("No HAVING clause found, resetting.");
        // Set the having clause to the condition null
        setHavingClause({
          condition: { aggregateColumn: null, operator: null, value: null },
        });
      }

      // Get the where match
      const whereMatch = normalizedQuery.match(
        /\bWHERE\s+(.+?)(?=\s*(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|;|$))/i
      );
      // If the where match is true and the table name is true
      if (whereMatch && tableName) {
        // Get the where clause string and trim it
        const whereClauseStr = whereMatch[1].trim();
        // Log the parsing where clause
        console.log("Parsing WHERE clause:", whereClauseStr);
        // Set the conditions to the conditions
        const conditions: WhereClause["conditions"] = [];
        // Get the condition parts
        const conditionParts = whereClauseStr
          // Split the where clause string by the and or
          .split(/\s*(AND|OR)\s*/i)
          // and filtering the condition parts by the part
          .filter((part) => part.trim());

        // Set the current logical operator to the null
        let currentLogicalOperator: SelectOption | null = null;
        // For each condition part
        for (let i = 0; i < conditionParts.length; i++) {
          // Get the part and trim it
          const part = conditionParts[i].trim();
          // If the part is not true, continue
          if (!part) continue;
          // If the part is and or or 
          if (part.toUpperCase() === "AND" || part.toUpperCase() === "OR") {
            // Set the current logical operator to the current logical operator
            // or the part to the current logical operator
            // otherwise set the current logical operator to the null
            currentLogicalOperator = {
              value: part.toUpperCase(),
              label: part.toUpperCase(),
            };
            // Continue
            continue;
          }

          // Get the condition match
          const conditionMatch = part.match(
            /^((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))\s*(=|[<>]=?|!=|LIKE|IS\s+NULL|IS\s+NOT\s+NULL|BETWEEN)?(?:\s*('.*?'|".*?"|\d+(?:\.\d+)?|[a-zA-Z_][a-zA-Z0-9_]*))?(?:\s+AND\s+('.*?'|".*?"|\d+(?:\.\d+)?|[a-zA-Z_][a-zA-Z0-9_]*))?/i
          );
          // Set the condition to the condition null
          const condition: WhereClause["conditions"][0] = {
            column: null,
            operator: null,
            value: null,
            value2: null,
            logicalOperator: i === 0 ? null : currentLogicalOperator,
          };

          // If the condition match is true
          if (conditionMatch) {
            const column = stripQuotes(conditionMatch[1]);
            // If the table columns includes the column
            if (tableColumns[tableName]?.includes(column)) {
              // Set the column to the column
              condition.column = { value: column, label: column };
            }
            // If the condition match is true
            if (conditionMatch[2]) {
              // Set the operator to the operator
              condition.operator = {
                value: conditionMatch[2].toUpperCase(),
                label: conditionMatch[2].toUpperCase(),
              };
            }
            // If the condition match is true
            if (conditionMatch[3]) {
              // Set the value to the value
              condition.value = {
                value: stripQuotes(conditionMatch[3]),
                label: stripQuotes(conditionMatch[3]),
              };
            }
            // If the operator is between and the condition match is true
            if (condition.operator?.value === "BETWEEN" && conditionMatch[4]) {
              // Set the value2 to the value2
              condition.value2 = {
                value: stripQuotes(conditionMatch[4]),
                label: stripQuotes(conditionMatch[4]),
              };
            }
          } else {
            // Get the column only match
            const columnOnlyMatch = part.match(
              /^((?:"[^"]+"|'[^']+'|[a-zA-Z_][a-zA-Z0-9_]*))\s*(=|[<>]=?|!=|LIKE|IS\s+NULL|IS\s+NOT\s+NULL|BETWEEN)?/i
            );
            // If the column only match is true
            if (columnOnlyMatch) {
              // Set the column to the column
              const column = stripQuotes(columnOnlyMatch[1]);
              // If the table columns includes the column
              if (tableColumns[tableName]?.includes(column)) {
                // Set the column to the column 
                condition.column = { value: column, label: column };
                // If the column only match is true
                if (columnOnlyMatch[2]) {
                  // Set the operator to the operator
                  condition.operator = {
                    value: columnOnlyMatch[2].toUpperCase(),
                    label: columnOnlyMatch[2].toUpperCase(),
                  };
                }
              }
            }
          }
          // If the condition column is true
          if (condition.column) {
            // Set the conditions to the conditions 
            // and add the condition to the conditions
            conditions.push(condition);
          }
        }

        // If the conditions length is greater than 0
        if (conditions.length > 0) {
          // Log the parsed where conditions
          console.log("Parsed WHERE conditions:", conditions);
          // Set the where clause to the conditions
          setWhereClause({ conditions });
        } else {
          // Log the incomplete where clause, preserving partial state
          console.log("Incomplete WHERE clause, preserving partial state.");
          // Set the where clause to the conditions null
          setWhereClause({
            conditions: [
              {
                column: null,
                operator: null,
                value: null,
                value2: null,
              },
            ],
          });
        }
      } else {
        // Log the no where clause found, preserving existing state
        console.log("No WHERE clause found, preserving existing state.");
      }

      // Get the order by match
      const orderByMatch = normalizedQuery.match(
        /\bORDER\s+BY\s+((?:"[\w]+"|'[\w]+'|[\w_]+)\s*(ASC|DESC)?)(?=\s*(LIMIT|;|$))/i
      );
      // If the order by match is true and the table name is true
      if (orderByMatch && tableName) {
        // Get the column and strip the quotes
        const column = stripQuotes(orderByMatch[1]);
        // If the table columns includes the column
        if (tableColumns[tableName]?.includes(column)) {
          // Log the parsed order by clause
          console.log("Parsed ORDER BY clause:", {
            column,
            direction: orderByMatch[2],
          });
          // Set the order by clause to the column and direction
          setOrderByClause({
            column: { value: column, label: column },
            direction: orderByMatch[2]
              ? {
                  value: orderByMatch[2],
                  label:
                    orderByMatch[2] === "ASC"
                      ? "Ascending (A-Z, low-high)"
                      : "Descending (Z-A, high-low)",
                }
              : null,
          });
        }
      } else {
        // Log the no order by clause found, resetting
        console.log("No ORDER BY clause found, resetting.");
        // Set the order by clause to the column and direction null
        setOrderByClause({ column: null, direction: null });
      }

      // Get the limit match
      const limitMatch = normalizedQuery.match(/\bLIMIT\s+(\d+)/i);
      // If the limit match is true and the limit match 1 is true
      if (limitMatch && /^\d+$/.test(limitMatch[1])) {
        // Get the limit value and trim it
        const limitValue = limitMatch[1];
        // Log the parsed limit clause
        console.log("Parsed LIMIT clause:", limitValue);
        // Set the limit to the limit value and label
        setLimit({ value: limitValue, label: limitValue });
      } else {
        // Log the no limit clause found, resetting
        console.log("No LIMIT clause found, resetting.");
        // Set the limit to the limit value and label null
        setLimit(null);
      }
    },
    [tableNames, tableColumns, isMySQL]
  );

  return {
    handleQueryChange,
  };
};

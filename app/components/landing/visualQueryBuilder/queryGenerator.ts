import { WhereCondition } from "@/app/types/query";
import { QueryState } from "./types";

export const generateQuery = (queryState: QueryState): string => {
  const joinConditions = (
    conditions: WhereCondition[],
    operator: string,
    format: (c: WhereCondition) => string
  ): string => {
    const validConditions = conditions.filter((c) => c.column && c.operator && c.value);
    return validConditions.length > 0 ? `\n${operator} ${validConditions.map(format).join(" AND ")}` : "";
  };

  let query = "";

  if (queryState.withClauses.length > 0) {
    const validCtes = queryState.withClauses.filter(cte => cte.alias && cte.table);
    if (validCtes.length > 0) {
      query += "WITH ";
      query += validCtes.map(cte => `${cte.alias} AS (SELECT * FROM ${cte.table!.value})`).join(", ");
      query += "\n";
    }
  }

  query += "SELECT ";

  if (queryState.caseConditions.length > 0) {
    const validCases = queryState.caseConditions.filter(c => c.column && c.operator && c.value && c.result);
    if (validCases.length > 0) {
      query += "CASE ";
      validCases.forEach(c => {
        query += `WHEN ${c.column!.value} ${c.operator!.value} ${c.value!.value} THEN ${c.result!.value} `;
      });
      query += "END AS case_result";
      if (queryState.selectedColumns.length > 0) {
        query += ", ";
      }
    }
  }

  query += queryState.selectedColumns.length > 0
    ? queryState.selectedColumns.map((col) => col.value).join(", ")
    : "*";

  if (queryState.selectedTable) {
    query += `\nFROM ${queryState.selectedTable.value}`;
  }

  if (queryState.joinClauses.length > 0) {
    queryState.joinClauses.forEach(join => {
      if (join.table && join.type && join.onColumn1 && join.onColumn2) {
        query += `\n${join.type.value} ${join.table.value} ON ${join.onColumn1.value} = ${join.onColumn2.value}`;
      }
    });
  }

  if (queryState.whereConditions.length > 0) {
    query += joinConditions(
      queryState.whereConditions,
      "WHERE",
      (c) => `${c.column!.value} ${c.operator!.value} ${c.value!.value}`
    );
  }

  if (queryState.groupBy.length > 0) {
    query += `\nGROUP BY ${queryState.groupBy.map((g) => g.value).join(", ")}`;
  }

  if (queryState.havingConditions.length > 0) {
    query += joinConditions(
      queryState.havingConditions,
      "HAVING",
      (c) => `${c.column!.value} ${c.operator!.value} ${c.value!.value}`
    );
  }

  if (queryState.unionClauses.length > 0) {
    queryState.unionClauses.forEach(union => {
      if (union.table && union.type) {
        query += `\n${union.type.value}\nSELECT * FROM ${union.table.value}`;
      }
    });
  }

  if (queryState.orderBy) {
    query += `\nORDER BY ${queryState.orderBy.value}`;
  }

  query += ";";
  return query;
};

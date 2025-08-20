import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";
import { getOperatorDetail } from "../../getOperatorDetail";

export const suggestWhereClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Define type guards for Select node, table reference, and WITH clause
  // 2. Extract table name or CTE alias from FROM clause using AST or regex
  // 3. If FROM references a CTE, extract columns from CTE's SELECT statement
  // 4. If after WHERE, AND, or OR, suggest columns (from table or CTE)
  // 5. If after a valid column, suggest comparison operators
  // 6. If after an operator, suggest values (LIKE patterns, BETWEEN values, etc.)
  // 7. If after BETWEEN first value, suggest AND
  // 8. If after BETWEEN AND, suggest second value
  // 9. If after a complete condition, suggest AND, OR, or ORDER BY
  // 10. If after AND/OR with a condition, suggest columns
  // 11. Return null if no suggestions apply

  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for FROM clause
  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    !!fromItem &&
    typeof fromItem === "object" &&
    "table" in fromItem &&
    (typeof (fromItem as { table: unknown }).table === "string" ||
      (fromItem as { table: unknown }).table === null);

  // Type guard for WITH clause
  const isWithClause = (
    withItem: unknown
  ): withItem is { name: { value: string }; stmt: Select | Select[] } =>
    !!withItem &&
    typeof withItem === "object" &&
    "name" in withItem &&
    "stmt" in withItem;

  // Get the table name or CTE alias from the FROM clause and its columns
  let selectedTable: string | null = null;
  let columns: string[] = [];
  let isCte = false;

  if (ast) {
    const selectNode = Array.isArray(ast)
      ? ast.find((node: Select) => isSelectNode(node))
      : isSelectNode(ast)
      ? ast
      : null;
    if (selectNode && selectNode.from) {
      const fromClause = Array.isArray(selectNode.from)
        ? selectNode.from[0]
        : selectNode.from;
      if (isTableReference(fromClause)) {
        selectedTable = fromClause.table;
        // Check if the table is a CTE alias
        if (selectNode.with) {
          const withClauses = Array.isArray(selectNode.with)
            ? selectNode.with
            : [selectNode.with];
          const cte = withClauses.find(
            (w) =>
              isWithClause(w) && stripQuotes(w.name.value) === selectedTable
          );
          if (cte) {
            isCte = true;
            const cteStmt = Array.isArray(cte.stmt)
              ? cte.stmt.find(isSelectNode) ?? null
              : isSelectNode(cte.stmt)
              ? cte.stmt
              : null;
            if (cteStmt && cteStmt.columns) {
              columns = cteStmt.columns
                .map((col) =>
                  col.as
                    ? stripQuotes(col.as)
                    : col.expr?.type === "column_ref"
                    ? stripQuotes(col.expr.column)
                    : null
                )
                .filter((col): col is string => !!col);
            }
          }
        }
        // If not a CTE, use physical table columns
        if (!isCte && selectedTable && tableColumns[selectedTable]) {
          columns = tableColumns[selectedTable];
        }
      }
    }
  } else {
    const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
    selectedTable = fromMatch ? fromMatch[1] : null;
    if (selectedTable && tableColumns[selectedTable]) {
      columns = tableColumns[selectedTable];
    }
  }

  if (!selectedTable || columns.length === 0) {
    return null;
  }

  // Suggest columns if immediately after WHERE, AND, or OR
  const afterWhereOrAndRegex = /\b(WHERE|AND|OR)\s*(\w*)$/i;
  if (afterWhereOrAndRegex.test(docText)) {
    const filteredColumns = columns.filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
          detail: isCte ? "CTE column" : "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  // Suggest comparison operators after a valid column
  const afterColumnRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  const match = docText.match(afterColumnRegex);
  if (match) {
    const column = stripQuotes(match[2]);
    if (
      columns.some((c) => stripQuotes(c).toLowerCase() === column.toLowerCase())
    ) {
      const operators = [
        "=",
        "!=",
        ">",
        "<",
        ">=",
        "<=",
        "LIKE",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
      ];
      return {
        from: word ? word.from : pos,
        options: operators.map((op) => ({
          label: op,
          type: "keyword",
          apply: `${op} `,
          detail: getOperatorDetail(op),
        })),
        filter: true,
        validFor: /^[=!><]*$|^LIKE$|^BETWEEN$|^IS\s+NULL$|^IS\s+NOT\s+NULL$/i,
      };
    }
  }

  // Suggest values after an operator
  const afterOperatorRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|BETWEEN|IS\s+NULL|IS\s+NOT\s+NULL)\s*$/i;
  const operatorMatch = docText.match(afterOperatorRegex);
  if (operatorMatch) {
    const [, , column, operator] = operatorMatch;
    const strippedColumn = stripQuotes(column);

    if (
      columns.some(
        (c) => stripQuotes(c).toLowerCase() === strippedColumn.toLowerCase()
      )
    ) {
      if (operator.toUpperCase() === "LIKE") {
        // Suggest common LIKE patterns
        const patternSuggestions = [
          { label: "'%value%'", detail: "Contains value" },
          { label: "'value%'", detail: "Starts with value" },
          { label: "'%value'", detail: "Ends with value" },
          { label: "'_value_'", detail: "Single character wildcards" },
          {
            label: "'value_%'",
            detail: "Starts with value, single char after",
          },
          { label: "'_value%'", detail: "Single char before, ends with value" },
          { label: "'value__%'", detail: "Starts with value, two chars after" },
        ];

        return {
          from: word ? word.from : pos,
          options: patternSuggestions.map((pattern) => ({
            label: pattern.label,
            type: "text",
            apply: pattern.label + " ",
            detail: pattern.detail,
          })),
          filter: true,
          validFor: /^['"].*['"]?$/,
        };
      } else if (
        operator.toUpperCase() === "IS NULL" ||
        operator.toUpperCase() === "IS NOT NULL"
      ) {
        // Suggest AND, OR, or ORDER BY after IS NULL or IS NOT NULL
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: "AND",
              type: "keyword",
              apply: "AND ",
              detail: "Add another condition (all must be true)",
            },
            {
              label: "OR",
              type: "keyword",
              apply: "OR ",
              detail: "Add another condition (any can be true)",
            },
            {
              label: "ORDER BY",
              type: "keyword",
              apply: "ORDER BY ",
              detail: "Sort results",
            },
          ],
          filter: true,
          validFor: /^(AND|OR|ORDER\s+BY)$/i,
        };
      } else if (operator.toUpperCase() === "BETWEEN") {
        // Suggest first value for BETWEEN
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: "'value'",
              type: "text",
              apply: "'value' ",
              detail: "Enter first value",
            },
            {
              label: "0",
              type: "text",
              apply: "0 ",
              detail: "Numeric value",
            },
          ],
          filter: true,
          validFor: /^['"\d]*$/,
        };
      } else {
        // Suggest single value for =, !=, >, <, >=, <=
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: "'value'",
              type: "text",
              apply: "'value' ",
              detail: "Enter a string value",
            },
            {
              label: "0",
              type: "text",
              apply: "0 ",
              detail: "Numeric value",
            },
          ],
          filter: true,
          validFor: /^['"\d]*$/,
        };
      }
    }
  }

  // Suggest AND for BETWEEN second value
  const afterBetweenFirstValueRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*$/i;
  if (afterBetweenFirstValueRegex.test(docText)) {
    const [, , column] = afterBetweenFirstValueRegex.exec(docText)!;
    if (
      columns.some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(column).toLowerCase()
      )
    ) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "AND",
            type: "keyword",
            apply: "AND ",
            detail: "Specify second value for BETWEEN",
          },
        ],
        filter: true,
        validFor: /^AND$/i,
      };
    }
  }

  // Suggest second value for BETWEEN
  const afterBetweenAndRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*$/i;
  if (afterBetweenAndRegex.test(docText)) {
    const [, , column] = afterBetweenAndRegex.exec(docText)!;
    if (
      columns.some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(column).toLowerCase()
      )
    ) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "'value'",
            type: "text",
            apply: "'value' ",
            detail: "Enter second value",
          },
          {
            label: "0",
            type: "text",
            apply: "0 ",
            detail: "Numeric value",
          },
        ],
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }
  }

  // Suggest AND, OR, or ORDER BY after a complete condition
  const afterConditionRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|IS\s+NULL|IS\s+NOT\s+NULL)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*$/i;
  const afterBetweenRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*$/i;
  if (afterConditionRegex.test(docText) || afterBetweenRegex.test(docText)) {
    const column = afterConditionRegex.test(docText)
      ? afterConditionRegex.exec(docText)![2]
      : afterBetweenRegex.exec(docText)![2];
    if (
      columns.some(
        (c) =>
          stripQuotes(c).toLowerCase() === stripQuotes(column).toLowerCase()
      )
    ) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "AND",
            type: "keyword",
            apply: "AND ",
            detail: "Add another condition (all must be true)",
          },
          {
            label: "OR",
            type: "keyword",
            apply: "OR ",
            detail: "Add another condition (any can be true)",
          },
          {
            label: "ORDER BY",
            type: "keyword",
            apply: "ORDER BY ",
            detail: "Sort results",
          },
        ],
        filter: true,
        validFor: /^(AND|OR|ORDER\s+BY)$/i,
      };
    }
  }

  // Suggest column names after AND or OR
  const afterAndOrRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE)\s*('[^']*')\s*(AND|OR)\s*$/i;
  if (afterAndOrRegex.test(docText)) {
    const filteredColumns = columns.filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    if (filteredColumns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: filteredColumns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
          detail: isCte ? "CTE column" : "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  return null;
};

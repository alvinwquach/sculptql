import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

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

  // Get the table name from the FROM clause
  let selectedTable: string | null = null;
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
      }
    }
  } else {
    const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
    selectedTable = fromMatch ? fromMatch[1] : null;
  }

  if (!selectedTable || !tableColumns[selectedTable]) {
    return null;
  }

  // Suggest columns if immediately after WHERE, AND, or OR
  const afterWhereOrAndRegex = /\b(WHERE|AND|OR)\s*(\w*)$/i;
  if (afterWhereOrAndRegex.test(docText)) {
    const columns = tableColumns[selectedTable].filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    if (columns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: columns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
          detail: "Column name",
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
      tableColumns[selectedTable].some(
        (c) => stripQuotes(c).toLowerCase() === column.toLowerCase()
      )
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
        validFor: /^[=!><]*$|^LIKE$|^BETWEEN$/i,
      };
    }
  }

  // Suggest values after an operator
  const afterOperatorRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|BETWEEN|IS NULL|IS NOT NULL)\s*$/i;
  const operatorMatch = docText.match(afterOperatorRegex);
  if (operatorMatch) {
    const [, , column, operator] = operatorMatch;
    const strippedColumn = stripQuotes(column);

    if (
      tableColumns[selectedTable].some(
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

  // Suggest second value for BETWEEN
  const afterBetweenAndRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*$/i;
  if (afterBetweenAndRegex.test(docText)) {
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

  // Suggest AND, OR, or ORDER BY after a complete condition
  const afterConditionRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE|IS NULL|IS NOT NULL)\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*$/i;
  const afterBetweenRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*BETWEEN\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*AND\s*('[^']*'|[0-9]+(?:\.[0-9]+)?)\s*$/i;
  if (afterConditionRegex.test(docText) || afterBetweenRegex.test(docText)) {
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

  // Suggest column names after AND or OR
  const afterAndOrRegex =
    /\b(WHERE|AND|OR)\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*([=!><]=?|LIKE)\s*('[^']*')\s*(AND|OR)\s*$/i;
  if (afterAndOrRegex.test(docText)) {
    const columns = tableColumns[selectedTable].filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    if (columns.length > 0) {
      return {
        from: word ? word.from : pos,
        options: columns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
          detail: "Column name",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
  }

  return null;
};

const getOperatorDetail = (operator: string): string => {
  switch (operator.toUpperCase()) {
    case "=":
      return "Equals";
    case "!=":
      return "Does not equal";
    case ">":
      return "Greater than";
    case "<":
      return "Less than";
    case ">=":
      return "Greater than or equal to";
    case "<=":
      return "Less than or equal to";
    case "LIKE":
      return "Pattern matching (supports wildcards)";
    case "IS NULL":
      return "Checks if the value is NULL";
    case "IS NOT NULL":
      return "Checks if the value is not NULL";
    case "BETWEEN":
      return "Checks if value is within a range";
    default:
      return "";
  }
};
import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

export const suggestJoinClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  tableNames: string[],
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null
): CompletionResult | null => {
  // PSEUDOCODE:
  // 1. Define type guards for Select node and table reference
  // 2. Extract primary table from FROM clause using AST or regex
  // 3. Check if in a CTE subquery and count parentheses
  // 4. If after FROM table_name or another JOIN, suggest JOIN types or ) (if in CTE)
  // 5. If after JOIN type, suggest table names
  // 6. If after JOIN table_name, suggest ON or ) (if CROSS JOIN)
  // 7. If after ON, suggest column names from primary table or joined table
  // 8. If after column, suggest = operator
  // 9. If after =, suggest column names from the other table
  // 10. If after complete ON condition, suggest JOIN, WHERE, or ) (if in CTE)
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

  // Check if in a CTE subquery and count parentheses
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  // Extract primary table
  let primaryTable: string | null = null;
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
        primaryTable = fromClause.table;
      }
    }
  } else {
    const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
    primaryTable = fromMatch ? fromMatch[1] : null;
  }

  if (!primaryTable || !tableColumns[primaryTable]) {
    return null;
  }

  // Suggest JOIN types after FROM or another JOIN
  const afterFromOrJoinRegex =
    /\bFROM\s+\w+\s*$|\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+[\w.]+\s*(ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+)?\s*$/i;
  if (afterFromOrJoinRegex.test(docText)) {
    const options = [
      {
        label: "INNER JOIN",
        type: "keyword",
        apply: "INNER JOIN ",
        detail: "Join with matching rows",
      },
      {
        label: "LEFT JOIN",
        type: "keyword",
        apply: "LEFT JOIN ",
        detail: "Include all rows from left table",
      },
      {
        label: "RIGHT JOIN",
        type: "keyword",
        apply: "RIGHT JOIN ",
        detail: "Include all rows from right table",
      },
      {
        label: "CROSS JOIN",
        type: "keyword",
        apply: "CROSS JOIN ",
        detail: "Cartesian product of tables",
      },
    ];

    if (isInCteSubquery && parenCount > 0) {
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }

    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(INNER|LEFT|RIGHT|CROSS|\))$/i,
    };
  }

  // Suggest table names after JOIN type
  const afterJoinTypeRegex = /\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+(\w*)$/i;
  if (afterJoinTypeRegex.test(docText)) {
    const filteredTables = tableNames.filter(
      (table) =>
        table !== primaryTable &&
        (currentWord
          ? stripQuotes(table)
              .toLowerCase()
              .startsWith(stripQuotes(currentWord).toLowerCase())
          : true)
    );

    return {
      from: word ? word.from : pos,
      options: filteredTables.map((table) => ({
        label: table,
        type: "table",
        apply: needsQuotes(table) ? `"${table}" ` : `${table} `,
        detail: "Table name",
      })),
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Suggest ON or ) after JOIN table_name
  const afterJoinTableRegex = /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s*$/i;
  const afterCrossJoinRegex = /\bCROSS\s+JOIN\s+[\w.]+\s*$/i;
  if (afterJoinTableRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "ON",
          type: "keyword",
          apply: "ON ",
          detail: "Specify join condition",
        },
      ],
      filter: true,
      validFor: /^ON$/i,
    };
  } else if (afterCrossJoinRegex.test(docText)) {
    const options = [
      {
        label: "WHERE",
        type: "keyword",
        apply: "WHERE ",
        detail: "Filter results",
      },
      {
        label: ";",
        type: "text",
        apply: ";",
        detail: "Complete query",
      },
    ];

    if (isInCteSubquery && parenCount > 0) {
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }

    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(WHERE|;|\))$/i,
    };
  }

  // Suggest columns after ON
  const afterOnRegex = /\b(INNER|LEFT|RIGHT)\s+JOIN\s+([\w.]+)\s+ON\s+(\w*)$/i;
  if (afterOnRegex.test(docText)) {
    const joinedTable = stripQuotes(afterOnRegex.exec(docText)![2]);
    const columns = [
      ...(tableColumns[primaryTable] || []),
      ...(tableColumns[joinedTable] || []),
    ];

    const filteredColumns = columns.filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    return {
      from: word ? word.from : pos,
      options: filteredColumns.map((column) => ({
        label: column,
        type: "field",
        apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
        detail: `Column from ${primaryTable} or ${joinedTable}`,
      })),
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Suggest = after column
  const afterOnColumnRegex =
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s+ON\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  if (afterOnColumnRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "=",
          type: "keyword",
          apply: "= ",
          detail: "Join condition operator",
        },
      ],
      filter: true,
      validFor: /^=$/,
    };
  }

  // Suggest columns from the other table after =
  const afterOnEqualsRegex =
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+([\w.]+)\s+ON\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*=\s*(\w*)$/i;
  if (afterOnEqualsRegex.test(docText)) {
    const joinedTable = stripQuotes(afterOnEqualsRegex.exec(docText)![2]);
    const firstColumn = stripQuotes(afterOnEqualsRegex.exec(docText)![3]);
    const firstTable = tableColumns[primaryTable]?.includes(firstColumn)
      ? primaryTable
      : joinedTable;
    const secondTable =
      firstTable === primaryTable ? joinedTable : primaryTable;

    const columns = tableColumns[secondTable] || [];
    const filteredColumns = columns.filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    return {
      from: word ? word.from : pos,
      options: filteredColumns.map((column) => ({
        label: column,
        type: "field",
        apply: needsQuotes(column) ? `"${column}" ` : `${column} `,
        detail: `Column from ${secondTable}`,
      })),
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Suggest JOIN, WHERE, or ) after complete ON condition
  const afterOnConditionRegex =
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s+ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+\s*$/i;
  if (afterOnConditionRegex.test(docText)) {
    const options = [
      {
        label: "INNER JOIN",
        type: "keyword",
        apply: "INNER JOIN ",
        detail: "Join with matching rows",
      },
      {
        label: "LEFT JOIN",
        type: "keyword",
        apply: "LEFT JOIN ",
        detail: "Include all rows from left table",
      },
      {
        label: "RIGHT JOIN",
        type: "keyword",
        apply: "RIGHT JOIN ",
        detail: "Include all rows from right table",
      },
      {
        label: "CROSS JOIN",
        type: "keyword",
        apply: "CROSS JOIN ",
        detail: "Cartesian product of tables",
      },
      {
        label: "WHERE",
        type: "keyword",
        apply: "WHERE ",
        detail: "Filter results",
      },
    ];

    if (isInCteSubquery && parenCount > 0) {
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }

    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(INNER|LEFT|RIGHT|CROSS|WHERE|\))$/i,
    };
  }

  return null;
};
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
  // 2. Extract primary table from AST or regex
  // 3. If after FROM or another JOIN, suggest INNER JOIN, LEFT JOIN, RIGHT JOIN, CROSS JOIN
  // 4. If after JOIN keyword, suggest table names (excluding primary table)
  // 5. If after ON, suggest columns from primary table
  // 6. If after ON table1.column =, suggest columns from joined table
  // 7. If after complete JOIN clause or CROSS JOIN, suggest WHERE or ;
  // 8. Return null if no suggestions apply

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

  // Get the primary table from the FROM clause
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

  if (!primaryTable) {
    return null;
  }

  // Suggest INNER JOIN, LEFT JOIN, RIGHT JOIN, and CROSS JOIN after FROM or another JOIN
  const afterFromOrJoinRegex = /\b(FROM|JOIN)\s+[\w.]+\s*$/i;
  if (afterFromOrJoinRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "INNER JOIN",
          type: "keyword",
          apply: "INNER JOIN ",
          detail: "Join tables with matching records",
        },
        {
          label: "LEFT JOIN",
          type: "keyword",
          apply: "LEFT JOIN ",
          detail: "Join tables, keeping all records from the left table",
        },
        {
          label: "RIGHT JOIN",
          type: "keyword",
          apply: "RIGHT JOIN ",
          detail: "Join tables, keeping all records from the right table",
        },
        {
          label: "CROSS JOIN",
          type: "keyword",
          apply: "CROSS JOIN ",
          detail: "Combine all rows from both tables",
        },
      ],
      filter: true,
      validFor: /^(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|CROSS\s+JOIN)$/i,
    };
  }

  // Suggest table names after INNER JOIN, LEFT JOIN, RIGHT JOIN, or CROSS JOIN
  const afterJoinRegex = /\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+(\w*)$/i;
  if (afterJoinRegex.test(docText)) {
    const availableTables = tableNames.filter(
      (table) => table !== primaryTable
    );
    return {
      from: word ? word.from : pos,
      options: availableTables.map((table) => ({
        label: table,
        type: "table",
        apply: needsQuotes(table)
          ? `"${table}"${docText.match(/\bCROSS\s+JOIN/i) ? " " : " ON "}`
          : `${table}${docText.match(/\bCROSS\s+JOIN/i) ? " " : " ON "}`,
        detail: "Table name",
      })),
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Suggest columns for ON clause (first column from primary table)
  const afterOnRegex = /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s+ON\s+(\w*)$/i;
  if (
    afterOnRegex.test(docText) &&
    primaryTable &&
    tableColumns[primaryTable]
  ) {
    const columns = tableColumns[primaryTable].filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );
    return {
      from: word ? word.from : pos,
      options: columns.map((column) => ({
        label: column,
        type: "field",
        apply: `${primaryTable}.${
          needsQuotes(column) ? `"${column}"` : column
        } = `,
        detail: "Column from primary table",
      })),
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Suggest columns for second table in ON clause
  const afterOnEqualRegex =
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+([\w.]+)\s+ON\s+[\w.]+\.[\w.]+\s*=\s*(\w*)$/i;
  const match = docText.match(afterOnEqualRegex);
  if (match && match[2] && tableColumns[match[2]]) {
    const joinTable = match[2];
    const columns = tableColumns[joinTable].filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );
    return {
      from: word ? word.from : pos,
      options: columns.map((column) => ({
        label: column,
        type: "field",
        apply: `${joinTable}.${needsQuotes(column) ? `"${column}"` : column} `,
        detail: `Column from ${joinTable}`,
      })),
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Suggest WHERE or ; after complete ON clause or CROSS JOIN
  const afterJoinClauseRegex =
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s+ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+\s*$|\bCROSS\s+JOIN\s+[\w.]+\s*$/i;
  if (afterJoinClauseRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
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
      ],
      filter: true,
      validFor: /^(WHERE|;)$/i,
    };
  }

  return null;
};
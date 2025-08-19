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

  // Suggest INNER JOIN after FROM or another JOIN
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
      ],
      filter: true,
      validFor: /^INNER\s+JOIN$/i,
    };
  }

  // Suggest table names after INNER JOIN
  const afterInnerJoinRegex = /\bINNER\s+JOIN\s+(\w*)$/i;
  if (afterInnerJoinRegex.test(docText)) {
    const availableTables = tableNames.filter(
      (table) => table !== primaryTable
    );
    return {
      from: word ? word.from : pos,
      options: availableTables.map((table) => ({
        label: table,
        type: "table",
        apply: needsQuotes(table) ? `"${table}" ON ` : `${table} ON `,
        detail: "Table name",
      })),
      filter: true,
      validFor: /^["'\w]*$/,
    };
  }

  // Suggest columns for ON clause (first column from primary table)
  const afterOnRegex = /\bINNER\s+JOIN\s+[\w.]+\s+ON\s+(\w*)$/i;
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
    /\bINNER\s+JOIN\s+([\w.]+)\s+ON\s+[\w.]+\.[\w.]+\s*=\s*(\w*)$/i;
  const match = docText.match(afterOnEqualRegex);
  if (match && match[1] && tableColumns[match[1]]) {
    const joinTable = match[1];
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

  // Suggest WHERE or ; after complete ON clause (no additional INNER JOIN)
  const afterOnClauseRegex =
    /\bINNER\s+JOIN\s+[\w.]+\s+ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+\s*$/i;
  if (afterOnClauseRegex.test(docText)) {
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

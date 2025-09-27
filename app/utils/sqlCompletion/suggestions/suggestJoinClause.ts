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
    // If the node is undefined, return false
    !!node &&
    // If the node is not an object, return false
    typeof node === "object" &&
    // If the node does not have a type, return false
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for FROM clause
  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    // If the from item is undefined, return false
    !!fromItem &&
    // If the from item is not an object, return false
    typeof fromItem === "object" &&
    // If the from item does not have a table, return false
    "table" in fromItem &&
    (typeof (fromItem as { table: unknown }).table === "string" ||
      (fromItem as { table: unknown }).table === null);

  // Check if in a CTE subquery
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Calculate the parenthesis count
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

    // Extract primary table
  let primaryTable: string | null = null;
  // If the ast is a select node
  if (ast) {
    // Set the select node to the select node
    const selectNode = Array.isArray(ast)
      // If the ast is an array, find the first select node
      ? ast.find((node: Select) => isSelectNode(node))
      // If the ast is a select node, return the ast
      : isSelectNode(ast)
      ? ast
      : null;
    // If the select node has a from clause
    if (selectNode && selectNode.from) {
      // Set the from clause to the from clause
      const fromClause = Array.isArray(selectNode.from)
        // If the from clause is an array, 
        // set the from clause to the first item
        ? selectNode.from[0]
        // If the from clause is not an array,
        // set the from clause to the from clause
        : selectNode.from;
      // If the from clause is a table reference
      if (isTableReference(fromClause)) {
        // Set the primary table to the table
        primaryTable = fromClause.table;
      }
    }
  } else {
    // Set the from match to the from match
    const fromMatch = docText.match(/\bFROM\s+(\w+)/i);
    // Set the primary table to the from match
    primaryTable = fromMatch ? fromMatch[1] : null;
  }

  // If the primary table is null or the table columns
  // does not have the primary table
  if (!primaryTable || !tableColumns[primaryTable]) {
    // Return null
    return null;
  }

  // Set the after from or join regex to the after from or join regex
  const afterFromOrJoinRegex =
    // If the after from or join regex is true
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

    // If the is in cte subquery and the parenthesis count is greater than 0
    if (isInCteSubquery && parenCount > 0) {
      // Push the ) option to the options
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
      });
    }

    // Return the options
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(INNER|LEFT|RIGHT|CROSS|\))$/i,
    };
  }

  // Set the after join type regex to the after join type regex
  const afterJoinTypeRegex = /\b(INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+(\w*)$/i;
  // If the after join type regex is true
  if (afterJoinTypeRegex.test(docText)) {
    // Set the filtered tables to the filtered tables
    const filteredTables = tableNames.filter(
      // If the table is not the primary table 
      // and the current word is true
      (table) =>
        table !== primaryTable &&
        (currentWord
          ? stripQuotes(table)
              .toLowerCase()
              .startsWith(stripQuotes(currentWord).toLowerCase())
          : true)
    );

    // Return the options
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

  
  // Set the after join table regex to the after join table regex
  const afterJoinTableRegex = /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s*$/i;
  // Set the after cross join regex to the after cross join regex
  const afterCrossJoinRegex = /\bCROSS\s+JOIN\s+[\w.]+\s*$/i;
  if (afterJoinTableRegex.test(docText)) {
    // Return the options
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

  // Set the after on regex to the after on regex
  const afterOnRegex = /\b(INNER|LEFT|RIGHT)\s+JOIN\s+([\w.]+)\s+ON\s+(\w*)$/i;
  // If the after on regex is true
  if (afterOnRegex.test(docText)) {
    // Set the joined table to the joined table
    const joinedTable = stripQuotes(afterOnRegex.exec(docText)![2]);
    // Set the columns to the columns
    const columns = [
      ...(tableColumns[primaryTable] || []),
      ...(tableColumns[joinedTable] || []),
    ];

    // Set the filtered columns to the filtered columns
    const filteredColumns = columns.filter((column) =>
      currentWord
        ? stripQuotes(column)
            .toLowerCase()
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // Return the options
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

  // Set the after on column regex to the after on column regex
  const afterOnColumnRegex =
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s+ON\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i;
  // If the after on column regex is true
    if (afterOnColumnRegex.test(docText)) {
    // Return the options
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

  // Set the after on equals regex to the after on equals regex
  const afterOnEqualsRegex =
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+([\w.]+)\s+ON\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*=\s*(\w*)$/i;
  // If the after on equals regex is true
  if (afterOnEqualsRegex.test(docText)) {
    // Set the joined table to the joined table
    const joinedTable = stripQuotes(afterOnEqualsRegex.exec(docText)![2]);
    // Set the first column to the first column
    const firstColumn = stripQuotes(afterOnEqualsRegex.exec(docText)![3]);
    // Set the first table to the first table
    const firstTable = tableColumns[primaryTable]?.includes(firstColumn)
      ? primaryTable
      : joinedTable;
    // Set the second table to the second table
      const secondTable =
      firstTable === primaryTable ? joinedTable : primaryTable;

    // Set the columns to the columns
    const columns = tableColumns[secondTable] || [];
    // Set the filtered columns to the filtered columns
    const filteredColumns = columns.filter((column) =>
      // If the current word is true
      currentWord
        ? stripQuotes(column)
            // Lowercase the column
            .toLowerCase()
            // Start with the strip quotes current word
            .startsWith(stripQuotes(currentWord).toLowerCase())
        : true
    );

    // Return the options
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

  // Set the after on condition regex to the after on condition regex
  const afterOnConditionRegex =
    // If the after on condition regex is true
    /\b(INNER|LEFT|RIGHT)\s+JOIN\s+[\w.]+\s+ON\s+[\w.]+\.[\w.]+\s*=\s*[\w.]+\.[\w.]+\s*$/i;
  if (afterOnConditionRegex.test(docText)) {
    // Set the options to the options
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

    // If the is in cte subquery and the 
    // parenthesis count is greater than 0
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
import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

export const suggestHavingClause = (
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
  // 1. Define type guards for Select node and table reference
  // 2. Extract table name from AST or regex
  // 3. If after GROUP BY and no HAVING, suggest HAVING
  // 4. If after HAVING:
  //    a. Suggest aggregate functions (COUNT, SUM, etc.)
  //    b. After aggregate, suggest columns
  //    c. After ROUND column, suggest comma or closing parenthesis
  //    d. After ROUND comma, suggest decimal places
  //    e. After aggregate or column, suggest operators
  //    f. After operator, suggest values
  //    g. After valid HAVING condition, suggest AND, OR, ORDER BY, or ;
  // 5. Return null if no suggestions apply

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
    const fromMatch = docText.match(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    selectedTable = fromMatch ? fromMatch[1] : null;
  }

  if (!selectedTable || !tableColumns[selectedTable]) {
    return null;
  }

  // Check if HAVING already exists
  const hasHaving = /\bHAVING\b/i.test(docText);

  // Suggest HAVING after GROUP BY if no HAVING exists
  const afterGroupByRegex = /\bGROUP\s+BY\s+[^;]*?(\s*)$/i;
  if (!hasHaving && afterGroupByRegex.test(docText)) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "HAVING",
          type: "keyword",
          apply: "HAVING ",
          detail: "Filter grouped results",
        },
      ],
      filter: true,
      validFor: /^HAVING$/i,
    };
  }

  // Suggest aggregates immediately after HAVING
  const afterHavingRegex = /\bHAVING\s*([^;]*)$/i;
  if (hasHaving && afterHavingRegex.test(docText)) {
    const havingText = afterHavingRegex.exec(docText)![1].trim();
    const lastCharIsComma = havingText.endsWith(",");
    const currentHavingItems = havingText
      ? havingText
          .split(/(AND|OR)/i)
          .map((item) => item.trim())
          .filter((item) => item && !item.match(/AND|OR/i))
      : [];

    // Suggest aggregates when HAVING is followed by nothing or a comma
    if (lastCharIsComma || havingText === "") {
      const aggregateOptions = [
        "COUNT(*)",
        "COUNT",
        "SUM",
        "AVG",
        "MIN",
        "MAX",
        "ROUND",
      ].filter(
        (agg) =>
          !currentHavingItems.some((item) => item.startsWith(agg)) &&
          (currentWord
            ? agg.toLowerCase().startsWith(currentWord.toLowerCase())
            : true)
      );

      return {
        from: word ? word.from : pos,
        options: aggregateOptions.map((agg) => ({
          label: agg,
          type: "function",
          apply: agg.includes("COUNT(*)") ? "COUNT(*)" : `${agg}(`,
          detail: "Aggregate function",
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }

    // Suggest columns after aggregate functions
    const afterAggregateRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND)\(\s*([^\s,)]*)$/i;
    if (afterAggregateRegex.test(docText)) {
      const columns = tableColumns[selectedTable].filter(
        (column) =>
          !currentHavingItems.includes(column) &&
          (currentWord
            ? stripQuotes(column)
                .toLowerCase()
                .startsWith(stripQuotes(currentWord).toLowerCase())
            : true)
      );

      return {
        from: word ? word.from : pos,
        options: columns.map((column) => ({
          label: column,
          type: "field",
          apply: needsQuotes(column) ? `"${column}"` : `${column}`,
          detail: `Column in ${selectedTable}`,
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }

    // Suggest closing parenthesis after column in ROUND
    const afterRoundColumnRegex =
      /\bHAVING\s+.*?\bROUND\(\s*([^\s,)]+)\s*([^\s,)]*)$/i;
    if (afterRoundColumnRegex.test(docText)) {
      const column = afterRoundColumnRegex.exec(docText)![1];
      if (tableColumns[selectedTable].includes(stripQuotes(column))) {
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: ",",
              type: "text",
              apply: ", ",
              detail: "Specify decimals for ROUND",
            },
            {
              label: ")",
              type: "text",
              apply: ") ",
              detail: "Complete ROUND function",
            },
          ],
          filter: true,
          validFor: /^[,)]*$/,
        };
      }
    }

    // Suggest decimals after ROUND(column,
    const afterRoundCommaRegex =
      /\bHAVING\s+.*?\bROUND\(\s*[^\s,)]+\s*,\s*([^\s,)]*)$/i;
    if (afterRoundCommaRegex.test(docText)) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "2",
            type: "text",
            apply: "2) ",
            detail: "Decimal places for ROUND",
          },
          {
            label: "0",
            type: "text",
            apply: "0) ",
            detail: "Decimal places for ROUND",
          },
          {
            label: "1",
            type: "text",
            apply: "1) ",
            detail: "Decimal places for ROUND",
          },
        ],
        filter: true,
        validFor: /^\d*$/,
      };
    }

    // Suggest operators after aggregate or column
    const afterAggregateOrColumnRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND)\([^)]+\)\s*([^\s;]*)$/i;
    if (
      afterAggregateOrColumnRegex.test(docText) ||
      havingText.match(/COUNT\(\*\)\s*([^\s;]*)$/i)
    ) {
      const operatorOptions = ["=", ">", "<", ">=", "<=", "<>"].filter((op) =>
        currentWord ? op.startsWith(currentWord) : true
      );

      return {
        from: word ? word.from : pos,
        options: operatorOptions.map((op) => ({
          label: op,
          type: "keyword",
          apply: `${op} `,
          detail: "Comparison operator",
        })),
        filter: true,
        validFor: /^(=|>|<|>=|<=|<>)$/,
      };
    }

    // Suggest values after an operator
    const afterOperatorRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND)\([^)]+\)\s*(=|>|<|>=|<=|<>)\s*([^\s;]*)$/i;
    const afterCountStarOperatorRegex =
      /\bHAVING\s+.*?COUNT\(\*\)\s*(=|>|<|>=|<=|<>)\s*([^\s;]*)$/i;
    if (
      afterOperatorRegex.test(docText) ||
      afterCountStarOperatorRegex.test(docText)
    ) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "0",
            type: "text",
            apply: "0 ",
            detail: "Numeric value",
          },
          {
            label: "10",
            type: "text",
            apply: "10 ",
            detail: "Numeric value",
          },
          {
            label: "'value'",
            type: "text",
            apply: "'value' ",
            detail: "String value",
          },
        ],
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }

    // Suggest AND, OR, ORDER BY, or ; after a valid HAVING condition
    const afterHavingConditionRegex = /\bHAVING\s+([^;]+?)(\s*)$/i;
    const match = docText.match(afterHavingConditionRegex);
    if (match) {
      const havingItems = match[1]
        .split(/(AND|OR)/i)
        .map((item) => item.trim())
        .filter((item) => item && !item.match(/AND|OR/i));
      const lastItem = havingItems[havingItems.length - 1];
      const isValidItem =
        lastItem.match(
          /(COUNT|SUM|AVG|MIN|MAX|ROUND)\([^)]+\)\s*(=|>|<|>=|<=|<>)\s*(\w+|'[^']*')/i
        ) || lastItem.match(/COUNT\(\*\)\s*(=|>|<|>=|<=|<>)\s*(\w+|'[^']*')/i);

      if (isValidItem) {
        const options = [
          {
            label: "AND",
            type: "keyword",
            apply: "AND ",
            detail: "Add another condition",
          },
          {
            label: "OR",
            type: "keyword",
            apply: "OR ",
            detail: "Add another condition",
          },
          {
            label: "ORDER BY",
            type: "keyword",
            apply: "ORDER BY ",
            detail: "Sort results",
          },
          {
            label: ";",
            type: "text",
            apply: ";",
            detail: "Complete query",
          },
        ];

        return {
          from: word ? word.from : pos,
          options,
          filter: true,
          validFor: /^(AND|OR|ORDER\s+BY|;)$/i,
        };
      }
    }
  }

  return null;
};
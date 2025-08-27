import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { SelectOption, TableColumn } from "@/app/types/query";
import { SingleValue } from "react-select";

export const suggestHavingClause = (
  docText: string,
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  tableColumns: TableColumn,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  ast: Select | Select[] | null,
  onAggregateColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onHavingOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onHavingValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void,
  isMySQL: boolean = false
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

  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    !!fromItem &&
    typeof fromItem === "object" &&
    "table" in fromItem &&
    (typeof (fromItem as { table: unknown }).table === "string" ||
      (fromItem as { table: unknown }).table === null);

  // --- Extract table ---
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
  console.log("Extracted selectedTable:", selectedTable);

  if (!selectedTable || !tableColumns[selectedTable]) {
    console.log("No valid table or columns found, returning null");
    return null;
  }

  const hasHaving = /\bHAVING\b/i.test(docText);
  console.log("Has HAVING clause:", hasHaving);

  // --- Suggest HAVING after GROUP BY ---
  const afterGroupByRegex = /\bGROUP\s+BY\s+[^;]*?(\s*)$/i;
  if (!hasHaving && afterGroupByRegex.test(docText)) {
    console.log("Suggesting HAVING keyword after GROUP BY");
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

  // --- After HAVING keyword ---
  const afterHavingRegex = /\bHAVING\s*([^;]*)$/i;
  if (hasHaving && afterHavingRegex.test(docText)) {
    const havingText = afterHavingRegex.exec(docText)![1].trim();
    const lastCharIsComma = havingText.endsWith(",");
    console.log(
      "HAVING clause text:",
      havingText,
      "Last char is comma:",
      lastCharIsComma
    );

    // conditionIndex = nth condition in HAVING
    const currentHavingItems = havingText
      ? havingText
          .split(/(AND|OR)/i)
          .map((item) => item.trim())
          .filter((item) => item && !item.match(/AND|OR/i))
      : [];
    const conditionIndex = currentHavingItems.length;
    console.log(
      "Current HAVING items:",
      currentHavingItems,
      "Condition index:",
      conditionIndex
    );

    // --- 1. Suggest aggregate functions immediately after HAVING or after comma ---
    if (lastCharIsComma || havingText === "") {
      console.log("Suggesting aggregate functions");
      const aggregateOptions: SelectOption[] = [
        { value: "COUNT(*)", label: "COUNT(*)", aggregate: true },
        ...tableColumns[selectedTable].flatMap((col) => {
          const aggregates: SelectOption[] = [
            {
              value: `COUNT(${col})`,
              label: `COUNT(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `SUM(${col})`,
              label: `SUM(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `AVG(${col})`,
              label: `AVG(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `MAX(${col})`,
              label: `MAX(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `MIN(${col})`,
              label: `MIN(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 0)`,
              label: `ROUND(AVG(${col}), 0)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 1)`,
              label: `ROUND(AVG(${col}), 1)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 2)`,
              label: `ROUND(AVG(${col}), 2)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 3)`,
              label: `ROUND(AVG(${col}), 3)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 4)`,
              label: `ROUND(AVG(${col}), 4)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(${col}, 0)`,
              label: `ROUND(${col}, 0)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 1)`,
              label: `ROUND(${col}, 1)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 2)`,
              label: `ROUND(${col}, 2)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 3)`,
              label: `ROUND(${col}, 3)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 4)`,
              label: `ROUND(${col}, 4)`,
              aggregate: false,
              column: col,
            },
          ];

          if (isMySQL) {
            aggregates.push(
              {
                value: `COUNT(DISTINCT ${col})`,
                label: `COUNT(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
              {
                value: `SUM(DISTINCT ${col})`,
                label: `SUM(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
              {
                value: `AVG(DISTINCT ${col})`,
                label: `AVG(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
              {
                value: `MAX(DISTINCT ${col})`,
                label: `MAX(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
              {
                value: `MIN(DISTINCT ${col})`,
                label: `MIN(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              }
            );
          }

          return aggregates;
        }),
      ].filter((agg) =>
        currentWord
          ? agg.label.toLowerCase().startsWith(currentWord.toLowerCase())
          : true
      );

      console.log("Aggregate options:", aggregateOptions);

      return {
        from: word ? word.from : pos,
        options: aggregateOptions.map((agg) => ({
          label: agg.label,
          type: agg.aggregate ? "function" : "field",
          apply: () => {
            console.log(
              "Applying aggregate:",
              agg,
              "at condition index:",
              conditionIndex
            );
            onAggregateColumnSelect?.(agg, conditionIndex);
            return needsQuotes(agg.value) && !agg.value.includes("(")
              ? `"${agg.value}"`
              : agg.value;
          },
          detail: agg.aggregate ? "Aggregate function" : "Rounded column",
        })),
        filter: true,
        validFor: /^["'\w(]*$/,
      };
    }

    // --- 2. After aggregate function -> suggest columns ---
    const afterAggregateRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\(\s*([^\s,)]*)$/i;
    if (afterAggregateRegex.test(docText)) {
      const columns = tableColumns[selectedTable].filter((column) =>
        currentWord
          ? stripQuotes(column)
              .toLowerCase()
              .startsWith(stripQuotes(currentWord).toLowerCase())
          : true
      );
      console.log("Suggesting columns after aggregate:", columns);

      return {
        from: word ? word.from : pos,
        options: columns.map((column) => ({
          label: column,
          type: "field",
          apply: () => {
            console.log(
              "Applying column:",
              column,
              "at condition index:",
              conditionIndex
            );
            onAggregateColumnSelect?.(
              { value: column, label: column, column },
              conditionIndex
            );
            return needsQuotes(column) ? `"${column}"` : column;
          },
          detail: `Column in ${selectedTable}`,
        })),
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }

    // --- 3. ROUND(column) or ROUND(AVG(column)) -> suggest , or ) ---
    const afterRoundColumnRegex =
      /\bHAVING\s+.*?\bROUND\(\s*([^\s,)]+|\bAVG\([^\s,)]+\))\s*$/i;
    if (afterRoundColumnRegex.test(docText)) {
      console.log("Suggesting comma or closing parenthesis for ROUND");
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

    // --- 4. ROUND(column, ?) or ROUND(AVG(column), ?) -> suggest decimal places ---
    const afterRoundCommaRegex =
      /\bHAVING\s+.*?\bROUND\(\s*(?:[^\s,)]+|\bAVG\([^\s,)]+\))\s*,\s*$/i;
    if (afterRoundCommaRegex.test(docText)) {
      console.log("Suggesting decimal places for ROUND");
      return {
        from: word ? word.from : pos,
        options: ["0", "1", "2", "3", "4"].map((num) => ({
          label: num,
          type: "text",
          apply: `${num}) `,
          detail: "Decimal places for ROUND",
        })),
        filter: true,
        validFor: /^\d*$/,
      };
    }

    // --- 5. After aggregate(column) or aggregate(DISTINCT column) -> suggest operators ---
    const afterAggregateOrColumnRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\([^)]+\)\s*$/i;
    const afterCountStarRegex = /\bHAVING\s+.*?COUNT\(\*\)\s*$/i;
    if (
      afterAggregateOrColumnRegex.test(docText) ||
      afterCountStarRegex.test(docText)
    ) {
      const operatorOptions = ["=", ">", "<", ">=", "<=", "<>"].filter((op) =>
        currentWord ? op.startsWith(currentWord) : true
      );
      console.log("Suggesting operators:", operatorOptions);

      return {
        from: word ? word.from : pos,
        options: operatorOptions.map((op) => ({
          label: op,
          type: "keyword",
          apply: () => {
            console.log(
              "Applying operator:",
              op,
              "at condition index:",
              conditionIndex
            );
            onHavingOperatorSelect?.({ value: op, label: op }, conditionIndex);
            return `${op} `;
          },
          detail: "Comparison operator",
        })),
        filter: true,
        validFor: /^(=|>|<|>=|<=|<>)$/,
      };
    }

    // --- 6. After operator -> suggest values ---
    const afterOperatorRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\([^)]+\)\s*(=|>|<|>=|<=|<>)\s*$/i;
    if (
      afterOperatorRegex.test(docText) ||
      /\bCOUNT\(\*\)\s*(=|>|<|>=|<=|<>)\s*$/i.test(docText)
    ) {
      const valueOptions: SelectOption[] = [
        { label: "0", value: "0" },
        { label: "10", value: "10" },
        { label: "'value'", value: "'value'" },
      ];
      console.log("Suggesting values:", valueOptions);

      return {
        from: word ? word.from : pos,
        options: valueOptions.map((val) => ({
          label: val.label,
          type: "text",
          apply: () => {
            console.log(
              "Applying value:",
              val,
              "at condition index:",
              conditionIndex
            );
            onHavingValueSelect?.(val, conditionIndex, false);
            return `${val.value} `;
          },
          detail: "Comparison value",
        })),
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }

    // --- 7. After valid condition -> suggest AND, OR, ORDER BY, ; ---
    const afterHavingConditionRegex = /\bHAVING\s+([^;]+?)(\s*)$/i;
    const match = docText.match(afterHavingConditionRegex);
    if (match) {
      const lastItem = match[1].trim();
      const isValidCondition =
        /(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\([^)]+\)\s*(=|>|<|>=|<=|<>)\s*.+/i.test(
          lastItem
        ) || /COUNT\(\*\)\s*(=|>|<|>=|<=|<>)\s*.+/i.test(lastItem);
      console.log(
        "After HAVING condition, last item:",
        lastItem,
        "Is valid condition:",
        isValidCondition
      );
    }
  }

  console.log("No matching HAVING clause condition, returning null");
  return null;
};

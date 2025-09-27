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
 
  // Type guard for Select node
  const isSelectNode = (node: unknown): node is Select =>
    // If the node is undefined, return false
    !!node &&
    // If the node is not an object, return false
    typeof node === "object" &&
    // If the node does not have a type, return false
    "type" in node &&
    (node as { type: unknown }).type === "select";

  // Type guard for table reference
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

  // Set the selected table to null
  let selectedTable: string | null = null;
  // If the ast is true
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
      // Set the from clause to the from clause if it is an array
      const fromClause = Array.isArray(selectNode.from)
        // If the from clause is an array, 
        // set the from clause to the first item
        ? selectNode.from[0]
        // If the from clause is not an array,
        //  set the from clause to the from clause
        : selectNode.from;
      // If the from clause is a table reference
      if (isTableReference(fromClause)) {
        // Set the selected table to the table
        selectedTable = fromClause.table;
      }
    }
  } else {
    // Set the from match to the from match
    const fromMatch = docText.match(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    // Set the selected table to the from match
    selectedTable = fromMatch ? fromMatch[1] : null;
  }
  // Log the selected table
  console.log("Extracted selectedTable:", selectedTable);

  // If the selected table is null or the table columns 
  // does not have the selected table
  if (!selectedTable || !tableColumns[selectedTable]) {
    // Log the no valid table or columns found, returning null
    console.log("No valid table or columns found, returning null");
    return null;
  }

  // Set the has having to the has having
  const hasHaving = /\bHAVING\b/i.test(docText);
  // Log the has having clause
  console.log("Has HAVING clause:", hasHaving);

  // Set the after group by regex to the after group by regex
  const afterGroupByRegex = /\bGROUP\s+BY\s+[^;]*?(\s*)$/i;
  // If the has having is false and the after group by regex is true
  if (!hasHaving && afterGroupByRegex.test(docText)) {
    // Log the suggesting HAVING keyword after GROUP BY
    console.log("Suggesting HAVING keyword after GROUP BY");
    // Return the options
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

  // Set the after having regex to the after having regex
  const afterHavingRegex = /\bHAVING\s*([^;]*)$/i;
  // If the has having is true and the after having regex is true
  if (hasHaving && afterHavingRegex.test(docText)) {
    // Set the having text to the having text
    const havingText = afterHavingRegex.exec(docText)![1].trim();
    // Set the last char is comma to the last char is comma
    const lastCharIsComma = havingText.endsWith(",");
    // Log the having text and the last char is comma
    console.log(
      "HAVING clause text:",
      havingText,
      "Last char is comma:",
      lastCharIsComma
    );

    // Set the current having items to the current having items
    const currentHavingItems = havingText
      // Split the having text by AND or OR
      ? havingText
          .split(/(AND|OR)/i)
          // Map the having text by the item
          .map((item) => item.trim())
          // Filter the having text by the item
          .filter((item) => item && !item.match(/AND|OR/i))
      : [];
    // Set the condition index to the condition index
    const conditionIndex = currentHavingItems.length;
    // Log the current having items and the condition index
    console.log(
      "Current HAVING items:",
      currentHavingItems,
      "Condition index:",
      conditionIndex
    );

    // If the last char is comma or the having text is empty
    if (lastCharIsComma || havingText === "") {
      // Log the suggesting aggregate functions
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
          // If the is mysql
          if (isMySQL) {
            // Add the distinct aggregates
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
          // Return the aggregates
          return aggregates;
        }),
        // Filter the aggregate options by the agg
      ].filter((agg) =>
        currentWord
          ? agg.label.toLowerCase().startsWith(currentWord.toLowerCase())
          : true
      );
      // Log the aggregate options
      console.log("Aggregate options:", aggregateOptions);

      // Return the options
      return {
        from: word ? word.from : pos,
        options: aggregateOptions.map((agg) => ({
          label: agg.label,
          type: agg.aggregate ? "function" : "field",
          apply: () => {
            // Log the applying aggregate
            console.log(
              "Applying aggregate:",
              agg,
              "at condition index:",
              conditionIndex
            );
            // On aggregate column select the aggregate
            onAggregateColumnSelect?.(agg, conditionIndex);
            // Return the needs quotes
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

    // Set the after aggregate regex to the after aggregate regex
    const afterAggregateRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\(\s*([^\s,)]*)$/i;
    // If the after aggregate regex is true
      if (afterAggregateRegex.test(docText)) {
      // Set the columns to the columns
      const columns = tableColumns[selectedTable].filter((column) =>
        // If the current word is true
        currentWord
          ? stripQuotes(column)
              // Strip the quotes from the column
              .toLowerCase()
              // Check if the column starts with the current word
              .startsWith(stripQuotes(currentWord).toLowerCase())
          : true
      );
      // Log the suggesting columns after aggregate
      console.log("Suggesting columns after aggregate:", columns);

      // Return the options
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

    // Set the after round column regex to the after round column regex
    const afterRoundColumnRegex =
      /\bHAVING\s+.*?\bROUND\(\s*([^\s,)]+|\bAVG\([^\s,)]+\))\s*$/i;
    // If the after round column regex is true
    if (afterRoundColumnRegex.test(docText)) {
      // Log the suggesting comma or closing parenthesis for ROUND
      console.log("Suggesting comma or closing parenthesis for ROUND");
      // Return the options
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

    // Set the after round comma regex to the after round comma regex
    const afterRoundCommaRegex =
      /\bHAVING\s+.*?\bROUND\(\s*(?:[^\s,)]+|\bAVG\([^\s,)]+\))\s*,\s*$/i;
    if (afterRoundCommaRegex.test(docText)) {
      // Log the suggesting decimal places for ROUND
      console.log("Suggesting decimal places for ROUND");
      // Return the options
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


    // Set the after aggregate or column regex to the after aggregate or column regex
    const afterAggregateOrColumnRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\([^)]+\)\s*$/i;
    // Set the after count star regex to the after count star regex
    const afterCountStarRegex = /\bHAVING\s+.*?COUNT\(\*\)\s*$/i;
    // If the after aggregate or column regex is true or the after count star regex is true
    if (
      afterAggregateOrColumnRegex.test(docText) ||
      afterCountStarRegex.test(docText)
    ) {
      // Set the operator options to the operator options
      const operatorOptions = ["=", ">", "<", ">=", "<=", "<>"].filter((op) =>
        currentWord ? op.startsWith(currentWord) : true
      );
      // Log the suggesting operators
      console.log("Suggesting operators:", operatorOptions);

      // Return the options
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
            // On having operator select the operator
            onHavingOperatorSelect?.({ value: op, label: op }, conditionIndex);
            return `${op} `;
          },
          detail: "Comparison operator",
        })),
        filter: true,
        validFor: /^(=|>|<|>=|<=|<>)$/,
      };
    }


    // Set the after operator regex to the after operator regex
    const afterOperatorRegex =
      /\bHAVING\s+.*?(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\([^)]+\)\s*(=|>|<|>=|<=|<>)\s*$/i;
    // If the after operator regex is true or 
    // the after count star regex is true
    if (
      afterOperatorRegex.test(docText) ||
      /\bCOUNT\(\*\)\s*(=|>|<|>=|<=|<>)\s*$/i.test(docText)
    ) {
      const valueOptions: SelectOption[] = [
        { label: "0", value: "0" },
        { label: "10", value: "10" },
        { label: "'value'", value: "'value'" },
      ];
      // Log the suggesting values
      console.log("Suggesting values:", valueOptions);
      // Return the options
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
            // On having value select the value
            onHavingValueSelect?.(val, conditionIndex, false);
            return `${val.value} `;
          },
          detail: "Comparison value",
        })),
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }

    // Set the after having condition regex to the after having condition regex
    const afterHavingConditionRegex = /\bHAVING\s+([^;]+?)(\s*)$/i;
    // If the after having condition regex is true
    const match = docText.match(afterHavingConditionRegex);
    // If the after having condition regex is true
    if (match) {
      // Set the last item to the last item
      const lastItem = match[1].trim();
      // Set the isValidCondition to the isValidCondition
      const isValidCondition =
        // If the last item is a valid condition
        /(COUNT|SUM|AVG|MIN|MAX|ROUND|COUNT\(DISTINCT|SUM\(DISTINCT|AVG\(DISTINCT|MAX\(DISTINCT|MIN\(DISTINCT)\([^)]+\)\s*(=|>|<|>=|<=|<>)\s*.+/i.test(
          lastItem
        ) || /COUNT\(\*\)\s*(=|>|<|>=|<=|<>)\s*.+/i.test(lastItem);
      // Log the after having condition, last item 
      // and the isValidCondition
        console.log(
        "After HAVING condition, last item:",
        lastItem,
        "Is valid condition:",
        isValidCondition
      );
    }
  }

  console.log("No matching HAVING clause condition, returning null");
  // Return null
  return null;
};

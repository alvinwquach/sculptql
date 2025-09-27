import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";
import { getOperatorDetail } from "../../getOperatorDetail";

// Function to suggest the case clause
export const suggestCaseClause = (
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

  // Check if in a CTE subquery and count parentheses
  const isInCteSubquery = /\bWITH\s+[\w"]*\s+AS\s*\(\s*SELECT\b.*$/i.test(
    docText
  );
  // Calculate the parenthesis count
  const parenCount = isInCteSubquery
    ? (docText.match(/\(/g) || []).length - (docText.match(/\)/g) || []).length
    : 0;

  // Set the selected table to null
  let selectedTable: string | null = null;
  // Set the columns to an empty array
  let columns: string[] = [];

  // If the ast is a select node
  if (ast) {
    // Set the select node to the ast
    const selectNode = Array.isArray(ast)
      // If the ast is an array, find the first select node
      ? ast.find(isSelectNode)
      // If the ast is a select node, return the ast
      : isSelectNode(ast)
      // If the ast is not a select node, return null
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
        // Set the selected table to the table
        selectedTable = fromClause.table;
        // Set the columns to the columns
        columns =
          // If the selected table and the table columns
          // have the selected table, 
          // set the columns to the table columns
          selectedTable && tableColumns[selectedTable]
            ? tableColumns[selectedTable]
            : [];
      }
    }
  } else {
    // Set the from match to the from match
    const fromMatch = docText.match(
      /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+CASE\b/i
    );
    // Set the selected table to the from match
    selectedTable = fromMatch ? fromMatch[1] : null;
    // Set the columns to the columns
    columns =
      // If the selected table and the table columns
      // have the selected table, 
      // set the columns to the table columns
      selectedTable && tableColumns[selectedTable]
        ? tableColumns[selectedTable]
        : [];
    // If the selected table is null
    if (!selectedTable) {
      // Set the select match to the select match
      const selectMatch = docText.match(
        /\bSELECT\s+([^,;\n]+)(?:,|\s+CASE|$)/i
      );
      // If the select match is not null
      if (selectMatch) {
        // Set the column names to the column names
        const columnNames = selectMatch[1]
          .split(",")
          .map((col) => stripQuotes(col.trim()))
          .filter((col) => col && col !== "*");
        // Set the possible tables to the possible tables
        const possibleTables = Object.keys(tableColumns).filter((table) =>
          columnNames.every((col) => tableColumns[table].includes(col))
        );
        // Set the selected table to the selected table
        selectedTable = possibleTables.length === 1 ? possibleTables[0] : null;
        // Set the columns to the columns
        columns =
          selectedTable && tableColumns[selectedTable]
            ? tableColumns[selectedTable]
            : [];
      }
    }
  }
  // Set the case match to the case match
  const caseMatch = docText.match(/\bCASE\s+([\s\S]*?)$/i);
  // Set the after select or comma regex 
  // to the after select or comma regex
  const afterSelectOrCommaRegex =
    /\bSELECT\s+([^;\n]*?)(?:,|\s+CASE)\s*(\w*)$/i;
  // Set the is select star to the is select star
  const isSelectStar = /\bSELECT\s+\*\s*$/i.test(docText);
  // If the after select or comma regex test the doc text,
  // the case match is null, the is select star is null,
  // and the doc text does not match the from where group by 
  // having order by limit union regex
  // and the doc text does not match the from table case regex
  if (
    afterSelectOrCommaRegex.test(docText) &&
    !caseMatch &&
    !isSelectStar &&
    !docText.match(
      /\bFROM\s+.*\b(WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|UNION)\b/i
    ) &&
    !docText.match(/\bFROM\s+[a-zA-Z_][a-zA-Z0-9_]*\s+CASE\b/i)
  ) {
    // Set the options to the options
    const options = [
      {
        label: "CASE",
        type: "keyword",
        apply: "CASE ",
        detail: "Start a conditional CASE statement",
        boost: 10,
      },
    ];
    // If the is in cte subquery and the parenthesis count 
    // is greater than 0
    if (isInCteSubquery && parenCount > 0) {
      // Push the ) option to the options
      options.push({
        label: ")",
        type: "keyword",
        apply: ") ",
        detail: "Close CTE subquery",
        boost: 5,
      });
    }
    // Return the options
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^(CASE|\))$/i,
    };
  }
  // If the case match is not null
  if (caseMatch) {
    // If the case match test the doc text
    if (/\bCASE\s+(\w*)$/i.test(docText)) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "WHEN",
            type: "keyword",
            apply: "WHEN ",
            detail: "Specify a condition",
          },
        ],
        filter: true,
        validFor: /^WHEN$/i,
      };
    }
    // If the case match test the doc text    
    if (/\bCASE\s+.*?\bWHEN\s+(\w*)$/i.test(docText)) {
      // Set the filtered columns to the filtered columns
      const filteredColumns =
        // If the columns length is greater than 0
        columns.length > 0
          ? columns.filter((col) =>
              // If the current word is not null
              // and the strip quotes column starts 
              // with the strip quotes current word
              currentWord
                ? stripQuotes(col)
                    .toLowerCase()
                    .startsWith(stripQuotes(currentWord).toLowerCase())
                : true
            )
          : [];
      // Return the options
      return {
        from: word ? word.from : pos,
        options:
          // If the filtered columns length is greater than 0
          filteredColumns.length > 0
            ? filteredColumns.map((col) => ({
                // Push the column to the options
                label: col,
                type: "field",
                apply: needsQuotes(col) ? `"${col}" ` : `${col} `,
                detail: "Column name",
              }))
            : [
                {
                  label: "column_name",
                  type: "field",
                  apply: "column_name ",
                  detail: "Enter a column name",
                },
              ],
        filter: true,
        validFor: /^["'\w]*$/,
      };
    }
    // If the case match test the doc text
    if (
      /\bCASE\s+.*?\bWHEN\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i.test(
        docText
      )
    ) {
      // Set the operators to the operators
      const operators = ["=", "!=", ">", "<", ">=", "<=", "LIKE"];
      // Return the options
      return {
        from: word ? word.from : pos,
        options: operators.map((op) => ({
          label: op,
          type: "keyword",
          apply: `${op} `,
          detail: getOperatorDetail(op),
        })),
        filter: true,
        validFor: /^(=|>|<|>=|<=|!=|LIKE)$/i,
      };
    }
    // If the case match test the doc text
    if (
      /\bCASE\s+.*?\bWHEN\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(=|>|<|>=|<=|!=|LIKE)\s*(\w*)$/i.test(
        docText
      )
    ) {
      // Set the operator to the operator
      const operator = /\bWHEN\s+.*?\s*(=|>|<|>=|<=|!=|LIKE)\s*/i.exec(
        docText
      )![1];
      // If the operator is like
      if (operator.toUpperCase() === "LIKE") {
        // Return the options
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: "'%value%'",
              type: "text",
              apply: "'%value%' ",
              detail: "Contains value",
            },
            {
              label: "'value%'",
              type: "text",
              apply: "'value%' ",
              detail: "Starts with value",
            },
            {
              label: "'%value'",
              type: "text",
              apply: "'%value' ",
              detail: "Ends with value",
            },
          ],
          filter: true,
          validFor: /^['"].*['"]?$/,
        };
      }
      // Return the options
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "'value'",
            type: "text",
            apply: "'value' ",
            detail: "Enter a string value",
          },
          { label: "0", type: "text", apply: "0 ", detail: "Numeric value" },
        ],
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }
    // If the case match test the doc text
    if (
      /\bCASE\s+.*?\bWHEN\s+.*?\s*(=|>|<|>=|<=|!=|LIKE)\s*('[^']*'|[0-9]+)\s*(\w*)$/i.test(
        docText
      )
    ) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "THEN",
            type: "keyword",
            apply: "THEN ",
            detail: "Specify the result for the condition",
          },
        ],
        filter: true,
        validFor: /^THEN$/i,
      };
    }
    // If the case match test the doc text
    if (/\bCASE\s+.*?\bTHEN\s+(\w*)$/i.test(docText)) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "'value'",
            type: "text",
            apply: "'value' ",
            detail: "Enter a string value",
          },
          { label: "0", type: "text", apply: "0 ", detail: "Numeric value" },
        ],
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }
    // If the case match test the doc text
    if (/\bCASE\s+.*?\bTHEN\s*('[^']*'|[0-9]+)\s*(\w*)$/i.test(docText)) {
      // Set the options to the options
      const options = [
        {
          label: "ELSE",
          type: "keyword",
          apply: "ELSE ",
          detail: "Default result",
        },
        {
          label: "END",
          type: "keyword",
          apply: "END ",
          detail: "Complete CASE",
        },
      ];
      // If the is in cte subquery and the 
      // parenthesis count is greater than 0
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
        validFor: /^(ELSE|END|\))$/i,
      };
    }
    // If the case match test the doc text
    if (/\bCASE\s+.*?\bELSE\s+(\w*)$/i.test(docText)) {
      // Return the options
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "'value'",
            type: "text",
            apply: "'value' ",
            detail: "Enter a string value",
          },
          { label: "0", type: "text", apply: "0 ", detail: "Numeric value" },
        ],
        filter: true,
        validFor: /^['"\d]*$/,
      };
    }
    // If the case match test the doc text
    if (/\bCASE\s+.*?\bELSE\s*('[^']*'|[0-9]+)\s*(\w*)$/i.test(docText)) {
      // Set the options to the options
      const options = [
        {
          label: "END",
          type: "keyword",
          apply: "END ",
          detail: "Complete CASE statement",
        },
        {
          label: "AS",
          type: "keyword",
          apply: 'AS "" ',
          detail: "Alias the CASE expression",
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
      // Return the options
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(END|AS|\))$/i,
      };
    }

    // If the case match test the doc text
    if (/\bCASE\s+.*?\bAS\s+""\s*$/i.test(docText)) {
      // Set the options to the options
      const options = [
        {
          label: "FROM",
          type: "keyword",
          apply: "FROM ",
          detail: "Start FROM clause",
          boost: 10,
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
          boost: 5,
        });
      }
      // Return the options
      return {
        from: word ? word.from : pos,
        options,
        filter: true,
        validFor: /^(FROM|\))$/i,
      };
    }
  }

  return null;
};
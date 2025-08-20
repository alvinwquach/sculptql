import { CompletionResult } from "@codemirror/autocomplete";
import { Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";
import { getOperatorDetail } from "../../getOperatorDetail";

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
  // PSEUDOCODE:
  // 1. Define type guards for Select node and table reference
  // 2. Extract table and columns from AST or regex
  // 3. If after SELECT (not SELECT *), suggest CASE
  // 4. If inside CASE statement:
  //    a. After CASE, suggest WHEN
  //    b. After WHEN, suggest columns
  //    c. After column, suggest operators
  //    d. After operator, suggest values (or LIKE patterns)
  //    e. After value, suggest THEN
  //    f. After THEN, suggest values
  //    g. After value, suggest ELSE or END
  //    h. After ELSE, suggest values
  //    i. After ELSE value, suggest END or AS
  //    j. After AS "", suggest FROM
  // 5. Return null if no suggestions apply

  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";


  const isTableReference = (
    fromItem: unknown
  ): fromItem is { table: string | null } =>
    !!fromItem && typeof fromItem === "object" && "table" in fromItem;


  let selectedTable: string | null = null;
  let columns: string[] = [];

  if (ast) {
    // AST is available → pull table from FROM clause
    const selectNode = Array.isArray(ast)
      ? ast.find(isSelectNode)
      : isSelectNode(ast)
      ? ast
      : null;
    if (selectNode && selectNode.from) {
      const fromClause = Array.isArray(selectNode.from)
        ? selectNode.from[0]
        : selectNode.from;
      if (isTableReference(fromClause)) {
        selectedTable = fromClause.table;
        columns =
          selectedTable && tableColumns[selectedTable]
            ? tableColumns[selectedTable]
            : [];
      }
    }
  } else {
    // AST missing → fall back to regex for incorrect FROM (e.g., SELECT * FROM users CASE)
    const fromMatch = docText.match(
      /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+CASE\b/i
    );
    selectedTable = fromMatch ? fromMatch[1] : null;
    columns =
      selectedTable && tableColumns[selectedTable]
        ? tableColumns[selectedTable]
        : [];

    // Infer table by matching SELECT column names to known table schemas
    if (!selectedTable) {
      const selectMatch = docText.match(
        /\bSELECT\s+([^,;\n]+)(?:,|\s+CASE|$)/i
      );
      if (selectMatch) {
        const columnNames = selectMatch[1]
          .split(",")
          .map((col) => stripQuotes(col.trim()))
          .filter((col) => col && col !== "*");

        const possibleTables = Object.keys(tableColumns).filter((table) =>
          columnNames.every((col) => tableColumns[table].includes(col))
        );

        selectedTable = possibleTables.length === 1 ? possibleTables[0] : null;
        columns =
          selectedTable && tableColumns[selectedTable]
            ? tableColumns[selectedTable]
            : [];
      }
    }
  }

  const caseMatch = docText.match(/\bCASE\s+([\s\S]*?)$/i);

  // Suggest CASE keyword after SELECT (but not after SELECT *)
  const afterSelectOrCommaRegex =
    /\bSELECT\s+([^;\n]*?)(?:,|\s+CASE)\s*(\w*)$/i;
  const isSelectStar = /\bSELECT\s+\*\s*$/i.test(docText);
  if (
    afterSelectOrCommaRegex.test(docText) &&
    !caseMatch &&
    !isSelectStar && 
    !docText.match(
      /\bFROM\s+.*\b(WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|UNION)\b/i
    ) &&
    !docText.match(/\bFROM\s+[a-zA-Z_][a-zA-Z0-9_]*\s+CASE\b/i)
  ) {
    return {
      from: word ? word.from : pos,
      options: [
        {
          label: "CASE",
          type: "keyword",
          apply: "CASE ",
          detail: "Start a conditional CASE statement",
          boost: 10,
        },
      ],
      filter: true,
      validFor: /^CASE$/i,
    };
  }

  if (caseMatch) {
    // Suggest WHEN after CASE
    if (/\bCASE\s+(\w*)$/i.test(docText)) {
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

    // Suggest columns after WHEN
    if (/\bCASE\s+.*?\bWHEN\s+(\w*)$/i.test(docText)) {
      const filteredColumns =
        columns.length > 0
          ? columns.filter((col) =>
              currentWord
                ? stripQuotes(col)
                    .toLowerCase()
                    .startsWith(stripQuotes(currentWord).toLowerCase())
                : true
            )
          : [];

      return {
        from: word ? word.from : pos,
        options:
          filteredColumns.length > 0
            ? filteredColumns.map((col) => ({
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

    // Suggest operators after column
    if (
      /\bCASE\s+.*?\bWHEN\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(\w*)$/i.test(
        docText
      )
    ) {
      const operators = ["=", "!=", ">", "<", ">=", "<=", "LIKE"];
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

    // Suggest values after operator
    if (
      /\bCASE\s+.*?\bWHEN\s+((?:"[\w]+"|'[\w]+'|[\w_]+))\s*(=|>|<|>=|<=|!=|LIKE)\s*(\w*)$/i.test(
        docText
      )
    ) {
      const operator = /\bWHEN\s+.*?\s*(=|>|<|>=|<=|!=|LIKE)\s*/i.exec(
        docText
      )![1];
      if (operator.toUpperCase() === "LIKE") {
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

    // Suggest THEN
    if (
      /\bCASE\s+.*?\bWHEN\s+.*?\s*(=|>|<|>=|<=|!=|LIKE)\s*('[^']*'|[0-9]+)\s*(\w*)$/i.test(
        docText
      )
    ) {
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

    // Suggest values after THEN
    if (/\bCASE\s+.*?\bTHEN\s+(\w*)$/i.test(docText)) {
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

    // Suggest ELSE or END
    if (/\bCASE\s+.*?\bTHEN\s*('[^']*'|[0-9]+)\s*(\w*)$/i.test(docText)) {
      return {
        from: word ? word.from : pos,
        options: [
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
        ],
        filter: true,
        validFor: /^(ELSE|END)$/i,
      };
    }

    // Suggest values after ELSE
    if (/\bCASE\s+.*?\bELSE\s+(\w*)$/i.test(docText)) {
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

    // Suggest END or AS
    if (/\bCASE\s+.*?\bELSE\s*('[^']*'|[0-9]+)\s*(\w*)$/i.test(docText)) {
      return {
        from: word ? word.from : pos,
        options: [
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
        ],
        filter: true,
        validFor: /^(END|AS)$/i,
      };
    }

    // Suggest FROM after AS ""
    if (/\bCASE\s+.*?\bAS\s+""\s*$/i.test(docText)) {
      return {
        from: word ? word.from : pos,
        options: [
          {
            label: "FROM",
            type: "keyword",
            apply: "FROM ",
            detail: "Start FROM clause",
            boost: 10,
          },
        ],
        filter: true,
        validFor: /^FROM$/i,
      };
    }
  }

  return null;
};

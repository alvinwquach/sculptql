export interface SQLContext {
  type: string;
  [key: string]: boolean | string;
}

interface Rule {
  name: string;
  test: (text: string) => boolean;
  context: SQLContext;
}

// Cache commonly used regex patterns
const FROM_PATTERN = /\bFROM\s+[\w"']+/i;
const GROUP_BY_PATTERN = /\bGROUP\s+BY\b/i;

export function getCompletionContext(textBeforeCursor: string): SQLContext {
  // Early return for empty input
  if (!textBeforeCursor || textBeforeCursor.length < 3) {
    return { type: "keyword" };
  }

  let hasFrom: boolean | null = null;
  let hasGroupBy: boolean | null = null;

  const getHasFrom = () => hasFrom ?? (hasFrom = FROM_PATTERN.test(textBeforeCursor));
  const getHasGroupBy = () => hasGroupBy ?? (hasGroupBy = GROUP_BY_PATTERN.test(textBeforeCursor));

  // Set the rules to the rules - ordered by most common first for early exit
  const rules: Rule[] = [
    {
      name: "with",
      test: (text) => /\bWITH\s+\w*\s*AS\s*\(\s*SELECT\b/i.test(text),
      context: { type: "with", inCte: true },
    },
    {
      name: "union",
      test: (text) => /\bUNION\s+(?:ALL\s+)?\s*SELECT\b/i.test(text),
      context: { type: "union", inUnion: true },
    },
    {
      name: "from_clause_start",
      test: (text) => /\bFROM\s*$/i.test(text),
      context: { type: "from", inFrom: true },
    },
    {
      name: "from_with_table",
      test: (text) => /\bFROM\s+[\w"']+$/i.test(text),
      context: { type: "from", inFrom: true },
    },
    {
      name: "after_from",
      test: (text) => /\bSELECT\s+.*\s+FROM\s+[\w"']+\s+$/i.test(text),
      context: { type: "after_from", inAfterFrom: true },
    },
    {
      name: "select_star_no_from",
      test: (text) =>
        /\bSELECT\s+(DISTINCT\s+)?\*\s*$/i.test(text) && !getHasFrom(),
      context: { type: "need_from", needFrom: true },
    },
    {
      name: "select_columns_no_from",
      test: (text) =>
        /\bSELECT\s+(DISTINCT\s+)?[\w"'(),\s]+\s+$/i.test(text) &&
        !getHasFrom() &&
        !/\bSELECT\s+(DISTINCT\s+)?$/i.test(text) &&
        !/,\s*$/i.test(text),
      context: { type: "need_from", needFrom: true },
    },
    {
      name: "in_select",
      test: (text) =>
        /\bSELECT\s*(DISTINCT\s*)?$/i.test(text) ||
        (/\bSELECT\s+(DISTINCT\s+)?[\w"'(),\s]*$/i.test(text) && !getHasFrom()),
      context: { type: "select", inSelect: true },
    },
    {
      name: "join_clause",
      test: (text) =>
        getHasFrom() &&
        /\b(?:INNER|LEFT|RIGHT|CROSS)\s+JOIN\b/i.test(text) &&
        !/\b(WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|UNION)\b/i.test(
          text.split(/\b(?:INNER|LEFT|RIGHT|CROSS)\s+JOIN\b/i).pop() || ""
        ),
      context: { type: "join", inJoin: true },
    },
    {
      name: "having_clause",
      test: (text) =>
        getHasGroupBy() &&
        /\bHAVING\b/i.test(text) &&
        !/\b(ORDER\s+BY|LIMIT|UNION)\b/i.test(
          text.split(/\bHAVING\b/i)[1] || ""
        ),
      context: { type: "having", inHaving: true },
    },
    {
      name: "group_by_clause",
      test: (text) =>
        getHasFrom() &&
        /\bGROUP\s+BY\b/i.test(text) &&
        !/\b(HAVING|ORDER\s+BY|LIMIT|UNION)\b/i.test(
          text.split(/\bGROUP\s+BY\b/i)[1] || ""
        ),
      context: { type: "group_by", inGroupBy: true },
    },
    {
      name: "limit_clause",
      test: (text) =>
        /\bLIMIT\b/i.test(text) &&
        !/\bUNION\b/i.test(text.split(/\bLIMIT\b/i)[1] || ""),
      context: { type: "limit", inLimit: true },
    },
    {
      name: "order_by_clause",
      test: (text) =>
        getHasFrom() &&
        /\bORDER\s+BY\b/i.test(text) &&
        !/\b(LIMIT|UNION)\b/i.test(
          text.split(/\bORDER\s+BY\b/i)[1] || ""
        ),
      context: { type: "order_by", inOrderBy: true },
    },
    {
      name: "where_clause",
      test: (text) =>
        getHasFrom() &&
        /\bWHERE\b/i.test(text) &&
        !/\b(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|UNION)\b/i.test(
          text.split(/\bWHERE\b/i)[1] || ""
        ),
      context: { type: "where", inWhere: true },
    },
  ];

  // Loop through the rules
  for (const rule of rules) {
    // If the rule test is true
    if (rule.test(textBeforeCursor)) {
      // Return the rule context
      return rule.context;
    }
  }

  // Default fallback
  return { type: "keyword" };
}

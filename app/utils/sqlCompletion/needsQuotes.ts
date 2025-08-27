export const needsQuotes = (id: string): boolean => {
  // 1. If it's clearly a function/expression with parentheses, don't quote
  if (/\w+\s*\(.*\)/.test(id)) {
    return false;
  }

  // 2. Explicit aggregate check (covers COUNT, SUM, AVG, MIN, MAX, ROUND)
  const isAggregate = /^(COUNT|SUM|AVG|MAX|MIN|ROUND)\s*\(.*\)$/i.test(id);
  if (isAggregate) {
    return false;
  }

  // 3. Reserved keywords list
  const reservedKeywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "UNION",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "AS",
    "JOIN",
    "INNER",
    "LEFT",
    "RIGHT",
    "CROSS",
    "ON",
  ];

  // 4. Quote if:
  //    - Doesn't match normal SQL identifier
  //    - OR is a reserved keyword
  return (
    !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id) ||
    reservedKeywords.includes(id.toUpperCase())
  );
};

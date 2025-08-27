export const needsQuotes = (id: string): boolean => {
  // PSEUDOCODE:
  // 1. Check if identifier contains special characters or reserved keywords
  // 2. Return true if quotes are needed, false otherwise

  const isAggregate =
    /^(COUNT|SUM|AVG|MAX|MIN|ROUND)(\s*\((\s*DISTINCT)?\s*(["']?[\w_]+["']?|\*)\s*(,\s*\d+)?\s*\))$/i.test(
      id
    );
  if (isAggregate) {
    return false;
  }

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
  return (
    !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id) ||
    reservedKeywords.includes(id.toUpperCase())
  );
};

export const needsQuotes = (id: string): boolean => {
  // PSEUDOCODE:
  // 1. Check if identifier contains special characters or reserved keywords
  // 2. Return true if quotes are needed, false otherwise

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

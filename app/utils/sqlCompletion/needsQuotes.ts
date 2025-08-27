export const needsQuotes = (id: string): boolean => {
  // If it's clearly numeric -> no quotes
  if (/^\d+(\.\d+)?$/.test(id)) {
    return false;
  }

  // Function/expression with parentheses -> no quotes
  if (/\w+\s*\(.*\)/.test(id)) {
    return false;
  }

  // Explicit aggregate check
  const isAggregate = /^(COUNT|SUM|AVG|MAX|MIN|ROUND)\s*\(.*\)$/i.test(id);
  if (isAggregate) {
    return false;
  }

  // Reserved keywords list
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

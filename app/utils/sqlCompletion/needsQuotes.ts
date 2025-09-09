export const needsQuotes = (id: string, isValue: boolean = false): boolean => {
  // Explicitly handle the wildcard *
  if (id === "*") {
    return false;
  }

  // If it's a value (e.g., for WHERE clause conditions), always quote strings unless numeric
  if (isValue) {
    // Numeric values don't need quotes
    if (/^\d+(\.\d+)?$/.test(id)) {
      return false;
    }
    // Non-numeric values (e.g., 'ADMIN') need single quotes
    return true;
  }

  // For identifiers (table/column names):
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

  // Identifiers need quotes if they don't match standard identifier pattern or are reserved keywords
  return (
    !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id) ||
    reservedKeywords.includes(id.toUpperCase())
  );
};

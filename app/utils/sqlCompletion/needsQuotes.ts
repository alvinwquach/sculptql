export const needsQuotes = (
  id: string,
  isValue: boolean = false,
  columnDataType?: string // Optional column data type
): boolean => {
  // Handle the wildcard *
  if (id === "*") return false;

  // If this is a value (e.g., WHERE clause)
  if (isValue) {
    // Numeric values or NULL don't need quotes
    if (/^\d+(\.\d+)?$/.test(id) || id.toUpperCase() === "NULL") {
      return false;
    }

    // Explicit boolean literals don't need quotes
    if (["TRUE", "FALSE"].includes(id.toUpperCase())) {
      return false;
    }

    // Respect column data type hints
    if (
      columnDataType &&
      ["string", "text", "varchar", "char", "enum"].includes(
        columnDataType.toLowerCase()
      )
    ) {
      return true;
    }

    // Default for non-numeric strings: quote them
    return true;
  }

  // For identifiers (table/column names)
  // Numeric identifiers don't need quotes
  if (/^\d+(\.\d+)?$/.test(id)) return false;

  // Functions or expressions with parentheses -> no quotes
  if (/\w+\s*\(.*\)/.test(id)) return false;

  // Aggregates like COUNT(), SUM(), AVG(), etc. -> no quotes
  if (/^(COUNT|SUM|AVG|MAX|MIN|ROUND)\s*\(.*\)$/i.test(id)) return false;

  // Reserved SQL keywords
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

  // Identifiers need quotes if:
  // 1. They contain invalid characters for standard identifiers
  // 2. They are reserved SQL keywords
  return (
    !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id) ||
    reservedKeywords.includes(id.toUpperCase())
  );
};

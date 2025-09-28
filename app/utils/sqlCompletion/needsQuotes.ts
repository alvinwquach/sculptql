export const needsQuotes = (
  id: string,
  isValue: boolean = false,
  columnDataType?: string
): boolean => {
  // If the id is a wildcard, return false
  if (id === "*") return false;

  // If the id is a value
  if (isValue) {
    // If the id is a number or null, return false
    if (/^\d+(\.\d+)?$/.test(id) || id.toUpperCase() === "NULL") {
      return false;
    }
    // If the id is true or false, return false
    if (["TRUE", "FALSE"].includes(id.toUpperCase())) {
      return false;
    }
    // If the column data type is 
    // a string, text, varchar, char, enum, or Oracle-specific types, return true 
    if (
      columnDataType &&
      ["string", "text", "varchar", "char", "enum", "varchar2", "nvarchar2", "clob", "nclob", "char", "nchar"].includes(
        columnDataType.toLowerCase()
      )
    ) {
      // Return true
      return true;
    }
    // Return true
    return true;
  }

  // If the id is a number, return false
  if (/^\d+(\.\d+)?$/.test(id)) return false;
  // If the id is a function with parentheses, return false
  if (/\w+\s*\(.*\)/.test(id)) return false;
  // If the id is a aggregate function, return false
  if (/^(COUNT|SUM|AVG|MAX|MIN|ROUND|STDDEV|VARIANCE|LISTAGG|WM_CONCAT|COLLECT|PIVOT|UNPIVOT)\s*\(.*\)$/i.test(id)) return false;

  // Create the reserved keywords
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
    // Oracle-specific keywords
    "ROWNUM",
    "ROWID",
    "DUAL",
    "SYSDATE",
    "SYSTIMESTAMP",
    "USER",
    "LEVEL",
    "CONNECT",
    "START",
    "PRIOR",
    "NOCYCLE",
    "NOCACHE",
    "ORDER",
    "SIBLINGS",
  ];

  // Return true if the id is not a valid identifier 
  // or is a reserved keyword
  return (
    !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id) ||
    reservedKeywords.includes(id.toUpperCase())
  );
};

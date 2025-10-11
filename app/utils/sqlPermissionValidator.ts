export type PermissionMode = "read-only" | "read-write" | "full";

export enum SqlOperationType {
  SELECT = "SELECT",
  INSERT = "INSERT",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  DROP = "DROP",
  TRUNCATE = "TRUNCATE",
  CREATE = "CREATE",
  ALTER = "ALTER",
  GRANT = "GRANT",
  REVOKE = "REVOKE",
  EXPLAIN = "EXPLAIN",
  DESCRIBE = "DESCRIBE",
  SHOW = "SHOW",
  USE = "USE",
  SET = "SET",
  PRAGMA = "PRAGMA",
}

const PERMISSION_CONFIG: Record<
  PermissionMode,
  { allowed: SqlOperationType[]; description: string }
> = {
  "read-only": {
    allowed: [
      SqlOperationType.SELECT,
      SqlOperationType.EXPLAIN,
      SqlOperationType.DESCRIBE,
      SqlOperationType.SHOW,
      SqlOperationType.PRAGMA,
    ],
    description: "Only SELECT and read operations are allowed",
  },
  "read-write": {
    allowed: [
      SqlOperationType.SELECT,
      SqlOperationType.INSERT,
      SqlOperationType.UPDATE,
      SqlOperationType.EXPLAIN,
      SqlOperationType.DESCRIBE,
      SqlOperationType.SHOW,
      SqlOperationType.PRAGMA,
    ],
    description: "SELECT, INSERT, and UPDATE operations are allowed",
  },
  full: {
    allowed: Object.values(SqlOperationType),
    description: "All SQL operations are allowed",
  },
};

const KEYWORD_TO_OPERATION: Record<string, SqlOperationType> = {
  SELECT: SqlOperationType.SELECT,
  INSERT: SqlOperationType.INSERT,
  UPDATE: SqlOperationType.UPDATE,
  DELETE: SqlOperationType.DELETE,
  DROP: SqlOperationType.DROP,
  TRUNCATE: SqlOperationType.TRUNCATE,
  CREATE: SqlOperationType.CREATE,
  ALTER: SqlOperationType.ALTER,
  GRANT: SqlOperationType.GRANT,
  REVOKE: SqlOperationType.REVOKE,
  EXPLAIN: SqlOperationType.EXPLAIN,
  DESCRIBE: SqlOperationType.DESCRIBE,
  DESC: SqlOperationType.DESCRIBE,
  SHOW: SqlOperationType.SHOW,
  USE: SqlOperationType.USE,
  SET: SqlOperationType.SET,
  PRAGMA: SqlOperationType.PRAGMA,
  WITH: SqlOperationType.SELECT,
};

export function detectSqlOperation(query: string): SqlOperationType[] {
  // Normalize the query: remove comments, extra whitespace, and convert to uppercase
  const normalizedQuery = query
    // Remove single-line comments
    .replace(/--[^\n]*/g, "")
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  // Split by semicolon to handle multiple statements
  const statements = normalizedQuery
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const operations: SqlOperationType[] = [];

  for (const statement of statements) {
    const firstKeyword = statement.split(/\s+/)[0];
    // Use lookup map for O(1) operation detection
    const operation = KEYWORD_TO_OPERATION[firstKeyword];
    if (operation) {
      operations.push(operation);
    }
  }

  return operations;
}

export function validateSqlPermission(
  query: string,
  mode: PermissionMode
): { allowed: boolean; error?: string; operations: SqlOperationType[] } {
  const operations = detectSqlOperation(query);

  // If no operations detected, allow it
  if (operations.length === 0) {
    return {
      allowed: true,
      operations: [],
    };
  }

  const config = PERMISSION_CONFIG[mode];
  const disallowedOperations = operations.filter(
    (op) => !config.allowed.includes(op)
  );

  if (disallowedOperations.length > 0) {
    const operationsList = disallowedOperations.join(", ");
    return {
      allowed: false,
      error: `Operation not allowed in ${mode} mode: ${operationsList}. ${config.description}.`,
      operations,
    };
  }

  return {
    allowed: true,
    operations,
  };
}

export function getPermissionMode(): PermissionMode {
  const mode = process.env.DB_MODE as PermissionMode | undefined;

  if (!mode) {
    return "full";
  }

  if (!["read-only", "read-write", "full"].includes(mode)) {
    console.warn(
      `Invalid DB_MODE: ${mode}. Defaulting to "full". Valid values: read-only, read-write, full`
    );
    return "full";
  }

  return mode;
}

export function getPermissionDescription(mode: PermissionMode): string {
  return PERMISSION_CONFIG[mode].description;
}

import { linter, Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";

// Client-side permission mode type
export type PermissionMode = "read-only" | "read-write" | "full";

// SQL operation types
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

// Permission configuration
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

/**
 * Detects SQL operations in a query string
 */
function detectSqlOperation(query: string): {
  operations: SqlOperationType[];
  positions: { operation: SqlOperationType; from: number; to: number }[];
} {
  const normalizedQuery = query
    .replace(/--[^\n]*/g, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Initialize arrays to store operations and positions for the query normalized 
  const operations: SqlOperationType[] = [];
  const positions: { operation: SqlOperationType; from: number; to: number }[] =
    [];

  // Split by semicolon to handle multiple statements
  const statements = normalizedQuery
    .split(";")
    .filter((s) => s.trim().length > 0);

  // Initialize current position to 0
  let currentPos = 0;
  // Loop through the statements
  for (const statement of statements) {
    // Trim the statement and convert to uppercase
    const trimmedStatement = statement.trim().toUpperCase();
    // Get the first keyword from the trimmed statement
    const firstKeyword = trimmedStatement.split(/\s+/)[0];

    // Initialize operation to null
    let operation: SqlOperationType | null = null;

    // Detect operation type
    if (
      firstKeyword.startsWith("SELECT") ||
      trimmedStatement.startsWith("WITH")
    ) {
      operation = SqlOperationType.SELECT;
    } else if (firstKeyword === "INSERT") {
      operation = SqlOperationType.INSERT;
    } else if (firstKeyword === "UPDATE") {
      operation = SqlOperationType.UPDATE;
    } else if (firstKeyword === "DELETE") {
      operation = SqlOperationType.DELETE;
    } else if (firstKeyword === "DROP") {
      operation = SqlOperationType.DROP;
    } else if (firstKeyword === "TRUNCATE") {
      operation = SqlOperationType.TRUNCATE;
    } else if (firstKeyword === "CREATE") {
      operation = SqlOperationType.CREATE;
    } else if (firstKeyword === "ALTER") {
      operation = SqlOperationType.ALTER;
    } else if (firstKeyword === "GRANT") {
      operation = SqlOperationType.GRANT;
    } else if (firstKeyword === "REVOKE") {
      operation = SqlOperationType.REVOKE;
    } else if (firstKeyword === "EXPLAIN") {
      operation = SqlOperationType.EXPLAIN;
    } else if (firstKeyword === "DESCRIBE" || firstKeyword === "DESC") {
      operation = SqlOperationType.DESCRIBE;
    } else if (firstKeyword === "SHOW") {
      operation = SqlOperationType.SHOW;
    } else if (firstKeyword === "USE") {
      operation = SqlOperationType.USE;
    } else if (firstKeyword === "SET") {
      operation = SqlOperationType.SET;
    } else if (firstKeyword === "PRAGMA") {
      operation = SqlOperationType.PRAGMA;
    }

    if (operation) {
      operations.push(operation);

      // Find the position of this keyword in the original query
      const keywordPos = query.toUpperCase().indexOf(firstKeyword, currentPos);
      if (keywordPos !== -1) {
        positions.push({
          operation,
          from: keywordPos,
          to: keywordPos + firstKeyword.length,
        });
      }
    }

    currentPos = query.indexOf(statement, currentPos) + statement.length;
  }

  return { operations, positions };
}

// Validate if SQL operations are allowed based on permission mode
function validateSqlPermission(
  query: string,
  mode: PermissionMode
): {
  allowed: boolean;
  disallowedOperations: {
    operation: SqlOperationType;
    from: number;
    to: number;
  }[];
  message?: string;
} {
  // Detect SQL operations and their positions in the query
  const { operations, positions } = detectSqlOperation(query);

  // If no operations are detected, return true
  if (operations.length === 0) {
    return { allowed: true, disallowedOperations: [] };
  }

  // Get the permission configuration for the mode
  const config = PERMISSION_CONFIG[mode];
  // Filter out the operations that are not allowed
  const disallowedOperations = positions.filter(
    (pos) => !config.allowed.includes(pos.operation)
  );

  // If there are disallowed operations, return false
  if (disallowedOperations.length > 0) {
    const operationsList = [
      ...new Set(disallowedOperations.map((op) => op.operation)),
    ].join(", ");
    return {
      allowed: false,
      disallowedOperations,
      message: `Operation not allowed in ${mode} mode: ${operationsList}. ${config.description}.`,
    };
  }

  // If there are no disallowed operations, return true
  return { allowed: true, disallowedOperations: [] };
}

export function createSqlPermissionLinter(mode: PermissionMode) {
  return linter((view: EditorView) => {
    // Initialize an array to store diagnostics
    const diagnostics: Diagnostic[] = [];
    // Get the query from the view state
    const query = view.state.doc.toString();

    // If the query is not trimmed, return diagnostics
    if (!query.trim()) {
      return diagnostics;
    }

    // Validate the query with the permission mode
    const validation = validateSqlPermission(query, mode);
    // If the query is not allowed, add diagnostics

    if (!validation.allowed) {
      // Loop through the disallowed operations and add diagnostics
      for (const disallowed of validation.disallowedOperations) {
        // Add diagnostics for the disallowed operation
        diagnostics.push({
          from: disallowed.from,
          to: disallowed.to,
          severity: "error",
          message: `${disallowed.operation} operation is not allowed in ${mode} mode. ${PERMISSION_CONFIG[mode].description}.`,
        });
      }
    }

    // Return the diagnostics
    return diagnostics;
  });
}


function isValidMode(mode: string): mode is PermissionMode {
  return ["read-only", "read-write", "full"].includes(mode);
}


export function getClientPermissionMode(): PermissionMode {
  // If the window is not undefined, try to get the permission mode from localStorage
  if (typeof window !== "undefined") {
    try {
      const storedMode = localStorage.getItem("dbPermissionMode");
      // If the stored mode is valid, return it
      if (storedMode && isValidMode(storedMode)) {
        return storedMode;
      }
    } catch (error) {
      console.warn("Failed to read permission mode from localStorage:", error);
    }
  }

  // If the environment variable is valid, return it
  const envMode = process.env.NEXT_PUBLIC_DB_MODE as PermissionMode | undefined;
  if (envMode && isValidMode(envMode)) {
    return envMode;
  }

  // If the stored mode is not valid, return full
  return "full";
}

/**
 * Set permission mode in localStorage
 */
export function setClientPermissionMode(mode: PermissionMode): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("dbPermissionMode", mode);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("permissionModeChanged", { detail: { mode } }));
    } catch (error) {
      console.error("Failed to save permission mode to localStorage:", error);
    }
  }
}

/**
 * Clear permission mode from localStorage (reverts to env var or default)
 */
export function clearClientPermissionMode(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("dbPermissionMode");
      window.dispatchEvent(new CustomEvent("permissionModeChanged"));
    } catch (error) {
      console.error("Failed to clear permission mode from localStorage:", error);
    }
  }
}

/**
 * Validate SQL and return error message if not allowed
 * (For use with toast notifications)
 */
export function validateSqlForToast(
  query: string,
  mode: PermissionMode
): {
  allowed: boolean;
  message?: string;
  operations: SqlOperationType[];
} {
  const { operations, positions } = detectSqlOperation(query);

  if (operations.length === 0) {
    return { allowed: true, operations: [] };
  }

  const config = PERMISSION_CONFIG[mode];
  const disallowedOperations = operations.filter(
    (op) => !config.allowed.includes(op)
  );

  if (disallowedOperations.length > 0) {
    const operationsList = [...new Set(disallowedOperations)].join(", ");
    return {
      allowed: false,
      operations: disallowedOperations,
      message: `❌ ${operationsList} not allowed in ${mode} mode! ${config.description}.`,
    };
  }

  return { allowed: true, operations };
}

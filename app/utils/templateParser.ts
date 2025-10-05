import { TemplateParameter } from "@/app/types/query";

type SupportedDialect = "postgres" | "mysql" | "mssql" | "sqlite" | "oracle";

export interface ParsedTemplate {
  query: string;
  params: (string | number | boolean)[];
  parameterOrder: string[];
}

// Parse template with named placeholders and convert to dialect-specific prepared statement
export function parseTemplate(
  templateQuery: string,
  parameters: TemplateParameter[],
  parameterValues: Record<string, string | number | boolean>,
  dialect: SupportedDialect = "postgres"
): ParsedTemplate {
  // Extract parameter names from template (matches {{paramName}})
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const foundPlaceholders = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(templateQuery)) !== null) {
    foundPlaceholders.add(match[1]);
  }

  // Validate that all placeholders have corresponding parameter definitions
  const paramMap = new Map(parameters.map((p) => [p.name, p]));

  for (const placeholder of foundPlaceholders) {
    if (!paramMap.has(placeholder)) {
      throw new Error(`Template contains undefined placeholder: {{${placeholder}}}`);
    }
  }

  // Validate required parameters are provided
  for (const param of parameters) {
    if (param.required && !(param.name in parameterValues)) {
      if (param.defaultValue === undefined) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }
    }
  }

  // Build parameter array with type conversion
  const parameterOrder: string[] = [];
  const params: (string | number | boolean)[] = [];

  // Replace placeholders with dialect-specific syntax
  let parsedQuery = templateQuery;
  let paramIndex = 0;

  // Process each placeholder in order of appearance
  parsedQuery = parsedQuery.replace(/\{\{(\w+)\}\}/g, (_, paramName) => {
    const param = paramMap.get(paramName);
    if (!param) {
      throw new Error(`Unknown parameter: ${paramName}`);
    }

    // Get value (use provided value or default)
    let value = parameterValues[paramName] ?? param.defaultValue;

    if (value === undefined) {
      throw new Error(`No value provided for parameter: ${paramName}`);
    }

    // Type conversion
    value = convertParameterValue(value, param.type);

    parameterOrder.push(paramName);
    params.push(value);
    paramIndex++;

    // Return dialect-specific placeholder
    return getDialectPlaceholder(dialect, paramIndex - 1);
  });

  return {
    query: parsedQuery,
    params,
    parameterOrder,
  };
}

// Convert parameter value to the correct type
function convertParameterValue(
  value: string | number | boolean,
  type: TemplateParameter["type"]
): string | number | boolean {
  switch (type) {
    case "number":
      if (typeof value === "number") return value;
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Cannot convert '${value}' to number`);
      }
      return num;

    case "boolean":
      if (typeof value === "boolean") return value;
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      throw new Error(`Cannot convert '${value}' to boolean`);

    case "string":
      return String(value);

    case "date":
      // For date, we'll pass as string and let the database handle it
      return String(value);

    default:
      return value;
  }
}

// Get the dialect-specific placeholder syntax
function getDialectPlaceholder(dialect: SupportedDialect, index: number): string {
  switch (dialect) {
    case "postgres":
      return `$${index + 1}`;
    case "mysql":
    case "sqlite":
      return "?";
    case "mssql":
      return `@param${index}`;
    case "oracle":
      return `:${index + 1}`;
    default:
      return `$${index + 1}`;
  }
}

// Extract parameter definitions from a template query
export function extractParametersFromTemplate(templateQuery: string): string[] {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const parameters = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(templateQuery)) !== null) {
    parameters.add(match[1]);
  }

  return Array.from(parameters);
}

// Validate template syntax
export function validateTemplateSyntax(templateQuery: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for mismatched braces
  const openBraces = (templateQuery.match(/\{\{/g) || []).length;
  const closeBraces = (templateQuery.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push("Mismatched template braces: {{ and }} must be balanced");
  }

  // Check for invalid placeholder names
  const invalidPlaceholderRegex = /\{\{([^}]*[^}\w][^}]*)\}\}/g;
  let match;

  while ((match = invalidPlaceholderRegex.exec(templateQuery)) !== null) {
    errors.push(`Invalid placeholder name: {{${match[1]}}} - only alphanumeric characters and underscores are allowed`);
  }

  // Check for empty placeholders
  if (/\{\{\s*\}\}/.test(templateQuery)) {
    errors.push("Empty placeholder found: {{}} - parameter name is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

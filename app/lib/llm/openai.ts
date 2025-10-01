import OpenAI from "openai";
import { ApiTableSchema, SchemaContext } from "@/app/types/query";

export type TableSchemaInput = ApiTableSchema;

export interface GenerateSqlInput {
  naturalLanguage: string;
  schema: TableSchemaInput[];
  dialect?: string;
}

export function transformToSchemaContext(
  schema: TableSchemaInput[]
): SchemaContext {
  return {
    tables: schema.map((table) => ({
      name: table.table_name,
      columns: table.columns.map((col) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === "YES",
        primaryKey: col.is_primary_key,
      })),
      relationships: table.foreign_keys.map((fk) => ({
        fromColumn: fk.column_name,
        toTable: fk.referenced_table,
        toColumn: fk.referenced_column,
      })),
    })),
  };
}

function validateSqlFormat(sql: string): string | null {
  const sqlKeywords = /^(SELECT|INSERT|UPDATE|DELETE|WITH)/i;
  if (!sqlKeywords.test(sql.trim())) {
    return "Generated response does not appear to be valid SQL";
  }

  return null;
}

async function callVercelAiEndpoint({
  naturalLanguage,
  schema,
  dialect = "postgres",
}: GenerateSqlInput): Promise<string> {
  const vercelApiUrl =
    process.env.VERCEL_API_URL || process.env.NEXT_PUBLIC_VERCEL_API_URL;

  if (!vercelApiUrl) {
    console.warn("No Vercel API URL configured, returning mock SQL");
    return generateMockSql(naturalLanguage, schema);
  }

  const graphqlEndpoint = `${vercelApiUrl}/api/graphql`;

  console.log(`[AI] Calling Vercel endpoint: ${graphqlEndpoint}`);

  const mutation = `
    mutation GenerateSQL($naturalLanguage: String!, $schema: [TableSchemaInput!]!, $dialect: String) {
      generateSqlFromNaturalLanguage(
        naturalLanguage: $naturalLanguage
        schema: $schema
        dialect: $dialect
      ) {
        sql
      }
    }
  `;

  const variables = {
    naturalLanguage,
    schema,
    dialect,
  };

  const response = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Vercel API error: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  const generatedSql = result.data?.generateSqlFromNaturalLanguage?.sql;

  if (!generatedSql) {
    throw new Error("No SQL generated from Vercel API");
  }

  return generatedSql;
}

export async function generateSqlFromNaturalLanguage({
  naturalLanguage,
  schema,
  dialect = "postgres",
}: GenerateSqlInput): Promise<string> {
  try {
    const isVercelEnvironment = !!process.env.OPENAI_API_KEY;

    if (isVercelEnvironment) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
      });

      const schemaContext = transformToSchemaContext(schema);

      const prompt = `You are an expert SQL developer. Given the following database schema and natural language request, generate a precise SQL query.

Database Schema:
${createOptimizedSchemaPrompt(schemaContext)}

Natural Language Request: "${naturalLanguage}"

Please generate a SQL query that fulfills this request. Return only the SQL query, no explanations or markdown formatting.

Important guidelines:
- Use proper table and column names exactly as provided in the schema
- Use appropriate JOINs for related tables
- Apply proper WHERE clauses for filtering
- Use correct aggregation functions when needed
- Use UNION to combine results from multiple queries (UNION removes duplicates, UNION ALL keeps them)
- Use HAVING to filter grouped results with aggregate conditions (e.g., HAVING COUNT(*) > 5)
- Use CASE statements for conditional logic (e.g., CASE WHEN status = 'premium' THEN 'VIP' ELSE 'Standard' END)
- Use WITH clauses (CTEs) for complex queries or when you need to reference the same subquery multiple times
- Ensure the query is valid for ${dialect} syntax
- Do not include comments unless specifically requested

SQL Query:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });

      const generatedSql = completion.choices[0]?.message?.content?.trim();

      if (!generatedSql) {
        throw new Error("No SQL generated from OpenAI");
      }

      const validationError = validateSqlFormat(generatedSql);
      if (validationError) {
        throw new Error(validationError);
      }

      return generatedSql;
    } else {
      console.log("[AI] Using Vercel GraphQL endpoint (CLI environment)");
      return await callVercelAiEndpoint({ naturalLanguage, schema, dialect });
    }
  } catch (error) {
    console.error("OpenAI SQL generation error:", error);
    return generateMockSql(naturalLanguage, schema);
  }
}

function createOptimizedSchemaPrompt(schemaContext: SchemaContext): string {
  return schemaContext.tables
    .map((table) => {
      const columns = table.columns
        .map(
          (col) =>
            `  ${col.name} (${col.type}${!col.nullable ? " NOT NULL" : ""}${
              col.primaryKey ? " PRIMARY KEY" : ""
            })`
        )
        .join("\n");

      const relationships =
        table.relationships.length > 0
          ? `\n  Relationships:\n${table.relationships
              .map(
                (rel) =>
                  `    ${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn}`
              )
              .join("\n")}`
          : "";

      return `Table: ${table.name}
Columns:
${columns}${relationships}`;
    })
    .join("\n\n");
}

function generateMockSql(
  naturalLanguage: string,
  schema: TableSchemaInput[]
): string {
  const lowerInput = naturalLanguage.toLowerCase();

  if (
    lowerInput.includes("show") ||
    lowerInput.includes("list") ||
    lowerInput.includes("get")
  ) {
    const tableName = schema[0]?.table_name || "users";
    return `SELECT * FROM ${tableName} LIMIT 100;`;
  }

  if (lowerInput.includes("count") || lowerInput.includes("number of")) {
    const tableName = schema[0]?.table_name || "users";
    return `SELECT COUNT(*) as total FROM ${tableName};`;
  }

  if (lowerInput.includes("average") || lowerInput.includes("avg")) {
    const numericColumn = schema[0]?.columns.find(
      (col) =>
        col.data_type.toLowerCase().includes("int") ||
        col.data_type.toLowerCase().includes("numeric") ||
        col.data_type.toLowerCase().includes("decimal")
    );
    const columnName = numericColumn?.column_name || "id";
    const tableName = schema[0]?.table_name || "users";
    return `SELECT AVG(${columnName}) as average FROM ${tableName};`;
  }

  const tableName = schema[0]?.table_name || "users";
  return `SELECT * FROM ${tableName} LIMIT 50;`;
}

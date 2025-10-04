import { format as formatSQL } from "sql-formatter";

type SqlLanguage =
  | "postgresql"
  | "sqlite"
  | "mysql"
  | "transactsql"
  | "bigquery"
  | "db2"
  | "db2i"
  | "duckdb"
  | "hive"
  | "mariadb"
  | "tidb"
  | "n1ql"
  | "plsql"
  | "redshift"
  | "spark"
  | "sql"
  | "trino"
  | "singlestoredb"
  | "snowflake"
  | "tsql";

export function formatSqlQuery(query: string): string | null {
  try {
    const dialect =
      (typeof window !== "undefined" &&
        (window as { DB_DIALECT?: string }).DB_DIALECT) ||
      "postgresql";

      // Map the dialect to the language
    const languageMap: Record<string, SqlLanguage> = {
      sqlite: "sqlite",
      mysql: "mysql",
      mssql: "transactsql",
      postgresql: "postgresql",
    };

    // Map the dialect to the language
    const language: SqlLanguage = languageMap[dialect] || "postgresql";

    // Format the query
    const formatted = formatSQL(query, {
      language,
      keywordCase: "upper",
    });

    // Return the formatted query
    return formatted;
  } catch (err) {
    console.error("SQL formatting failed:", err);
    // Return null
    return null;
  }
}

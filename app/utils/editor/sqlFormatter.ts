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

    const languageMap: Record<string, SqlLanguage> = {
      sqlite: "sqlite",
      mysql: "mysql",
      mssql: "transactsql",
      postgresql: "postgresql",
    };

    const language: SqlLanguage = languageMap[dialect] || "postgresql";

    const formatted = formatSQL(query, {
      language,
      keywordCase: "upper",
    });

    return formatted;
  } catch (err) {
    console.error("SQL formatting failed:", err);
    return null;
  }
}

#!/usr/bin/env node

import { Command } from "commander";
import { Pool as PgPool } from "pg";
import mysql, { Pool as MySqlPool } from "mysql2/promise";
import sqlite3 from "sqlite3";
import { open, Database as SqliteDatabase } from "sqlite";
import * as mssql from "mssql";
import oracledb, { Pool as OraclePool } from "oracledb";
import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

type SupportedDialect = "postgres" | "mysql" | "sqlite" | "mssql" | "oracle";

interface CLIOptions {
  dialect: SupportedDialect;
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  password?: string;
  db_file?: string;
}

const program = new Command();

program
  .name("sculptql")
  .description(
    "Maintain a persistent connection to your SQL database.\n" +
      "Supported dialects: postgres | mysql | sqlite | mssql | oracle (default: postgres)"
  )
  .option(
    "--dialect <dialect>",
    "Database dialect",
    process.env.DB_DIALECT ?? "postgres"
  )
  .option("--host <host>", "Database host", process.env.DB_HOST)
  .option("--port <port>", "Database port", process.env.DB_PORT)
  .option("--database <database>", "Database name", process.env.DB_NAME)
  .option("--user <user>", "Database user", process.env.DB_USER)
  .option("--password <password>", "Database password", process.env.DB_PASSWORD)
  .option("--db_file <db_file>", "SQLite file path", process.env.DB_FILE);

program.parse(process.argv);

const options = program.opts<CLIOptions>();

async function main() {
  if (!options.dialect) {
    console.error(
      chalk.red("❌ Error: Missing required --dialect or DB_DIALECT")
    );
    process.exit(1);
  }

  console.log("Connecting with options:", {
    dialect: options.dialect,
    host: options.host,
    port: options.port,
    database: options.database,
    user: options.user,
    password: options.password ? "******" : "",
    db_file: options.db_file,
  });

  let pool:
    | PgPool
    | MySqlPool
    | SqliteDatabase
    | mssql.ConnectionPool
    | OraclePool;

  if (options.dialect === "postgres") {
    pool = new PgPool({
      host: options.host,
      port: Number(options.port) || 5432,
      database: options.database,
      user: options.user,
      password: options.password,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      application_name: "sculptql-cli",
    });
    pool.on("error", (err) =>
      console.error(chalk.red("Postgres pool error:"), err)
    );
  } else if (options.dialect === "mysql") {
    pool = await mysql.createPool({
      host: options.host,
      port: Number(options.port) || 3306,
      database: options.database,
      user: options.user,
      password: options.password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  } else if (options.dialect === "sqlite") {
    if (!options.db_file) {
      console.error(chalk.red("❌ SQLite requires --db_file"));
      process.exit(1);
    }
    pool = await open({
      filename: options.db_file,
      driver: sqlite3.Database,
    });
  } else if (options.dialect === "mssql") {
    const config: mssql.config = {
      server: options.host ?? "",
      port: Number(options.port) || 1433,
      user: options.user,
      password: options.password,
      database: options.database,
      options: { encrypt: true, trustServerCertificate: true },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    };
    pool = await new mssql.ConnectionPool(config).connect();
  } else if (options.dialect === "oracle") {
    pool = await oracledb.createPool({
      user: options.user!,
      password: options.password!,
      connectString: `${options.host}:${options.port || 1521}/${
        options.database
      }`,
      poolMin: 0,
      poolMax: 5,
      poolIncrement: 1,
    });
  } else {
    console.error(chalk.red("❌ Unsupported dialect:"), options.dialect);
    process.exit(1);
  }

  console.log(
    chalk.green(
      `✅ ${options.dialect} connection pool is active. Press Ctrl+C to exit.`
    )
  );

  const closePool = async () => {
    console.log(chalk.green("\n✅ Closing connection pool..."));
    try {
      if (options.dialect === "postgres") {
        await(pool as PgPool).end();
      } else if (options.dialect === "mysql") {
        await(pool as MySqlPool).end();
      } else if (options.dialect === "sqlite") {
        await (pool as SqliteDatabase).close();
      } else if (options.dialect === "mssql") {
        await (pool as mssql.ConnectionPool).close();
      } else if (options.dialect === "oracle") {
        await (pool as OraclePool).close(10);
      }
      console.log(chalk.green("✅ Connection pool closed"));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(chalk.red("❌ Error closing pool:"), err.message);
      } else {
        console.error(chalk.red("❌ Error closing pool:"), err);
      }
    }
  };

  process.on("SIGINT", async () => {
    await closePool();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closePool();
    process.exit(0);
  });

  await new Promise(() => {});
}

main();

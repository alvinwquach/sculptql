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
import openUrl from "open";
import { createServer } from "http";
import { parse } from "url";
import next from "next";

dotenvConfig({ path: ".env" });

type SupportedDialect = "postgres" | "mysql" | "sqlite" | "mssql" | "oracle";

interface CLIOptions {
  dialect?: SupportedDialect;
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  password?: string;
  db_file?: string;
  serverPort?: string;
}

const program = new Command();

program
  .name("sculptql")
  .description(
    "Maintain a persistent connection to your SQL database.\n" +
      "Supported dialects: postgres | mysql | sqlite | mssql | oracle"
  )
  .option("--dialect <dialect>", "Database dialect (required)")
  .option("--host <host>", "Database host")
  .option("--port <port>", "Database port")
  .option("--database <database>", "Database name")
  .option("--user <user>", "Database user")
  .option("--password <password>", "Database password")
  .option("--db_file <db_file>", "SQLite file path")
  .option("--serverPort <serverPort>", "Web server port", "3000");

program.parse(process.argv);

const options = program.opts<CLIOptions>();
const dialect = options.dialect ?? process.env.DB_DIALECT;
const host = options.host ?? process.env.DB_HOST;
const port = options.port ?? process.env.DB_PORT;
const database = options.database ?? process.env.DB_DATABASE;
const user = options.user ?? process.env.DB_USER;
const password = options.password ?? process.env.DB_PASSWORD;
const db_file = options.db_file ?? process.env.DB_FILE;
const serverPort = parseInt(
  options.serverPort ?? process.env.PORT ?? "3000",
  10
);

const missingFields: string[] = [];

if (!dialect) {
  missingFields.push("--dialect or DB_DIALECT");
}

if (dialect === "sqlite") {
  if (!db_file) {
    missingFields.push("--db_file or DB_FILE");
  }
} else {
  if (!host) missingFields.push("--host or DB_HOST");
  if (!port) missingFields.push("--port or DB_PORT");
  if (!database) missingFields.push("--database or DB_DATABASE");
  if (!user) missingFields.push("--user or DB_USER");
  if (!password) missingFields.push("--password or DB_PASSWORD");
}

if (missingFields.length > 0) {
  console.error(
    chalk.red("❌ Missing required options:\n  " + missingFields.join("\n  "))
  );
  process.exit(1);
}

async function main() {
  console.log("Connecting with options:", {
    dialect,
    host,
    port,
    database,
    user,
    password: password ? "******" : "",
    db_file,
    serverPort,
  });

  let pool:
    | PgPool
    | MySqlPool
    | SqliteDatabase
    | mssql.ConnectionPool
    | OraclePool;

  if (dialect === "postgres") {
    pool = new PgPool({
      host,
      port: Number(port) || 5432,
      database,
      user,
      password,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      application_name: "sculptql-cli",
    });
    pool.on("error", (err) =>
      console.error(chalk.red("Postgres pool error:"), err)
    );
  } else if (dialect === "mysql") {
    pool = await mysql.createPool({
      host,
      port: Number(port) || 3306,
      database,
      user,
      password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  } else if (dialect === "sqlite") {
    pool = await open({
      filename: db_file!,
      driver: sqlite3.Database,
    });
  } else if (dialect === "mssql") {
    const config: mssql.config = {
      server: host ?? "",
      port: Number(port) || 1433,
      user,
      password,
      database,
      options: { encrypt: true, trustServerCertificate: true },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    };
    pool = await new mssql.ConnectionPool(config).connect();
  } else if (dialect === "oracle") {
    pool = await oracledb.createPool({
      user,
      password,
      connectString: `${host}:${port || 1521}/${database}`,
      poolMin: 0,
      poolMax: 5,
      poolIncrement: 1,
    });
  } else {
    console.error(chalk.red("❌ Unsupported dialect:"), dialect);
    process.exit(1);
  }

  console.log(
    chalk.green(
      `✅ ${dialect} connection pool is active. Press Ctrl+C to exit.`
    )
  );

  const dev = process.env.NODE_ENV !== "production";
  const app = next({ dev });
  const handle = app.getRequestHandler();

  await app.prepare();
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  server.listen(serverPort, () => {
    console.log(
      chalk.green(
        `> Server listening at http://localhost:${serverPort} as ${
          dev ? "development" : process.env.NODE_ENV
        }`
      )
    );
  });

  const webUrl =
    (dev
      ? `http://localhost:${serverPort}`
      : process.env.NEXT_PUBLIC_BASE_URL ?? "https://sculptql.com") + "/editor";
  console.log(chalk.cyan(` Open the web interface: ${webUrl}`));

  try {
    await openUrl(webUrl);
    console.log(chalk.green("🌐 Browser opened successfully"));
  } catch (err) {
    console.error(chalk.red("❌ Failed to open browser:"), err);
  }

  const closePoolAndServer = async () => {
    console.log(chalk.green("\n Closing connection pool and server..."));
    try {
      if (dialect === "postgres") {
        await (pool as PgPool).end();
      } else if (dialect === "mysql") {
        await (pool as MySqlPool).end();
      } else if (dialect === "sqlite") {
        await (pool as SqliteDatabase).close();
      } else if (dialect === "mssql") {
        await (pool as mssql.ConnectionPool).close();
      } else if (dialect === "oracle") {
        await (pool as OraclePool).close(10);
      }
      console.log(chalk.green(" Connection pool closed"));
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(chalk.red(" Error closing pool:"), err.message);
      } else {
        console.error(chalk.red(" Error closing pool:"), err);
      }
    }
    server.close(() => {
      console.log(chalk.green(" Web server closed"));
    });
  };

  process.on("SIGINT", async () => {
    await closePoolAndServer();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closePoolAndServer();
    process.exit(0);
  });

  await new Promise(() => {});
}

main();

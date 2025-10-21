#!/usr/bin/env node

import { Pool as PgPool } from "pg";
import mysql, { Pool as MySqlPool } from "mysql2/promise";
import sqlite3 from "sqlite3";
import { open, Database as SqliteDatabase } from "sqlite";
import * as mssql from "mssql";
import oracledb, { Pool as OraclePool } from "oracledb";
import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";
import { Command } from "commander";
import openUrl from "open";
import { createServer, Server } from "http";
import next from "next";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig({ path: ".env" });

const program = new Command();
program
  .name("sculptql")
  .description("Visual SQL Query Builder with database connection")
  .version("4.2.0")
  .option(
    "-d, --dialect <type>",
    "Database dialect (postgres|mysql|sqlite|mssql|oracle)"
  )
  .option("-h, --host <host>", "Database host")
  .option("-P, --port <port>", "Database port")
  .option("-D, --database <name>", "Database name")
  .option("-u, --user <username>", "Database username")
  .option("-p, --password <password>", "Database password")
  .option("-f, --file <path>", "SQLite database file path")
  .option("-s, --server-port <port>", "Server port (default: 3000)")
  .option(
    "-m, --mode <mode>",
    "Permission mode: read-only (SELECT only), read-write (SELECT/INSERT/UPDATE), full (all operations including DELETE/DROP)"
  )
  .parse();

const options = program.opts();

type SupportedDialect = "postgres" | "mysql" | "sqlite" | "mssql" | "oracle";
type PermissionMode = "read-only" | "read-write" | "full";

const dialect = (options.dialect || process.env.DB_DIALECT) as
  | SupportedDialect
  | undefined;
const host = options.host || process.env.DB_HOST;
const port = options.port || process.env.DB_PORT;
const database = options.database || process.env.DB_DATABASE;
const user = options.user || process.env.DB_USER;
const password = options.password || process.env.DB_PASSWORD;
const db_file = options.file || process.env.DB_FILE;
const serverPort = parseInt(
  options.serverPort || process.env.PORT || "3000",
  10
);
const mode = (options.mode || process.env.DB_MODE || "full") as PermissionMode;

const missingFields: string[] = [];

if (!dialect) {
  missingFields.push("DB_DIALECT");
}

// Validate permission mode
if (!["read-only", "read-write", "full"].includes(mode)) {
  console.error(
    chalk.red(
      `❌ Invalid permission mode: ${mode}\n   Valid values: read-only, read-write, full`
    )
  );
  process.exit(1);
}

if (dialect === "sqlite") {
  if (!db_file) {
    missingFields.push("DB_FILE");
  }
} else {
  if (!host) missingFields.push("DB_HOST");
  if (!port) missingFields.push("DB_PORT");
  if (!database) missingFields.push("DB_DATABASE");
  if (!user) missingFields.push("DB_USER");
  if (!password) missingFields.push("DB_PASSWORD");
}

if (missingFields.length > 0) {
  console.error(
    chalk.red(
      "❌ Missing required configuration:\n  " + missingFields.join("\n  ")
    )
  );
  console.log(chalk.cyan("\n💡 You can configure SculptQL in three ways:\n"));

  console.log(chalk.yellow("1. Using environment variables:"));
  console.log(
    chalk.gray(
      "   DB_DIALECT=postgres DB_HOST=localhost DB_PORT=5432 DB_DATABASE=mydb DB_USER=user DB_PASSWORD=pass DB_MODE=read-only npx sculptql\n"
    )
  );

  console.log(chalk.yellow("2. Using CLI arguments:"));
  console.log(
    chalk.gray(
      "   npx sculptql -d postgres -h localhost -P 5432 -D mydb -u user -p pass -m read-only\n"
    )
  );

  console.log(chalk.yellow("3. Using a .env file:"));
  console.log(chalk.gray("   Create a .env file with:"));
  console.log(chalk.gray("   DB_DIALECT=postgres"));
  console.log(chalk.gray("   DB_HOST=localhost"));
  console.log(chalk.gray("   DB_PORT=5432"));
  console.log(chalk.gray("   DB_DATABASE=mydb"));
  console.log(chalk.gray("   DB_USER=user"));
  console.log(chalk.gray("   DB_PASSWORD=pass"));
  console.log(chalk.gray("   DB_MODE=read-only"));
  console.log(chalk.gray("   \n   Then run: npx sculptql\n"));

  console.log(chalk.cyan("💡 Permission Modes:"));
  console.log(
    chalk.gray(
      "   • read-only:  Only SELECT queries (prevents accidental data modification)"
    )
  );
  console.log(
    chalk.gray("   • read-write: SELECT, INSERT, and UPDATE (no DELETE/DROP)")
  );
  console.log(
    chalk.gray("   • full:       All operations allowed (default)\n")
  );

  console.log(chalk.cyan("Run 'npx sculptql --help' for more options"));
  process.exit(1);
}

async function main() {
  // Set mode as environment variable for API access
  process.env.DB_MODE = mode;

  console.log("Connecting with environment variables:", {
    dialect,
    host,
    port,
    database,
    user,
    password: password ? "******" : "",
    db_file,
    serverPort,
    mode,
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

  const modeDescriptions = {
    "read-only": "Read-only mode: Only SELECT queries allowed",
    "read-write": "Read-write mode: SELECT, INSERT, and UPDATE allowed",
    full: "Full mode: All operations allowed (including DELETE/DROP)",
  };
  const modeColor =
    mode === "read-only"
      ? chalk.green
      : mode === "read-write"
      ? chalk.yellow
      : chalk.red;
  console.log(modeColor(`🔒 ${modeDescriptions[mode]}`));

  // Check if standalone build exists - if it does, use production mode
  const standaloneDir = join(__dirname, "..", ".next", "standalone");
  const hasStandaloneBuild = existsSync(standaloneDir);

  // Use development mode only if no standalone build exists AND not in production env
  const dev = !hasStandaloneBuild && process.env.NODE_ENV !== "production";

  let server: Server | { close: () => void };

  if (dev) {
    const app = next({
      dev: true,
      dir: join(__dirname, ".."),
    });
    const handle = app.getRequestHandler();

    await app.prepare();
    const devServer: Server = createServer((req, res) => {
      handle(req, res);
    });

    devServer.listen(serverPort, () => {
      console.log(
        chalk.green(
          `> Server listening at http://localhost:${serverPort} as development`
        )
      );
    });

    server = devServer;
  } else {
    // Production mode - run the app using next start
    const app = next({
      dev: false,
      dir: join(__dirname, ".."),
    });
    const handle = app.getRequestHandler();

    await app.prepare();
    const prodServer: Server = createServer((req, res) => {
      handle(req, res);
    });

    prodServer.listen(serverPort, () => {
      console.log(
        chalk.green(
          `> Server listening at http://localhost:${serverPort} as production`
        )
      );
    });

    server = prodServer;
  }

  const webUrl = `http://localhost:${serverPort}/editor`;
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
    if (server && typeof server.close === "function") {
      server.close(() => {
        console.log(chalk.green(" Web server closed"));
      });
    } else {
      console.log(chalk.green(" Web server closed"));
    }
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
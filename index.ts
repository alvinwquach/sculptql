import { Command } from "commander";
import { Pool as PgPool } from "pg";
import mysql, { Pool as MySqlPool } from "mysql2/promise";
import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

type SupportedDialect = "postgres" | "mysql";

const program = new Command();

program
  .name("sculptql")
  .description(
    "Maintain a persistent connection to your SQL database.\n" +
      "Supported dialects: postgres | mysql (default: postgres)\n" +
      "You can set the default via DB_DIALECT in .env or pass --dialect in CLI."
  )
  .option(
    "--dialect <dialect>",
    "Database dialect: postgres | mysql",
    process.env.DB_DIALECT ?? "postgres"
  )
  .option("--host <host>", "Database host", process.env.DB_HOST)
  .option("--port <port>", "Database port", process.env.DB_PORT)
  .option(
    "--database <database>",
    "Database name",
    process.env.DB_NAME ?? "postgres"
  )
  .option("--user <user>", "Database user", process.env.DB_USER)
  .option(
    "--password <password>",
    "Database password",
    process.env.DB_PASSWORD
  );

program.parse(process.argv);

const options = program.opts();

async function main() {
  const requiredFields = [
    "dialect",
    "host",
    "port",
    "database",
    "user",
    "password",
  ] as const;

  for (const field of requiredFields) {
    if (!options[field]) {
      console.error(
        chalk.red(
          `❌ Error: Missing required option --${field} or environment variable DB_${field.toUpperCase()}`
        )
      );
      console.log(
        chalk.yellow(
          "Please provide credentials via CLI options or a .env file. See .env.template for guidance."
        )
      );
      process.exit(1);
    }
  }

  console.log("Connecting with options:", {
    dialect: options.dialect,
    host: options.host,
    port: Number(options.port),
    database: options.database,
    user: options.user,
    password: options.password ? "******" : "",
  });

  let pool: PgPool | MySqlPool;

  if (options.dialect === "postgres") {
    pool = new PgPool({
      host: options.host,
      port: Number(options.port),
      database: options.database,
      user: options.user,
      password: options.password,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      application_name: "sculptql-cli",
    });

    pool.on("error", (err) => {
      console.error(chalk.red("❌ PostgreSQL pool error:"), err.message || err);
    });
  } else if (options.dialect === "mysql") {
    pool = await mysql.createPool({
      host: options.host,
      port: Number(options.port),
      database: options.database,
      user: options.user,
      password: options.password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
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
      await pool.end();
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

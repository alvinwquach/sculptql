import { Command } from "commander";
import { Pool } from "pg";
import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

const program = new Command();

program
  .name("sculptql")
  .description(
    "Maintain a persistent connection to your Supabase PostgreSQL database"
  )
  .option("--host <host>", "Supabase host", process.env.DB_HOST)
  .option("--port <port>", "Database port", process.env.DB_PORT ?? "5432")
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
    host: options.host,
    port: Number(options.port),
    database: options.database,
    user: options.user,
    password: options.password ? "******" : "",
  });

  const pool = new Pool({
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
    if (err instanceof Error) {
      console.error(chalk.red("❌ Pool error:"), err.message);
    } else {
      console.error(chalk.red("❌ Pool error:"), err);
    }
  });

  console.log(
    chalk.green("✅ Connection pool is active. Press Ctrl+C to exit.")
  );

  process.on("SIGINT", async () => {
    console.log(
      chalk.green("\n✅ Received SIGINT. Closing connection pool...")
    );
    await pool.end();
    console.log(chalk.green("✅ Connection pool closed"));
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log(
      chalk.green("\n✅ Received SIGTERM. Closing connection pool...")
    );
    await pool.end();
    console.log(chalk.green("✅ Connection pool closed"));
    process.exit(0);
  });

  await new Promise(() => {});
}

main();

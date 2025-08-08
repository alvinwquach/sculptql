import { Command } from "commander";
import { Client } from "pg";
import chalk from "chalk";

const program = new Command();

program
  .name("sculptql")
  .description("Validate connection to your Supabase PostgreSQL database")
  .requiredOption("--host <host>", "Supabase host")
  .requiredOption("--port <port>", "Database port")
  .requiredOption("--database <database>", "Database name")
  .requiredOption("--user <user>", "Database user")
  .requiredOption("--password <password>", "Database password");

program.parse(process.argv);

const options = program.opts();

async function main() {
  console.log("Connecting with options:", {
    host: options.host,
    port: Number(options.port),
    database: options.database,
    user: options.user,
    password: options.password ? "******" : "",
  });

  const client = new Client({
    host: options.host,
    port: Number(options.port),
    database: options.database,
    user: options.user,
    password: options.password,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log(chalk.green("✅ Successfully connected to Supabase"));
    await client.end();
  } catch (err) {
    console.error(chalk.red("❌ Error:"), err);
    process.exit(1);
  }
}

main();

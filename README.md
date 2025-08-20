# sculptql

`sculptql` is a lightweight tool that **connects your SQL database to a local web interface**, enabling you to query, explore, and visualize your data just like PopSQL — but all locally.  

The CLI sets up a persistent database connection and launches a web app for interactive querying.

---

## Supported Database Dialects

`sculptql` supports connecting to:

- **Postgres**
- **MySQL**
- **SQLite**
- **Microsoft SQL Server (MSSQL)**
- **Oracle**

> ⚠️ **Important:** You must specify the dialect explicitly using `--dialect` or via the `DB_DIALECT` environment variable. There is **no default dialect**.

---

## Features

- Persistent connection pool to your database.
- Launch a **local web app** to query and explore your data.
- Supports connection via CLI arguments or environment variables.
- Secure handling of credentials.
- Graceful pool cleanup when exiting.

---

## Usage

1. **Start the CLI and connect your database:**

```bash
npx sculptql --dialect <DIALECT> --host <HOST> --port <PORT> --database <DB> --user <USER> --password <PASSWORD>

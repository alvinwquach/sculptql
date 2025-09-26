# sculptql

**sculptql** is a lightweight tool that **connects your SQL database to a local web interface**, enabling you to query, explore, and visualize your data.  

The CLI sets up a persistent database connection and launches a web app for interactive querying.

---

## 🚀 Features

- Persistent connection pool to your database.
- Launch a **local web app** to query and explore your data.
- Supports connection via CLI arguments or environment variables.
- Secure handling of credentials.
- Graceful pool cleanup when exiting.

---

## 🛠️ Supported Database Dialects

You must specify your database dialect explicitly using the `DB_DIALECT` environment variable.

- **Postgres**
- **MySQL**
- **SQLite**
- **Microsoft SQL Server (MSSQL)**
- **Oracle**

> ⚠️ There is **no default dialect** — you must specify it explicitly.

---

## ⚙️ Setup Instructions

1. Create a .env file in your project directory.

2. Add your database connection configuration.

3. Run the CLI command.

<details> <summary><strong>Postgres</strong></summary>
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000
</details> 

<details>   
<summary><strong>MySQL</strong></summary>

```bash
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000
```

**MySQL Setup Notes:**
- Ensure your MySQL server is running and accessible
- The user must have `SELECT`, `INSERT`, `UPDATE`, `DELETE` privileges on the database
- For schema introspection, the user needs access to `information_schema` tables
- Both local and remote MySQL servers are supported
- SSL connections are supported but not required for local development

**Quick MySQL Setup:**
```bash
# Copy the example configuration
cp env.mysql.example .env

# Edit with your MySQL credentials
nano .env

# Start the application
npm run dev
```

</details> 

<details> 
<summary><strong>SQLite</strong></summary>
DB_DIALECT=sqlite
DB_FILE=./mydb.sqlite
PORT=3000
</details> 

<details> 
<summary><strong>MSSQL</strong></summary>
DB_DIALECT=mssql
DB_HOST=localhost
DB_PORT=1433
DB_DATABASE=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000
</details> 

<details> 
<summary><strong>Oracle</strong></summary>
DB_DIALECT=oracle
DB_HOST=localhost
DB_PORT=1521
DB_DATABASE=ORCLCDB.localdomain
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000
</details> 

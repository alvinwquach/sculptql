# sculptql

**sculptql** is a lightweight tool that **connects your SQL database to a local web interface**, enabling you to query, explore, and visualize your data.  

The CLI sets up a persistent database connection and launches a web app for interactive querying.

---

## 🚀 Features

- Persistent connection pool to your database.
- Launch a **local web app** to query and explore your data.
- **Three permission modes** for safe query execution:
  - **Read-Only**: Only SELECT and read operations allowed
  - **Read-Write**: SELECT, INSERT, and UPDATE operations allowed
  - **Full Access**: All SQL operations allowed
- Supports connection via environment variables.
- Secure handling of credentials.
- Graceful pool cleanup when exiting.

---

## 🛠️ Supported Database Dialects

You must specify your database dialect explicitly using the `DB_DIALECT` environment variable.

- **Postgres** 
- **MySQL** 
- **Microsoft SQL Server (MSSQL)** 
- **SQLite** 
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
<summary><strong>Microsoft SQL Server (MSSQL)</strong></summary>

```bash
DB_DIALECT=mssql
DB_HOST=localhost
DB_PORT=1433
DB_DATABASE=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000
```

**SQL Server Setup Notes:**
- Ensure your SQL Server is running and accessible

</details> 

<details> 
<summary><strong>SQLite</strong></summary>

```bash
DB_DIALECT=sqlite
DB_FILE=./data/example.db
PORT=3000
```

**SQLite Setup Notes:**
- SQLite uses a file-based database, so no server setup is required
- You can use either `DB_FILE` or `DB_DATABASE` environment variable
- The database file will be created automatically if it doesn't exist
- Perfect for development, testing, and small applications

**Quick SQLite Setup:**
```bash
# Copy the example configuration
cp env.sqlite.example .env

# Create a sample database
mkdir -p data
sqlite3 data/example.db "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);"
sqlite3 data/example.db "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');"

# Start the application
npm run dev
```

</details> 

<details> 
<summary><strong>Oracle</strong></summary>

```bash
DB_DIALECT=oracle
DB_HOST=localhost
DB_PORT=1521
DB_DATABASE=your_database_name
DB_USER=your_oracle_user
DB_PASSWORD=your_oracle_password
PORT=3000
```

**Oracle Setup Notes:**
- Ensure your Oracle database is running and accessible
- The user must have SELECT, INSERT, UPDATE, DELETE privileges on the database
- For schema introspection, the user needs access to USER_TABLES, USER_TAB_COLUMNS, etc.
- Oracle Instant Client may be required for the oracledb driver
- The connectString format is: host:port/service_name or host:port:sid

**Quick Oracle Setup:**
```bash
# Copy the example configuration
cp env.oracle.example .env

# Edit with your Oracle credentials
nano .env

# Start the application
npm run dev
```

</details> 

---

## 🔒 Permission Modes

SculptQL offers three permission modes to control what SQL operations are allowed, providing an extra layer of safety when working with your database:

### Read-Only Mode
- **Allowed Operations**: SELECT, SHOW, DESCRIBE, EXPLAIN
- **Blocked Operations**: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, and other write operations
- **Use Case**: Perfect for exploring and analyzing data without risk of modifications
- **Environment Variables**:
  ```bash
  DB_MODE=read-only
  NEXT_PUBLIC_DB_MODE=read-only
  ```

### Read-Write Mode
- **Allowed Operations**: SELECT, INSERT, UPDATE, and read operations
- **Blocked Operations**: DELETE, DROP, ALTER, CREATE, TRUNCATE, and other destructive operations
- **Use Case**: Safe for data entry and updates while protecting against accidental data loss
- **Environment Variables**:
  ```bash
  DB_MODE=read-write
  NEXT_PUBLIC_DB_MODE=read-write
  ```

### Full Access Mode
- **Allowed Operations**: All SQL operations including DROP, DELETE, ALTER, CREATE, TRUNCATE
- **Blocked Operations**: None
- **Use Case**: For database administrators who need complete control
- **Environment Variables**:
  ```bash
  DB_MODE=full
  NEXT_PUBLIC_DB_MODE=full
  ```

> 💡 **Tip**: You can switch between permission modes directly in the web interface using the permission mode selector in the editor toolbar. The mode is validated both client-side and server-side for security.

> ⚠️ **Note**: Permission modes provide an additional safety layer but should not replace proper database user permissions and access controls.

---

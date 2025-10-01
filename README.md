# sculptql

**sculptql** is a lightweight tool that **connects your SQL database to a local web interface**, enabling you to query, explore, and visualize your data.  

The CLI sets up a persistent database connection and launches a web app for interactive querying.

---

## 🚀 Features

- Persistent connection pool to your database.
- Launch a **local web app** to query and explore your data.
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

## 🤖 Natural Language Queries (Optional)

SculptQL now supports **AI-powered natural language to SQL conversion** using local LLMs. This feature is completely optional and runs entirely on your machine for privacy and speed.

### Why Local AI?

- ✅ **Complete Privacy**: Your data and queries never leave your machine
- ✅ **No API Costs**: Free to use, no rate limits
- ✅ **Schema-Aware**: AI understands your database structure
- ✅ **Fast**: Local processing with no network latency

### One-Time Setup

#### 1. Install Ollama

**macOS / Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from [ollama.com](https://ollama.com)

#### 2. Pull the SQL Model

```bash
# Recommended: SQLCoder (7B - optimized for SQL)
ollama pull sqlcoder:7b

# Alternative models:
# ollama pull codellama:13b      # Better quality, slower
# ollama pull deepseek-coder-v2  # Excellent for complex queries
```

#### 3. Start SculptQL

```bash
npx sculptql
```

That's it! The natural language feature will be available in the editor.

### Usage

In the editor sidebar, you'll see a **"Natural Language to SQL"** input box at the top. Simply type what you want in plain English:

**Examples:**
- "Show me all users who signed up last month"
- "What are the top 10 products by sales?"
- "Find customers with more than 5 orders"
- "Get average order value by customer state"

The AI will:
1. Analyze your database schema
2. Generate valid SQL
3. Validate table/column names
4. Insert the query into your editor

### Configuration (Optional)

Add these to your `.env` file to customize:

```bash
# LLM Provider (default: ollama)
LLM_PROVIDER=ollama

# Model to use (default: sqlcoder:7b)
LLM_MODEL=sqlcoder:7b

# LLM host (default: http://localhost:11434)
LLM_HOST=http://localhost:11434
```

### Alternative Providers

<details>
<summary><strong>LM Studio</strong> (GUI-based alternative)</summary>

1. Download [LM Studio](https://lmstudio.ai/)
2. Download a SQL-capable model (e.g., Code Llama)
3. Start the local server (port 1234)
4. Set in `.env`:
   ```bash
   LLM_PROVIDER=lmstudio
   LLM_HOST=http://localhost:1234
   ```

</details>

<details>
<summary><strong>llamafile</strong> (Zero installation)</summary>

1. Download a llamafile from [Mozilla AI](https://github.com/Mozilla-Ocho/llamafile)
2. Run: `chmod +x ./llama-*.llamafile && ./llama-*.llamafile`
3. Set in `.env`:
   ```bash
   LLM_PROVIDER=llamafile
   LLM_HOST=http://localhost:8080
   ```

</details>

### Troubleshooting

**"Cannot connect to local LLM"**
- Ensure Ollama is running: `ollama serve`
- Check if the model is installed: `ollama list`
- Verify port 11434 is not blocked

**"Model not found"**
- Pull the model: `ollama pull sqlcoder:7b`

**Slow generation**
- Try a smaller model: `ollama pull codellama:7b`
- Ensure your machine has at least 8GB RAM

---

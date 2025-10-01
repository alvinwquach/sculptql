"use client";

import { useState } from "react";
import { Database, Plug, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Database display names
const DATABASE_DISPLAY_NAMES: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mssql: "SQL Server",
  sqlite: "SQLite",
  oracle: "Oracle",
};

// Get display name for database
function getDatabaseDisplayName(db: string): string {
  return DATABASE_DISPLAY_NAMES[db] || db.charAt(0).toUpperCase() + db.slice(1);
}

// Database configuration examples
const ENV_EXAMPLES = {
  postgres: `# PostgreSQL Configuration
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000`,

  mysql: `# MySQL Configuration
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000`,

  sqlite: `# SQLite Configuration
DB_DIALECT=sqlite
DB_FILE=./data/example.db
PORT=3000`,

  mssql: `# SQL Server Configuration
DB_DIALECT=mssql
DB_HOST=localhost
DB_PORT=1433
DB_DATABASE=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
PORT=3000`,

  oracle: `# Oracle Configuration
DB_DIALECT=oracle
DB_HOST=localhost
DB_PORT=1521
DB_DATABASE=your_database_name
DB_USER=your_oracle_user
DB_PASSWORD=your_oracle_password
PORT=3000`,
};

export default function NoDatabaseConnected() {
  // State for the selected database type
  const [selectedDb, setSelectedDb] =
    useState<keyof typeof ENV_EXAMPLES>("postgres");
  // State for the copied state
  const [copied, setCopied] = useState(false);
  // Function to copy the configuration to the clipboard
  const copyToClipboard = () => {
    // Copy the configuration to the clipboard
    navigator.clipboard.writeText(ENV_EXAMPLES[selectedDb]);
    // Set the copied state to true
    setCopied(true);
    // Set the copied state to false after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center h-full p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
        <CardHeader className="text-center pb-6">
          <div className="relative mb-4 inline-flex">
            <Database className="w-14 h-14 text-purple-400 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-1.5 shadow-[0_0_20px_rgba(244,114,182,0.5)]">
              <Plug className="w-3 h-3 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Connect Your Database
          </CardTitle>
          <CardDescription className="text-slate-300 text-sm leading-relaxed">
            Choose your database type and copy the configuration to your{" "}
            <Badge variant="secondary" className="bg-purple-500/20 text-cyan-300">
              .env
            </Badge>{" "}
            file
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              Select Database Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {Object.keys(ENV_EXAMPLES).map((db) => (
                <Button
                  key={db}
                  variant={selectedDb === db ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDb(db as keyof typeof ENV_EXAMPLES)}
                  className={`font-semibold transition-all duration-300 relative overflow-hidden premium-button ${
                    selectedDb === db
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-105 hover:from-purple-400 hover:to-pink-400"
                      : "bg-[#0f0f23]/50 border-purple-500/20 text-slate-400 hover:border-purple-400/40 hover:text-slate-300 hover:bg-[#0f0f23]/70 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)] hover:scale-105"
                  }`}
                >
                  {getDatabaseDisplayName(db)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Configuration
              </label>
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105 relative overflow-hidden premium-button"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="bg-[#0a0a0f] border border-purple-500/20 rounded-lg p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
              {ENV_EXAMPLES[selectedDb]}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#0f0f23]/50 rounded-lg border border-cyan-500/20">
              <Badge variant="secondary" className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                1
              </Badge>
              <p className="text-sm text-slate-300">
                Create a{" "}
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  .env
                </Badge>{" "}
                file in your project root
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#0f0f23]/50 rounded-lg border border-purple-500/20">
              <Badge variant="secondary" className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                2
              </Badge>
              <p className="text-sm text-slate-300">
                Paste the configuration above and update with your credentials
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#0f0f23]/50 rounded-lg border border-pink-500/20">
              <Badge variant="secondary" className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(244,114,182,0.4)]">
                3
              </Badge>
              <p className="text-sm text-slate-300">
                Restart your server:{" "}
                <Badge variant="outline" className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                  npm run dev
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

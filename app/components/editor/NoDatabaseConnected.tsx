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
    <div className="flex items-center justify-center min-h-full h-full p-8 overflow-y-auto bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e]">
      <Card className="max-w-4xl w-full bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 border border-purple-500/20 shadow-[0_0_60px_rgba(139,92,246,0.25)] backdrop-blur-sm">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="relative mb-6 inline-flex mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/30">
              <Database className="w-16 h-16 text-purple-400" />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-2 shadow-[0_0_25px_rgba(244,114,182,0.6)] animate-bounce">
                <Plug className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3">
            Connect Your Database
          </CardTitle>
          <CardDescription className="text-slate-300 text-base leading-relaxed max-w-xl mx-auto">
            Get started by connecting to your database. Choose your database type below and copy the configuration to your{" "}
            <Badge variant="secondary" className="bg-purple-500/20 text-cyan-300 border border-purple-500/30">
              .env
            </Badge>{" "}
            file
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pb-8">
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-4 block flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              Select Database Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.keys(ENV_EXAMPLES).map((db) => (
                <Button
                  key={db}
                  variant={selectedDb === db ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedDb(db as keyof typeof ENV_EXAMPLES)}
                  className={`font-semibold transition-all duration-300 relative overflow-hidden ${
                    selectedDb === db
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.7)] hover:scale-105"
                      : "bg-[#0f0f23]/60 border-purple-500/30 text-slate-300 hover:border-purple-400/50 hover:text-slate-200 hover:bg-[#0f0f23]/80 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-105"
                  }`}
                >
                  {getDatabaseDisplayName(db)}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f0f23]/80 to-[#0a0a0f]/80 rounded-xl p-6 border border-purple-500/20 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                Configuration
              </label>
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border border-purple-500/40 hover:border-purple-400/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-105"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Config
                  </>
                )}
              </Button>
            </div>
            <div className="bg-[#0a0a0f] border border-purple-500/30 rounded-lg p-5 font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
              {ENV_EXAMPLES[selectedDb]}
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              Quick Setup Guide
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-[#0f0f23]/60 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Badge variant="secondary" className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  1
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-slate-300 font-medium mb-1">Create environment file</p>
                  <p className="text-xs text-slate-400">
                    Create a{" "}
                    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                      .env
                    </Badge>{" "}
                    file in your project root directory
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-[#0f0f23]/60 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Badge variant="secondary" className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  2
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-slate-300 font-medium mb-1">Add your credentials</p>
                  <p className="text-xs text-slate-400">
                    Paste the configuration above and update with your database credentials
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-[#0f0f23]/60 rounded-xl border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(244,114,182,0.2)]">
                <Badge variant="secondary" className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(244,114,182,0.5)]">
                  3
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-slate-300 font-medium mb-1">Restart the server</p>
                  <p className="text-xs text-slate-400">
                    Run{" "}
                    <Badge variant="outline" className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">
                      npm run dev
                    </Badge>{" "}
                    to restart your development server
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

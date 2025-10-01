"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@apollo/client/react";
import { TableSchema, ApiTableSchema } from "@/app/types/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { GENERATE_SQL_FROM_NATURAL_LANGUAGE } from "@/app/graphql/mutations/generateSqlFromNaturalLanguage";
import { transformToApiSchema } from "@/app/utils/schemaCache";

// Type definitions for the GraphQL mutation response
interface GenerateSqlResponse {
  generateSqlFromNaturalLanguage: {
    sql: string;
  };
}

function validateInputWithSchema(input: string, tableNames: string[]): string | null {
  const words = input.toLowerCase().split(/\s+/);

  for (const word of words) {
    if (word.length >= 3 && tableNames.includes(word)) {
      return null; // Found a matching table name, validation passes
    }
  }


  if (words.length > 3 && !words.some(word => word.length > 2)) {
    return "Please mention at least one table name from your schema.";
  }

  return null;
}

interface NaturalLanguageInputProps {
  schema: TableSchema[];
  onSqlGenerated: (sql: string) => void;
  dialect?: string;
}

export default function NaturalLanguageInput({
  schema,
  onSqlGenerated,
  dialect = "postgres",
}: NaturalLanguageInputProps) {
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [generateSqlMutation, { loading, error: mutationError }] = useMutation<GenerateSqlResponse>(
    GENERATE_SQL_FROM_NATURAL_LANGUAGE,
    {
      onCompleted: (data: GenerateSqlResponse | undefined) => {
        if (data?.generateSqlFromNaturalLanguage?.sql) {
          const sql = data.generateSqlFromNaturalLanguage.sql;
          if (sql.startsWith("-- ERROR:")) {
            const errorMsg = sql.replace("-- ERROR:", "").trim();
            setServerError(errorMsg);
          } else {
            onSqlGenerated(sql);
            setServerError(null);
          }
        }
      },
      onError: (error: Error) => {
        console.error("GraphQL mutation error:", error);
        setServerError(error.message || "Failed to generate SQL");
      }
    }
  );

  const tableNames = useMemo(() => schema.map((t) => t.table_name), [schema]);

  useEffect(() => {
    // Clear server error whenever input changes
    setServerError(null);

    if (!input.trim()) {
      setValidationError(null);
      return;
    }

    const validationError = validateInputWithSchema(input, tableNames);
    setValidationError(validationError);
  }, [input, tableNames]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || validationError) return;

    setServerError(null);

    try {
      const processedSchema: ApiTableSchema[] = transformToApiSchema(schema);

      await generateSqlMutation({
        variables: {
          naturalLanguage: input,
          schema: processedSchema,
          dialect: dialect,
        },
      });
    } catch (err) {
      console.error("Failed to generate SQL:", err);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Show me all users"
            className="w-full bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e] border-2 text-white placeholder:text-slate-400 rounded-lg focus-visible:ring-2 transition-all duration-200 pr-10"
            style={{
              borderImage:
                "linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) 1",
              borderImageSlice: 1,
              boxShadow:
                "0 0 20px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-pulse pointer-events-none" />
        </div>
        <Button
          type="submit"
          disabled={loading || !!validationError}
          className="text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #f472b6)",
            boxShadow:
              "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(244, 114, 182, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(244, 114, 182, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(244, 114, 182, 0.2)";
          }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
        </Button>
      </form>

      {/* Validation Error Display (Real-time) */}
      {validationError && (
        <div
          className="flex items-start gap-3 p-3 rounded-lg border-2 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))",
            borderColor: "#fbbf24",
            boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)",
          }}
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-300 mb-1">
              Invalid Query
            </p>
            <p className="text-xs text-yellow-200 leading-relaxed">
              {validationError}
            </p>
          </div>
        </div>
      )}

      {/* Server Error Display */}
      {serverError && !validationError && (
        <div
          className="flex items-start gap-3 p-3 rounded-lg border-2 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))",
            borderColor: "#ef4444",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)",
          }}
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300 mb-1">
              Invalid Query
            </p>
            <p className="text-xs text-red-200 leading-relaxed">
              {serverError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@apollo/client/react";
import { TableSchema, ApiTableSchema } from "@/app/types/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { GENERATE_SQL_FROM_NATURAL_LANGUAGE } from "@/app/graphql/mutations/generateSqlFromNaturalLanguage";
import { transformToApiSchema } from "@/app/utils/schemaCache";

interface GenerateSqlResponse {
  generateSqlFromNaturalLanguage: {
    sql: string;
  };
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Find closest match for a word
function findClosestMatch(word: string, candidates: string[]): { match: string; distance: number } | null {
  let closestMatch: string | null = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(word.toLowerCase(), candidate.toLowerCase());
    if (distance < minDistance && distance > 0) {
      minDistance = distance;
      closestMatch = candidate;
    }
  }

  // Only suggest if distance is small (1-2 characters difference)
  if (closestMatch && minDistance <= 2) {
    return { match: closestMatch, distance: minDistance };
  }

  return null;
}

interface ValidationResult {
  error: string | null;
  suggestion?: string;
}

function validateInputWithSchema(
  input: string,
  schema: TableSchema[]
): ValidationResult {
  const words = input.toLowerCase().split(/\s+/).filter(w => w.length >= 3);

  const tableNames = schema.map(t => t.table_name.toLowerCase());
  const columnNames = schema.flatMap(t => t.columns.map(c => c.column_name.toLowerCase()));

  // Build column-to-values map for validation
  const columnToValues = new Map<string, string[]>();
  schema.forEach(table => {
    table.columns.forEach(col => {
      if (col.uniqueValues && col.uniqueValues.length > 0) {
        columnToValues.set(
          col.column_name.toLowerCase(),
          col.uniqueValues.map(v => String(v).toLowerCase())
        );
      }
    });
  });

  // Common SQL keywords and filler words to ignore
  const commonKeywords = [
    'show', 'all', 'get', 'list', 'where', 'from', 'select', 'and', 'or',
    'the', 'with', 'that', 'this', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'for', 'not', 'but', 'can', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'between', 'like', 'order',
    'group', 'limit', 'offset', 'join', 'left', 'right', 'inner', 'outer',
    'desc', 'asc', 'count', 'sum', 'avg', 'min', 'max'
  ];

  // Track matches
  let matchedTables = 0;
  let matchedColumns = 0;
  const matchedColumnNames: string[] = [];
  const unmatchedWords: string[] = [];

  // Check for exact matches first
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (commonKeywords.includes(word)) continue;

    if (tableNames.includes(word)) {
      matchedTables++;
    } else if (columnNames.includes(word)) {
      matchedColumns++;
      matchedColumnNames.push(word);
    } else {
      unmatchedWords.push(word);
    }
  }

  // Check if unmatched words might be invalid values for matched columns
  if (matchedColumns > 0 && unmatchedWords.length > 0) {
    for (const word of unmatchedWords) {
      // Check if this word appears after a matched column (likely a value)
      const wordIndex = words.indexOf(word);
      if (wordIndex > 0) {
        const prevWord = words[wordIndex - 1];
        const prevPrevWord = wordIndex > 1 ? words[wordIndex - 2] : null;

        // Check patterns like "column is value" or "column = value"
        if (prevWord === 'is' || prevWord === '=' || prevWord === 'equals') {
          const columnWord = prevPrevWord;
          if (columnWord && matchedColumnNames.includes(columnWord)) {
            const validValues = columnToValues.get(columnWord);
            if (validValues && validValues.length > 0 && !validValues.includes(word)) {
              const suggestions = validValues.slice(0, 5).join(', ');
              return {
                error: `Value "${word}" is not valid for column "${columnWord}".`,
                suggestion: `Valid values: ${suggestions}${validValues.length > 5 ? ` (+${validValues.length - 5} more)` : ''}`
              };
            }
          }
        }

        // Direct pattern: "column value" (without operator)
        if (matchedColumnNames.includes(prevWord)) {
          const validValues = columnToValues.get(prevWord);
          if (validValues && validValues.length > 0 && !validValues.includes(word)) {
            const suggestions = validValues.slice(0, 5).join(', ');
            return {
              error: `Value "${word}" is not valid for column "${prevWord}".`,
              suggestion: `Valid values: ${suggestions}${validValues.length > 5 ? ` (+${validValues.length - 5} more)` : ''}`
            };
          }
        }
      }
    }
  }

  // Valid if we have at least one table or column match
  if (matchedTables > 0 || matchedColumns > 0) {
    return { error: null };
  }

  // Check for typos in unmatched words
  for (const word of unmatchedWords) {
    // Check against table names
    const tableMatch = findClosestMatch(word, schema.map(t => t.table_name));
    if (tableMatch) {
      return {
        error: `Table "${word}" doesn't exist.`,
        suggestion: `Did you mean "${tableMatch.match}"?`
      };
    }

    // Check against column names
    const allColumns = schema.flatMap(t => t.columns.map(c => c.column_name));
    const columnMatch = findClosestMatch(word, allColumns);
    if (columnMatch) {
      const parentTable = schema.find(t =>
        t.columns.some(c => c.column_name.toLowerCase() === columnMatch.match.toLowerCase())
      );
      return {
        error: `Column "${word}" doesn't exist.`,
        suggestion: `Did you mean "${columnMatch.match}"${parentTable ? ` (in ${parentTable.table_name})` : ''}?`
      };
    }
  }

  // If we have no matches at all, show schema overview
  if (unmatchedWords.length > 0) {
    const schemaOverview = schema.slice(0, 3).map(table => {
      const cols = table.columns.slice(0, 4).map(c => c.column_name).join(", ");
      const moreCount = table.columns.length > 4 ? ` (+${table.columns.length - 4})` : '';
      return `${table.table_name}: ${cols}${moreCount}`;
    }).join('\n');

    return {
      error: "No matching table or column found.",
      suggestion: `Available:\n${schemaOverview}${schema.length > 3 ? `\n(+${schema.length - 3} more tables)` : ''}`
    };
  }

  return { error: null };
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
  const [validationResult, setValidationResult] = useState<ValidationResult>({ error: null });
  const [showValidation, setShowValidation] = useState(false);
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

  const performValidation = () => {
    if (!input.trim()) {
      setValidationResult({ error: null });
      setShowValidation(false);
      return;
    }
    const result = validateInputWithSchema(input, schema);
    setValidationResult(result);
    setShowValidation(true);
  };

  useEffect(() => {
    setServerError(null);
    setShowValidation(false);

    if (!input.trim()) {
      setValidationResult({ error: null });
      return;
    }

    const timer = setTimeout(() => {
      performValidation();
    }, 1500);

    return () => clearTimeout(timer);
  }, [input, schema]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setServerError(null);
    setShowValidation(false);

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
      <form onSubmit={handleSubmit} className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={performValidation}
          placeholder="Show me all users where role is admin"
          className="w-full bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e] border-2 text-white placeholder:text-slate-400 rounded-lg focus-visible:ring-2 transition-all duration-200 pr-12 text-sm py-2.5 shadow-[0_0_20px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
          style={{
            borderImage:
              "linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) 1",
            borderImageSlice: 1,
          }}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110"
          style={{
            background: loading || !input.trim() ? "rgba(139, 92, 246, 0.3)" : "linear-gradient(135deg, #8b5cf6, #f472b6)",
            boxShadow: loading || !input.trim() ? "none" : "0 0 15px rgba(139, 92, 246, 0.5)",
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </form>
      {showValidation && validationResult.error && (
        <div
          className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 animate-in fade-in slide-in-from-top-1 duration-200 backdrop-blur-sm border-[rgba(251,191,36,0.4)] shadow-[0_4px_12px_rgba(251,191,36,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
          style={{
            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))",
          }}
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-yellow-200 leading-relaxed mb-1">
              {validationResult.error}
            </p>
            {validationResult.suggestion && (
              <div className="mt-2 p-2 sm:p-2.5 rounded-md bg-black/20 border border-yellow-500/20">
                <pre className="text-xs text-yellow-100/90 leading-relaxed font-mono whitespace-pre-wrap break-words">
                  {validationResult.suggestion}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      {serverError && !showValidation && (
        <div
          className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-sm border-[rgba(239,68,68,0.5)] shadow-[0_4px_12px_rgba(239,68,68,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))",
          }}
        >
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-red-300 mb-1">
              Invalid Query
            </p>
            <p className="text-xs sm:text-sm text-red-200/90 leading-relaxed break-words">
              {serverError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

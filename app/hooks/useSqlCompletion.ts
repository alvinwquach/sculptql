"use client";

import { useCallback } from "react";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { Parser, Select } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";
import { getAllColumns } from "../utils/sqlCompletion/getAllColumns";
import { getValidTables } from "../utils/sqlCompletion/getValidTables";
import { suggestAsOrFromKeyword } from "../utils/sqlCompletion/suggestions/suggestAsOrFromKeyword";
import { suggestColumnsAfterSelect } from "../utils/sqlCompletion/suggestions/suggestColumnsAfterSelect";
import { suggestSelect } from "../utils/sqlCompletion/suggestions/suggestSelect";
import { suggestTablesAfterFrom } from "../utils/sqlCompletion/suggestions/suggestTablesAfterFrom";
import { suggestWhereClause } from "../utils/sqlCompletion/suggestions/suggestWhereClause";
import { suggestOrderByClause } from "../utils/sqlCompletion/suggestions/suggestOrderByClause";
import { suggestLimitClause } from "../utils/sqlCompletion/suggestions/suggestLimitClause";
import { suggestGroupByClause } from "../utils/sqlCompletion/suggestions/suggestGroupByClause";
import { suggestHavingClause } from "../utils/sqlCompletion/suggestions/suggestHavingClause";
import { suggestJoinClause } from "../utils/sqlCompletion/suggestions/suggestJoinClause";
import { suggestUnionClause } from "../utils/sqlCompletion/suggestions/suggestUnionClause";
import { suggestCaseClause } from "../utils/sqlCompletion/suggestions/suggestCaseClause";
import { suggestWithClause } from "../utils/sqlCompletion/suggestions/suggestWithClause";

/**
 *
 * Hook: useSqlCompletion
 * This custom React hook provides autocomplete logic for SQL using CodeMirror's API.
 * It integrates multiple context-aware suggestion strategies to guide users while writing SQL.
 */
export const useSqlCompletion = (
  tableNames: string[], // List of known table names
  tableColumns: TableColumn, // Mapping of table names to their columns
  stripQuotes: (s: string) => string, // Helper to strip quotes from identifiers
  needsQuotes: (id: string) => boolean // Helper to determine if a name needs quotes
) => {
  // === STEP 1: Prepare full list of available columns ===
  const allColumns = getAllColumns(tableNames, tableColumns);

  // Type guard to check if an AST node is a Select node
  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  /**
   * sqlCompletion: Main function used by CodeMirror to determine what suggestions to show
   */
  const sqlCompletion = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      // === STEP 2: Extract the current word and document context ===

      // Match the current word under the cursor (alphanumeric + dot + quotes + asterisk)
      const word = context.matchBefore(/["'\w.*]+/);
      const currentWord = word?.text || "";
      const pos = context.pos;

      // Get the full text from the beginning of the document up to the current position
      const docText = context.state.sliceDoc(0, context.pos);

      // === STEP 3: Create SQL parser instance inside the callback and try parsing the SQL into an AST (Abstract Syntax Tree) ===
      const parser = new Parser();

      let ast: Select | Select[] | null;
      try {
        const parsedAst = parser.astify(docText, { database: "postgresql" });
        if (Array.isArray(parsedAst)) {
          // Filter to only Select nodes
          const selectNodes = parsedAst.filter(isSelectNode);
          ast = selectNodes.length > 0 ? selectNodes : null;
        } else {
          ast = isSelectNode(parsedAst) ? parsedAst : null;
        }
      } catch {
        // If parsing fails (e.g., incomplete or invalid SQL), we continue without AST
        ast = null;
      }

      // === STEP 4: Call suggestion functions in priority order ===
      // Each function returns either a CompletionResult or null.
      // The first non-null result is returned to CodeMirror.

      return (
        suggestSelect(docText, currentWord, pos, word, ast) ||
        suggestWithClause(
          docText,
          currentWord,
          pos,
          word,
          ast,
          tableNames,
          tableColumns,
          stripQuotes,
          needsQuotes
        ) ||
        suggestColumnsAfterSelect(
          docText,
          currentWord,
          pos,
          word,
          allColumns,
          needsQuotes,
          ast
        ) ||
        suggestCaseClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestAsOrFromKeyword(docText, pos, word, ast) ||
        suggestTablesAfterFrom(
          docText,
          currentWord,
          pos,
          word,
          (selectedColumn) =>
            getValidTables(tableNames, tableColumns, selectedColumn),
          stripQuotes,
          needsQuotes,
          tableColumns,
          ast
        ) ||
        suggestJoinClause(
          docText,
          currentWord,
          pos,
          word,
          tableNames,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestWhereClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestGroupByClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestHavingClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestOrderByClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast
        ) ||
        suggestLimitClause(docText, pos, word, tableNames) ||
        suggestUnionClause(docText, currentWord, pos, word, ast)
      );
    },

    // === STEP 5: Dependencies for useCallback ===
    // Ensures the completion function updates when any inputs change
    [allColumns, tableNames, tableColumns, stripQuotes, needsQuotes]
  );

  // === STEP 6: Return the completion function to be used by the editor ===
  return sqlCompletion;
};

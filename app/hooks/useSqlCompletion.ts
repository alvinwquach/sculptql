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
import { suggestSemicolonCompletion } from "../utils/sqlCompletion/suggestions/suggestSemicolonCompletion";
import { suggestTablesAfterFrom } from "../utils/sqlCompletion/suggestions/suggestTablesAfterFrom";

/**
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

  // Create SQL parser instance
  const parser = new Parser();

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

      // === STEP 3: Try parsing the SQL into an AST (Abstract Syntax Tree) ===

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
      } catch (e) {
        // If parsing fails (e.g., incomplete or invalid SQL), we continue without AST
        ast = null;
      }

      // === STEP 4: Call suggestion functions in priority order ===
      // Each function returns either a CompletionResult or null.
      // The first non-null result is returned to CodeMirror.

      return (
        suggestSelect(docText, currentWord, pos, word, ast) ||
        suggestColumnsAfterSelect(
          docText,
          currentWord,
          pos,
          word,
          allColumns,
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
          ast
        ) ||
        suggestSemicolonCompletion(pos, tableColumns, stripQuotes, ast)
      );
    },

    // === STEP 5: Dependencies for useCallback ===
    // Ensures the completion function updates when any inputs change
    [allColumns, tableNames, tableColumns, stripQuotes, needsQuotes]
  );

  // === STEP 6: Return the completion function to be used by the editor ===
  return sqlCompletion;
};
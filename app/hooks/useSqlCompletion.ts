"use client";

import { useCallback } from "react";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { TableColumn } from "../types/query";
import { needsQuotes } from "../utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "../utils/sqlCompletion/stripQuotes";
import { getAllColumns } from "../utils/sqlCompletion/getAllColumns";
import { getValidTables } from "../utils/sqlCompletion/getValidTables";
import { suggestColumnsAfterSelect } from "../utils/sqlCompletion/suggestions/suggestColumnsAfterSelect";
import { suggestFromKeyword } from "../utils/sqlCompletion/suggestions/suggestFromKeyword";
import { suggestSelect } from "../utils/sqlCompletion/suggestions/suggestSelect";
import { suggestSemicolonCompletion } from "../utils/sqlCompletion/suggestions/suggestSemicolonCompletion";
import { suggestTablesAfterFrom } from "../utils/sqlCompletion/suggestions/suggestTablesAfterFrom";

export const useSqlCompletion = (
  tableNames: string[],
  tableColumns: TableColumn
) => {
  const allColumnsGetter = useCallback(
    () => getAllColumns(tableNames, tableColumns),
    [tableNames, tableColumns]
  );

  const validTablesGetter = useCallback(
    (selectedColumn: string | null) =>
      getValidTables(tableNames, tableColumns, selectedColumn),
    [tableNames, tableColumns]
  );

  return useCallback(
    (context: CompletionContext): CompletionResult | null => {
      const { state, pos } = context;
      const word = context.matchBefore(/["\w.]*/);
      const docText = state.doc.toString().substring(0, pos).trim();
      const currentWord = word ? word.text.toLowerCase() : "";

      // Suggest SELECT
      const selectSuggestion = suggestSelect(docText, currentWord, pos, word);
      if (selectSuggestion) return selectSuggestion;

      // After SELECT → suggest * and columns
      const columnsSuggestion = suggestColumnsAfterSelect(
        docText,
        currentWord,
        pos,
        word,
        allColumnsGetter(),
        needsQuotes
      );
      if (columnsSuggestion) return columnsSuggestion;

      // Suggest FROM keyword
      const fromKeywordSuggestion = suggestFromKeyword(docText, pos);
      if (fromKeywordSuggestion) return fromKeywordSuggestion;

      // Suggest tables after FROM
      const tableSuggestion = suggestTablesAfterFrom(
        docText,
        currentWord,
        pos,
        word,
        validTablesGetter,
        stripQuotes,
        needsQuotes
      );
      if (tableSuggestion) return tableSuggestion;

      // Suggest semicolon to complete query
      const semicolonSuggestion = suggestSemicolonCompletion(
        docText,
        pos,
        tableColumns,
        stripQuotes
      );
      if (semicolonSuggestion) return semicolonSuggestion;

      return null;
    },
    [tableNames, tableColumns, allColumnsGetter, validTablesGetter]
  );
};

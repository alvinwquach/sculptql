"use client";

import { useCallback } from "react";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

export const useSqlCompletion = (tableNames: string[]) => {
  return useCallback(
    (context: CompletionContext): CompletionResult | null => {
      const { state, pos } = context;
      const word = context.matchBefore(/\w*/);
      const docText = state.doc.toString().substring(0, pos).trim();
      const currentWord = word ? word.text.toLowerCase() : "";

      // Handle autocompletion for SELECT keyword
      if (
        (!docText || /^s(el(ect)?)?$/i.test(currentWord)) &&
        !/^\s*select\b/i.test(docText)
      ) {
        return {
          from: word ? word.from : pos,
          options: [
            {
              label: "SELECT",
              type: "keyword",
              apply: "SELECT ",
              detail: "Select data from a table",
            },
          ],
        };
      }

      // Handle autocompletion for * after SELECT
      if (/^select\s*$/i.test(docText)) {
        return {
          from: pos,
          options: [
            {
              label: "*",
              type: "field",
              apply: "* ",
              detail: "All columns",
            },
          ],
        };
      }

      // Handle autocompletion for FROM after SELECT *
      if (/^select\s+\*\s*$/i.test(docText) && !/\bfrom\b/i.test(docText)) {
        return {
          from: pos,
          options: [
            {
              label: "FROM",
              type: "keyword",
              apply: "FROM ",
              detail: "Specify table",
            },
          ],
        };
      }

      // Handle autocompletion for table names after SELECT * FROM
      if (/^select\s+\*\s+from\s*(\w*)$/i.test(docText)) {
        const filteredTables = tableNames.filter((tableName) =>
          currentWord ? tableName.toLowerCase().startsWith(currentWord) : true
        );

        if (filteredTables.length > 0) {
          return {
            from: word ? word.from : pos,
            options: filteredTables.map((tableName) => ({
              label: tableName,
              type: "table",
              apply: tableName + ";",
              detail: "Table name",
            })),
            filter: true,
            validFor: /^\w*$/,
          };
        }
      }

      return null;
    },
    [tableNames]
  );
};

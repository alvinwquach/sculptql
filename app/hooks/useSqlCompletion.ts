"use client";

import { useCallback, useMemo, useRef } from "react";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { Parser, Select } from "node-sql-parser";
import { SelectOption, TableColumn } from "@/app/types/query";
import { getAllColumns } from "@/app/utils/sqlCompletion/getAllColumns";
import { getValidTables } from "@/app/utils/sqlCompletion/getValidTables";
import { suggestAsOrFromKeyword } from "@/app/utils/sqlCompletion/suggestions/suggestAsOrFromKeyword";
import { suggestColumnsAfterSelect } from "@/app/utils/sqlCompletion/suggestions/suggestColumnsAfterSelect";
import { suggestSelect } from "@/app/utils/sqlCompletion/suggestions/suggestSelect";
import { suggestTablesAfterFrom } from "@/app/utils/sqlCompletion/suggestions/suggestTablesAfterFrom";
import { suggestWhereClause } from "@/app/utils/sqlCompletion/suggestions/suggestWhereClause";
import { suggestOrderByClause } from "@/app/utils/sqlCompletion/suggestions/suggestOrderByClause";
import { suggestGroupByClause } from "@/app/utils/sqlCompletion/suggestions/suggestGroupByClause";
import { suggestHavingClause } from "@/app/utils/sqlCompletion/suggestions/suggestHavingClause";
import { suggestJoinClause } from "@/app/utils/sqlCompletion/suggestions/suggestJoinClause";
import { suggestUnionClause } from "@/app/utils/sqlCompletion/suggestions/suggestUnionClause";
import { suggestCaseClause } from "@/app/utils/sqlCompletion/suggestions/suggestCaseClause";
import { suggestWithClause } from "@/app/utils/sqlCompletion/suggestions/suggestWithClause";
import { SQLAutoCompletion } from "@/app/utils/sqlCompletion/autoCompletion";
import { MultiValue, SingleValue } from "react-select";

export interface SqlCompletionCallbacks {
  onTableSelect?: (value: SelectOption | null) => void;
  onWhereColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void;
  onLogicalOperatorSelect?: (value: SingleValue<SelectOption>) => void;
  onOrderBySelect?: (
    column: SingleValue<SelectOption>,
    direction: SingleValue<SelectOption> | null,
    limit?: SingleValue<SelectOption>
  ) => void;
  onColumnSelect?: (value: MultiValue<SelectOption>) => void;
  onDistinctSelect?: (value: boolean) => void;
  onGroupByColumnSelect?: (value: MultiValue<SelectOption>) => void;
  onAggregateColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onHavingOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onHavingValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void;
}

export const useSqlCompletion = (
  tableNames: string[],
  tableColumns: TableColumn,
  selectedColumns: SelectOption[],
  uniqueValues: Record<string, SelectOption[]>,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  callbacks: SqlCompletionCallbacks
) => {
  // Set the all columns to the all columns
  const allColumns = useMemo(
    () => getAllColumns(tableNames, tableColumns),
    [tableNames, tableColumns]
  );
  // Set the parser to the parser
  const parser = useMemo(() => new Parser(), []);
  // Set the callbacks ref to the callbacks ref
  const callbacksRef = useRef(callbacks);
  // Set the callbacks ref to the callbacks
  callbacksRef.current = callbacks;
  // Check if the node is a select node
  const isSelectNode = (node: unknown): node is Select =>
    // - The node is an object
    !!node &&
    typeof node === "object" &&
    // - The node has a type property
    "type" in node &&
    // - The type property is "select"
    (node as { type: unknown }).type === "select";
// Set the enhanced completion to the enhanced completion
  const enhancedCompletion = useMemo(
    () =>
      new SQLAutoCompletion(
        tableNames,
        tableColumns,
        stripQuotes,
        needsQuotes,
        uniqueValues
      ),
    [tableNames, tableColumns, uniqueValues]
  );

  // Set the sql completion to the sql completion
  const sqlCompletion = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      // Set the char after to the char after
      const charAfter = context.state.sliceDoc(context.pos, context.pos + 1);
      // If the char after is a word, return null
      if (/\w/.test(charAfter)) {
        return null;
      }
      // Set the word to the word
      const word = context.matchBefore(/["'\w.*]+/);
      // Set the current word to the current word
      const currentWord = word?.text || "";
      // Set the pos to the pos
      const pos = context.pos;
      // Set the doc text to the doc text
      const docText = context.state.sliceDoc(0, context.pos);

      try {
        // Set the enhanced result to the enhanced result
        const enhancedResult = enhancedCompletion.getCompletion(
          docText,
          currentWord,
          pos,
          word
        );
        // If the enhanced result is true, 
        // return the enhanced result
        if (enhancedResult) {
          return enhancedResult;
        }
      } catch (error) {
        console.warn(
          "Enhanced completion failed, falling back to legacy completion:",
          error
        );
      }
      // Set the ast to the ast
      let ast: Select | Select[] | null;
      // Try to parse the ast
      try {
        // If the doc text is less than 5, set the ast to null
        if (docText.trim().length < 5) {
          ast = null; 
        } else {
          const dialect =
            (typeof window !== "undefined" &&
              (window as { DB_DIALECT?: string }).DB_DIALECT) ||
            "postgresql";
          const parsedAst = parser.astify(docText, { database: dialect });
          if (Array.isArray(parsedAst)) {
            const selectNodes = parsedAst.filter(isSelectNode);
            ast = selectNodes.length > 0 ? selectNodes : null;
          } else {
            ast = isSelectNode(parsedAst) ? parsedAst : null;
          }
        }
      } catch {
        ast = null;
      }

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
          needsQuotes,
          uniqueValues,
          callbacksRef.current.onWhereColumnSelect,
          callbacksRef.current.onOperatorSelect,
          callbacksRef.current.onValueSelect,
          callbacksRef.current.onLogicalOperatorSelect
        ) ||
        suggestColumnsAfterSelect(
          docText,
          currentWord,
          pos,
          word,
          allColumns,
          selectedColumns,
          needsQuotes,
          ast,
          callbacksRef.current.onColumnSelect,
          callbacksRef.current.onDistinctSelect
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
          ast,
          callbacksRef.current.onTableSelect,
          tableNames
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
          uniqueValues,
          stripQuotes,
          needsQuotes,
          ast,
          callbacksRef.current.onWhereColumnSelect,
          callbacksRef.current.onOperatorSelect,
          callbacksRef.current.onValueSelect,
          callbacksRef.current.onLogicalOperatorSelect
        ) ||
        suggestOrderByClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast,
          callbacksRef.current.onOrderBySelect
        ) ||
        suggestGroupByClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast,
          callbacksRef.current.onGroupByColumnSelect
        ) ||
        suggestHavingClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast,
          callbacksRef.current.onAggregateColumnSelect,
          callbacksRef.current.onHavingOperatorSelect,
          callbacksRef.current.onHavingValueSelect
        ) ||
        suggestUnionClause(docText, currentWord, pos, word, ast)
      );
    },
    [
      allColumns,
      enhancedCompletion,
      parser,
      tableNames,
      tableColumns,
      selectedColumns,
      uniqueValues,
      stripQuotes,
      needsQuotes,
    ]
  );
  return sqlCompletion;
};
"use client";

import { useCallback } from "react";
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
import { MultiValue, SingleValue } from "react-select";

export const useSqlCompletion = (
  tableNames: string[],
  tableColumns: TableColumn,
  selectedColumns: SelectOption[],
  uniqueValues: Record<string, SelectOption[]>,
  stripQuotes: (s: string) => string,
  needsQuotes: (id: string) => boolean,
  onTableSelect?: (value: SelectOption | null) => void,
  onWhereColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void,
  onLogicalOperatorSelect?: (value: SingleValue<SelectOption>) => void,
  onOrderBySelect?: (
    column: SingleValue<SelectOption>,
    direction: SingleValue<SelectOption> | null,
    limit?: SingleValue<SelectOption>
  ) => void,
  onColumnSelect?: (value: MultiValue<SelectOption>) => void
) => {
  const allColumns = getAllColumns(tableNames, tableColumns);

  const isSelectNode = (node: unknown): node is Select =>
    !!node &&
    typeof node === "object" &&
    "type" in node &&
    (node as { type: unknown }).type === "select";

  const sqlCompletion = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      const word = context.matchBefore(/["'\w.*]+/);
      const currentWord = word?.text || "";
      const pos = context.pos;
      const docText = context.state.sliceDoc(0, context.pos);

      const parser = new Parser();
      let ast: Select | Select[] | null;
      try {
        const parsedAst = parser.astify(docText, { database: "postgresql" });
        if (Array.isArray(parsedAst)) {
          const selectNodes = parsedAst.filter(isSelectNode);
          ast = selectNodes.length > 0 ? selectNodes : null;
        } else {
          ast = isSelectNode(parsedAst) ? parsedAst : null;
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
          onWhereColumnSelect,
          onOperatorSelect,
          onValueSelect,
          onLogicalOperatorSelect
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
          onColumnSelect
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
          onTableSelect
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
          onWhereColumnSelect,
          onOperatorSelect,
          onValueSelect,
          onLogicalOperatorSelect
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
          ast,
          onOrderBySelect
        ) ||
        suggestUnionClause(docText, currentWord, pos, word, ast)
      );
    },
    [
      allColumns,
      tableNames,
      tableColumns,
      selectedColumns,
      uniqueValues,
      stripQuotes,
      needsQuotes,
      onTableSelect,
      onWhereColumnSelect,
      onOperatorSelect,
      onValueSelect,
      onLogicalOperatorSelect,
      onOrderBySelect,
    ]
  );

  return sqlCompletion;
};
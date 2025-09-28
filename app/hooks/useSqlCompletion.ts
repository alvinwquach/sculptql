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
import { EnhancedSQLCompletion } from "@/app/utils/sqlCompletion/enhancedCompletion";
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
  onColumnSelect?: (value: MultiValue<SelectOption>) => void,
  onDistinctSelect?: (value: boolean) => void,
  onGroupByColumnSelect?: (value: MultiValue<SelectOption>) => void,
  onAggregateColumnSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onHavingOperatorSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void,
  onHavingValueSelect?: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void
) => {
  // Get all columns from the table names and table columns
  const allColumns = getAllColumns(tableNames, tableColumns);
  // Check if the node is a select node
  const isSelectNode = (node: unknown): node is Select =>
    // - The node is an object
  !!node &&
  typeof node === "object" &&
  // - The node has a type property
    "type" in node &&
    // - The type property is "select"
    (node as { type: unknown }).type === "select";
  // Create enhanced completion instance
  const enhancedCompletion = new EnhancedSQLCompletion(
    tableNames,
    tableColumns,
    stripQuotes,
    needsQuotes
  );

  // Create the sql completion
  const sqlCompletion = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      // Get the word from the context
      const word = context.matchBefore(/["'\w.*]+/);
      // Get the current word from the word
      const currentWord = word?.text || "";
      // Get the position from the context
      const pos = context.pos;
      // Get the document text from the context
      const docText = context.state.sliceDoc(0, context.pos);

      // Debug: log completion attempts (remove in production)
      // console.log('SQL completion called:', { currentWord, pos, docText, tableNames: tableNames.length });

      // Try enhanced completion first
      try {
        const enhancedResult = enhancedCompletion.getCompletion(docText, currentWord, pos, word);
        if (enhancedResult) {
          // console.log('Enhanced completion returned result:', enhancedResult.options.length, 'options');
          return enhancedResult;
        } else {
          // console.log('Enhanced completion returned null');
        }
      } catch (error) {
        console.warn('Enhanced completion failed, falling back to legacy completion:', error);
      }

      // Fallback to legacy completion system
      // Create the parser
      const parser = new Parser();
      // Create the ast
      let ast: Select | Select[] | null;
      try {
        // Try to detect database dialect from environment or default to postgresql
        const dialect = (typeof window !== 'undefined' && (window as { DB_DIALECT?: string }).DB_DIALECT) || "postgresql";
        // Parse the ast
        const parsedAst = parser.astify(docText, { database: dialect });
        // Check if the parsed ast is an array
        if (Array.isArray(parsedAst)) {
          // Get the select nodes from the parsed ast
          const selectNodes = parsedAst.filter(isSelectNode);
          // Set the ast to the select nodes
          ast = selectNodes.length > 0 ? selectNodes : null;
        } else {
          // Set the ast to the parsed ast
          ast = isSelectNode(parsedAst) ? parsedAst : null;
        }
      } catch {
        // Set the ast to null
        ast = null;
      }
      
      return (
        // Suggest the select clause
        suggestSelect(docText, currentWord, pos, word, ast) ||
        // Suggest the with clause
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
        // Suggest the columns after select
        suggestColumnsAfterSelect(
          docText,
          currentWord,
          pos,
          word,
          allColumns,
          selectedColumns,
          needsQuotes,
          ast,
          onColumnSelect,
          onDistinctSelect
        ) ||
        // Suggest the case clause
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
        // Suggest the as or from keyword
        suggestAsOrFromKeyword(docText, pos, word, ast) ||
        // Suggest the tables after from
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
        // Suggest the join clause
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
        // Suggest the where clause
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
        // Suggest the order by clause
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
        // Suggest the group by clause
        suggestGroupByClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast,
          onGroupByColumnSelect
        ) ||
        // Suggest the having clause
        suggestHavingClause(
          docText,
          currentWord,
          pos,
          word,
          tableColumns,
          stripQuotes,
          needsQuotes,
          ast,
          onAggregateColumnSelect,
          onHavingOperatorSelect,
          onHavingValueSelect
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
      onGroupByColumnSelect,
      onAggregateColumnSelect,
      onColumnSelect,
      onDistinctSelect,
      onHavingOperatorSelect,
      onHavingValueSelect,
    ]
  );

  // Return the sql completion
  return sqlCompletion;
};
import { CompletionResult } from "@codemirror/autocomplete";
import { TableColumn } from "@/app/types/query";
import { getCompletionContext } from "./contextDetector";
import {
  getSelectCompletion,
  getFromCompletion,
  getNeedFromCompletion,
  getAfterFromCompletion,
  getWhereCompletion,
  getJoinCompletion,
  getUnionCompletion,
  getWithCompletion,
  getGroupByCompletion,
  getOrderByCompletion,
  getHavingCompletion,
  getLimitCompletion,
  getKeywordCompletion,
  type CompletionContext,
  type CompletionHandler,
} from "./handlers";

export class SQLAutoCompletion {
  private context: CompletionContext;
  constructor(
    tableNames: string[],
    tableColumns: TableColumn,
    stripQuotes: (s: string) => string,
    needsQuotes: (id: string) => boolean,
    uniqueValues: Record<string, { value: string; label: string }[]> = {}
  ) {
    this.context = {
      tableNames,
      tableColumns,
      stripQuotes,
      needsQuotes,
      uniqueValues,
    };
  }

  private completionHandlers: Record<string, CompletionHandler> = {
    select: getSelectCompletion,
    need_from: getNeedFromCompletion,
    from: getFromCompletion,
    after_from: getAfterFromCompletion,
    where: getWhereCompletion,
    join: getJoinCompletion,
    union: getUnionCompletion,
    with: getWithCompletion,
    group_by: getGroupByCompletion,
    order_by: getOrderByCompletion,
    having: getHavingCompletion,
    limit: getLimitCompletion,
  };

  getCompletion(
    docText: string,
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    try {
      const textBeforeCursor = docText.slice(0, pos).trim();

      const contextType = getCompletionContext(textBeforeCursor);

      const handler = this.completionHandlers[contextType.type] || getKeywordCompletion;

      return handler(currentWord, pos, word, textBeforeCursor, this.context);
    } catch (error) {
      console.warn(
        "Enhanced completion failed, falling back to basic completion:",
        error
      );
      return getKeywordCompletion(currentWord, pos, word, "", this.context);
    }
  }
}

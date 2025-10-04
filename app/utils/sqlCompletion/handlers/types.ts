import { CompletionResult } from "@codemirror/autocomplete";
import { TableColumn } from "@/app/types/query";

export interface CompletionContext {
  tableNames: string[];
  tableColumns: TableColumn;
  stripQuotes: (s: string) => string;
  needsQuotes: (id: string) => boolean;
  uniqueValues: Record<string, { value: string; label: string }[]>;
}

export type CompletionHandler = (
  currentWord: string,
  pos: number,
  word: { from: number } | null,
  textBeforeCursor: string,
  context: CompletionContext
) => CompletionResult | null;

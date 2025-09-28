import { QueryResult } from "@/app/types/query";

// Declare the global window object
declare global {
  interface Window {
    QueryResults?: {
      data: Record<string, unknown>[];
      fields: string[];
      rowCount?: number;
      filter: (predicate: (row: Record<string, unknown>) => boolean) => Record<string, unknown>[];
      map: (mapper: (row: Record<string, unknown>) => any) => any[];
      find: (predicate: (row: Record<string, unknown>) => boolean) => Record<string, unknown> | undefined;
      getColumnValues: (columnName: string) => unknown[];
      getUniqueValues: (columnName: string) => unknown[];
      count: () => number;
      fullResult: QueryResult;
    };
    logQueryResultAsJson?: () => string | undefined;
  }
}

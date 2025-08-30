import { QueryResult } from "@/app/types/query";

declare global {
  interface Window {
    QueryResults?: QueryResult;
    logQueryResultAsJson?: () => string | undefined;
  }
}

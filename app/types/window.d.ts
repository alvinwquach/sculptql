import { QueryResult } from "@/app/types/query";

// Declare the global window object
declare global {
  interface Window {
    QueryResults?: QueryResult;
    logQueryResultAsJson?: () => string | undefined;
  }
}

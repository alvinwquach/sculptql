import {
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
} from "@/app/types/query";
import {
  getQueryData as getQueryDataAction,
  saveQueryData as saveQueryDataAction,
  clearQueryData as clearQueryDataAction,
  QueryData as ServerQueryData,
} from "@/app/actions/queries";

export interface QueryData {
  queryHistory?: QueryHistoryItem[];
  pinnedQueries?: PinnedQuery[];
  bookmarkedQueries?: BookmarkedQuery[];
  labeledQueries?: LabeledQuery[];
  showQueryHistory?: boolean;
}

// Function to get the query data
export async function getQueryData(): Promise<QueryData> {
  try {
    return await getQueryDataAction();
  } catch (error) {
    console.error("Error fetching query data:", error);
    return {
      queryHistory: [],
      pinnedQueries: [],
      bookmarkedQueries: [],
      labeledQueries: [],
      showQueryHistory: false,
    };
  }
}

// Function to set the query data
export async function setQueryData(data: QueryData): Promise<void> {
  try {
    await saveQueryDataAction(data as ServerQueryData);
  } catch (error) {
    console.error("Error saving query data:", error);
  }
}

// Function to clear the query data
export async function clearQueryData(): Promise<void> {
  try {
    await clearQueryDataAction();
  } catch (error) {
    console.error("Error clearing query data:", error);
  }
}

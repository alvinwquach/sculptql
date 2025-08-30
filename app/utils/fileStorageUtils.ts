import {
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
} from "@/app/types/query";

interface QueryData {
  queryHistory?: QueryHistoryItem[];
  pinnedQueries?: PinnedQuery[];
  bookmarkedQueries?: BookmarkedQuery[];
  labeledQueries?: LabeledQuery[];
  showQueryHistory?: boolean;
}

export async function getQueryData(): Promise<QueryData> {
  try {
    const response = await fetch("/api/queries");
    if (!response.ok) {
      throw new Error("Failed to fetch query data");
    }
    return await response.json();
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

export async function setQueryData(data: QueryData): Promise<void> {
  try {
    const response = await fetch("/api/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to save query data");
    }
  } catch (error) {
    console.error("Error saving query data:", error);
  }
}

export async function clearQueryData(): Promise<void> {
  try {
    const response = await fetch("/api/queries", {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to clear query data");
    }
  } catch (error) {
    console.error("Error clearing query data:", error);
  }
}

import {
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
} from "@/app/types/query";

// Interface for the query data
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
    // Fetch the query data
    const response = await fetch("/api/queries");
    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error("Failed to fetch query data");
    }
    // Return the query data
    return await response.json();
  } catch (error) {
    // Log the error
    console.error("Error fetching query data:", error);
    // Return the default query data
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
    // Fetch the query data
    const response = await fetch("/api/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error("Failed to save query data");
    }
  } catch (error) {
    // Log the error
    console.error("Error saving query data:", error);
  }
}

// Function to clear the query data
export async function clearQueryData(): Promise<void> {
  try {
    // Fetch the query data
    const response = await fetch("/api/queries", { method: "DELETE" });
    // If the response is not ok, throw an error
    if (!response.ok) {
      throw new Error("Failed to clear query data");
    }
  } catch (error) {
    // Log the error
    console.error("Error clearing query data:", error);
  }
}

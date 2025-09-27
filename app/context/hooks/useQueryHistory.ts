"use client";

import { useState, useCallback, useEffect } from "react";
import { QueryHistoryItem, PinnedQuery, BookmarkedQuery, LabeledQuery } from "@/app/types/query";
import { v4 as uuidv4 } from "uuid";
import { getLocalStorageItem, setLocalStorageItem } from "@/app/utils/localStorageUtils";

export interface QueryHistoryState {
  queryHistory: QueryHistoryItem[];
  pinnedQueries: PinnedQuery[];
  bookmarkedQueries: BookmarkedQuery[];
  labeledQueries: LabeledQuery[];
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  loadQueryFromHistory: (query: string) => void;
  runQueryFromHistory: (query: string) => void;
  addPinnedQuery: (query: string) => void;
  removePinnedQuery: (id: string) => void;
  addBookmarkedQuery: (query: string) => void;
  removeBookmarkedQuery: (id: string) => void;
  addLabeledQuery: (query: string, label: string) => void;
  removeLabeledQuery: (id: string) => void;
  editLabeledQuery: (id: string, label: string) => void;
}

export interface QueryHistoryDependencies {
  setQuery: (query: string) => void;
  runQuery: (query: string) => Promise<void>;
}

export function useQueryHistory(dependencies?: QueryHistoryDependencies): QueryHistoryState {
  // Query history
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  // Pinned queries
  const [pinnedQueries, setPinnedQueries] = useState<PinnedQuery[]>([]);
  // Bookmarked queries
  const [bookmarkedQueries, setBookmarkedQueries] = useState<BookmarkedQuery[]>([]);
  // Labeled queries
  const [labeledQueries, setLabeledQueries] = useState<LabeledQuery[]>([]);
  // Show history
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    // Get the saved history from local storage and set the query history 
    const savedHistory = getLocalStorageItem("queryHistory", []);
    // Get the saved pinned queries from local storage
    const savedPinned = getLocalStorageItem("pinnedQueries", []);
    // Get the saved bookmarked queries from local storage
    const savedBookmarked = getLocalStorageItem("bookmarkedQueries", []);
    // Get the saved labeled queries from local storage
    const savedLabeled = getLocalStorageItem("labeledQueries", []);
    // Get the saved show history from local storage
    const savedShowHistory = getLocalStorageItem("showHistory", false);
    // Set the query history, pinned queries, bookmarked queries, labeled queries, and show history
    setQueryHistory(savedHistory);
    // Set the pinned queries
    setPinnedQueries(savedPinned);
    // Set the bookmarked queries
    setBookmarkedQueries(savedBookmarked);
    // Set the labeled queries
    setLabeledQueries(savedLabeled);
    // Set the show history
    setShowHistory(savedShowHistory);
  }, []);

  useEffect(() => {
    // Save the query history to local storage
    setLocalStorageItem("queryHistory", queryHistory);
  }, [queryHistory]);

  useEffect(() => {
    // Save the pinned queries to local storage
    setLocalStorageItem("pinnedQueries", pinnedQueries);
  }, [pinnedQueries]);

  useEffect(() => {
    // Save the bookmarked queries to local storage
    setLocalStorageItem("bookmarkedQueries", bookmarkedQueries);
  }, [bookmarkedQueries]);

  useEffect(() => {
    // Save the labeled queries to local storage
    setLocalStorageItem("labeledQueries", labeledQueries);
  }, [labeledQueries]);

  useEffect(() => {
    // Save the show history to local storage
    setLocalStorageItem("showHistory", showHistory);
  }, [showHistory]);

  const addToHistory = useCallback((query: string) => {
    // If the query is not trimmed, return
    if (!query.trim()) return;
    // Create a new query history item
    const newItem: QueryHistoryItem = {
      // Generate a new UUID for the query history item
      id: uuidv4(),
      // Set the query to the trimmed query
      query: query.trim(),
      // Set the timestamp to the current date and time
      timestamp: new Date().toISOString(),
    };
    // Set the query history
    setQueryHistory((prev) => {
      // Filter the previous query history to remove the new item
      const filtered = prev.filter((item) => item.query !== newItem.query);
      // Return the new query history with the new item 
      // and the filtered previous query history
      return [newItem, ...filtered].slice(0, 100); 
    });
  }, []);

  // Clear the query history
  const clearHistory = useCallback(() => {
    // Set the query history to an empty array
    setQueryHistory([]);
  }, []);

  // Load the query from history
  const loadQueryFromHistory = useCallback((query: string) => {
    // If the setQuery function is provided, set the query
    if (dependencies?.setQuery) {
      // Set the query
      dependencies.setQuery(query);
    } else {
      // Log a warning if the setQuery function is not provided
      console.warn("setQuery function not provided to useQueryHistory");
    }
  }, [dependencies?.setQuery]);

  // Run the query from history
  const runQueryFromHistory = useCallback(async (query: string) => {
    // If the runQuery function is provided, run the query
    if (dependencies?.runQuery) {
      // Run the query
      await dependencies.runQuery(query);
    } else {
      // Log a warning if the runQuery function is not provided
      console.warn("runQuery function not provided to useQueryHistory");
    }
  }, [dependencies?.runQuery]);

  // Add a pinned query
  const addPinnedQuery = useCallback((query: string) => {
    // Create a new pinned query
    const newPinned: PinnedQuery = {
      // Generate a new UUID for the pinned query
      id: uuidv4(),
      // Set the query to the trimmed query
      query: query.trim(),
      // Set the timestamp to the current date and time
      timestamp: new Date().toISOString(),
    };
    setPinnedQueries((prev) => [...prev, newPinned]);
  }, []);

  // Remove a pinned query
  const removePinnedQuery = useCallback((id: string) => {
    // Remove the pinned query
    setPinnedQueries((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Add a bookmarked query
  const addBookmarkedQuery = useCallback((query: string) => {
    // Create a new bookmarked query
    const newBookmarked: BookmarkedQuery = {
      // Generate a new UUID for the bookmarked query
      id: uuidv4(),
      // Set the query to the trimmed query
      query: query.trim(),
      // Set the timestamp to the current date and time
      timestamp: new Date().toISOString(),
    };
    setBookmarkedQueries((prev) => [...prev, newBookmarked]);
  }, []);

  // Remove a bookmarked query
  const removeBookmarkedQuery = useCallback((id: string) => {
    setBookmarkedQueries((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Add a labeled query
  const addLabeledQuery = useCallback((query: string, label: string) => {
    // First add the query to history to get a history item ID
    addToHistory(query);
    // Create a temporary history item to get an ID
    const tempHistoryItem = {
      // Generate a new UUID for the temporary history item
      id: uuidv4(),
      // Set the query to the trimmed query
      query: query.trim(),
      // Set the timestamp to the current date and time
      timestamp: new Date().toISOString(),
    };
    // Create a new labeled query
    const newLabeled: LabeledQuery = {
      // Generate a new UUID for the labeled query
      id: uuidv4(),
      // Set the history item id to the temporary history item id
      historyItemId: tempHistoryItem.id,
      // Set the label to the trimmed label
      label: label.trim(),
      // Set the timestamp to the current date and time
      timestamp: new Date().toISOString(),
    };
    // Set the labeled queries
    setLabeledQueries((prev) => [...prev, newLabeled]);
  }, [addToHistory]);

  // Remove a labeled query
  const removeLabeledQuery = useCallback((id: string) => {
    // Set the query history to the previous query history filtered to remove the id
    setQueryHistory((prev) => prev.filter((item) => item.id !== id));
    // Set the labeled queries to the previous labeled queries filtered to remove the id
    setLabeledQueries((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Edit a labeled query
  const editLabeledQuery = useCallback((id: string, label: string) => {
    // Set the labeled queries to the previous labeled queries mapped to the new labeled query
    setLabeledQueries((prev) =>
      // Map the previous labeled queries to the new labeled query
      prev.map((item) =>
        // If the id is the same as the id, return the new labeled query
        // Otherwise, return the previous labeled query
        item.id === id ? { ...item, label: label.trim() } : item
      )
    );
  }, []);

  return {
    queryHistory,
    pinnedQueries,
    bookmarkedQueries,
    labeledQueries,
    showHistory,
    setShowHistory,
    addToHistory,
    clearHistory,
    loadQueryFromHistory,
    runQueryFromHistory,
    addPinnedQuery,
    removePinnedQuery,
    addBookmarkedQuery,
    removeBookmarkedQuery,
    addLabeledQuery,
    removeLabeledQuery,
    editLabeledQuery,
  };
}

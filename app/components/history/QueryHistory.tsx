"use client";

import { useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHistoryStore } from "@/app/stores/useHistoryStore";
import { useQueryActionsStore } from "@/app/stores/useQueryActionsStore";
import QueryHistoryHeader from "./queryHistory/QueryHistoryHeader";
import PinnedQuerySection from "./queryHistory/PinnedQuerySection";
import BookmarkedQueriesSection from "./queryHistory/BookmarkedQueriesSection";
import LabeledQueriesSection from "./queryHistory/LabeledQueriesSection";
import RecentQueriesSection from "./queryHistory/RecentQueriesSection";

export default function QueryHistory() {
  const queryHistory = useHistoryStore((state) => state.queryHistory);
  const pinnedQueries = useHistoryStore((state) => state.pinnedQueries);
  const bookmarkedQueries = useHistoryStore((state) => state.bookmarkedQueries);
  const labeledQueries = useHistoryStore((state) => state.labeledQueries);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const loadQueryFromHistory = useHistoryStore(
    (state) => state.loadQueryFromHistory
  );
  const addPinnedQuery = useHistoryStore((state) => state.addPinnedQuery);
  const removePinnedQuery = useHistoryStore((state) => state.removePinnedQuery);
  const addBookmarkedQuery = useHistoryStore(
    (state) => state.addBookmarkedQuery
  );
  const removeBookmarkedQuery = useHistoryStore(
    (state) => state.removeBookmarkedQuery
  );
  const addLabeledQuery = useHistoryStore((state) => state.addLabeledQuery);
  const editLabeledQuery = useHistoryStore((state) => state.editLabeledQuery);
  const removeLabeledQuery = useHistoryStore(
    (state) => state.removeLabeledQuery
  );
  const runQuery = useQueryActionsStore((state) => state.runQuery);

  // State for search term
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Handler for toggling pinned query
  const togglePinnedQuery = useCallback(
    (query: string, id: string) => {
      // If the query is already pinned, remove it
      if (pinnedQueries.some((pin) => pin.id === id)) {
        // Remove the pinned query
        removePinnedQuery(id);
      } else {
        // Remove all pinned queries before adding the new one
        pinnedQueries.forEach((pin) => removePinnedQuery(pin.id));
        // Add the new pinned query
        addPinnedQuery(query);
      }
    },
    [pinnedQueries, addPinnedQuery, removePinnedQuery]
  );

  // Handler for toggling bookmark
  const toggleBookmark = useCallback(
    (query: string, id: string) => {
      // If the query is already bookmarked, remove it
      if (bookmarkedQueries.some((bm) => bm.id === id)) {
        // Remove the bookmarked query
        removeBookmarkedQuery(id);
      } else {
        // Remove all bookmarked queries before adding the new one
        addBookmarkedQuery(query);
      }
    },
    [bookmarkedQueries, addBookmarkedQuery, removeBookmarkedQuery]
  );

  // Filtered pinned queries
  const filteredPinnedQueries = useMemo(
    () =>
      // Filter the pinned queries by the search term
      pinnedQueries.filter((item) =>
        // Check if the query includes the search term
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [pinnedQueries, searchTerm]
  );

  // Filtered bookmarked queries
  const filteredBookmarkedQueries = useMemo(
    () =>
      // Filter the bookmarked queries by the search term
      bookmarkedQueries.filter((item) =>
        // Check if the query includes the search term
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [bookmarkedQueries, searchTerm]
  );

  // Filtered labeled queries
  const filteredLabeledQueries = useMemo(
    () =>
      labeledQueries.filter((item) => {
        // Find the history item
        const historyItem = queryHistory.find(
          (h) => h.id === item.historyItemId
        );
        return (
          // Check if the label includes the search term
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Check if the query includes the search term
          (historyItem?.query
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ??
            false)
        );
      }),
    [labeledQueries, queryHistory, searchTerm]
  );

  // Filtered history
  const filteredHistory = useMemo(
    () =>
      // Filter the history by the search term
      queryHistory.filter((item) =>
        // Check if the query includes the search term
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [queryHistory, searchTerm]
  );

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden">
      <QueryHistoryHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearHistory={clearHistory}
      />
      <ScrollArea className="p-4">
        <div className="space-y-4">
          <PinnedQuerySection
            pinnedQueries={filteredPinnedQueries}
            onLoadQuery={loadQueryFromHistory}
            onRunQuery={runQuery}
            onUnpin={removePinnedQuery}
          />
          <BookmarkedQueriesSection
            bookmarkedQueries={filteredBookmarkedQueries}
            onLoadQuery={loadQueryFromHistory}
            onRunQuery={runQuery}
            onRemoveBookmark={removeBookmarkedQuery}
          />
          <LabeledQueriesSection
            labeledQueries={filteredLabeledQueries}
            queryHistory={queryHistory}
            onLoadQuery={loadQueryFromHistory}
            onRunQuery={runQuery}
            onEditLabel={editLabeledQuery}
            onRemoveLabel={removeLabeledQuery}
          />
          <RecentQueriesSection
            queryHistory={filteredHistory}
            pinnedQueries={pinnedQueries}
            bookmarkedQueries={bookmarkedQueries}
            labeledQueries={labeledQueries}
            onLoadQuery={loadQueryFromHistory}
            onRunQuery={runQuery}
            onTogglePin={togglePinnedQuery}
            onToggleBookmark={toggleBookmark}
            onAddLabel={addLabeledQuery}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

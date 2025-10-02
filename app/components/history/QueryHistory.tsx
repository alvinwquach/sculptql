"use client";

import { useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Pin, Bookmark, Tag, Search, Play, Pencil } from "lucide-react";
import { useHistoryStore } from "@/app/stores/useHistoryStore";
import { useQueryActionsStore } from "@/app/stores/useQueryActionsStore";

export default function QueryHistory({}) {
  // Get state and actions from Zustand stores
  const queryHistory = useHistoryStore((state) => state.queryHistory);
  const pinnedQueries = useHistoryStore((state) => state.pinnedQueries);
  const bookmarkedQueries = useHistoryStore((state) => state.bookmarkedQueries);
  const labeledQueries = useHistoryStore((state) => state.labeledQueries);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const loadQueryFromHistory = useHistoryStore((state) => state.loadQueryFromHistory);
  const addPinnedQuery = useHistoryStore((state) => state.addPinnedQuery);
  const removePinnedQuery = useHistoryStore((state) => state.removePinnedQuery);
  const addBookmarkedQuery = useHistoryStore((state) => state.addBookmarkedQuery);
  const removeBookmarkedQuery = useHistoryStore((state) => state.removeBookmarkedQuery);
  const addLabeledQuery = useHistoryStore((state) => state.addLabeledQuery);
  const editLabeledQuery = useHistoryStore((state) => state.editLabeledQuery);
  const removeLabeledQuery = useHistoryStore((state) => state.removeLabeledQuery);
  const runQuery = useQueryActionsStore((state) => state.runQuery);

  // Create the label input
  const [labelInput, setLabelInput] = useState<string>("");
  // Create the labeling query
  const [labelingQuery, setLabelingQuery] = useState<string | null>(null);

  // Create the editing query
  const [editingQuery, setEditingQuery] = useState<string | null>(null);
  // Create the search term
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Handle the label query
  const handleLabelQuery = useCallback(
    // If the labeling query is the history item id
    (historyItemId: string) => {
      if (labelingQuery === historyItemId) {
        if (labelInput.trim()) {
          // Add the labeled query
          addLabeledQuery(labelInput.trim(), historyItemId);
          // Clear the label input
          setLabelInput("");
          // Clear the labeling query
          setLabelingQuery(null);
        } else {
          // Clear the labeling query
          setLabelingQuery(null);
          // Clear the label input
          setLabelInput("");
        }
      } else {
        // Set the labeling query to the history item id
        setLabelingQuery(historyItemId);
        // Clear the label input
        setLabelInput("");
      }
    },
    // Return the handle label query
    [labelingQuery, labelInput, addLabeledQuery]
  );

  // Handle the edit label
  const handleEditLabel = useCallback(
    // If the editing query is the history item id
    (historyItemId: string, currentLabel: string) => {
      // If the editing query is the history item id
      if (editingQuery === historyItemId) {
        // If the label input is not empty
        if (labelInput.trim()) {
          // Edit the labeled query
          editLabeledQuery(historyItemId, labelInput.trim());
          // Clear the label input
          setLabelInput("");
          // Clear the editing query
          setEditingQuery(null);
        } else {
          // Clear the editing query
          setEditingQuery(null);
          // Clear the label input
          setLabelInput("");
        }
      } else {
        // Set the editing query to the history item id
        setEditingQuery(historyItemId);
        // Set the label input to the current label
        setLabelInput(currentLabel);
      }
    },
    // Return the handle edit label
    [editingQuery, labelInput, editLabeledQuery]
  );

  // Handle the key down
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      historyItemId: string,
      isEditing: boolean
    ) => {
      // If the key is enter and the label input is not empty
      if (e.key === "Enter" && labelInput.trim()) {
        // If the editing query is not null
        if (isEditing) {
          // Edit the labeled query
          editLabeledQuery(historyItemId, labelInput.trim());
        } else {
          // Add the labeled query
          addLabeledQuery(labelInput.trim(), historyItemId);
        }
        // Clear the label input
        setLabelInput("");
        // Clear the labeling query
        setLabelingQuery(null);
        // Clear the editing query
        setEditingQuery(null);
      }
    },
    [labelInput, addLabeledQuery, editLabeledQuery]
  );

  // Handle the toggle pinned query
  const togglePinnedQuery = useCallback(
    (query: string, id: string) => {
      // If the pinned queries some of the id is the id
      if (pinnedQueries.some((pin) => pin.id === id)) {
        // Remove the pinned query
        removePinnedQuery(id);
      } else {
        // Remove the pinned queries
        pinnedQueries.forEach((pin) => removePinnedQuery(pin.id));
        // Add the pinned query
        addPinnedQuery(query);
      }
    },
    // Return the toggle pinned query
    [pinnedQueries, addPinnedQuery, removePinnedQuery]
  );

  // Create the filtered pinned queries
  const filteredPinnedQueries = useMemo(
    // Return the filtered pinned queries
    () =>
      // Filter the pinned queries to include the search term
      pinnedQueries.filter((item) =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    // Return the filtered pinned queries
    [pinnedQueries, searchTerm]
  );

  const filteredBookmarkedQueries = useMemo(
    () =>
      bookmarkedQueries.filter((item) =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [bookmarkedQueries, searchTerm]
  );

  // Create the filtered labeled queries
  const filteredLabeledQueries = useMemo(
    () =>
      // Filter the labeled queries to include the search term
      labeledQueries.filter((item) => {
        // Find the history item by the history item id and the query
        const historyItem = queryHistory.find(
          (h) => h.id === item.historyItemId
        );
        return (
          // If the label includes the search term or the history item query includes the search term
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // If the history item query includes the search term
          (historyItem?.query
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ??
            false)
        );
      }),
    // Return the filtered labeled queries
    [labeledQueries, queryHistory, searchTerm]
  );

  // Create the filtered history
  const filteredHistory = useMemo(
    () =>
      // Filter the history to include the search term
      queryHistory.filter((item) =>
        // If the query includes the search term
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    // Return the filtered history
    [queryHistory, searchTerm]
  );

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden">
      <div className="sticky top-0 z-10 bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] pb-4 border-b border-purple-500/20">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Query History
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300 p-1.5 rounded transition-all duration-200"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full p-2 text-sm bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white border border-purple-500/30 rounded-lg pl-8 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/60 transition-all duration-200"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
        </div>
      </div>
      <ScrollArea className="p-4">
        <div className="space-y-4">
          <div className="border-b border-purple-500/20 pb-3">
            <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
              📌 Pinned Query
            </h3>
            {filteredPinnedQueries.length === 0 ? (
              <p className="text-xs text-purple-300/60 py-2">
                No pinned queries found
              </p>
            ) : (
              <div
                className="p-3 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 cursor-pointer flex flex-col transition-all duration-200 hover:border-purple-400/40"
                onClick={() =>
                  loadQueryFromHistory(filteredPinnedQueries[0].query)
                }
              >
                <div className="flex items-start">
                  <Pin
                    className="w-4 h-4 mr-1 text-yellow-400 mt-1 flex-shrink-0 hover:text-yellow-500"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-cyan-300 break-words whitespace-pre-wrap font-mono">
                      {filteredPinnedQueries[0].query}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-purple-300/70 mt-2 font-mono">
                  {new Date(
                    filteredPinnedQueries[0].timestamp
                  ).toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Run Query"
                    onClick={(e) => {
                      e.stopPropagation();
                      runQuery(filteredPinnedQueries[0].query);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2 py-1 text-xs transition-all duration-200"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePinnedQuery(filteredPinnedQueries[0].id);
                    }}
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 px-2 py-1 text-xs transition-all duration-200"
                    title="Unpin"
                  >
                    <Pin
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                    Unpin
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-purple-500/20 pb-3">
            <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
              🔖 Bookmarks
            </h3>
            {filteredBookmarkedQueries.length === 0 ? (
              <p className="text-xs text-purple-300/60 py-2">
                No bookmarked queries found
              </p>
            ) : (
              filteredBookmarkedQueries.map((item) => (
                <div
                  key={`bookmark-${item.id}`}
                  className="p-3 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 cursor-pointer flex flex-col transition-all duration-200 hover:border-purple-400/40 mb-2"
                  onClick={() => loadQueryFromHistory(item.query)}
                >
                  <div className="flex items-start">
                    <Bookmark
                      className="w-4 h-4 mr-1 text-blue-400 mt-1 flex-shrink-0 hover:text-blue-500"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-cyan-300 break-words whitespace-pre-wrap font-mono">
                        {item.query}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-2 font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Run Query"
                      onClick={(e) => {
                        e.stopPropagation();
                        runQuery(item.query);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2 py-1 text-xs transition-all duration-200"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Run
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmarkedQuery(item.id);
                      }}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 py-1 text-xs transition-all duration-200"
                      title="Remove Bookmark"
                    >
                      <Bookmark
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-b border-purple-500/20 pb-3">
            <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
              🏷️ Labeled Queries
            </h3>
            {filteredLabeledQueries.length === 0 ? (
              <p className="text-xs text-purple-300/60 py-2">
                No labeled queries found
              </p>
            ) : (
              filteredLabeledQueries.map((item) => {
                const historyItem = queryHistory.find(
                  (h) => h.id === item.historyItemId
                );
                if (!historyItem) return null;
                return (
                  <div
                    key={`labeled-${item.id}`}
                    className="p-3 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 cursor-pointer flex flex-col transition-all duration-200 hover:border-purple-400/40 mb-2"
                    onClick={() => loadQueryFromHistory(historyItem.query)}
                  >
                    <div className="flex items-start">
                      <Tag className="w-4 h-4 mr-1 text-purple-400 mt-1 flex-shrink-0 hover:text-purple-500" />
                      <div className="flex-1">
                        {editingQuery === item.historyItemId ? (
                          <input
                            type="text"
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value)}
                            placeholder="Edit query label"
                            className="w-full p-1 text-sm bg-[#2d3748] text-white border border-slate-600 rounded"
                            onKeyDown={(e) =>
                              handleKeyDown(e, item.historyItemId, true)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="text-sm text-cyan-300 break-words whitespace-pre-wrap font-mono">
                            {item.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-purple-300/70 mt-2 break-words whitespace-pre-wrap font-mono">
                      {historyItem.query}
                    </p>
                    <p className="text-xs text-purple-300/70 mt-1 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Run Query"
                        onClick={(e) => {
                          e.stopPropagation();
                          runQuery(historyItem.query);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2 py-1 text-xs transition-all duration-200"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLabel(item.historyItemId, item.label);
                        }}
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2 py-1 text-xs transition-all duration-200"
                        title={
                          editingQuery === item.historyItemId
                            ? "Cancel Edit"
                            : "Edit Label"
                        }
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        {editingQuery === item.historyItemId
                          ? "Cancel"
                          : "Edit"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLabeledQuery(item.historyItemId);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 text-xs transition-all duration-200"
                        title="Delete Label"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
              🕒 Recent Queries
            </h3>
            <p className="text-xs text-purple-300/60 py-2 font-mono">
              Showing up to 200 recent queries
            </p>
            {filteredHistory.length === 0 ? (
              <p className="text-xs text-purple-300/60 py-2">
                No queries found
              </p>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={`history-${item.id}`}
                  className="p-3 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 cursor-pointer flex flex-col transition-all duration-200 hover:border-purple-400/40 mb-2"
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p
                        className="text-sm text-cyan-300 break-words whitespace-pre-wrap font-mono"
                        onClick={() => loadQueryFromHistory(item.query)}
                      >
                        {labeledQueries.find(
                          (lq) => lq.historyItemId === item.id
                        )?.label || item.query}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-2 font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runQuery(item.query)}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2 py-1 text-xs transition-all duration-200"
                      title="Run Query"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Run
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePinnedQuery(item.query, item.id)}
                      className={`px-2 py-1 text-xs transition-all duration-200 ${
                        pinnedQueries.some((pin) => pin.id === item.id)
                          ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                          : "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      }`}
                      title={
                        pinnedQueries.some((pin) => pin.id === item.id)
                          ? "Unpin"
                          : "Pin (replaces current pinned query)"
                      }
                    >
                      <Pin
                        className="w-3 h-3 mr-1"
                        fill={
                          pinnedQueries.some((pin) => pin.id === item.id)
                            ? "currentColor"
                            : "none"
                        }
                        strokeWidth={
                          pinnedQueries.some((pin) => pin.id === item.id)
                            ? 0
                            : 2
                        }
                      />
                      {pinnedQueries.some((pin) => pin.id === item.id)
                        ? "Unpin"
                        : "Pin"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (bookmarkedQueries.some((bm) => bm.id === item.id)) {
                          removeBookmarkedQuery(item.id);
                        } else {
                          addBookmarkedQuery(item.query);
                        }
                      }}
                      className={`px-2 py-1 text-xs transition-all duration-200 ${
                        bookmarkedQueries.some((bm) => bm.id === item.id)
                          ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          : "text-gray-400 hover:text-blue-300 hover:bg-blue-500/10"
                      }`}
                      title={
                        bookmarkedQueries.some((bm) => bm.id === item.id)
                          ? "Remove Bookmark"
                          : "Bookmark"
                      }
                    >
                      <Bookmark
                        className="w-3 h-3 mr-1"
                        fill={
                          bookmarkedQueries.some((bm) => bm.id === item.id)
                            ? "currentColor"
                            : "none"
                        }
                        strokeWidth={
                          bookmarkedQueries.some((bm) => bm.id === item.id)
                            ? 0
                            : 2
                        }
                      />
                      {bookmarkedQueries.some((bm) => bm.id === item.id)
                        ? "Remove"
                        : "Bookmark"}
                    </Button>
                    {!labeledQueries.some(
                      (labeledQuery) => labeledQuery.historyItemId === item.id
                    ) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLabelQuery(item.id)}
                        className={`px-2 py-1 text-xs transition-all duration-200 ${
                          labelingQuery === item.id
                            ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            : "text-gray-400 hover:text-purple-300 hover:bg-purple-500/10"
                        }`}
                        title={
                          labelingQuery === item.id
                            ? "Cancel Labeling"
                            : "Label Query"
                        }
                      >
                        <Tag
                          className="w-3 h-3 mr-1"
                          fill={
                            labelingQuery === item.id ? "currentColor" : "none"
                          }
                          strokeWidth={labelingQuery === item.id ? 0 : 2}
                        />
                        {labelingQuery === item.id ? "Cancel" : "Label"}
                      </Button>
                    )}
                  </div>
                  {labelingQuery === item.id && (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        placeholder="Enter query label"
                        className="w-full p-2 text-sm bg-[#0f0f23] text-white border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 font-mono"
                        onKeyDown={(e) => handleKeyDown(e, item.id, false)}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

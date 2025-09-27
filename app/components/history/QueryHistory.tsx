"use client";

import { useState, useCallback, useMemo } from "react";
import { useEditorContext } from "@/app/context/EditorContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Pin, Bookmark, Tag, Search, Play, Pencil } from "lucide-react";

// Props for the QueryHistory component
interface QueryHistoryProps {
  showHistory: boolean;
}

export default function QueryHistory({
  showHistory,
}: QueryHistoryProps) {
  // Get the query history, pinned queries, bookmarked queries, labeled queries, clear history, load query from history, run query, add pinned query, remove pinned query, add bookmarked query, remove bookmarked query, add labeled query, edit labeled query, and remove labeled query from the editor context
  const {
    queryHistory,
    pinnedQueries,
    bookmarkedQueries,
    labeledQueries,
    clearHistory,
    loadQueryFromHistory,
    runQuery,
    addPinnedQuery,
    removePinnedQuery,
    addBookmarkedQuery,
    removeBookmarkedQuery,
    addLabeledQuery,
    editLabeledQuery,
    removeLabeledQuery,
  } = useEditorContext();

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
        const historyItem = queryHistory.find((h) => h.id === item.historyItemId);
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
    <div
      className={`w-full lg:w-52 bg-[#0f172a] border-r border-slate-700/50 p-2 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
        showHistory ? "block md:w-full" : "hidden md:w-0"
      } md:h-full md:flex-shrink-0`}
    >
      <div className="sticky top-0 z-10 bg-[#0f172a] pb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-green-300">Query History</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-red-400 hover:bg-slate-700/50 hover:text-red-400 p-1.5 rounded"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative mt-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full p-1.5 text-sm bg-[#2d3748] text-white border border-slate-600 rounded pl-8 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      <ScrollArea className="p-2">
        <div className="space-y-4">
          <div className="border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-green-300">Pinned Query</h3>
            {filteredPinnedQueries.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">
                No pinned queries found
              </p>
            ) : (
              <div
                className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
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
                    <p className="text-sm text-green-300 break-words whitespace-pre-wrap">
                      {filteredPinnedQueries[0].query}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(
                    filteredPinnedQueries[0].timestamp
                  ).toLocaleString()}
                </p>
                <div className="flex space-x-1 mt-1">
                  <Button
                    variant="link"
                    size="sm"
                    title="Run Query"
                    onClick={(e) => {
                      e.stopPropagation();
                      runQuery(filteredPinnedQueries[0].query);
                    }}
                    className="rounded-full text-green-400 hover:bg-green-700/50 p-0 h-auto"
                  >
                    <Play className="w-4 h-4 hover:text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePinnedQuery(filteredPinnedQueries[0].id);
                    }}
                    className="rounded-full text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-500 focus:outline-none transition-all ease-in-out duration-150"
                    title="Unpin"
                  >
                    <Pin
                      className="w-5 h-5 hover:text-yellow-500"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-green-300">Bookmarks</h3>
            {filteredBookmarkedQueries.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">
                No bookmarked queries found
              </p>
            ) : (
              filteredBookmarkedQueries.map((item) => (
                <div
                  key={`bookmark-${item.id}`}
                  className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
                  onClick={() => loadQueryFromHistory(item.query)}
                >
                  <div className="flex items-start">
                    <Bookmark
                      className="w-4 h-4 mr-1 text-blue-400 mt-1 flex-shrink-0 hover:text-blue-500"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-green-300 break-words whitespace-pre-wrap">
                        {item.query}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="flex space-x-1 mt-1">
                    <Button
                      variant="link"
                      size="sm"
                      title="Run Query"
                      onClick={(e) => {
                        e.stopPropagation();
                        runQuery(item.query);
                      }}
                      className="rounded-full text-green-400 hover:bg-green-700/50 p-0 h-auto"
                    >
                      <Play className="w-4 h-4 hover:text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmarkedQuery(item.id);
                      }}
                      className="rounded-full text-blue-400 hover:bg-blue-700/50 hover:text-blue-500 p-1 h-auto"
                      title="Remove Bookmark"
                    >
                      <Bookmark
                        className="w-5 h-5 sm:w-4 sm:h-4 hover:text-blue-500"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-green-300">
              Labeled Queries
            </h3>
            {filteredLabeledQueries.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">
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
                    className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
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
                          <p className="text-sm text-green-300 break-words whitespace-pre-wrap">
                            {item.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 break-words whitespace-pre-wrap">
                      {historyItem.query}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <div className="flex space-x-1 mt-1">
                      <Button
                        variant="link"
                        size="sm"
                        title="Run Query"
                        onClick={(e) => {
                          e.stopPropagation();
                          runQuery(historyItem.query);
                        }}
                        className="rounded-full text-green-400 hover:bg-green-700/50 p-0 h-auto"
                      >
                        <Play className="w-4 h-4 hover:text-green-500" />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLabel(item.historyItemId, item.label);
                        }}
                        className="rounded-full text-purple-400 hover:bg-purple-700/50 p-0 h-auto"
                        title={
                          editingQuery === item.historyItemId
                            ? "Cancel Edit"
                            : "Edit Label"
                        }
                      >
                        <Pencil
                          className={`w-4 h-4 hover:text-purple-500 ${
                            editingQuery === item.historyItemId
                              ? "text-purple-500"
                              : ""
                          }`}
                        />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLabeledQuery(item.historyItemId);
                        }}
                        className="text-purple-400 hover:bg-slate-700/50 p-0 h-auto"
                        title="Delete Label"
                      >
                        <Tag className="w-5 h-5 sm:w-4 sm:h-4 hover:text-purple-500" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-green-300">Recent Queries</h3>
            <p className="text-xs text-gray-400 py-1">
              Showing up to 200 recent queries
            </p>
            {filteredHistory.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No queries found</p>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={`history-${item.id}`}
                  className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p
                        className="text-sm text-green-300 break-words whitespace-pre-wrap"
                        onClick={() => loadQueryFromHistory(item.query)}
                      >
                        {labeledQueries.find(
                          (lq) => lq.historyItemId === item.id
                        )?.label || item.query}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => runQuery(item.query)}
                      className="rounded-full text-green-400 hover:bg-green-700/50 p-0 h-auto"
                      title="Run Query"
                    >
                      <Play className="w-4 h-4 hover:text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePinnedQuery(item.query, item.id)}
                      className={`p-1 h-auto hover:bg-slate-700/50 hover:text-white rounded-full ${
                        pinnedQueries.some((pin) => pin.id === item.id)
                          ? "text-yellow-400 hover:text-yellow-500 hover:bg-yellow-500/20"
                          : "text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-500"
                      }`}
                      title={
                        pinnedQueries.some((pin) => pin.id === item.id)
                          ? "Unpin"
                          : "Pin (replaces current pinned query)"
                      }
                    >
                      <Pin
                        className="w-5 h-5 sm:w-4 sm:h-4 hover:text-yellow-500"
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
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        bookmarkedQueries.some((bm) => bm.id === item.id)
                          ? removeBookmarkedQuery(item.id)
                          : addBookmarkedQuery(item.query);
                      }}
                      className={`p-1 h-auto rounded-full ${
                        bookmarkedQueries.some((bm) => bm.id === item.id)
                          ? "text-blue-400 hover:bg-blue-700/50 hover:text-blue-500"
                          : "text-gray-400 hover:bg-blue-700/50 hover:text-blue-500"
                      }`}
                      title={
                        bookmarkedQueries.some((bm) => bm.id === item.id)
                          ? "Remove Bookmark"
                          : "Bookmark"
                      }
                    >
                      <Bookmark
                        className="w-5 h-5 sm:w-4 sm:h-4 hover:text-blue-500"
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
                    </Button>
                    {!labeledQueries.some(
                      (labeledQuery) => labeledQuery.historyItemId === item.id
                    ) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLabelQuery(item.id)}
                        className={`p-1 h-auto hover:bg-purple-700/50 hover:text-white rounded-full ${
                          labelingQuery === item.id
                            ? "text-purple-400 hover:text-purple-500"
                            : "text-gray-400 hover:text-purple-500"
                        }`}
                        title={
                          labelingQuery === item.id
                            ? "Cancel Labeling"
                            : "Label Query"
                        }
                      >
                        <Tag
                          className="w-5 h-5 sm:w-4 sm:h-4 hover:text-purple-500"
                          fill={
                            labelingQuery === item.id ? "currentColor" : "none"
                          }
                          strokeWidth={labelingQuery === item.id ? 0 : 2}
                        />
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
                        className="w-full p-1 text-sm bg-[#2d3748] text-white border border-slate-600 rounded"
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

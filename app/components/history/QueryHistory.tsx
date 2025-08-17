"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Pin, Bookmark, Tag } from "lucide-react";
import { useState, useCallback } from "react";
import {
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
} from "@/app/types/query";

interface QueryHistoryProps {
  showHistory: boolean;
  history: QueryHistoryItem[];
  pinnedQueries: PinnedQuery[];
  bookmarkedQueries: BookmarkedQuery[];
  labeledQueries: LabeledQuery[];
  clearHistory: () => void;
  loadQueryFromHistory: (query: string) => void;
  runQueryFromHistory: (query: string) => void;
  addPinnedQuery: (query: string) => void;
  removePinnedQuery: (query: string) => void;
  addBookmarkedQuery: (query: string) => void;
  removeBookmarkedQuery: (query: string) => void;
  addLabeledQuery: (label: string, query: string) => void;
  removeLabeledQuery: (query: string) => void;
}

export default function QueryHistory({
  showHistory,
  history,
  pinnedQueries,
  bookmarkedQueries,
  labeledQueries,
  clearHistory,
  loadQueryFromHistory,
  runQueryFromHistory,
  addPinnedQuery,
  removePinnedQuery,
  addBookmarkedQuery,
  removeBookmarkedQuery,
  addLabeledQuery,
  removeLabeledQuery,
}: QueryHistoryProps) {
  const [labelInput, setLabelInput] = useState<string>("");
  const [labelingQuery, setLabelingQuery] = useState<string | null>(null);

  const handleLabelQuery = useCallback(
    (query: string) => {
      if (labelingQuery === query) {
        if (labelInput.trim()) {
          addLabeledQuery(labelInput.trim(), query);
          setLabelInput("");
          setLabelingQuery(null);
        }
      } else {
        setLabelingQuery(query);
        setLabelInput("");
      }
    },
    [labelingQuery, labelInput, addLabeledQuery]
  );

  const togglePinnedQuery = useCallback(
    (query: string) => {
      if (pinnedQueries.some((pin) => pin.query === query)) {
        removePinnedQuery(query);
      } else {
        pinnedQueries.forEach((pin) => removePinnedQuery(pin.query));
        addPinnedQuery(query);
      }
    },
    [pinnedQueries, addPinnedQuery, removePinnedQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, query: string) => {
      if (e.key === "Enter" && labelInput.trim()) {
        addLabeledQuery(labelInput.trim(), query);
        setLabelInput("");
        setLabelingQuery(null);
      }
    },
    [labelInput, addLabeledQuery]
  );

  return (
    <div
      className={`w-64 h-full bg-[#1e293b] border-r border-slate-700 ${
        showHistory ? "block" : "hidden"
      } flex-shrink-0`}
    >
      <div className="flex justify-between items-center p-2 border-b border-slate-700">
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
      <ScrollArea className="h-[calc(100%-3rem)] p-2">
        <div className="space-y-4">
          <div className="border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-green-300">Pinned Query</h3>
            {pinnedQueries.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No pinned query set</p>
            ) : (
              <div
                className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
                onClick={() => loadQueryFromHistory(pinnedQueries[0].query)}
              >
                <div className="flex items-start">
                  <Pin
                    className="w-4 h-4 mr-1 text-yellow-400 mt-1"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                  <ScrollArea className="max-h-16 w-full overflow-x-auto">
                    <p className="text-sm text-green-300 break-words whitespace-pre-wrap max-w-full">
                      {pinnedQueries[0].query}
                    </p>
                  </ScrollArea>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(pinnedQueries[0].timestamp).toLocaleString()}
                </p>
                <div className="flex space-x-1 mt-1">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      runQueryFromHistory(pinnedQueries[0].query);
                    }}
                    className="text-green-400 hover:bg-slate-700/50 p-0 h-auto"
                  >
                    Run
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePinnedQuery(pinnedQueries[0].query);
                    }}
                    className="text-yellow-400 hover:bg-slate-700/50 p-0 h-auto"
                  >
                    Unpin
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-green-300">Bookmarks</h3>
            {bookmarkedQueries.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">
                No bookmarked queries
              </p>
            ) : (
              bookmarkedQueries.map((item, index) => (
                <div
                  key={`bookmark-${index}`}
                  className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
                  onClick={() => loadQueryFromHistory(item.query)}
                >
                  <div className="flex items-start">
                    <Bookmark
                      className="w-4 h-4 mr-1 text-blue-400 mt-1"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                    <ScrollArea className="max-h-16 w-full overflow-x-auto">
                      <p className="text-sm text-green-300 break-words whitespace-pre-wrap max-w-full">
                        {item.query}
                      </p>
                    </ScrollArea>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="flex space-x-1 mt-1">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        runQueryFromHistory(item.query);
                      }}
                      className="text-green-400 hover:bg-slate-700/50 p-0 h-auto"
                    >
                      Run
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmarkedQuery(item.query);
                      }}
                      className="text-blue-400 hover:bg-slate-700/50 p-0 h-auto"
                    >
                      Remove
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
            {labeledQueries.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No labeled queries</p>
            ) : (
              labeledQueries.map((item, index) => (
                <div
                  key={`labeled-${index}`}
                  className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
                  onClick={() => loadQueryFromHistory(item.query)}
                >
                  <div className="flex items-start">
                    <Tag className="w-4 h-4 mr-1 text-purple-400 mt-1" />
                    <ScrollArea className="max-h-16 w-full overflow-x-auto">
                      <p className="text-sm text-green-300 break-words whitespace-pre-wrap max-w-full">
                        {item.label}
                      </p>
                    </ScrollArea>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 break-words whitespace-pre-wrap max-w-full">
                    {item.query}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="flex space-x-1 mt-1">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        runQueryFromHistory(item.query);
                      }}
                      className="text-green-400 hover:bg-slate-700/50 p-0 h-auto"
                    >
                      Run
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLabeledQuery(item.query);
                      }}
                      className="text-purple-400 hover:bg-slate-700/50 p-0 h-auto"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-green-300">Recent Queries</h3>
            <p className="text-xs text-gray-400 py-1">
              Showing up to 200 recent queries
            </p>
            {history.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">
                No queries in history
              </p>
            ) : (
              history.map((item, index) => (
                <div
                  key={`history-${index}`}
                  className="p-1 border-b border-slate-700 hover:bg-[#2d3748] cursor-pointer flex flex-col"
                >
                  <ScrollArea className="max-h-16 w-full overflow-x-auto">
                    <p
                      className="text-sm text-green-300 break-words whitespace-pre-wrap max-w-full"
                      onClick={() => loadQueryFromHistory(item.query)}
                    >
                      {item.query}
                    </p>
                  </ScrollArea>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => runQueryFromHistory(item.query)}
                      className="text-green-400 hover:bg-slate-700/50 p-0 h-auto"
                    >
                      Run
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePinnedQuery(item.query)}
                      className={`hover:bg-slate-700/50 hover:text-white p-1 h-auto rounded-full ${
                        pinnedQueries.some((pin) => pin.query === item.query)
                          ? "text-yellow-400"
                          : "text-gray-400"
                      }`}
                      title={
                        pinnedQueries.some((pin) => pin.query === item.query)
                          ? "Unpin"
                          : "Pin (replaces current pinned query)"
                      }
                    >
                      <Pin
                        className="w-5 h-5 sm:w-4 sm:h-4"
                        fill={
                          pinnedQueries.some((pin) => pin.query === item.query)
                            ? "currentColor"
                            : "none"
                        }
                        strokeWidth={
                          pinnedQueries.some((pin) => pin.query === item.query)
                            ? 0
                            : 2
                        }
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        bookmarkedQueries.some((bm) => bm.query === item.query)
                          ? removeBookmarkedQuery(item.query)
                          : addBookmarkedQuery(item.query)
                      }
                      className={`p-1 h-auto hover:bg-slate-700/50 hover:text-white rounded-full ${
                        bookmarkedQueries.some((bm) => bm.query === item.query)
                          ? "text-blue-400"
                          : "text-gray-400"
                      }`}
                      title={
                        bookmarkedQueries.some((bm) => bm.query === item.query)
                          ? "Remove Bookmark"
                          : "Bookmark"
                      }
                    >
                      <Bookmark
                        className="w-5 h-5 sm:w-4 sm:h-4"
                        fill={
                          bookmarkedQueries.some(
                            (bookmarked) => bookmarked.query === item.query
                          )
                            ? "currentColor"
                            : "none"
                        }
                        strokeWidth={
                          bookmarkedQueries.some(
                            (bookmarked) => bookmarked.query === item.query
                          )
                            ? 0
                            : 2
                        }
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLabelQuery(item.query)}
                      className="text-purple-400 hover:bg-slate-700/50 hover:text-white p-1 h-auto rounded-full"
                      title="Label Query"
                    >
                      <Tag className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  {labelingQuery === item.query && (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        placeholder="Enter query label"
                        className="w-full p-1 text-sm bg-[#2d3748] text-white border border-slate-600 rounded"
                        onKeyDown={(e) => handleKeyDown(e, item.query)}
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
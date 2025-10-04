"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pin, Bookmark, Tag, Play } from "lucide-react";
import {
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
} from "@/app/types/query";

interface RecentQueriesSectionProps {
  queryHistory: QueryHistoryItem[];
  pinnedQueries: PinnedQuery[];
  bookmarkedQueries: BookmarkedQuery[];
  labeledQueries: LabeledQuery[];
  onLoadQuery: (query: string) => void;
  onRunQuery: (query: string) => void;
  onTogglePin: (query: string, id: string) => void;
  onToggleBookmark: (query: string, id: string) => void;
  onAddLabel: (label: string, historyItemId: string) => void;
}

export default function RecentQueriesSection({
  queryHistory,
  pinnedQueries,
  bookmarkedQueries,
  labeledQueries,
  onLoadQuery,
  onRunQuery,
  onTogglePin,
  onToggleBookmark,
  onAddLabel,
}: RecentQueriesSectionProps) {
  // State for labeling query
  const [labelingQuery, setLabelingQuery] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState<string>("");

  const handleLabelQuery = useCallback(
    (historyItemId: string) => {
      if (labelingQuery === historyItemId) {
        // If the input is not empty, add the label
        if (labelInput.trim()) {
          // Add the label in the parent component using the onAddLabel prop
          onAddLabel(labelInput.trim(), historyItemId); 
        }
        // Reset the input value and labeling state
        setLabelInput("");
        setLabelingQuery(null);
      } else {
        // Set the labeling state to the history item id
        setLabelingQuery(historyItemId);
        // Reset the input value
        setLabelInput("");
      }
    },
    [labelingQuery, labelInput, onAddLabel]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, historyItemId: string) => {
      if (e.key === "Enter" && labelInput.trim()) {
        onAddLabel(labelInput.trim(), historyItemId);
        setLabelInput("");
        setLabelingQuery(null);
      }
    },
    [labelInput, onAddLabel]
  );

  return (
    <div>
      <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
        🕒 Recent Queries
      </h3>
      <p className="text-xs text-purple-300/60 py-2 font-mono">
        Showing up to 200 recent queries
      </p>
      {queryHistory.length === 0 ? (
        <p className="text-xs text-purple-300/60 py-2">No queries found</p>
      ) : (
        queryHistory.map((item) => {
          const isPinned = pinnedQueries.some((pin) => pin.id === item.id);
          const isBookmarked = bookmarkedQueries.some((bm) => bm.id === item.id);
          const labeledQuery = labeledQueries.find(
            (lq) => lq.historyItemId === item.id
          );

          return (
            <div
              key={`history-${item.id}`}
              className="p-3 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 cursor-pointer flex flex-col transition-all duration-200 hover:border-purple-400/40 mb-2"
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <p
                    className="text-sm text-cyan-300 break-words whitespace-pre-wrap font-mono"
                    onClick={() => onLoadQuery(item.query)}
                  >
                    {labeledQuery?.label || item.query}
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
                  onClick={() => onRunQuery(item.query)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2 py-1 text-xs transition-all duration-200"
                  title="Run Query"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Run
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePin(item.query, item.id)}
                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 px-2 py-1 text-xs transition-all duration-200"
                  title={
                    isPinned ? "Unpin" : "Pin (replaces current pinned query)"
                  }
                >
                  <Pin
                    className="w-3 h-3 mr-1"
                    fill={isPinned ? "currentColor" : "none"}
                    strokeWidth={isPinned ? 0 : 2}
                  />
                  {isPinned ? "Unpin" : "Pin"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(item.query, item.id);
                  }}
                  className={`px-2 py-1 text-xs transition-all duration-200 ${
                    isBookmarked
                      ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      : "text-gray-400 hover:text-blue-300 hover:bg-blue-500/10"
                  }`}
                  title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                >
                  <Bookmark
                    className="w-3 h-3 mr-1"
                    fill={isBookmarked ? "currentColor" : "none"}
                    strokeWidth={isBookmarked ? 0 : 2}
                  />
                  {isBookmarked ? "Remove" : "Bookmark"}
                </Button>
                {!labeledQuery && (
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
                      fill={labelingQuery === item.id ? "currentColor" : "none"}
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
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

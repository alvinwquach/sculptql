"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Play } from "lucide-react";
import QueryHistoryItem from "./QueryHistoryItem";
import { BookmarkedQuery } from "@/app/types/query";

interface BookmarkedQueriesSectionProps {
  bookmarkedQueries: BookmarkedQuery[];
  onLoadQuery: (query: string) => void;
  onRunQuery: (query: string) => void;
  onRemoveBookmark: (id: string) => void;
}

export default function BookmarkedQueriesSection({
  bookmarkedQueries,
  onLoadQuery,
  onRunQuery,
  onRemoveBookmark,
}: BookmarkedQueriesSectionProps) {
  return (
    <div className="border-b border-purple-500/20 pb-3">
      <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
        🔖 Bookmarks
      </h3>
      {bookmarkedQueries.length === 0 ? (
        <p className="text-xs text-purple-300/60 py-2">
          No bookmarked queries found
        </p>
      ) : (
        bookmarkedQueries.map((item) => (
          <QueryHistoryItem
            key={`bookmark-${item.id}`}
            query={item.query}
            timestamp={item.timestamp}
            icon={
              <Bookmark
                className="w-4 h-4 text-blue-400 hover:text-blue-500"
                fill="currentColor"
                strokeWidth={0}
              />
            }
            onLoadQuery={() => onLoadQuery(item.query)}
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Run Query"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunQuery(item.query);
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
                    onRemoveBookmark(item.id);
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
              </>
            }
          />
        ))
      )}
    </div>
  );
}

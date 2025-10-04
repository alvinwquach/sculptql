"use client";

import { Button } from "@/components/ui/button";
import { Pin, Play } from "lucide-react";
import QueryHistoryItem from "./QueryHistoryItem";
import { PinnedQuery } from "@/app/types/query";

interface PinnedQuerySectionProps {
  pinnedQueries: PinnedQuery[];
  onLoadQuery: (query: string) => void;
  onRunQuery: (query: string) => void;
  onUnpin: (id: string) => void;
}

export default function PinnedQuerySection({
  pinnedQueries,
  onLoadQuery,
  onRunQuery,
  onUnpin,
}: PinnedQuerySectionProps) {
  return (
    <div className="border-b border-purple-500/20 pb-3">
      <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
        📌 Pinned Query
      </h3>
      {pinnedQueries.length === 0 ? (
        <p className="text-xs text-purple-300/60 py-2">No pinned queries found</p>
      ) : (
        <QueryHistoryItem
          query={pinnedQueries[0].query}
          timestamp={pinnedQueries[0].timestamp}
          icon={
            <Pin
              className="w-4 h-4 text-yellow-400 hover:text-yellow-500"
              fill="currentColor"
              strokeWidth={0}
            />
          }
          onLoadQuery={() => onLoadQuery(pinnedQueries[0].query)}
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                title="Run Query"
                onClick={(e) => {
                  e.stopPropagation();
                  onRunQuery(pinnedQueries[0].query);
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
                  onUnpin(pinnedQueries[0].id);
                }}
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 px-2 py-1 text-xs transition-all duration-200"
                title="Unpin"
              >
                <Pin className="w-3 h-3 mr-1" fill="currentColor" strokeWidth={0} />
                Unpin
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}

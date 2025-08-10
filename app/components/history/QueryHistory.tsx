"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface QueryHistoryItem {
  query: string;
  timestamp: string;
}

interface QueryHistoryProps {
  showHistory: boolean;
  history: QueryHistoryItem[];
  clearHistory: () => void;
  loadQueryFromHistory: (query: string) => void;
  runQueryFromHistory: (query: string) => void;
}

export default function QueryHistory({
  showHistory,
  history,
  clearHistory,
  loadQueryFromHistory,
  runQueryFromHistory,
}: QueryHistoryProps) {
  return (
    <div
      className={`w-64 sm:w-80 h-full bg-[#1e293b] border-r border-slate-700 ${
        showHistory ? "block" : "hidden"
      }`}
    >
      <div className="flex justify-between items-center p-2 border-b border-slate-700">
        <h2 className="text-sm font-bold text-green-300">Query History</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="text-red-400 hover:bg-red-700/20 hover:text-red-300 p-1.5 rounded"
          title="Clear history"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100%-3rem)]">
        <p className="p-2 text-xs text-gray-400">
          Showing up to 200 recent queries
        </p>
        {history.length === 0 ? (
          <p className="p-2 text-gray-400 text-sm">No queries in history</p>
        ) : (
          history.map((item, index) => (
            <div
              key={index}
              className="p-2 border-b border-slate-700 hover:bg-[#374151] cursor-pointer"
              onClick={() => loadQueryFromHistory(item.query)}
            >
              <p className="text-sm text-green-300 truncate">{item.query}</p>
              <p className="text-xs text-gray-400">
                {new Date(item.timestamp).toLocaleString()}
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  runQueryFromHistory(item.query);
                }}
                className="text-green-400 p-0 h-auto"
              >
                Run
              </Button>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";

interface QueryHistoryHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearHistory: () => void;
}

export default function QueryHistoryHeader({
  searchTerm,
  onSearchChange,
  onClearHistory,
}: QueryHistoryHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] pb-4 border-b border-purple-500/20">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          Query History
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search queries..."
          className="w-full p-2 text-sm bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white border border-purple-500/30 rounded-lg pl-8 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/60 transition-all duration-200"
        />
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
      </div>
    </div>
  );
}

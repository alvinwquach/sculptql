"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface QueryHistoryItemProps {
  query: string;
  timestamp: string;
  icon?: ReactNode;
  onLoadQuery: () => void;
  actions?: ReactNode;
  additionalContent?: ReactNode;
}

export default function QueryHistoryItem({
  query,
  timestamp,
  icon,
  onLoadQuery,
  actions,
  additionalContent,
}: QueryHistoryItemProps) {
  return (
    <div className="p-3 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 cursor-pointer flex flex-col transition-all duration-200 hover:border-purple-400/40 mb-2">
      <div className="flex items-start" onClick={onLoadQuery}>
        {icon && <div className="flex-shrink-0 mr-1 mt-1">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm text-cyan-300 break-words whitespace-pre-wrap font-mono">
            {query}
          </p>
        </div>
      </div>
      <p className="text-xs text-purple-300/70 mt-2 font-mono">
        {new Date(timestamp).toLocaleString()}
      </p>
      {actions && <div className="flex flex-wrap gap-2 mt-2">{actions}</div>}
      {additionalContent}
    </div>
  );
}

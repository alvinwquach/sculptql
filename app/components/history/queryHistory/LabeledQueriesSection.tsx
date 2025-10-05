"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tag, Play, Pencil } from "lucide-react";
import { LabeledQuery, QueryHistoryItem } from "@/app/types/query";
import { Input } from "@/components/ui/input";

interface LabeledQueriesSectionProps {
  labeledQueries: LabeledQuery[];
  queryHistory: QueryHistoryItem[];
  onLoadQuery: (query: string) => void;
  onRunQuery: (query: string) => void;
  onEditLabel: (historyItemId: string, newLabel: string) => void;
  onRemoveLabel: (historyItemId: string) => void;
}

export default function LabeledQueriesSection({
  labeledQueries,
  queryHistory,
  onLoadQuery,
  onRunQuery,
  onEditLabel,
  onRemoveLabel,
}: LabeledQueriesSectionProps) {
  // State for editing query
  const [editingQuery, setEditingQuery] = useState<string | null>(null);
  // State for input value
  const [labelInput, setLabelInput] = useState<string>("");

  // Handler for editing query label
  const handleEditLabel = useCallback(
    (historyItemId: string, currentLabel: string) => {
      // If the query is already being edited, update the label
      if (editingQuery === historyItemId) {
        // If the input is not empty, update the label
        if (labelInput.trim()) {
          // Update the label in the parent component using the onEditLabel prop
          onEditLabel(historyItemId, labelInput.trim());
        }
        // Reset the input value and editing state
        setLabelInput("");
        setEditingQuery(null);
      } else {
        // Set the editing state to the history item id
        setEditingQuery(historyItemId);
        // Set the input value to the current label
        setLabelInput(currentLabel);
      }
    },
    [editingQuery, labelInput, onEditLabel]
  );

  // Handler for key down event
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, historyItemId: string) => {
      // If the enter key is pressed and the input is not empty, update the label
      if (e.key === "Enter" && labelInput.trim()) {
        // Update the label in the parent component using the onEditLabel prop
        onEditLabel(historyItemId, labelInput.trim());
        // Reset the input value and editing state
        setLabelInput("");
        setEditingQuery(null);
      }
    },
    [labelInput, onEditLabel]
  );

  return (
    <div className="border-b border-purple-500/20 pb-3">
      <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
        🏷️ Labeled Queries
      </h3>
      {labeledQueries.length === 0 ? (
        <p className="text-xs text-purple-300/60 py-2">
          No labeled queries found
        </p>
      ) : (
        labeledQueries.map((item) => {
          const historyItem = queryHistory.find(
            (h) => h.id === item.historyItemId
          );
          if (!historyItem) return null;

          return (
            <div
              key={`labeled-${item.id}`}
              className="p-3 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 cursor-pointer flex flex-col transition-all duration-200 hover:border-purple-400/40 mb-2"
              onClick={() => onLoadQuery(historyItem.query)}
            >
              <div className="flex items-start">
                <Tag className="w-4 h-4 mr-1 text-purple-400 mt-1 flex-shrink-0 hover:text-purple-500" />
                <div className="flex-1">
                  {editingQuery === item.historyItemId ? (
                    <Input
                      type="text"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      placeholder="Edit query label"
                      className="w-full p-1 text-sm bg-[#2d3748] text-white border border-slate-600 rounded"
                      onKeyDown={(e) => handleKeyDown(e, item.historyItemId)}
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
                    onRunQuery(historyItem.query);
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
                  {editingQuery === item.historyItemId ? "Cancel" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLabel(item.historyItemId);
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
  );
}

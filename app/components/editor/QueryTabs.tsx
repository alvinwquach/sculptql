"use client";

import { useState } from "react";
import { Tab } from "@/app/types/query";

interface QueryTabsProps {
  queryTabs: Tab[];
  activeTab: number;
  onTabClick: (id: number) => void;
  onTabClose: (id: number) => void;
  onTabReorder: (newTabs: Tab[]) => void;
}

export default function QueryTabs({
  queryTabs,
  activeTab,
  onTabClick,
  onTabClose,
  onTabReorder,
}: QueryTabsProps) {
  // Track which tab is currently being dragged
  const [dragId, setDragId] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart =
    (id: number) => (e: React.DragEvent<HTMLDivElement>) => {
      // Store the ID of the tab being dragged
      setDragId(id);
      // Tell browser this is a move operation
      e.dataTransfer.effectAllowed = "move";
    };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Prevent the default behavior
    e.preventDefault();
    // Indicate this is a valid drop location
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (id: number) => (e: React.DragEvent<HTMLDivElement>) => {
    // Prevent the default behavior
    e.preventDefault();
    // If we're dropping on the same tab or no drag is in progress, do nothing
    if (dragId === null || dragId === id) return;
    // Find the current positions of the dragged and target tabs
    const dragIndex = queryTabs.findIndex((tab) => tab.id === dragId);
    // Find the current positions of the dragged and target tabs
    const dropIndex = queryTabs.findIndex((tab) => tab.id === id);
    // Create a new array of tabs with the reordered positions
    const newTabs = [...queryTabs];
    // Remove the dragged tab
    const [draggedTab] = newTabs.splice(dragIndex, 1);
    // Insert the dragged tab at the target position
    newTabs.splice(dropIndex, 0, draggedTab);
    // Reorder the tabs
    onTabReorder(newTabs);
    // Reset the drag state
    setDragId(null);
  };

  return (
    <div className="flex items-center overflow-x-auto bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] border-b border-purple-500/30">
      {queryTabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center px-4 py-2 cursor-move whitespace-nowrap text-sm font-medium transition-all duration-300 relative ${
            activeTab === tab.id
              ? "bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-cyan-100 border-b-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-purple-300 hover:text-cyan-100 hover:bg-gradient-to-r hover:from-[#1e1b4b]/50 hover:to-[#312e81]/50 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)]"
          } ${dragId === tab.id ? "opacity-50 scale-95" : ""}`}
          draggable
          onDragStart={handleDragStart(tab.id)}
          onDragOver={handleDragOver}
          onDrop={handleDrop(tab.id)}
          onClick={() => onTabClick(tab.id)}
        >
          {activeTab === tab.id && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" />
          )}
          <span className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-wider">{tab.title}</span>
            {tab.id !== 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded transition-all duration-200 text-xs"
                title="Close tab"
              >
                ×
              </button>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

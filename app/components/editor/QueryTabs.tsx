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

  const handleDragStart =
    (id: number) => (e: React.DragEvent<HTMLDivElement>) => {
      // Store the ID of the tab being dragged
      setDragId(id);
      // Tell browser this is a move operation
      e.dataTransfer.effectAllowed = "move";
    };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Indicate this is a valid drop location
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (id: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // If we're dropping on the same tab or no drag is in progress, do nothing
    if (dragId === null || dragId === id) return;

    // Find the current positions of the dragged and target tabs
    const dragIndex = queryTabs.findIndex((tab) => tab.id === dragId);
    const dropIndex = queryTabs.findIndex((tab) => tab.id === id);

    // Create a new array of tabs with the reordered positions
    const newTabs = [...queryTabs];
    const [draggedTab] = newTabs.splice(dragIndex, 1);
    newTabs.splice(dropIndex, 0, draggedTab);
    onTabReorder(newTabs);
    // Reset the drag state
    setDragId(null);
  };

  return (
    <div className="flex items-center border-b border-slate-700 bg-[#1e293b] overflow-x-auto">
      {queryTabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center px-3 py-1 sm:px-4 sm:py-2 cursor-move whitespace-nowrap text-sm sm:text-base transition-all duration-300 ${
            activeTab === tab.id
              ? "bg-[#2d3748] text-[#f8f9fa]"
              : "bg-[#1e293b] text-[#9ca3af] hover:bg-[#2d3748] hover:text-[#f8f9fa]" // Inactive tab styling
          } ${dragId === tab.id ? "opacity-50" : ""}`}
          draggable
          onDragStart={handleDragStart(tab.id)}
          onDragOver={handleDragOver}
          onDrop={handleDrop(tab.id)}
          onClick={() => onTabClick(tab.id)}
          style={{ marginTop: 0, borderTop: "none" }}
        >
          {tab.title}
          {tab.id !== 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-2 text-red-400 hover:text-red-600 text-xs sm:text-sm"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

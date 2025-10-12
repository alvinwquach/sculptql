"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VerticalResizablePanelProps {
  topPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
  defaultTopHeight?: number;
  minTopHeight?: number;
  minBottomHeight?: number;
  localStorageKey?: string;
}

export default function VerticalResizablePanel({
  topPanel,
  bottomPanel,
  defaultTopHeight = 40,
  minTopHeight = 20,
  minBottomHeight = 30,
  localStorageKey = "vertical-split-height",
}: VerticalResizablePanelProps) {
  const [topHeight, setTopHeight] = useState(() => {
    if (typeof window !== "undefined" && localStorageKey) {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return defaultTopHeight;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newTopHeight =
        ((e.clientY - containerRect.top) / containerRect.height) * 100;

      if (newTopHeight >= minTopHeight && newTopHeight <= 100 - minBottomHeight) {
        setTopHeight(newTopHeight);
        if (localStorageKey) {
          localStorage.setItem(localStorageKey, newTopHeight.toString());
        }
      }
    },
    [isDragging, minTopHeight, minBottomHeight, localStorageKey]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full overflow-hidden">
      <div
        style={{ height: `${topHeight}%` }}
        className="flex flex-col w-full overflow-hidden"
      >
        {topPanel}
      </div>
      <div
        className="h-1 w-full bg-purple-500/20 hover:bg-purple-500/40 cursor-row-resize transition-colors relative group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1" />
        <div
          className={`absolute inset-0 bg-purple-500/60 transition-opacity ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        />
      </div>
      <div
        style={{ height: `${100 - topHeight}%` }}
        className="flex flex-col w-full overflow-hidden"
      >
        {bottomPanel}
      </div>
    </div>
  );
}
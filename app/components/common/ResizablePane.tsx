"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Interface for the resizable pane props
interface ResizablePaneProps {
  children: React.ReactNode;
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  direction?: "horizontal" | "vertical";
  className?: string;
}

// Component for the resizable pane
export default function ResizablePane({
  children,
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
  direction = "vertical",
  className = "",
}: ResizablePaneProps) {
  // Create the size state
  const [size, setSize] = useState(initialSize);
  // Create the is resizing state
  const [isResizing, setIsResizing] = useState(false);
  // Create the container ref
  const containerRef = useRef<HTMLDivElement>(null);
  // Create the start pos ref
  const startPosRef = useRef<number>(0);
  // Create the start size ref
  const startSizeRef = useRef<number>(0);

  // Function to handle the mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent the default behavior
    e.preventDefault();
    // Set the is resizing state to true
    setIsResizing(true);
    // Set the start pos ref to the client x or client y
    startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
    // Set the start size ref to the size
    startSizeRef.current = size;
  }, [size, direction]);

  // Function to handle the mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // If the is resizing state is not true or the container ref is not null, return
    if (!isResizing || !containerRef.current) return;
    // Create the current pos by the direction
    const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
    // Create the delta by the current pos and the start pos ref
    const delta = currentPos - startPosRef.current;
    // Create the container size by the direction
    const containerSize = direction === "horizontal" 
      ? containerRef.current.offsetWidth 
      : containerRef.current.offsetHeight;
    // Create the delta percent by the delta and the container size
    const deltaPercent = (delta / containerSize) * 100;
    // Create the new size by the min size, the max size, and the start size ref and the delta percent
    const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + deltaPercent));
    // Set the size to the new size
    setSize(newSize);
  }, [isResizing, minSize, maxSize, direction]);

  // Function to handle the mouse up
  const handleMouseUp = useCallback(() => {
    // Set the is resizing state to false
    setIsResizing(false);
  }, []);

  // Function to handle the use effect
  useEffect(() => {
    // If the is resizing state is true
    if (isResizing) {
      // Add the mouse move event listener
      document.addEventListener("mousemove", handleMouseMove);
      // Add the mouse up event listener
      document.addEventListener("mouseup", handleMouseUp);
      // Set the body style cursor to the direction
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      // Set the body style user select to none
      document.body.style.userSelect = "none";
    } else {
      // Remove the mouse move event listener
      document.removeEventListener("mousemove", handleMouseMove);
      // Remove the mouse up event listener
      document.removeEventListener("mouseup", handleMouseUp);
      // Set the body style cursor to none
      document.body.style.cursor = "";
      // 
      document.body.style.userSelect = "";
    }

    return () => {
      // Remove the mouse move event listener
      document.removeEventListener("mousemove", handleMouseMove);
      // Remove the mouse up event listener
      document.removeEventListener("mouseup", handleMouseUp);
      // Set the body style cursor to none
      document.body.style.cursor = "";
      // Set the body style user select to none
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

  // Create the size style by the direction
  const sizeStyle = direction === "horizontal" 
    ? { width: `${size}%` }
    : { height: `${size}%` };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={sizeStyle}
    >
      {children}
      <div
        className={`absolute ${
          direction === "horizontal" 
            ? "right-0 top-0 w-1 h-full cursor-col-resize hover:bg-cyan-400/50" 
            : "bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-cyan-400/50"
        } ${
          isResizing ? "bg-cyan-400" : "bg-purple-500/30"
        } transition-colors duration-200`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

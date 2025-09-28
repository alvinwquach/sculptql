"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Interface for the sidebar props
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Sidebar({ isOpen, onToggle, title, children, className = "" }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full w-96 lg:w-[32rem] xl:w-[36rem] bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] border-r border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)] transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-purple-500/30">
          <h2 className="text-sm sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-purple-400 hover:text-purple-200 hover:bg-purple-500/10 p-1 h-6 w-6 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {children}
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}
    </>
  );
}

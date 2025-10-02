"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  FileJson,
  FileText,
  FileCode,
  Braces,
  Terminal,
} from "lucide-react";

interface ResultsToolbarProps {
  hasResults: boolean;
  exportToCsv: () => void;
  exportToJson: () => void;
  exportToMarkdown: () => void;
  logQueryResultAsJson: () => void;
  exposeQueryResultsToConsole: () => void;
}

export default function ResultsToolbar({
  hasResults,
  exportToCsv,
  exportToJson,
  exportToMarkdown,
  logQueryResultAsJson,
  exposeQueryResultsToConsole,
}: ResultsToolbarProps) {
  if (!hasResults) return null;

  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-end gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">
            Export:
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToCsv}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition-all duration-200 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50 text-xs font-semibold"
                aria-label="Export to CSV"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="bg-slate-900 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/20 z-[100]"
            >
              Export to CSV
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToJson}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 hover:text-white hover:bg-blue-500/30 transition-all duration-200 border border-blue-500/30 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/50 text-xs font-semibold"
                aria-label="Export to JSON"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="bg-slate-900 border-blue-500/50 text-blue-200 shadow-lg shadow-blue-500/20 z-[100]"
            >
              Export to JSON
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToMarkdown}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-300 hover:text-white hover:bg-orange-500/30 transition-all duration-200 border border-orange-500/30 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/50 text-xs font-semibold"
                aria-label="Export to Markdown"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">MD</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="bg-slate-900 border-orange-500/50 text-orange-200 shadow-lg shadow-orange-500/20 z-[100]"
            >
              Export to Markdown
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-slate-600/50 mx-1 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={logQueryResultAsJson}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50 text-xs font-semibold"
                aria-label="Log query result as JSON"
              >
                <Braces className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log JSON</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="bg-slate-900 border-purple-500/50 text-purple-200 shadow-lg shadow-purple-500/20 z-[100]"
            >
              Log as JSON ({isMac ? "⌘⇧J" : "Ctrl+Shift+J"})
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={exposeQueryResultsToConsole}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 text-xs font-semibold"
                aria-label="Expose query results to console"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Console</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="bg-slate-900 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20 z-[100]"
            >
              Expose to console ({isMac ? "⌘⇧C" : "Ctrl+Shift+C"})
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

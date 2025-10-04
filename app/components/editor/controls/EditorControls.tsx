import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LucideHistory,
  LucidePlay,
  Menu,
} from "lucide-react";

interface EditorControlsProps {
  showHistory: boolean;
  onToggleHistory: () => void;
  onToggleMobileSidebar: () => void;
  loading?: boolean;
  runQuery: (query: string) => Promise<void>;
  query: string;
  hasDatabase?: boolean;
}

const EditorControls = memo(function EditorControls({
  showHistory,
  onToggleHistory,
  onToggleMobileSidebar,
  loading = false,
  runQuery,
  query,
  hasDatabase = true,
}: EditorControlsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-between backdrop-blur-sm bg-gradient-to-r from-gray-900/80 via-purple-900/80 to-gray-900/80">
        <div className="flex items-center gap-2 sm:gap-4">
          {hasDatabase && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMobileSidebar}
              className="sm:hidden p-2.5 rounded-xl bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50"
              aria-label="Toggle query builder"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-xl lg:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
              SculptQL
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
              <span className="text-xs font-semibold text-cyan-300">EDITOR</span>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
              <span className="text-xs font-mono text-yellow-300 hidden sm:inline">
                Loading...
              </span>
            </div>
          )}
        </div>
        {hasDatabase && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleHistory}
                  disabled={loading}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cyan-500/10"
                  aria-label="Toggle query history"
                >
                  <LucideHistory className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {showHistory ? "Hide" : "History"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="bg-slate-900 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20 z-[100]"
              >
                Toggle query history
              </TooltipContent>
            </Tooltip>
            <div className="ml-1 sm:ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => runQuery(query)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 hover:from-pink-400 hover:via-purple-500 hover:to-pink-400 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/70 border border-pink-400/40 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-pink-500/50 hover:scale-105 active:scale-95"
                    aria-label="Run query"
                  >
                    <LucidePlay className="w-4 h-4" fill="currentColor" />
                    <span className="hidden sm:inline font-mono tracking-wider">
                      RUN QUERY
                    </span>
                    <span className="sm:hidden font-mono">RUN</span>
                    <kbd className="hidden lg:inline ml-2 px-2 py-1 text-[10px] bg-black/30 rounded border border-white/20 font-mono">
                      {navigator.platform.includes("Mac") ? "⌘↵" : "Ctrl+↵"}
                    </kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={8}
                  className="bg-slate-900 border-pink-500/50 text-pink-200 shadow-lg shadow-pink-500/20 z-[100]"
                >
                  Run query ({navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"})
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

export default EditorControls;

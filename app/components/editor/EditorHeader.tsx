import { History, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorHeaderProps {
  showHistory: boolean;
  onToggleHistory: () => void;
  onAddTab: () => void;
  onRunQuery: () => void;
}

export default function EditorHeader({
  showHistory,
  onToggleHistory,
  onAddTab,
  onRunQuery,
}: EditorHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 px-4 pt-12 pb-6 border-b border-slate-700 bg-[#0f172a] shadow-sm">
      <div className="flex items-center space-x-3 min-w-[150px]">
        <Database className="w-6 h-6 text-green-400" />
        <h1 className="text-xl font-mono font-bold tracking-wide text-green-300 whitespace-nowrap">
          SculptQL
        </h1>
      </div>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative group">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleHistory}
            className={`px-3 py-1 rounded-lg transition-all duration-300 ease-in-out border-2 shadow-sm ${
              showHistory
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-md"
                : "text-white bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white"
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? "Hide History" : "Show History"}
          </Button>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
            Show/Hide History
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
          </div>
        </div>
        <div className="relative group">
          <Button
            onClick={onAddTab}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold rounded-lg transition duration-200 shadow-sm min-w-[100px]"
            title="New Tab (Ctrl+T)"
          >
            New Tab
          </Button>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
            Ctrl+T
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
          </div>
        </div>
        <div className="relative group">
          <Button
            onClick={onRunQuery}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-bold rounded-lg transition duration-200 shadow-sm min-w-[100px]"
            title="Run Query (Cmd+Enter / Ctrl+Enter)"
          >
            Run
          </Button>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 hidden md:group-hover:block bg-gray-700 text-white text-xs rounded px-2 py-1 shadow transition-opacity duration-150 whitespace-nowrap">
            {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"}
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}

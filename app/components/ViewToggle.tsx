import { Braces, Table as TableIcon, BarChart2 } from "lucide-react";
import { ViewMode } from "../types/query";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewToggle({
  viewMode,
  onViewModeChange,
}: ViewToggleProps) {
  return (
    <ul className="flex text-sm font-medium text-center text-gray-400 rounded-lg shadow-sm border border-slate-700 overflow-hidden mb-4">
      <li className="w-1/3">
        <button
          onClick={() => onViewModeChange("table")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "table"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-green-500 focus:z-10`}
          aria-current={viewMode === "table" ? "page" : undefined}
          type="button"
        >
          <TableIcon className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Table
        </button>
      </li>
      <li className="w-1/3">
        <button
          onClick={() => onViewModeChange("json")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "json"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-green-500 focus:z-10`}
          aria-current={viewMode === "json" ? "page" : undefined}
          type="button"
        >
          <Braces className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          JSON
        </button>
      </li>
      <li className="w-1/3">
        <button
          onClick={() => onViewModeChange("stats")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "stats"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-green-500 focus:z-10`}
          aria-current={viewMode === "stats" ? "page" : undefined}
          type="button"
        >
          <BarChart2 className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Stats
        </button>
      </li>
    </ul>
  );
}

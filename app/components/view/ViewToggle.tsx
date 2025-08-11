import { Table, Braces, BarChart2, Database, ListTree } from "lucide-react";
import { ViewMode } from "../../types/query";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewToggle({
  viewMode,
  onViewModeChange,
}: ViewToggleProps) {
  return (
    <ul className="flex flex-wrap text-sm font-medium text-center text-gray-400 rounded-lg shadow-sm border border-slate-700 overflow-hidden mb-4 bg-[#1e293b]">
      <li className="w-1/2 sm:w-1/5">
        <button
          onClick={() => onViewModeChange("table")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "table"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          }`}
          type="button"
        >
          <Table className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Table
        </button>
      </li>
      <li className="w-1/2 sm:w-1/5">
        <button
          onClick={() => onViewModeChange("json")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "json"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          }`}
          type="button"
        >
          <Braces className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          JSON
        </button>
      </li>
      <li className="w-1/2 sm:w-1/5">
        <button
          onClick={() => onViewModeChange("stats")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "stats"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          }`}
          type="button"
        >
          <BarChart2 className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Stats
        </button>
      </li>
      <li className="w-1/2 sm:w-1/5">
        <button
          onClick={() => onViewModeChange("show")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "show"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          }`}
          type="button"
        >
          <Database className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Show
        </button>
      </li>
      <li className="w-1/2 sm:w-1/5">
        <button
          onClick={() => onViewModeChange("describe")}
          className={`inline-block w-full p-3 transition-colors duration-200 ${
            viewMode === "describe"
              ? "bg-green-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-gray-300"
          }`}
          type="button"
        >
          <ListTree className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Describe
        </button>
      </li>
    </ul>
  );
}

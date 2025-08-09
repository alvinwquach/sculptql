import { Braces, Table as TableIcon } from "lucide-react";

type ViewMode = "json" | "table";

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
      <li className="w-1/2">
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
          Table View
        </button>
      </li>
      <li className="w-1/2">
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
          JSON View
        </button>
      </li>
    </ul>
  );
}

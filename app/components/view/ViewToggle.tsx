import {
  Table,
  Braces,
  BarChart2,
  Database,
  ListTree,
  BarChart,
  LineChart,
  PieChart,
} from "lucide-react";
import { ViewMode } from "../../types/query";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const viewModes: {
  mode: ViewMode;
  label: string;
  icon: React.ElementType;
}[] = [
  { mode: "table", label: "Table", icon: Table },
  { mode: "json", label: "JSON", icon: Braces },
  { mode: "stats", label: "Stats", icon: BarChart2 },
  { mode: "show", label: "Show", icon: Database },
  { mode: "describe", label: "Describe", icon: ListTree },
  { mode: "bar", label: "Bar", icon: BarChart },
  { mode: "line", label: "Line", icon: LineChart },
  { mode: "pie", label: "Pie", icon: PieChart },
];

export default function ViewToggle({
  viewMode,
  onViewModeChange,
}: ViewToggleProps) {
  return (
    <ul className="flex flex-wrap text-sm font-medium text-center text-gray-400 rounded-lg shadow-sm border border-slate-700 overflow-hidden mb-4 bg-[#1e293b]">
      {viewModes.map(({ mode, label, icon: Icon }) => (
        <li key={mode} className="w-1/2 sm:w-1/5">
          <button
            onClick={() => onViewModeChange(mode)}
            type="button"
            className={`w-full h-12 px-2 flex items-center justify-center space-x-2 transition-colors duration-200 ${
              viewMode === mode
                ? "bg-green-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-gray-300"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

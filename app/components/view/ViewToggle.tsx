import { Button } from "@/components/ui/button";
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

// Props for the ViewToggle component
interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

// Create the view modes
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
    <ul className="flex flex-wrap text-sm font-medium text-center text-cyan-300 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] border-2 border-purple-500/50 overflow-hidden mb-6 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] backdrop-blur-sm">
      {viewModes.map(({ mode, label, icon: Icon }) => (
        <li key={mode} className="w-1/2 sm:w-1/5">
          <Button
            onClick={() => onViewModeChange(mode)}
            type="button"
            className={`w-full h-12 px-2 flex items-center justify-center space-x-2 transition-all duration-300 font-mono ${
              viewMode === mode
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(244,114,182,0.5)] border border-pink-400/50"
                : "bg-transparent hover:bg-purple-500/20 text-cyan-300 hover:text-pink-300 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] border border-transparent hover:border-purple-400/30"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}

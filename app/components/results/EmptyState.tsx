import { Database, BarChart2, PieChart, LineChart } from "lucide-react";
import { ViewMode } from "@/app/types/query";

interface EmptyStateProps {
  viewMode: ViewMode;
}

export default function EmptyState({ viewMode }: EmptyStateProps) {
  const getIcon = () => {
    switch (viewMode) {
      case "bar":
        return <BarChart2 className="w-12 h-12 mb-4 text-green-400" />;
      case "pie":
        return <PieChart className="w-12 h-12 mb-4 text-green-400" />;
      case "line":
        return <LineChart className="w-12 h-12 mb-4 text-green-400" />;
      default:
        return <Database className="w-12 h-12 mb-4 text-green-400" />;
    }
  };

  const getMessage = () => {
    if (["bar", "pie", "line"].includes(viewMode)) {
      return `Run a query to visualize results as a ${viewMode} chart.`;
    }
    return "The results of your query will appear here.";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-8 rounded-xl shadow-lg border border-slate-700/50 min-h-screen">
      {getIcon()}
      <p className="text-xs sm:text-lg font-medium">{getMessage()}</p>
    </div>
  );
}

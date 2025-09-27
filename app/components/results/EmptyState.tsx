import { Database, BarChart2, PieChart, LineChart } from "lucide-react";
import { ViewMode } from "@/app/types/query";

// Props for the EmptyState component
interface EmptyStateProps {
  viewMode: ViewMode;
}

export default function EmptyState({ viewMode }: EmptyStateProps) {
  // Function to get the icon
  const getIcon = () => {
    // Switch the view mode
    switch (viewMode) {
      // Return the bar chart icon
      case "bar":
        return <BarChart2 className="w-12 h-12 mb-4 text-green-400" />;
      // Return the pie chart icon
      case "pie":
        return <PieChart className="w-12 h-12 mb-4 text-green-400" />;
      // Return the line chart icon
      case "line":
        return <LineChart className="w-12 h-12 mb-4 text-green-400" />;
      // Return the database icon
      default:
        return <Database className="w-12 h-12 mb-4 text-green-400" />;
    }
  };

  // Function to get the message
  const getMessage = () => {
    // If the view mode is bar, pie, or line
    if (["bar", "pie", "line"].includes(viewMode)) {
      // Return the message
      return `Run a query to visualize results as a ${viewMode} chart.`;
    }
    // Return the message
    return "The results of your query will appear here.";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-8 rounded-xl shadow-lg border border-slate-700/50 min-h-screen">
      {getIcon()}
      <p className="text-xs sm:text-lg font-medium">{getMessage()}</p>
    </div>
  );
}

"use client";

import { TooltipProps } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2, List, FileText } from "lucide-react";
import { ChartDataItem, QueryResult } from "../../types/query";
import { formatSize, formatTime } from "../../utils/helpers";


// Props for the StatsPanel component
interface StatsPanelProps {
  result: QueryResult;
  chartData: ChartDataItem[];
}

// Type for the custom tooltip props
type CustomTooltipProps = TooltipProps<number, string>;

export default function StatsPanel({ result, chartData }: StatsPanelProps) {
  // Create the stats by the result and the chart data
  const stats = [
    { label: "Rows Fetched", value: result.rowCount || 0, icon: List },
    {
      label: "Payload Size",
      value: formatSize(result.payloadSize),
      icon: FileText,
    },
    {
      label: "Query Time",
      value: formatTime(result.totalTime),
      icon: BarChart2,
    },
  ];

  // Create the normalized data by the chart data
  const normalizedData = chartData.map((data) => ({
    // Create the normalized data by the data and the value 
    ...data,
    // Create the value by the data and the value and the value is less than 1
    value: data.value < 1 ? data.value * 1000 : data.value,
  }));

  // Function to create the custom tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    // If the active state and the payload and the payload length is greater than 0
    if (active && payload && payload.length) {
      // Create the value by the payload at index 0 and the value as number
      const value = payload[0].value as number;
      // Return the custom tooltip
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-400 mb-2">{label}</p>
          <p className="text-white">Time: {value.toFixed(4)} ms</p>
          <p className="text-white">Seconds: {(value / 1000).toFixed(6)} sec</p>
        </div>
      );
    }
    // Return null
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="bg-slate-900 border-slate-700 hover:border-slate-600 transition-colors duration-200"
          >
            <CardHeader className="flex items-center space-x-2">
              {Icon && <Icon className="w-4 h-4 text-green-400" />}
              <CardTitle className="text-sm font-medium text-gray-300">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-green-400">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
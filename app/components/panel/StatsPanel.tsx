"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2, List, FileText } from "lucide-react";
import { ChartDataItem, QueryResult } from "../../types/query";
import { formatSize, formatTime } from "../../utils/helpers";

interface StatsPanelProps {
  result: QueryResult;
  chartData: ChartDataItem[];
}


export default function StatsPanel({ result }: StatsPanelProps) {
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

  return (
    <div className="h-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] border-2 border-purple-500/50 hover:border-pink-500/50 transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-sm"
          >
            <CardHeader className="flex items-center space-x-2">
              {Icon && <Icon className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
              <CardTitle className="text-sm font-medium text-cyan-300 font-mono">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
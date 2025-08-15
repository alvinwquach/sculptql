"use client";

import { TooltipProps } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2, List, FileText } from "lucide-react";
import { ChartDataItem, QueryResult } from "../../types/query";
import { formatSize, formatTime } from "../../utils/helpers";

interface StatsPanelProps {
  result: QueryResult;
  chartData: ChartDataItem[];
}

type CustomTooltipProps = TooltipProps<number, string>;

export default function StatsPanel({ result, chartData }: StatsPanelProps) {
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

  const normalizedData = chartData.map((data) => ({
    ...data,
    value: data.value < 1 ? data.value * 1000 : data.value,
  }));

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const value = payload[0].value as number;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-400 mb-2">{label}</p>
          <p className="text-white">Time: {value.toFixed(4)} ms</p>
          <p className="text-white">Seconds: {(value / 1000).toFixed(6)} sec</p>
        </div>
      );
    }
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
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart2,
  List,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Type,
  Database,
  Lock,
  Cpu,
  HardDrive,
} from "lucide-react";
import { ChartDataItem, QueryResult, Stat } from "../types/query";
import { formatSize, formatTime } from "../utils/formatTime";

interface StatsPanelProps {
  result: QueryResult;
  chartData: ChartDataItem[];
}

type CustomTooltipProps = TooltipProps<number, string>;

export default function StatsPanel({ result, chartData }: StatsPanelProps) {
  const stats: Stat[] = [
    { label: "Query Type", value: result.queryType || "Unknown", icon: Type },
    { label: "Rows Fetched", value: result.rowCount || 0, icon: List },
    {
      label: "Payload Size",
      value: formatSize(result.payloadSize),
      icon: FileText,
    },
    {
      label: "Parsing Time",
      value: formatTime(result.parsingTime),
      icon: Clock,
    },
    {
      label: "Execution Time",
      value: formatTime(result.executionTime),
      icon: Clock,
    },
    {
      label: "Response Time",
      value: formatTime(result.responseTime),
      icon: Clock,
    },
    {
      label: "Total Time",
      value: formatTime(result.totalTime),
      icon: Clock,
    },
    {
      label: "Row Processing Time",
      value: formatTime(result.rowProcessingTime),
      icon: Zap,
    },
    {
      label: "Avg Row Size",
      value:
        result.averageRowSize !== undefined
          ? `${result.averageRowSize.toFixed(4)} bytes`
          : "0 bytes",
      icon: FileText,
    },
    {
      label: "Index Used",
      value: result.indexUsed ? "Yes" : "No",
      icon: result.indexUsed ? CheckCircle : XCircle,
    },
    {
      label: "Estimated Cost",
      value:
        result.estimatedCost !== undefined
          ? result.estimatedCost.toFixed(4)
          : "N/A",
      icon: Clock,
    },
    {
      label: "Tables Involved",
      value:
        result.tablesInvolved && result.tablesInvolved.length > 0
          ? result.tablesInvolved.join(", ")
          : "N/A",
      icon: Database,
    },
    {
      label: "Rows Filtered",
      value: result.rowsFiltered || 0,
      icon: List,
    },
    {
      label: "Cache Hit",
      value: result.cacheHit ? "Yes" : "No",
      icon: result.cacheHit ? CheckCircle : XCircle,
    },
    {
      label: "Warnings Count",
      value: result.warningsCount || 0,
      icon: XCircle,
    },
    {
      label: "Errors Count",
      value: result.errorsCount || 0,
      icon: XCircle,
    },
    {
      label: "Locks Wait Time",
      value: formatTime(result.locksWaitTime),
      icon: Lock,
    },
    {
      label: "Parallel Workers",
      value: result.parallelWorkers || 0,
      icon: Cpu,
    },
    {
      label: "Temp Files Size",
      value: formatSize(result.tempFilesSize),
      icon: HardDrive,
    },
    {
      label: "Shared Hit Blocks",
      value: result.ioStats?.sharedHitBlocks || 0,
      icon: HardDrive,
    },
    {
      label: "Shared Read Blocks",
      value: result.ioStats?.sharedReadBlocks || 0,
      icon: HardDrive,
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition-colors duration-200">
        <CardHeader className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-green-400" />
          <CardTitle className="text-sm font-medium text-gray-300">
            Execution Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#9ca3af" className="text-xs" />
              <YAxis stroke="#9ca3af" unit="ms" className="text-xs" />
              <RechartsTooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

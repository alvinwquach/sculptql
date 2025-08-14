"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
  TooltipProps,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { ViewMode, ChartDataItem } from "../../types/query";

interface ChartsPanelProps {
  viewMode: ViewMode;
  chartData: ChartDataItem[];
}

const COLORS = [
  "#34d399",
  "#60a5fa",
  "#f87171",
  "#a78bfa",
  "#facc15",
  "#22d3ee",
];

export default function ChartsPanel({ viewMode, chartData }: ChartsPanelProps) {
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const value = payload[0].value as number;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-400 mb-2">{label}</p>
          <p className="text-white">Count: {value}</p>
        </div>
      );
    }
    return null;
  };
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200">
      <CardHeader className="flex items-center space-x-2">
        {viewMode === "bar" && <BarChart2 className="w-4 h-4 text-green-400" />}
        {viewMode === "pie" && (
          <PieChartIcon className="w-4 h-4 text-green-400" />
        )}
        {viewMode === "line" && (
          <LineChartIcon className="w-4 h-4 text-green-400" />
        )}
        <CardTitle className="text-sm font-medium text-gray-300">
          {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-gray-400 text-center">
            No data available to display the chart.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {viewMode === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#9ca3af" className="text-xs" />
                <YAxis stroke="#9ca3af" className="text-xs" />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : viewMode === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#34d399"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      name={entry.name}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-green-400 mb-2">
                            {payload[0].name}
                          </p>
                          <p className="text-white">
                            Count: {payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const item = chartData.find((d) => d.name === value);
                    return `${value}: ${item?.value ?? 0}`;
                  }}
                />
              </PieChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#9ca3af" className="text-xs" />
                <YAxis stroke="#9ca3af" className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ fill: "#34d399", r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

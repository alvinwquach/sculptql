"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download,
} from "lucide-react";
import domtoimage from "dom-to-image";
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
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    if (viewMode === "pie" && chartData.length > 0) {
      const minHeightPerItem = 30;
      const newHeight = Math.max(
        400,
        200 + chartData.length * minHeightPerItem
      );
      setContainerHeight(newHeight);
    } else {
      setContainerHeight(300);
    }
  }, [viewMode, chartData]);

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

  const exportToPNG = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await domtoimage.toPng(chartRef.current, {
        width: 800,
        height: containerHeight + 50,
        bgcolor: "#1e293b",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `chart_${viewMode}_${new Date().toISOString()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to PNG:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJPEG = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await domtoimage.toJpeg(chartRef.current, {
        width: 800,
        height: containerHeight + 50,
        bgcolor: "#1e293b",
        quality: 0.9,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `chart_${viewMode}_${new Date().toISOString()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to JPEG:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToSVG = () => {
    if (!chartRef.current) return;
    const svgElement = chartRef.current.querySelector("svg");
    if (!svgElement) return;
    setIsExporting(true);
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chart_${viewMode}_${new Date().toISOString()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to SVG:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          {viewMode === "bar" && (
            <BarChart2 className="w-4 h-4 text-green-400" />
          )}
          {viewMode === "pie" && (
            <PieChartIcon className="w-4 h-4 text-green-400" />
          )}
          {viewMode === "line" && (
            <LineChartIcon className="w-4 h-4 text-green-400" />
          )}
          <CardTitle className="text-sm font-medium text-gray-300">
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Chart
          </CardTitle>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={exportToPNG}
            disabled={isExporting}
            className="px-3 py-1 rounded-lg text-sm font-medium border-2 bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export as PNG"
          >
            <Download className="w-4 h-4 mr-2" />
            PNG
          </Button>
          <Button
            onClick={exportToJPEG}
            disabled={isExporting}
            className="px-3 py-1 rounded-lg text-sm font-medium border-2 bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export as JPEG"
          >
            <Download className="w-4 h-4 mr-2" />
            JPEG
          </Button>
          <Button
            onClick={exportToSVG}
            disabled={isExporting}
            className="px-3 py-1 rounded-lg text-sm font-medium border-2 bg-slate-800 text-green-300 border-slate-700 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export as SVG"
          >
            <Download className="w-4 h-4 mr-2" />
            SVG
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-gray-400 text-center">
            No data available to display the chart.
          </p>
        ) : (
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={containerHeight}>
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
                    cy="40%"
                    innerRadius={0}
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
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      padding: "10px",
                      fontSize: "10px",
                      maxWidth: "150px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    formatter={(value) => {
                      const item = chartData.find((d) => d.name === value);
                      return `${
                        value.length > 20 ? value.slice(0, 20) + "..." : value
                      }: ${item?.value ?? 0}`;
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
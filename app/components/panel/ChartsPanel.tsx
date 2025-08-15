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
  CartesianGrid,
  Cell,
  Legend,
  TooltipProps,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download,
} from "lucide-react";
import domtoimage from "dom-to-image";
import { ViewMode, ChartDataItem } from "../../types/query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChartsPanelProps {
  viewMode: ViewMode;
  chartData: ChartDataItem[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const COLORS = [
  "#34d399",
  "#60a5fa",
  "#f87171",
  "#a78bfa",
  "#facc15",
  "#22d3ee",
];

export default function ChartsPanel({
  viewMode,
  chartData,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ChartsPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [containerHeight, setContainerHeight] = useState(400);
  const chartRef = useRef<HTMLDivElement>(null);

  const totalItems = chartData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedChartData = chartData.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  useEffect(() => {
    if (viewMode === "pie" && paginatedChartData.length > 0) {
      const minHeightPerItem = 30;
      const newHeight = Math.max(
        400,
        200 + paginatedChartData.length * minHeightPerItem
      );
      setContainerHeight(newHeight);
    } else {
      setContainerHeight(300);
    }
  }, [viewMode, paginatedChartData]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const value = payload[0].value as number;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm shadow-md">
          <p className="font-semibold text-green-400 mb-2">{label}</p>
          <p className="text-white">Count: {value}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const name = payload[0].name ?? "Unknown";
      const value = payload[0].value as number;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm shadow-md">
          <p className="font-semibold text-green-400 mb-2">{name}</p>
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
    <Card className="bg-slate-800 border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-200 shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          {viewMode === "bar" && (
            <BarChart2 className="w-5 h-5 text-green-400" />
          )}
          {viewMode === "pie" && (
            <PieChartIcon className="w-5 h-5 text-green-400" />
          )}
          {viewMode === "line" && (
            <LineChartIcon className="w-5 h-5 text-green-400" />
          )}
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-300">
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Chart
          </CardTitle>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={exportToPNG}
                  disabled={isExporting}
                  className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-slate-600 bg-slate-800 text-green-300 hover:bg-green-500 hover:text-white transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-20 sm:w-auto"
                >
                  <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                  PNG
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export chart as PNG</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={exportToJPEG}
                  disabled={isExporting}
                  className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-slate-600 bg-slate-800 text-green-300 hover:bg-green-500 hover:text-white transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-20 sm:w-auto"
                >
                  <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                  JPEG
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export chart as JPEG</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={exportToSVG}
                  disabled={isExporting}
                  className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-slate-600 bg-slate-800 text-green-300 hover:bg-green-500 hover:text-white transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-20 sm:w-auto"
                >
                  <Download className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                  SVG
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export chart as SVG</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {paginatedChartData.length === 0 ? (
          <p className="text-gray-300 text-center text-sm font-medium">
            No data available to display the chart.
          </p>
        ) : (
          <>
            <div ref={chartRef}>
              <ResponsiveContainer width="100%" height={containerHeight}>
                {viewMode === "bar" ? (
                  <BarChart data={paginatedChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <RechartsTooltip content={CustomTooltip} />
                    <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : viewMode === "pie" ? (
                  <PieChart>
                    <Pie
                      data={paginatedChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="40%"
                      innerRadius={0}
                      outerRadius={100}
                      fill="#34d399"
                    >
                      {paginatedChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          name={entry.name}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={PieTooltip} />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{
                        padding: "10px",
                        fontSize: "12px",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      formatter={(value) => {
                        const item = paginatedChartData.find(
                          (d) => d.name === value
                        );
                        return `${
                          value.length > 20 ? value.slice(0, 20) + "..." : value
                        }: ${item?.value ?? 0}`;
                      }}
                    />
                  </PieChart>
                ) : (
                  <LineChart data={paginatedChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <RechartsTooltip content={CustomTooltip} />
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
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 flex-wrap">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => onPageSizeChange(Number(value))}
                  >
                    <SelectTrigger className="w-28 sm:w-32 bg-slate-800 text-green-300 border-slate-600 rounded-full text-xs sm:text-sm">
                      <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-green-300 border-slate-600">
                      {[5, 10, 20].map((size) => (
                        <SelectItem
                          key={size}
                          value={size.toString()}
                          className="text-xs sm:text-sm"
                        >
                          {size} per page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs sm:text-sm text-gray-300">
                    Showing {startIndex + 1}–{endIndex} of {totalItems} items
                  </span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm"
                  >
                    Previous
                  </Button>
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className={`px-2 sm:px-3 py-1 text-green-300 border-slate-600 ${
                        page === currentPage
                          ? "bg-green-500 text-white"
                          : "bg-slate-800 hover:bg-green-500 hover:text-white"
                      } transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm`}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 text-green-300 border-slate-600 bg-slate-800 hover:bg-green-500 hover:text-white transition-all duration-200 rounded-full shadow-sm text-xs sm:text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
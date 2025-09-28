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

// Props for the ChartsPanel component
interface ChartsPanelProps {
  viewMode: ViewMode;
  chartData: ChartDataItem[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// Create the colors
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
  // Create the is exporting state
  const [isExporting, setIsExporting] = useState(false);
  // Create the container height state
  const [containerHeight, setContainerHeight] = useState(400);
  // Create the chart reference
  const chartRef = useRef<HTMLDivElement>(null);
  // Create the total items by the chart data length
  const totalItems = chartData.length;
  // Create the total pages by the total items and the page size
  const totalPages = Math.ceil(totalItems / pageSize);
  // Create the start index by the current page and the page size
  const startIndex = (currentPage - 1) * pageSize;
  // Create the end index by the start index and the page size and the total items
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  // Create the paginated chart data by the chart data, start index, and end index
  const paginatedChartData = chartData.slice(startIndex, endIndex);

  // Function to get the page numbers
  const getPageNumbers = () => {
    // Create the max pages to show
    const maxPagesToShow = 5;
    // Create the half by the max pages to show
    const half = Math.floor(maxPagesToShow / 2);
    // Create the start page by the current page and the half
    let startPage = Math.max(1, currentPage - half);
    // Create the end page by the total pages and the start page and the max pages to show
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    // If the end page and the start page and the max pages to show is less than the max pages to show
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Initialize pages to an empty array and create the pages by the start page and the end page 
    const pages = [];
    // Loop through the start page and the end page
    for (let i = startPage; i <= endPage; i++) {
      // Push the page to the pages array
      pages.push(i);
    }
    // Return the pages
    return pages;
  };

  // Function to use the effect
  useEffect(() => {
    // If the view mode is pie and the paginated chart data length is greater than 0
    if (viewMode === "pie" && paginatedChartData.length > 0) {
      // Create the min height per item by 30
      const minHeightPerItem = 30;
      // Create the new height by the min height per item and the paginated chart data length
      const newHeight = Math.max(
        400,
        200 + paginatedChartData.length * minHeightPerItem
      );
      // Set the container height to the new height
      setContainerHeight(newHeight);
    } else {
      // Set the container height to 300
      setContainerHeight(300);
    }
  }, [viewMode, paginatedChartData]);

  // Function to create the custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    // If the active state and the payload and the payload length is greater than 0
    if (active && payload && payload.length) {
      // Create the value by the payload at index 0 and the value as number
      const value = payload[0].value as number;
      // Return the custom tooltip
      return (
        <div className="bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] border-2 border-purple-500/50 rounded-lg p-3 text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <p className="font-semibold text-cyan-400 mb-2 font-mono">{label}</p>
          <p className="text-cyan-300 font-mono">Count: {value}</p>
        </div>
      );
    }
    // Return null
    return null;
  };

  // Function to create the pie tooltip
  const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    // If the active state and the payload and the payload length is greater than 0
    if (active && payload && payload.length) {
      // Create the name by the payload at index 0 and the name as string
      const name = payload[0].name ?? "Unknown";
      // Create the value by the payload at index 0 and the value as number
      const value = payload[0].value as number;
      // Return the pie tooltip
      return (
        <div className="bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] border-2 border-purple-500/50 rounded-lg p-3 text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <p className="font-semibold text-cyan-400 mb-2 font-mono">{name}</p>
          <p className="text-cyan-300 font-mono">Count: {value}</p>
        </div>
      );
    }
    return null;
  };

  // Function to export to PNG
  const exportToPNG = async () => {
    // If the chart reference is not null
    if (!chartRef.current) return;
    // Set the exporting state to true
    setIsExporting(true);
    // Try to export to PNG
    try {
      // Create the data URL by the chart reference and the container height and the background color
      const dataUrl = await domtoimage.toPng(chartRef.current, {
        width: 800,
        height: containerHeight + 50,
        bgcolor: "#1e293b",
      });
      // Create the link by the document create element
      const link = document.createElement("a");
      // Set the href to the data URL
      link.href = dataUrl;
      // Set the download to the chart mode and the new date to ISO string
      link.download = `chart_${viewMode}_${new Date().toISOString()}.png`;
      // Append the link to the body
      document.body.appendChild(link);
      // Click the link
      link.click();
      // Remove the link from the body
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to PNG:", error);
    } finally {
      // Set the exporting state to false
      setIsExporting(false);
    }
  };

  // Function to export to JPEG
  const exportToJPEG = async () => {
    // If the chart reference is not null
    if (!chartRef.current) return;
    // Set the exporting state to true
    setIsExporting(true);
    try {
      // Create the data URL by the chart reference and the container height and the background color and the quality
      const dataUrl = await domtoimage.toJpeg(chartRef.current, {
        width: 800,
        height: containerHeight + 50,
        bgcolor: "#1e293b",
        quality: 0.9,
      });
      // Create the link by the document create element
      const link = document.createElement("a");
      // Set the href to the data URL
      link.href = dataUrl;
      // Set the download to the chart mode and the new date to ISO string
      link.download = `chart_${viewMode}_${new Date().toISOString()}.jpg`;
      // Append the link to the body
      document.body.appendChild(link);
      // Click the link
      link.click();
      // Remove the link from the body
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to JPEG:", error);
    } finally {
      // Set the exporting state to false
      setIsExporting(false);
    }
  };

  // Function to export to SVG
  const exportToSVG = () => {
    // If the chart reference is not null
    if (!chartRef.current) return;
    // Create the svg element by the chart reference and the query selector
    const svgElement = chartRef.current.querySelector("svg");
    // If the svg element is not null
    if (!svgElement) return;
    // Set the exporting state to true
    setIsExporting(true);
    try {
      // Create the serializer by the XML serializer
      const serializer = new XMLSerializer();
      // Create the svg string by the serializer and the svg element
      const svgString = serializer.serializeToString(svgElement);
      // Create the blob by the svg string and the type
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      // Create the url by the blob
      const url = URL.createObjectURL(blob);
      // Create the link by the document create element
      const link = document.createElement("a");
      // Set the href to the url
      link.href = url;
      // Set the download to the chart mode and the new date to ISO string
      link.download = `chart_${viewMode}_${new Date().toISOString()}.svg`;
      // Append the link to the body
      document.body.appendChild(link);
      // Click the link
      link.click();
      // Remove the link from the body
      document.body.removeChild(link);
      // Revoke the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to SVG:", error);
    } finally {
      // Set the exporting state to false
      setIsExporting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] border-2 border-purple-500/50 hover:border-pink-500/50 transition-all duration-300 shadow-[0_0_25px_rgba(139,92,246,0.3)] rounded-xl backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          {viewMode === "bar" && (
            <BarChart2 className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          )}
          {viewMode === "pie" && (
            <PieChartIcon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          )}
          {viewMode === "line" && (
            <LineChartIcon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          )}
          <CardTitle className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono">
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
                  className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-cyan-500/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 hover:text-cyan-100 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-20 sm:w-auto font-mono"
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
                  className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-pink-500/50 bg-pink-500/20 text-pink-300 hover:bg-pink-500/40 hover:text-pink-100 hover:shadow-[0_0_10px_rgba(244,114,182,0.3)] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-20 sm:w-auto font-mono"
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
                  className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 hover:text-purple-100 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-20 sm:w-auto font-mono"
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
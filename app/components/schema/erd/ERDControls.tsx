import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";

interface ERDControlsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToView: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
}

export default function ERDControls({
  zoomIn,
  zoomOut,
  resetZoom,
  fitToView,
  showLegend,
  onToggleLegend,
}: ERDControlsProps) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={zoomIn}
            className="group bg-gradient-to-r from-slate-800/90 to-slate-700/90 text-cyan-300 p-2.5 rounded-xl hover:from-cyan-500/20 hover:to-purple-500/20 transition-all duration-300 shadow-lg border border-cyan-500/20 hover:border-cyan-400/50 backdrop-blur-sm hover:shadow-cyan-500/30"
          >
            <ZoomIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-sm bg-slate-800 border-purple-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20 z-[100]"
        >
          Zoom In
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={zoomOut}
            className="group bg-gradient-to-r from-slate-800/90 to-slate-700/90 text-cyan-300 p-2.5 rounded-xl hover:from-cyan-500/20 hover:to-purple-500/20 transition-all duration-300 shadow-lg border border-cyan-500/20 hover:border-cyan-400/50 backdrop-blur-sm hover:shadow-cyan-500/30"
          >
            <ZoomOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-sm bg-slate-800 border-purple-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20 z-[100]"
        >
          Zoom Out
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={resetZoom}
            className="group bg-gradient-to-r from-slate-800/90 to-slate-700/90 text-purple-300 p-2.5 rounded-xl hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 shadow-lg border border-purple-500/20 hover:border-purple-400/50 backdrop-blur-sm hover:shadow-purple-500/30"
          >
            <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-sm bg-slate-800 border-purple-500/50 text-purple-200 shadow-lg shadow-purple-500/20 z-[100]"
        >
          Reset Zoom
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={fitToView}
            className="group bg-gradient-to-r from-cyan-500/90 to-purple-500/90 text-white px-4 py-2.5 rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 shadow-lg font-medium font-mono border border-cyan-400/30 hover:shadow-cyan-500/40 backdrop-blur-sm"
          >
            <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm">FIT TO VIEW</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-sm bg-slate-800 border-purple-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20 z-[100]"
        >
          Fit entire diagram to view
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onToggleLegend}
            className={`group ${
              showLegend
                ? "bg-gradient-to-r from-emerald-500/90 to-cyan-500/90"
                : "bg-gradient-to-r from-slate-800/90 to-slate-700/90"
            } text-white p-2.5 rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg border ${
              showLegend
                ? "border-emerald-400/30 shadow-emerald-500/40"
                : "border-slate-500/20 hover:border-emerald-400/50"
            } backdrop-blur-sm`}
          >
            <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-sm bg-slate-800 border-purple-500/50 text-emerald-200 shadow-lg shadow-emerald-500/20 z-[100]"
        >
          {showLegend ? "Hide Legend" : "Show Legend"}
        </TooltipContent>
      </Tooltip>
    </>
  );
}

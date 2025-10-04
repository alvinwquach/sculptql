import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, ChevronDown, FileJson, FileImage } from "lucide-react";
import { ErdExportFunctions } from "@/app/hooks/useErdExportFunctions";

interface ERDExportMenuProps {
  exportFunctions: ErdExportFunctions;
}

export default function ERDExportMenu({ exportFunctions }: ERDExportMenuProps) {
  // State for showing export menu
  const [showExportMenu, setShowExportMenu] = useState(false);
  // Export functions
  const { exportToSvg, exportToPng, exportToJpeg, exportToJson } =
    exportFunctions;

  // Handler for exporting
  const handleExport = useCallback(
    (exportFn: () => void) => {
      // Export the function
      exportFn();
      // Set the show export menu to false
      setShowExportMenu(false);
    },
    []
  );

  useEffect(() => {
    // Handler for clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // If the show export menu and the target is not the export menu container
      if (showExportMenu && !target.closest(".export-menu-container")) {
        // Set the show export menu to false
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  return (
    <div className="relative export-menu-container">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="group bg-gradient-to-r from-pink-500/90 to-purple-500/90 text-white px-3 py-2.5 rounded-xl hover:from-pink-400 hover:to-purple-400 transition-all duration-300 shadow-lg border border-pink-400/30 hover:shadow-pink-500/40 backdrop-blur-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-mono">EXPORT</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                showExportMenu ? "rotate-180" : ""
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-sm bg-slate-800 border-purple-500/50 text-pink-200 shadow-lg shadow-pink-500/20 z-[100]"
        >
          Export diagram in multiple formats
        </TooltipContent>
      </Tooltip>

      {showExportMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-sm rounded-xl border border-purple-500/30 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            <Button
              onClick={() => handleExport(exportToSvg)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-500/20 transition-colors text-left group"
            >
              <FileImage className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-mono text-cyan-200 group-hover:text-cyan-100">
                SVG
              </span>
            </Button>
            <Button
              onClick={() => handleExport(exportToPng)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-colors text-left group"
            >
              <FileImage className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-mono text-purple-200 group-hover:text-purple-100">
                PNG
              </span>
            </Button>
            <Button
              onClick={() => handleExport(exportToJpeg)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-pink-500/20 transition-colors text-left group"
            >
              <FileImage className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-mono text-pink-200 group-hover:text-pink-100">
                JPEG
              </span>
            </Button>
            <div className="h-px bg-purple-500/20 my-1"></div>
            <Button
              onClick={() => handleExport(exportToJson)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors text-left group"
            >
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-mono text-emerald-200 group-hover:text-emerald-100">
                Schema JSON
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

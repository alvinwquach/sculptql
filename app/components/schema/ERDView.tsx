"use client";

import { useRef, useState } from "react";
import { TableSchema } from "@/app/types/query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useD3Diagram } from "@/app/hooks/useD3Diagram";
import { useErdExportFunctions } from "@/app/hooks/useErdExportFunctions";
import ERDStats from "./erd/ERDStats";
import ERDLegend from "./erd/ERDLegend";
import ERDControls from "./erd/ERDControls";
import ERDExportMenu from "./erd/ERDExportMenu";

interface ERDViewProps {
  schema: TableSchema[];
}

export default function ERDView({ schema }: ERDViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const { zoomIn, zoomOut, resetZoom, fitToView } = useD3Diagram(
    svgRef,
    containerRef,
    schema
  );

  const exportFunctions = useErdExportFunctions(svgRef, schema);

  return (
    <div
      ref={containerRef}
      className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-sm rounded-xl p-6 overflow-hidden relative erd-container border border-purple-500/20 shadow-lg"
    >
      <TooltipProvider delayDuration={200}>
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <ERDControls
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            resetZoom={resetZoom}
            fitToView={fitToView}
            showLegend={showLegend}
            onToggleLegend={() => setShowLegend(!showLegend)}
          />
          <ERDExportMenu exportFunctions={exportFunctions} />
        </div>
        <ERDStats schema={schema} />
        <ERDLegend show={showLegend} />
      </TooltipProvider>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
}

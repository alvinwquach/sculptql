import { Info } from "lucide-react";

interface ERDLegendProps {
  show: boolean;
}

export default function ERDLegend({ show }: ERDLegendProps) {
  if (!show) return null;

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 shadow-xl max-w-xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-500/20">
        <Info className="w-4 h-4 text-cyan-400" />
        <h3 className="text-cyan-300 font-mono font-bold text-sm">LEGEND</h3>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
          <span className="text-yellow-200 font-mono text-xs">
            Primary Key (PK)
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 bg-pink-400 rounded-sm"></div>
          <span className="text-pink-200 font-mono text-xs">
            Foreign Key (FK)
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 bg-slate-300 rounded-sm"></div>
          <span className="text-slate-200 font-mono text-xs">
            Regular Column
          </span>
        </div>
        <div className="flex items-center gap-2.5 pt-1 border-t border-purple-500/20">
          <svg width="20" height="2">
            <line
              x1="0"
              y1="1"
              x2="20"
              y2="1"
              stroke="#f472b6"
              strokeWidth="2"
              strokeDasharray="3,3"
            />
          </svg>
          <span className="text-pink-200 font-mono text-xs">Relationship</span>
        </div>
        <div className="text-xs text-slate-400 font-mono mt-3 pt-2 border-t border-purple-500/20">
          Drag tables to reposition • Scroll to zoom • Click &amp; drag to pan
        </div>
      </div>
    </div>
  );
}

import { TableSchema } from "@/app/types/query";

interface ERDStatsProps {
  schema: TableSchema[];
}

export default function ERDStats({ schema }: ERDStatsProps) {
  // Count the number of foreign keys
  const linkCount = schema.reduce(
    // Reduce the schema by the foreign keys length
    (acc, table) => acc + table.foreign_keys.length,
    0
  );

  return (
    <div className="absolute top-6 left-6 z-10">
      <div className="bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-purple-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
            <span className="text-purple-300 text-sm font-mono font-bold">
              {schema.length}
            </span>
            <span className="text-purple-300/60 text-xs font-mono">TABLES</span>
          </div>
          <div className="w-px h-4 bg-purple-500/30"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,114,182,0.8)]"></div>
            <span className="text-pink-300 text-sm font-mono font-bold">
              {linkCount}
            </span>
            <span className="text-pink-300/60 text-xs font-mono">LINKS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

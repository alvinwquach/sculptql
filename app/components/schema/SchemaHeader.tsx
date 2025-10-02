import { memo } from "react";
import { Database } from "lucide-react";

const SchemaHeader = memo(function SchemaHeader() {
  return (
    <div className="flex items-center justify-between backdrop-blur-sm bg-gradient-to-r from-gray-900/80 via-purple-900/80 to-gray-900/80 px-4 py-3 border-b border-purple-500/20">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-xl lg:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
            SculptQL
          </h1>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
            <span className="text-xs font-semibold text-cyan-300">SCHEMA</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-purple-400" />
      </div>
    </div>
  );
});

export default SchemaHeader;

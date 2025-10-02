import { Skeleton } from "@/components/ui/skeleton";

export default function ERDSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-sm rounded-xl p-6 overflow-hidden relative border border-purple-500/20 shadow-lg min-h-[600px]">
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-purple-500/20 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
              <Skeleton className="h-5 w-8 bg-purple-400/30 rounded" />
              <Skeleton className="h-4 w-14 bg-purple-400/20 rounded" />
            </div>
            <div className="w-px h-4 bg-purple-500/30"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,114,182,0.8)]"></div>
              <Skeleton className="h-5 w-8 bg-pink-400/30 rounded" />
              <Skeleton className="h-4 w-10 bg-pink-400/20 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <Skeleton className="h-10 w-10 bg-gradient-to-r from-slate-800/90 to-slate-700/90 rounded-xl border border-cyan-500/20" />
        <Skeleton className="h-10 w-10 bg-gradient-to-r from-slate-800/90 to-slate-700/90 rounded-xl border border-cyan-500/20" />
        <Skeleton className="h-10 w-10 bg-gradient-to-r from-slate-800/90 to-slate-700/90 rounded-xl border border-purple-500/20" />
        <Skeleton className="h-10 w-32 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-xl border border-cyan-400/30" />
        <Skeleton className="h-10 w-10 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-xl border border-pink-400/30" />
        <Skeleton className="h-10 w-10 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-xl border border-emerald-400/30" />
      </div>
      <div className="mt-20 flex items-center justify-center gap-12 flex-wrap px-8">
        <div className="bg-[#1e293b] border-2 border-cyan-500/40 rounded-xl p-4 w-80 shadow-lg">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-cyan-500/30">
            <Skeleton className="h-5 w-32 bg-cyan-400/30 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-5/6 bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-4/5 bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-full bg-slate-700/50 rounded" />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="w-20 h-1 bg-pink-500/40 rounded-full relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-pink-500/40 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
          </div>
        </div>
        <div className="bg-[#1e293b] border-2 border-cyan-500/40 rounded-xl p-4 w-80 shadow-lg">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-cyan-500/30">
            <Skeleton className="h-5 w-28 bg-cyan-400/30 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-3/4 bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-5/6 bg-slate-700/50 rounded" />
          </div>
        </div>
      </div>
      <div className="mt-12 flex items-center justify-center gap-12 flex-wrap px-8">
        <div className="bg-[#1e293b] border-2 border-cyan-500/40 rounded-xl p-4 w-80 shadow-lg">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-cyan-500/30">
            <Skeleton className="h-5 w-36 bg-cyan-400/30 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-4/5 bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-5/6 bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-3/4 bg-slate-700/50 rounded" />
            <Skeleton className="h-4 w-full bg-slate-700/50 rounded" />
          </div>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 backdrop-blur-sm rounded-xl px-6 py-4 border border-purple-500/30 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-cyan-300 font-mono text-sm font-bold">
              Loading ERD...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

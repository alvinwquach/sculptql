"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function EditorSkeleton() {
  return (
    <div className="flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white h-screen">
      <div className="flex-shrink-0 border-b border-purple-500/20 bg-gradient-to-r from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-3 shadow-[0_4px_20px_rgba(139,92,246,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-6 w-32 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 rounded" />
            <Skeleton className="h-4 w-48 bg-cyan-300/20 rounded hidden sm:block" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            <Skeleton className="h-8 w-20 bg-purple-500/20 rounded border border-purple-500/30" />
            <Skeleton className="h-8 w-24 bg-cyan-500/20 rounded border border-cyan-500/30" />
            <Skeleton className="h-8 w-28 bg-gradient-to-r from-pink-500/30 to-purple-600/30 rounded border border-pink-400/30 hidden sm:block" />
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-w-0 overflow-hidden flex">
        <div className="w-1/5 min-w-[200px] flex-shrink-0 border-r border-purple-500/20 bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] overflow-y-auto">
          <div className="flex-shrink-0 border-b border-purple-500/20 bg-gradient-to-r from-[#0f0f23]/95 to-[#1a1a2e]/95 backdrop-blur-sm px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
              <Skeleton className="h-4 w-28 bg-purple-400/30 rounded" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <Skeleton className="h-3 w-12 bg-slate-400/20 rounded mb-2" />
              <Skeleton className="h-10 w-full bg-purple-400/10 rounded border border-purple-500/20" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 bg-slate-400/20 rounded mb-2" />
              <Skeleton className="h-10 w-full bg-purple-400/10 rounded border border-purple-500/20" />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0" style={{ flexBasis: "30%" }}>
          <div className="w-1 h-full bg-purple-500/20 hover:bg-purple-500/40 float-left"></div>
          <div className="p-2 h-full">
            <div className="h-full rounded-lg border border-purple-500/20 bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-purple-500/20 bg-[#0f0f23]/60">
                <Skeleton className="h-8 w-24 bg-cyan-400/20 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 bg-purple-400/20 rounded border border-purple-500/30" />
                  <Skeleton className="h-8 w-8 bg-cyan-400/20 rounded border border-cyan-500/30" />
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 border-b border-purple-500/20">
                <Skeleton className="h-8 w-20 bg-purple-400/20 rounded" />
                <Skeleton className="h-8 w-20 bg-purple-400/10 rounded" />
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <Skeleton className="h-3 sm:h-4 w-full bg-purple-400/10 rounded border border-purple-500/20" />
                  <Skeleton className="h-3 sm:h-4 w-3/4 bg-purple-400/10 rounded border border-purple-500/20" />
                  <Skeleton className="h-3 sm:h-4 w-1/2 bg-purple-400/10 rounded border border-purple-500/20" />
                  <Skeleton className="h-3 sm:h-4 w-5/6 bg-purple-400/10 rounded border border-purple-500/20" />
                  <Skeleton className="h-3 sm:h-4 w-2/3 bg-purple-400/10 rounded border border-purple-500/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0" style={{ flexBasis: "50%" }}>
          <div className="w-1 h-full bg-purple-500/20 hover:bg-purple-500/40 float-left"></div>
          <div className="p-2 h-full">
            <div className="h-full rounded-lg border border-purple-500/20 bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden">
              <div className="p-4 sm:p-6 h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-purple-500/20 mb-4 sm:mb-6" />
                  <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mx-auto bg-purple-400/20 rounded mb-3" />
                  <Skeleton className="h-3 sm:h-4 w-full bg-purple-400/10 rounded mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-3/4 mx-auto bg-purple-400/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



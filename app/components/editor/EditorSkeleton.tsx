"use client";

import { Skeleton } from "@/components/ui/skeleton";


export default function EditorSkeleton() {
  return (
    <div className="flex flex-col bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] text-white min-h-screen">
      <div className="flex-shrink-0 border-b border-purple-500/30 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] px-2 sm:px-4 py-2 sm:py-3 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-6 w-32 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 rounded" />
            <Skeleton className="h-4 w-48 bg-cyan-300/20 rounded" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            <Skeleton className="h-8 w-20 bg-purple-500/20 rounded border border-purple-500/30" />
            <Skeleton className="h-8 w-24 bg-cyan-500/20 rounded border border-cyan-500/30" />
            <Skeleton className="h-8 w-28 bg-gradient-to-r from-pink-500/30 to-purple-600/30 rounded border border-pink-400/30" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 w-full min-w-0 overflow-hidden">
        <div className="w-full sm:w-96 lg:w-[32rem] xl:w-[36rem] flex-shrink-0 border-r border-purple-500/30 bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] overflow-y-auto shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                <Skeleton className="h-4 w-28 bg-purple-400/30 rounded" />
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12 bg-purple-400/20 rounded" />
                  <Skeleton className="h-10 w-full bg-purple-400/10 rounded border border-purple-500/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 bg-purple-400/20 rounded" />
                  <Skeleton className="h-10 w-full bg-purple-400/10 rounded border border-purple-500/20" />
                </div>
              </div>
            </div>
                        <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                <Skeleton className="h-4 w-16 bg-cyan-400/30 rounded" />
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-14 bg-cyan-400/20 rounded" />
                  <Skeleton className="h-10 w-full bg-cyan-400/10 rounded border border-cyan-500/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-18 bg-cyan-400/20 rounded" />
                  <Skeleton className="h-10 w-full bg-cyan-400/10 rounded border border-cyan-500/20" />
                </div>
              </div>
            </div>
                        <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
                <Skeleton className="h-4 w-32 bg-pink-400/30 rounded" />
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 bg-pink-400/20 rounded" />
                  <Skeleton className="h-10 w-full bg-pink-400/10 rounded border border-pink-500/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-pink-400/20 rounded" />
                  <Skeleton className="h-10 w-full bg-pink-400/10 rounded border border-pink-500/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-18 bg-pink-400/20 rounded" />
                  <Skeleton className="h-10 w-full bg-pink-400/10 rounded border border-pink-500/20" />
                </div>
              </div>
            </div>
            <div className="space-y-4 border-t border-purple-500/20 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                  <Skeleton className="h-4 w-32 bg-violet-400/30 rounded" />
                </div>
                <Skeleton className="h-8 w-24 bg-cyan-500/20 rounded border border-cyan-500/30" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <div className="p-2 sm:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] overflow-hidden">
            <div className="border border-purple-500/30 rounded-lg bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] h-full shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <div className="flex items-center justify-between p-3 border-b border-purple-500/20">
                <Skeleton className="h-6 w-20 bg-purple-400/20 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 bg-purple-400/20 rounded border border-purple-500/30" />
                  <Skeleton className="h-8 w-8 bg-cyan-400/20 rounded border border-cyan-500/30" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full bg-purple-400/10 rounded border border-purple-500/20" />
                  <Skeleton className="h-4 w-3/4 bg-purple-400/10 rounded border border-purple-500/20" />
                  <Skeleton className="h-4 w-1/2 bg-purple-400/10 rounded border border-purple-500/20" />
                  <Skeleton className="h-4 w-5/6 bg-purple-400/10 rounded border border-purple-500/20" />
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Skeleton className="h-4 w-48 bg-cyan-300/20 rounded" />
                </div>
              </div>
            </div>
          </div>
                    <div className="border-t border-purple-500/30 bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] p-2 sm:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[350px] overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24 bg-purple-400/20 rounded" />
              <Skeleton className="h-32 w-full bg-purple-400/10 rounded-lg border border-purple-500/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export const LoadingSkeleton = ({ height = "h-10", className = "" }: { height?: string; className?: string }) => (
    <div className={`${height} bg-slate-700 rounded animate-pulse ${className}`} />
  );
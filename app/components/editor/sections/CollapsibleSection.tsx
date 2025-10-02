import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  description: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = memo(function CollapsibleSection({
  title,
  description,
  color,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const colorClasses = {
    pink: {
      text: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/30",
      hoverBg: "hover:bg-pink-500/20",
      hoverBorder: "hover:border-pink-400/50",
      shadow: "shadow-[0_0_10px_rgba(244,114,182,0.3)]",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(244,114,182,0.5)]",
      dot: "bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]",
    },
    purple: {
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      hoverBg: "hover:bg-purple-500/20",
      hoverBorder: "hover:border-purple-400/50",
      shadow: "shadow-[0_0_10px_rgba(139,92,246,0.3)]",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]",
      dot: "bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]",
    },
    cyan: {
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      hoverBg: "hover:bg-cyan-500/20",
      hoverBorder: "hover:border-cyan-400/50",
      shadow: "shadow-[0_0_10px_rgba(6,182,212,0.3)]",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]",
      dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
    },
  };

  const colors =
    colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <div
      className={`mb-4 rounded-xl border ${colors.border} ${colors.bg} ${
        isExpanded ? colors.shadow : ""
      } transition-all duration-300 overflow-hidden backdrop-blur-sm`}
    >
      <Button
        onClick={onToggle}
        className={`w-full ${colors.hoverBg} ${colors.hoverBorder} ${colors.hoverShadow} rounded-xl transition-all duration-300 p-0 border-none`}
      >
        <div className="flex items-center justify-between w-full px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`}
            />
            <div className="text-left flex-1">
              <h3
                className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}
              >
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-normal normal-case tracking-normal">
                {description}
              </p>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp
                className={`w-4 h-4 ${colors.text} transition-transform duration-300`}
              />
            ) : (
              <ChevronDown
                className={`w-4 h-4 ${colors.text} transition-transform duration-300`}
              />
            )}
          </div>
        </div>
      </Button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
});

export default CollapsibleSection;

import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LucideHistory,
  LucidePlay,
  Menu,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  LucideIcon,
  Maximize2,
  Minimize2,
  Wand2,
} from "lucide-react";
import { QueryTemplate, QueryResult, TableSchema } from "@/app/types/query";
import dynamic from "next/dynamic";
import {
  getClientPermissionMode,
  setClientPermissionMode,
  PermissionMode,
} from "@/app/utils/editor/sqlPermissionLinter";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { UPDATE_PERMISSION_MODE } from "@/app/graphql/mutations/updatePermissionMode";

interface ModeConfig {
  label: string;
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  description: string;
}

interface ModeOptionProps {
  mode: PermissionMode;
  config: ModeConfig;
  isActive: boolean;
  onSelect: (mode: PermissionMode) => void;
}

const ModeOption = memo(function ModeOption({
  mode,
  config,
  isActive,
  onSelect,
}: ModeOptionProps) {
  return (
    <button
      onClick={() => onSelect(mode)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
        isActive
          ? `${config.bgColor} ${config.borderColor} border`
          : "hover:bg-slate-800"
      }`}
    >
      <config.icon
        className={`w-4 h-4 ${config.textColor} ${
          isActive ? config.glowColor : ""
        }`}
      />
      <div className="flex-1 text-left">
        <div className={`text-xs font-bold ${config.textColor}`}>
          {config.label}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {config.description}
        </div>
      </div>
      {isActive && (
        <div
          className={`w-2 h-2 rounded-full ${config.textColor.replace(
            "text-",
            "bg-"
          )}`}
        />
      )}
    </button>
  );
});

const TemplateManager = dynamic(
  () => import("@/app/components/editor/templates/TemplateManager"),
  { ssr: false }
);

const TemplateExecutor = dynamic(
  () => import("@/app/components/editor/templates/TemplateExecutor"),
  { ssr: false }
);

interface EditorControlsProps {
  showHistory: boolean;
  onToggleHistory: () => void;
  onToggleMobileSidebar: () => void;
  loading?: boolean;
  runQuery: (query: string) => Promise<void>;
  query: string;
  hasDatabase?: boolean;
  onTemplateSelect?: (template: QueryTemplate) => void;
  onTemplateResult?: (result: QueryResult) => void;
  schema?: TableSchema[];
  metadataLoading?: boolean;
  isMySQL?: boolean;
  onFormatSql?: () => void;
  isEditorFullscreen?: boolean;
  onToggleEditorFullscreen?: () => void;
}

const EditorControls = memo(function EditorControls({
  showHistory,
  onToggleHistory,
  onToggleMobileSidebar,
  loading = false,
  runQuery,
  query,
  hasDatabase = true,
  onTemplateSelect,
  onTemplateResult,
  schema = [],
  metadataLoading = false,
  isMySQL = false,
  onFormatSql,
  isEditorFullscreen = false,
  onToggleEditorFullscreen,
}: EditorControlsProps) {
  const [executingTemplate, setExecutingTemplate] =
    useState<QueryTemplate | null>(null);
  const [showTemplateExecutor, setShowTemplateExecutor] = useState(false);
  const [permissionMode, setPermissionMode] = useState<PermissionMode>(
    getClientPermissionMode()
  );
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const [updatePermissionModeMutation] = useMutation<
    { updatePermissionMode: boolean },
    { mode: string }
  >(UPDATE_PERMISSION_MODE);

  const handleDropdownToggle = () => {
    setShowModeDropdown(!showModeDropdown);
  };

  useEffect(() => {
    const handleModeChange = () => {
      setPermissionMode(getClientPermissionMode());
    };

    window.addEventListener("permissionModeChanged", handleModeChange);
    return () =>
      window.removeEventListener("permissionModeChanged", handleModeChange);
  }, []);

  const modeConfig: Record<PermissionMode, ModeConfig> = {
    "read-only": {
      label: "READ-ONLY",
      icon: ShieldAlert,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-300",
      glowColor: "shadow-[0_0_8px_rgba(239,68,68,0.8)]",
      description: "Only SELECT and read operations allowed",
    },
    "read-write": {
      label: "READ-WRITE",
      icon: Shield,
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-300",
      glowColor: "shadow-[0_0_8px_rgba(245,158,11,0.8)]",
      description: "SELECT, INSERT, and UPDATE operations allowed",
    },
    full: {
      label: "FULL ACCESS",
      icon: ShieldCheck,
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      textColor: "text-emerald-300",
      glowColor: "shadow-[0_0_8px_rgba(16,185,129,0.8)]",
      description: "All SQL operations allowed",
    },
  };

  const currentModeConfig = modeConfig[permissionMode];

  const handleModeSwitch = async (newMode: PermissionMode) => {
    setClientPermissionMode(newMode);
    setPermissionMode(newMode);
    setShowModeDropdown(false);

    const modeLabels = {
      "read-only": "Read-Only",
      "read-write": "Read-Write",
      full: "Full Access",
    };

    try {
      const result = await updatePermissionModeMutation({
        variables: { mode: newMode },
      });

      if (result.data?.updatePermissionMode) {
        toast.success(`Switched to ${modeLabels[newMode]} mode`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error("Failed to update permission mode on server");
      }
    } catch (error) {
      console.error("Error updating permission mode:", error);
      toast.error(
        `Failed to update permission mode on server. Client-side mode set to ${modeLabels[newMode]}.`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  const handleTemplateSelect = (template: QueryTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleExecuteTemplate = (template: QueryTemplate) => {
    setExecutingTemplate(template);
    setShowTemplateExecutor(true);
  };

  const handleTemplateResult = (result: QueryResult) => {
    if (onTemplateResult) {
      onTemplateResult(result);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-between backdrop-blur-sm bg-gradient-to-r from-gray-900/80 via-purple-900/80 to-gray-900/80 relative z-[100000]">
        <div className="flex items-center gap-2 sm:gap-4">
          {hasDatabase && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2.5 rounded-xl bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/50"
              aria-label="Toggle query builder"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-xl lg:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
              SculptQL
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
              <span className="text-xs font-semibold text-cyan-300">
                EDITOR
              </span>
            </div>
            {hasDatabase && (
              <div
                className="relative"
                style={{ zIndex: 9999999 }}
                id="permission-mode-anchor"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleDropdownToggle}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${currentModeConfig.bgColor} border ${currentModeConfig.borderColor} hover:opacity-80 transition-all`}
                    >
                      <currentModeConfig.icon
                        className={`w-3.5 h-3.5 ${currentModeConfig.textColor} ${currentModeConfig.glowColor}`}
                      />
                      <span
                        className={`text-[10px] font-bold ${currentModeConfig.textColor} tracking-wide hidden lg:inline`}
                      >
                        {currentModeConfig.label}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 ${
                          currentModeConfig.textColor
                        } transition-transform ${
                          showModeDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={8}
                    className={`bg-slate-900 ${currentModeConfig.borderColor} ${currentModeConfig.textColor} shadow-lg z-[100]`}
                  >
                    Change permission mode • {currentModeConfig.description}
                  </TooltipContent>
                </Tooltip>
                {showModeDropdown && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 9999998 }}
                      onClick={() => setShowModeDropdown(false)}
                    />
                    <div
                      className="absolute top-full mt-2 right-0 w-60 rounded-lg bg-slate-900 border border-purple-500/30 shadow-xl shadow-purple-500/20 overflow-hidden"
                      style={{ zIndex: 9999999 }}
                    >
                      <div className="p-1.5">
                        {(Object.keys(modeConfig) as PermissionMode[]).map(
                          (mode) => (
                            <ModeOption
                              key={mode}
                              mode={mode}
                              config={modeConfig[mode]}
                              isActive={mode === permissionMode}
                              onSelect={handleModeSwitch}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {loading && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
              <span className="text-xs font-mono text-yellow-300 hidden sm:inline">
                Loading...
              </span>
            </div>
          )}
        </div>
        {hasDatabase && (
          <div className="flex items-center gap-1.5 sm:gap-2 z-[100000]">
            <TemplateManager
              onSelectTemplate={handleTemplateSelect}
              onExecuteTemplate={handleExecuteTemplate}
            />
            {onFormatSql && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onFormatSql}
                    disabled={loading}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition-all duration-200 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/10"
                    aria-label="Format SQL"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Format</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={8}
                  className="bg-slate-900 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/20 z-[100]"
                >
                  Format SQL (
                  {navigator.platform.includes("Mac")
                    ? "⌘+Shift+F"
                    : "Ctrl+Shift+F"}
                  )
                </TooltipContent>
              </Tooltip>
            )}
            {onToggleEditorFullscreen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleEditorFullscreen}
                    disabled={loading}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-pink-500/10 text-pink-300 hover:text-white hover:bg-pink-500/30 transition-all duration-200 border border-pink-500/30 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-pink-500/10"
                    aria-label={
                      isEditorFullscreen
                        ? "Exit editor fullscreen"
                        : "Fullscreen editor"
                    }
                  >
                    {isEditorFullscreen ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden lg:inline">
                      {isEditorFullscreen ? "Exit" : "Fullscreen"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={8}
                  className="bg-slate-900 border-pink-500/50 text-pink-200 shadow-lg shadow-pink-500/20 z-[100]"
                >
                  {isEditorFullscreen
                    ? "Exit editor fullscreen"
                    : "Fullscreen editor"}
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleHistory}
                  disabled={loading}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 hover:text-white hover:bg-cyan-500/30 transition-all duration-200 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cyan-500/10"
                  aria-label="Toggle query history"
                >
                  <LucideHistory className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {showHistory ? "Hide" : "History"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="bg-slate-900 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20 z-[100]"
              >
                Toggle query history
              </TooltipContent>
            </Tooltip>
            <div className="ml-1 sm:ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => runQuery(query)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-pink-500 hover:from-pink-400 hover:via-purple-500 hover:to-pink-400 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/70 border border-pink-400/40 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-pink-500/50 hover:scale-105 active:scale-95"
                    aria-label="Run query"
                  >
                    <LucidePlay className="w-4 h-4" fill="currentColor" />
                    <span className="hidden sm:inline font-mono tracking-wider">
                      RUN QUERY
                    </span>
                    <span className="sm:hidden font-mono">RUN</span>
                    <kbd className="hidden lg:inline ml-2 px-2 py-1 text-[10px] bg-black/30 rounded border border-white/20 font-mono">
                      {navigator.platform.includes("Mac") ? "⌘↵" : "Ctrl+↵"}
                    </kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={8}
                  className="bg-slate-900 border-pink-500/50 text-pink-200 shadow-lg shadow-pink-500/20 z-[100]"
                >
                  Run query (
                  {navigator.platform.includes("Mac")
                    ? "⌘+Enter"
                    : "Ctrl+Enter"}
                  )
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
      <TemplateExecutor
        template={executingTemplate}
        isOpen={showTemplateExecutor}
        onClose={() => {
          setShowTemplateExecutor(false);
          setExecutingTemplate(null);
        }}
        onResult={handleTemplateResult}
      />
    </TooltipProvider>
  );
});

export default EditorControls;

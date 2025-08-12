import { Tab } from "@/app/types/query";

interface QueryTabsProps {
  queryTabs: Tab[];
  activeTab: number;
  onTabClick: (id: number) => void;
  onTabClose: (id: number) => void;
}

export default function QueryTabs({
  queryTabs,
  activeTab,
  onTabClick,
  onTabClose,
}: QueryTabsProps) {
  return (
    <div className="flex items-center border-b border-slate-700 bg-[#1e293b] overflow-x-auto">
      {queryTabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center px-3 py-1 sm:px-4 sm:py-2 cursor-pointer whitespace-nowrap text-sm sm:text-base transition-all duration-300 ${
            activeTab === tab.id
              ? "bg-[#2d3748] text-[#f8f9fa]"
              : "bg-[#1e293b] text-[#9ca3af] hover:bg-[#2d3748] hover:text-[#f8f9fa]"
          }`}
          onClick={() => onTabClick(tab.id)}
          style={{ marginTop: 0, borderTop: "none" }}
        >
          {tab.title}
          {tab.id !== 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-2 text-red-400 hover:text-red-600 text-xs sm:text-sm"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

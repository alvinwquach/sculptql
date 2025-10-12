import { memo } from "react";
import { TableSchema } from "@/app/types/query";
import TableSelect from "./TableSelect";
import ColumnSelect from "./ColumnSelect";

interface QueryBuilderSidebarProps {
  schema: TableSchema[];
  metadataLoading: boolean;
  isMySQL: boolean;
}

const QueryBuilderSidebar = memo(function QueryBuilderSidebar({
  schema,
  metadataLoading,
  isMySQL,
}: QueryBuilderSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] border-r border-purple-500/20">
      <div className="flex-shrink-0 border-b border-purple-500/20 bg-gradient-to-r from-[#0f0f23]/95 to-[#1a1a2e]/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
            Query Builder
          </h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Table
          </label>
          <TableSelect metadataLoading={metadataLoading} schema={schema} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Columns
          </label>
          <ColumnSelect
            metadataLoading={metadataLoading}
            isMySQL={isMySQL}
            schema={schema}
          />
        </div>
      </div>
    </div>
  );
});

export default QueryBuilderSidebar;

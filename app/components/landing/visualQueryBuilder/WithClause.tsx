import { Label } from "@/components/ui/label";
import Select from "react-select";
import { selectStyles } from "@/app/utils/selectStyles";
import { SelectOption } from "@/app/types/query";
import { WithClause as WithClauseType } from "./types";
import { tableOptions } from "./constants";

interface WithClauseProps {
  withClauses: WithClauseType[];
  onAliasUpdate: (index: number, alias: string) => void;
  onTableUpdate: (index: number, table: SelectOption | null) => void;
}

export default function WithClause({
  withClauses,
  onAliasUpdate,
  onTableUpdate
}: WithClauseProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
        <div className="w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
        WITH Clause (CTE)
      </h3>
      {withClauses.map((cte, index) => (
        <div key={index} className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30 space-y-3">
          <div>
            <Label className="text-xs text-pink-200 mb-1">CTE Alias Name</Label>
            <input
              type="text"
              value={cte.alias}
              onChange={(e) => onAliasUpdate(index, e.target.value)}
              className="w-full px-3 py-2 bg-gray-900/50 border border-pink-500/30 rounded text-pink-200 text-sm"
              placeholder="e.g., active_users"
            />
          </div>
          <div>
            <Label className="text-xs text-pink-200 mb-1">Source Table</Label>
            <Select
              instanceId={`vqb-with-table-${index}`}
              options={tableOptions}
              value={cte.table}
              onChange={(value) => onTableUpdate(index, value)}
              styles={selectStyles}
              className="text-sm"
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-pink-200/70 italic">
        WITH creates temporary named result sets (CTEs) for complex queries.
      </p>
    </div>
  );
}

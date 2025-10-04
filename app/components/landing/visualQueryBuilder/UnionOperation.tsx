import { Label } from "@/components/ui/label";
import Select from "react-select";
import { selectStyles } from "@/app/utils/selectStyles";
import { SelectOption } from "@/app/types/query";
import { UnionClause } from "./types";
import { unionTypeOptions, tableOptions } from "./constants";

interface UnionOperationProps {
  unionClauses: UnionClause[];
  onUpdate: (index: number, field: keyof UnionClause, value: SelectOption | null) => void;
}

export default function UnionOperation({ unionClauses, onUpdate }: UnionOperationProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
        UNION Operation
      </h3>
      {unionClauses.map((union, index) => (
        <div key={index} className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-cyan-200 mb-1">Union Type</Label>
              <Select
                instanceId={`vqb-union-type-${index}`}
                options={unionTypeOptions}
                value={union.type}
                onChange={(value) => onUpdate(index, "type", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-cyan-200 mb-1">Combine With Table</Label>
              <Select
                instanceId={`vqb-union-table-${index}`}
                options={tableOptions}
                value={union.table}
                onChange={(value) => onUpdate(index, "table", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-cyan-200/70 italic">
        UNION combines results from multiple queries. Use UNION ALL to keep duplicates.
      </p>
    </div>
  );
}

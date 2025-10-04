import { Label } from "@/components/ui/label";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectStyles } from "@/app/utils/selectStyles";
import { SelectOption } from "@/app/types/query";
import { JoinClause } from "./types";
import { joinTypeOptions, tableOptions, columnOptions } from "./constants";

interface JoinConfigurationProps {
  joinClauses: JoinClause[];
  onUpdate: (index: number, field: keyof JoinClause, value: SelectOption | null) => void;
}

export default function JoinConfiguration({ joinClauses, onUpdate }: JoinConfigurationProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
        JOIN Configuration
      </h3>
      {joinClauses.map((join, index) => (
        <div key={index} className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-purple-200 mb-1">Join Type</Label>
              <Select
                instanceId={`vqb-join-type-${index}`}
                options={joinTypeOptions}
                value={join.type}
                onChange={(value) => onUpdate(index, "type", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-purple-200 mb-1">Table</Label>
              <Select
                instanceId={`vqb-join-table-${index}`}
                options={tableOptions}
                value={join.table}
                onChange={(value) => onUpdate(index, "table", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-purple-200 mb-1">Left Column</Label>
              <CreatableSelect
                instanceId={`vqb-join-col1-${index}`}
                options={columnOptions}
                value={join.onColumn1}
                onChange={(value) => onUpdate(index, "onColumn1", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-purple-200 mb-1">Right Column</Label>
              <CreatableSelect
                instanceId={`vqb-join-col2-${index}`}
                options={columnOptions}
                value={join.onColumn2}
                onChange={(value) => onUpdate(index, "onColumn2", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-purple-200/70 italic">
        JOINs allow you to combine data from multiple tables based on related columns.
      </p>
    </div>
  );
}

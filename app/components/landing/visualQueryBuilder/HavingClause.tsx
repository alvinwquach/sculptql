import { Label } from "@/components/ui/label";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectStyles } from "@/app/utils/selectStyles";
import { SelectOption, WhereCondition } from "@/app/types/query";
import { columnOptions, operatorOptions, valueOptions } from "./constants";

interface HavingClauseProps {
  groupBy: SelectOption[];
  havingConditions: WhereCondition[];
  onGroupByUpdate: (value: SelectOption[]) => void;
  onConditionUpdate: (index: number, field: "column" | "operator" | "value", value: SelectOption | null) => void;
}

export default function HavingClause({
  groupBy,
  havingConditions,
  onGroupByUpdate,
  onConditionUpdate
}: HavingClauseProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
        HAVING Clause
      </h3>
      <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
        <Label className="text-xs text-pink-200 mb-2">GROUP BY Columns</Label>
        <CreatableSelect
          instanceId="vqb-having-groupby"
          isMulti
          options={columnOptions}
          value={groupBy}
          onChange={(value) => onGroupByUpdate(value as SelectOption[])}
          styles={selectStyles}
          className="text-sm"
        />
      </div>
      {havingConditions.map((condition, index) => (
        <div key={index} className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 space-y-3">
          <div className="text-xs text-emerald-300 font-semibold mb-2">HAVING condition:</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-emerald-200 mb-1">Aggregate</Label>
              <CreatableSelect
                instanceId={`vqb-having-column-${index}`}
                options={columnOptions}
                value={condition.column}
                onChange={(value) => onConditionUpdate(index, "column", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-emerald-200 mb-1">Operator</Label>
              <Select
                instanceId={`vqb-having-operator-${index}`}
                options={operatorOptions}
                value={condition.operator}
                onChange={(value) => onConditionUpdate(index, "operator", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-emerald-200 mb-1">Value</Label>
              <CreatableSelect
                instanceId={`vqb-having-value-${index}`}
                options={valueOptions}
                value={condition.value}
                onChange={(value) => onConditionUpdate(index, "value", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-emerald-200/70 italic">
        HAVING filters grouped data using aggregate functions like COUNT, SUM, AVG, etc.
      </p>
    </div>
  );
}

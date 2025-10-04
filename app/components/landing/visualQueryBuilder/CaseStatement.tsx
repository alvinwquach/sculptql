import { Label } from "@/components/ui/label";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectStyles } from "@/app/utils/selectStyles";
import { SelectOption } from "@/app/types/query";
import { CaseCondition } from "./types";
import { columnOptions, operatorOptions, valueOptions } from "./constants";

interface CaseStatementProps {
  caseConditions: CaseCondition[];
  onUpdate: (index: number, field: keyof CaseCondition, value: SelectOption | null) => void;
}

export default function CaseStatement({ caseConditions, onUpdate }: CaseStatementProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
        CASE Statement
      </h3>
      {caseConditions.map((condition, index) => (
        <div key={index} className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 space-y-3">
          <div className="text-xs text-amber-300 font-semibold mb-2">WHEN condition:</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-amber-200 mb-1">Column</Label>
              <CreatableSelect
                instanceId={`vqb-case-column-${index}`}
                options={columnOptions}
                value={condition.column}
                onChange={(value) => onUpdate(index, "column", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-200 mb-1">Operator</Label>
              <Select
                instanceId={`vqb-case-operator-${index}`}
                options={operatorOptions}
                value={condition.operator}
                onChange={(value) => onUpdate(index, "operator", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-200 mb-1">Value</Label>
              <CreatableSelect
                instanceId={`vqb-case-value-${index}`}
                options={valueOptions}
                value={condition.value}
                onChange={(value) => onUpdate(index, "value", value)}
                styles={selectStyles}
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-amber-200 mb-1">THEN Result</Label>
            <CreatableSelect
              instanceId={`vqb-case-result-${index}`}
              options={valueOptions}
              value={condition.result}
              onChange={(value) => onUpdate(index, "result", value)}
              styles={selectStyles}
              className="text-sm"
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-amber-200/70 italic">
        CASE statements add conditional logic to your queries, transforming data based on conditions.
      </p>
    </div>
  );
}

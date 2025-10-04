import { Label } from "@/components/ui/label";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { selectStyles } from "@/app/utils/selectStyles";
import { SelectOption } from "@/app/types/query";
import { QueryState } from "./types";
import { tableOptions, columnOptions, operatorOptions, valueOptions, orderByOptions } from "./constants";

interface BaseQueryFormProps {
  queryState: QueryState;
  onUpdate: (updates: Partial<QueryState>) => void;
}

export default function BaseQueryForm({ queryState, onUpdate }: BaseQueryFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
        Base Query
      </h3>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-gray-300 mb-1">Table</Label>
          <Select
            instanceId="vqb-base-table"
            options={tableOptions}
            value={queryState.selectedTable}
            onChange={(value) => onUpdate({ selectedTable: value })}
            styles={selectStyles}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1">Columns</Label>
          <CreatableSelect
            instanceId="vqb-base-columns"
            isMulti
            options={columnOptions}
            value={queryState.selectedColumns}
            onChange={(value) => onUpdate({ selectedColumns: value as SelectOption[] })}
            styles={selectStyles}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1">WHERE Condition</Label>
          <div className="grid grid-cols-3 gap-2">
            <CreatableSelect
              instanceId="vqb-base-where-column"
              options={columnOptions}
              value={queryState.whereConditions[0]?.column}
              onChange={(value) => onUpdate({
                whereConditions: [{ ...queryState.whereConditions[0], column: value }]
              })}
              styles={selectStyles}
              className="text-sm"
              placeholder="Column"
            />
            <Select
              instanceId="vqb-base-where-operator"
              options={operatorOptions}
              value={queryState.whereConditions[0]?.operator}
              onChange={(value) => onUpdate({
                whereConditions: [{ ...queryState.whereConditions[0], operator: value }]
              })}
              styles={selectStyles}
              className="text-sm"
              placeholder="="
            />
            <CreatableSelect
              instanceId="vqb-base-where-value"
              options={valueOptions}
              value={queryState.whereConditions[0]?.value}
              onChange={(value) => onUpdate({
                whereConditions: [{ ...queryState.whereConditions[0], value: value }]
              })}
              styles={selectStyles}
              className="text-sm"
              placeholder="Value"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-300 mb-1">ORDER BY</Label>
          <Select
            instanceId="vqb-base-orderby"
            options={orderByOptions}
            value={queryState.orderBy}
            onChange={(value) => onUpdate({ orderBy: value })}
            styles={selectStyles}
            className="text-sm"
            isClearable
          />
        </div>
      </div>
    </div>
  );
}

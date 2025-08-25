"use client";

import { useCallback } from "react";
import Select, { SingleValue } from "react-select";
import { X } from "lucide-react";
import { SelectOption, UnionClause } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface UnionSelectProps {
  selectedTable: SelectOption | null;
  tableNames: string[];
  unionClauses: UnionClause[];
  onUnionTableSelect: (
    value: SingleValue<SelectOption>,
    unionIndex: number
  ) => void;
  onAddUnionClause: () => void;
  onRemoveUnionClause: (unionIndex: number) => void;
  metadataLoading: boolean;
}

export default function UnionSelect({
  selectedTable,
  tableNames,
  unionClauses,
  onUnionTableSelect,
  onAddUnionClause,
  onRemoveUnionClause,
  metadataLoading,
}: UnionSelectProps) {
  const tableOptions: SelectOption[] = tableNames
    .filter((table) => table !== selectedTable?.value)
    .map((table) => ({ value: table, label: table }));

  const handleAddUnion = useCallback(() => {
    onAddUnionClause();
  }, [onAddUnionClause]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end">
        <button
          onClick={handleAddUnion}
          className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition disabled:opacity-50"
          disabled={!selectedTable || metadataLoading}
        >
          Add Union
        </button>
      </div>
      <label className="text-sm font-medium text-[#f8f9fa]">Unions</label>
      {unionClauses.map((union, index) => (
        <div key={index} className="flex flex-row items-end gap-2 w-full">
          <div className="flex flex-col gap-1 w-1/5">
            <label className="text-xs text-[#f8f9fa]">Union Table</label>
            <Select
              options={tableOptions}
              value={union.table}
              onChange={(value) => onUnionTableSelect(value, index)}
              placeholder="Table"
              isClearable
              isDisabled={!selectedTable || metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          <button
            onClick={() => onRemoveUnionClause(index)}
            className="text-red-500 hover:text-red-600 transition p-1"
            title="Remove this union"
            disabled={metadataLoading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

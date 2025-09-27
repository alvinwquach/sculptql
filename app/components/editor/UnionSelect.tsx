"use client";

import { useCallback } from "react";
import Select, { SingleValue } from "react-select";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectOption, UnionClause } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";
import { Label } from "@/components/ui/label"

// Props for the UnionSelect component
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
  // Create the table options
  const tableOptions: SelectOption[] = tableNames
    // Filter the table names to exclude the selected table
    .filter((table) => table !== selectedTable?.value)
    .map((table) => ({ value: table, label: table }));

  // Handle the add union
  const handleAddUnion = useCallback(() => {
    onAddUnionClause();
  }, [onAddUnionClause]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end">
        <Button
          onClick={handleAddUnion}
          className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition disabled:opacity-50"
          disabled={!selectedTable || metadataLoading}
        >
          Add Union
        </Button>
      </div>
      <Label className="text-sm font-medium text-[#f8f9fa]">Unions</Label>
      {unionClauses.map((union, index) => (
        <div key={index} className="flex flex-row items-end gap-2 w-full">
          <div className="flex flex-col gap-1 w-1/5">
            <Label className="text-xs text-[#f8f9fa]">Union Table</Label>
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
          <Button
            onClick={() => onRemoveUnionClause(index)}
            className="text-red-500 hover:text-red-600 transition p-1"
            title="Remove this union"
            disabled={metadataLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

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
  onUnionTypeSelect: (
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
  onUnionTypeSelect,
  onAddUnionClause,
  onRemoveUnionClause,
  metadataLoading,
}: UnionSelectProps) {
  // Create the table options
  const tableOptions: SelectOption[] = tableNames
    // Filter the table names to exclude the selected table
    .filter((table) => table !== selectedTable?.value)
    .map((table) => ({ value: table, label: table }));

  const unionTypeOptions: SelectOption[] = [
    { value: "UNION", label: "UNION (removes duplicates)" },
    { value: "UNION ALL", label: "UNION ALL (keeps duplicates)" },
  ];

  const handleAddUnion = useCallback(() => {
    onAddUnionClause();
  }, [onAddUnionClause]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-lg border border-pink-500/20 shadow-[0_0_15px_rgba(244,114,182,0.1)]">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Unions</Label>
        <Button
          onClick={handleAddUnion}
          className="text-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-3 py-1.5 rounded-lg border border-pink-400/30 shadow-[0_0_10px_rgba(244,114,182,0.3)] transition-all duration-200 disabled:opacity-50"
          disabled={!selectedTable || metadataLoading}
        >
          Add Union
        </Button>
      </div>
      {unionClauses.map((union, index) => (
        <div key={index} className="p-4 border border-pink-500/30 rounded-lg bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] shadow-[0_0_10px_rgba(244,114,182,0.1)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              Union {index + 1}
            </span>
            <Button
              onClick={() => onRemoveUnionClause(index)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-all duration-200"
              title="Remove this union"
              disabled={metadataLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-pink-300/80 font-mono">Union Type</Label>
              <Select
                options={unionTypeOptions}
                value={union.unionType}
                onChange={(value) => onUnionTypeSelect(value, index)}
                placeholder="Select type"
                isDisabled={metadataLoading}
                styles={selectStyles}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-pink-300/80 font-mono">Union Table</Label>
              <Select
                options={tableOptions}
                value={union.table}
                onChange={(value) => onUnionTableSelect(value, index)}
                placeholder="Table"
                isClearable
                isDisabled={!selectedTable || metadataLoading}
                styles={selectStyles}
                className="w-full"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

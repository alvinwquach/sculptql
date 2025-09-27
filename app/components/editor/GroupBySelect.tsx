"use client";

import { useEditorContext } from "@/app/context/EditorContext";
import { JoinClause, SelectOption } from "@/app/types/query";
import CreatableSelect from "react-select/creatable";
import { selectStyles } from "@/app/utils/selectStyles";
import { Label } from "@/components/ui/label"

interface GroupBySelectProps {
  metadataLoading: boolean;
  joinClauses: JoinClause[];
}

export default function GroupBySelect({
  metadataLoading,
  joinClauses,
}: GroupBySelectProps) {
  const {
    selectedTable,
    tableColumns,
    selectedGroupByColumns,
    handleGroupByColumnSelect,
  } = useEditorContext();

  const columnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-white text-opacity-80 font-semibold">
        Group By
      </div>
      <Label htmlFor="group-by-selector" className="text-xs text-[#f8f9fa] mb-1">
        Columns
      </Label>
      <CreatableSelect
        inputId="group-by-selector"
        instanceId="group-by-selector"
        aria-label="Select columns for grouping"
        options={columnOptions}
        value={selectedGroupByColumns}
        onChange={(value) => handleGroupByColumnSelect(Array.from(value))}
        placeholder="Select column(s) to group by"
        isMulti
        isClearable
        isDisabled={!selectedTable || metadataLoading}
        styles={selectStyles}
        className="min-w-0 w-full"
      />
    </div>
  );
}

"use client";

import Select from "react-select";
import { MultiValue } from "react-select";
import { SelectOption, TableColumn, JoinClause } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface ColumnSelectorProps {
  selectedTable: SelectOption | null;
  tableColumns: TableColumn;
  selectedColumns: SelectOption[];
  groupByColumns: SelectOption[];
  onColumnSelect: (value: MultiValue<SelectOption>) => void;
  onGroupByColumnsSelect: (value: MultiValue<SelectOption>) => void;
  metadataLoading: boolean;
  joinClauses: JoinClause[]; 
}

export default function ColumnSelector({
  selectedTable,
  tableColumns,
  selectedColumns,
  groupByColumns,
  onColumnSelect,
  onGroupByColumnsSelect,
  metadataLoading,
  joinClauses,
}: ColumnSelectorProps) {
  const columnOptions: SelectOption[] = selectedTable
    ? [
        { value: "*", label: "All Columns (*)" },
        ...(tableColumns[selectedTable.value]?.map((col) => ({
          value: `${selectedTable.value}.${col}`,
          label: `${selectedTable.value}.${col}`,
        })) || []),
        ...joinClauses
          .filter((join) => join.table?.value)
          .flatMap((join) =>
            tableColumns[join.table!.value]?.map((col) => ({
              value: `${join.table!.value}.${col}`,
              label: `${join.table!.value}.${col}`,
            })) || []
          ),
      ]
    : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#f8f9fa] mb-1">Columns</label>
        <Select
          isMulti
          options={columnOptions}
          value={selectedColumns}
          onChange={onColumnSelect}
          placeholder="Select columns"
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#f8f9fa] mb-1">Group By</label>
        <Select
          isMulti
          options={columnOptions.filter((opt) => opt.value !== "*")}
          value={groupByColumns}
          onChange={onGroupByColumnsSelect}
          placeholder="Group by columns"
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
        />
      </div>
    </div>
  );
}
import Select from "react-select";
import { MultiValue } from "react-select";
import { SelectOption, TableColumn } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface ColumnSelectorProps {
  selectedTable: SelectOption | null;
  tableColumns: TableColumn;
  selectedColumns: SelectOption[];
  groupByColumns: SelectOption[];
  onColumnSelect: (value: MultiValue<SelectOption>) => void;
  onGroupByColumnsSelect: (value: MultiValue<SelectOption>) => void;
  metadataLoading: boolean;
}

export default function ColumnSelector({
  selectedTable,
  tableColumns,
  selectedColumns,
  groupByColumns,
  onColumnSelect,
  onGroupByColumnsSelect,
  metadataLoading,
}: ColumnSelectorProps) {
  const columnOptions: SelectOption[] = selectedTable
    ? [
        { value: "*", label: "* (All Columns)" },
        ...(tableColumns[selectedTable.value]?.map((col) => ({
          value: col,
          label: col,
        })) || []),
      ]
    : [];

  const groupByColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#f8f9fa] mb-1">Columns</label>
        <Select
          options={columnOptions}
          value={selectedColumns}
          onChange={onColumnSelect}
          placeholder="Select columns"
          isMulti
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#f8f9fa] mb-1">Group By</label>
        <Select
          options={groupByColumnOptions}
          value={groupByColumns}
          onChange={onGroupByColumnsSelect}
          placeholder="Select columns to group by"
          isMulti
          isClearable
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
        />
      </div>
    </>
  );
}

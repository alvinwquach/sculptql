"use client";

import { useMemo } from "react";
import Select, { MultiValue } from "react-select";
import { SelectOption } from "@/app/types/query";
import { selectStyles } from "@/app/utils/selectStyles";

interface ColumnSelectProps {
  selectedTable: SelectOption | null;
  tableColumns: Record<string, string[]>;
  selectedColumns: SelectOption[];
  onColumnSelect: (value: MultiValue<SelectOption>) => void;
  metadataLoading: boolean;
}

export default function ColumnSelect({
  selectedTable,
  tableColumns,
  selectedColumns,
  onColumnSelect,
  metadataLoading,
}: ColumnSelectProps) {
  const columnOptions: SelectOption[] = useMemo(() => {
    const options = selectedTable
      ? [
          { value: "*", label: "All Columns (*)" },
          ...(tableColumns[selectedTable.value]?.map((col) => ({
            value: col,
            label: col,
          })) || []),
        ]
      : [];
    return options;
  }, [selectedTable, tableColumns]);

  const handleChange = (value: MultiValue<SelectOption>) => {
    // If "*" is selected last, reset to only "*"
    const lastSelected = value[value.length - 1];
    if (lastSelected?.value === "*") {
      onColumnSelect([{ value: "*", label: "All Columns (*)" }]);
    } else {
      // Allow mixing "*" with other columns, but filter out "*" if specific columns are selected
      const filteredValue = value.filter((col) => col.value !== "*");
      if (filteredValue.length > 0) {
        onColumnSelect(filteredValue);
      } else {
        // If no specific columns are selected, include "*" if it was in the previous selection
        onColumnSelect(
          value.some((col) => col.value === "*")
            ? [{ value: "*", label: "All Columns (*)" }]
            : value
        );
      }
    }
  };

  // Set dynamic label based on selected columns
  const label =
    selectedColumns.length === 1 && selectedColumns[0].value === "*"
      ? "Columns"
      : selectedColumns.length > 1
      ? "Columns"
      : "Column";

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="column-selector" className="text-xs text-[#f8f9fa] mb-1">
        {label}
      </label>
      <Select
        inputId="column-selector"
        instanceId="column-selector"
        options={columnOptions}
        value={selectedColumns}
        onChange={handleChange}
        placeholder="Select column(s)"
        isMulti
        isClearable
        isDisabled={!selectedTable || metadataLoading}
        styles={selectStyles}
        className="min-w-0 w-full"
        aria-label="Select columns"
      />
    </div>
  );
}

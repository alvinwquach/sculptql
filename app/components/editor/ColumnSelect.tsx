"use client";

import { useMemo } from "react";
import Select, { MultiValue } from "react-select";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectOption } from "@/app/types/query";
import { selectStyles } from "@/app/utils/selectStyles";

interface ColumnSelectProps {
  selectedTable: SelectOption | null;
  tableColumns: Record<string, string[]>;
  selectedColumns: SelectOption[];
  onColumnSelect: (value: MultiValue<SelectOption>) => void;
  metadataLoading: boolean;
  isDistinct: boolean;
  onDistinctChange: (value: boolean) => void;
  isMySQL?: boolean;
}

export default function ColumnSelect({
  selectedTable,
  tableColumns,
  selectedColumns,
  onColumnSelect,
  metadataLoading,
  isDistinct,
  onDistinctChange,
  isMySQL = false,
}: ColumnSelectProps) {
  const aggregateFunctions = [
    { value: "COUNT(*)", label: "COUNT(*)", isAggregate: true },
  ];

  const columnOptions: SelectOption[] = useMemo(() => {
    if (!selectedTable) return [];

    const columns = [
      { value: "*", label: "All Columns (*)" },
      ...(tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []),
      ...(tableColumns[selectedTable.value]?.flatMap((col) => {
        const aggregates = [
          {
            value: `SUM_${col}`, // Unique value by prefixing function
            label: `SUM(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `AVG_${col}`,
            label: `AVG(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `MAX_${col}`,
            label: `MAX(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `MIN_${col}`,
            label: `MIN(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `ROUND_${col}_0`,
            label: `ROUND(${col}, 0)`,
            isAggregate: false,
            targetColumn: col,
          },
          {
            value: `ROUND_${col}_1`,
            label: `ROUND(${col}, 1)`,
            isAggregate: false,
            targetColumn: col,
          },
          {
            value: `ROUND_${col}_2`,
            label: `ROUND(${col}, 2)`,
            isAggregate: false,
            targetColumn: col,
          },
          {
            value: `ROUND_${col}_3`,
            label: `ROUND(${col}, 3)`,
            isAggregate: false,
            targetColumn: col,
          },
          {
            value: `ROUND_${col}_4`,
            label: `ROUND(${col}, 4)`,
            isAggregate: false,
            targetColumn: col,
          },
          {
            value: `COUNT_${col}`,
            label: `COUNT(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `COUNT_DISTINCT_${col}`,
            label: `COUNT(DISTINCT ${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `ROUND_AVG_${col}_0`,
            label: `ROUND(AVG(${col}), 0)`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `ROUND_AVG_${col}_1`,
            label: `ROUND(AVG(${col}), 1)`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `ROUND_AVG_${col}_2`,
            label: `ROUND(AVG(${col}), 2)`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `ROUND_AVG_${col}_3`,
            label: `ROUND(AVG(${col}), 3)`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `ROUND_AVG_${col}_4`,
            label: `ROUND(AVG(${col}), 4)`,
            isAggregate: true,
            targetColumn: col,
          },
        ];

        if (isMySQL) {
          aggregates.push(
            {
              value: `SUM_DISTINCT_${col}`,
              label: `SUM(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            },
            {
              value: `AVG_DISTINCT_${col}`,
              label: `AVG(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            },
            {
              value: `MAX_DISTINCT_${col}`,
              label: `MAX(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            },
            {
              value: `MIN_DISTINCT_${col}`,
              label: `MIN(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            }
          );
        }

        return aggregates;
      }) || []),
      ...aggregateFunctions,
    ];

    // Ensure uniqueness by filtering out duplicates
    const uniqueColumns = Array.from(
      new Map(columns.map((option) => [option.value, option])).values()
    );

    return uniqueColumns;
  }, [selectedTable, tableColumns, isMySQL]);

  const handleChange = (value: MultiValue<SelectOption>) => {
    const lastSelected = value[value.length - 1];
    if (lastSelected?.value === "*") {
      onColumnSelect([{ value: "*", label: "All Columns (*)" }]);
    } else {
      const filteredValue = value.filter((col) => col.value !== "*");
      if (filteredValue.length > 0) {
        onColumnSelect(filteredValue);
      } else {
        onColumnSelect(
          value.some((col) => col.value === "*")
            ? [{ value: "*", label: "All Columns (*)" }]
            : value
        );
      }
    }
  };

  const label =
    selectedColumns.length === 1 && selectedColumns[0].value === "*"
      ? "Columns"
      : selectedColumns.length > 1
      ? "Columns"
      : "Column";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-2">
        <label
          htmlFor="column-selector"
          id="column-label"
          className="text-xs text-[#f8f9fa]"
        >
          {label}
        </label>
        <div className="flex items-center gap-2 ml-2">
          <Checkbox
            id="distinct-checkbox"
            aria-labelledby="distinct-checkbox-label"
            checked={isDistinct}
            onCheckedChange={onDistinctChange}
            className="border-[#f8f9fa] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6]"
          />
          <label
            htmlFor="distinct-checkbox"
            id="distinct-checkbox-label"
            className="text-xs text-[#f8f9fa] cursor-pointer"
          >
            Distinct (Unique Values)
          </label>
        </div>
      </div>
      <Select
        inputId="column-selector"
        instanceId="column-selector"
        aria-labelledby="column-label"
        aria-describedby="column-selector-description"
        options={columnOptions}
        value={selectedColumns}
        onChange={handleChange}
        placeholder="Select column(s) or aggregate(s)"
        isMulti
        isClearable
        isDisabled={!selectedTable || metadataLoading}
        styles={selectStyles}
        className="min-w-0 w-full"
      />
    </div>
  );
}
"use client";

import { useMemo } from "react";
import { useEditorContext } from "@/app/context/EditorContext";
import Select, { MultiValue } from "react-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label"
import { SelectOption } from "@/app/types/query";
import { selectStyles } from "@/app/utils/selectStyles";

// Props for the ColumnSelector component
interface ColumnSelectProps {
  metadataLoading: boolean;
  isMySQL?: boolean;
}

export default function ColumnSelect({
  metadataLoading,
  isMySQL = false,
}: ColumnSelectProps) {
  // Get the selected table, table columns, selected columns, is distinct, handle column select, and handle distinct change from the editor context
  const {
    selectedTable,
    tableColumns,
    selectedColumns,
    isDistinct,
    handleColumnSelect,
    handleDistinctChange,
  } = useEditorContext();


  // Create the aggregate functions
  const aggregateFunctions = useMemo(() => [
    { value: "COUNT(*)", label: "COUNT(*)", isAggregate: true },
  ], []);

  // Create the column options
  const columnOptions: SelectOption[] = useMemo(() => {
    // If no table is selected, return an empty array
    if (!selectedTable) return [];
    // Create the columns
    const columns = [
      // All columns
      { value: "*", label: "All Columns (*)" },
      // Main table columns
      ...(tableColumns[selectedTable.value]?.map((col) => ({
        // Create the column options
        value: col,
        // Create the label
        label: col,
      })) || []),
      // Join table columns
      ...(tableColumns[selectedTable.value]?.flatMap((col) => {
        // Create the aggregates
        const aggregates = [
          {
            value: `SUM_${col}`, 
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

        // If MySQL, add the distinct aggregates
        if (isMySQL) {
          // Add the distinct aggregates
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
        // Return the aggregates
        return aggregates;
      }) || []),
      // Aggregate functions 
      ...aggregateFunctions,
    ];
    // Ensure uniqueness by filtering out duplicates
    const uniqueColumns = Array.from(
      new Map(columns.map((option) => [option.value, option])).values()
    );
    // Return the unique columns
    return uniqueColumns;
  }, [selectedTable, tableColumns, isMySQL, aggregateFunctions]);
  // Handle the change
  const handleChange = (value: MultiValue<SelectOption>) => {
    // Get the last selected column
    const lastSelected = value[value.length - 1];
    // If the last selected column is the all columns
    if (lastSelected?.value === "*") {
      // Handle the column select
      handleColumnSelect([{ value: "*", label: "All Columns (*)" }]);
    } else {
      // Filter the value to remove the all columns
      const filteredValue = value.filter((col) => col.value !== "*");
      // If the filtered value is not empty
      if (filteredValue.length > 0) {
        // Handle the column select
        handleColumnSelect(filteredValue);
      } else {
        // Handle the column select
        handleColumnSelect(
          // If the value contains the all columns
          value.some((col) => col.value === "*")
            ? [{ value: "*", label: "All Columns (*)" }]
            : Array.isArray(value) ? value : []
        );
      }
    }
  };
  // Create the label
  const label =
    // If the selected columns length is 1 and the first column value is the all columns
    selectedColumns.length === 1 && selectedColumns[0].value === "*"
      ? "Columns"
      // If the selected columns length is greater than 1
      : selectedColumns.length > 1
      // Return the columns
      ? "Columns"
      : "Column";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-2">
        <Label
          htmlFor="column-selector"
          id="column-label"
          className="text-xs text-[#f8f9fa]"
        >
          {label}
        </Label>
        <div className="flex items-center gap-2 ml-2">
          <Checkbox
            id="distinct-checkbox"
            aria-labelledby="distinct-checkbox-label"
            checked={isDistinct}
            onCheckedChange={handleDistinctChange}
            className="border-[#f8f9fa] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6]"
          />
          <Label
            htmlFor="distinct-checkbox"
            id="distinct-checkbox-label"
            className="text-xs text-[#f8f9fa] cursor-pointer"
          >
            Distinct (Unique Values)
          </Label>
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

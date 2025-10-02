"use client";

import { useMemo } from "react";
import Select, { MultiValue } from "react-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SelectOption, TableSchema } from "@/app/types/query";
import { selectStyles } from "@/app/utils/selectStyles";
import { useQueryStore } from "@/app/stores/useQueryStore";
import { useQueryActionsStore } from "@/app/stores/useQueryActionsStore";

interface ColumnSelectProps {
  metadataLoading: boolean;
  isMySQL?: boolean;
  schema?: TableSchema[];
}

export default function ColumnSelect({
  metadataLoading,
  isMySQL = false,
  schema = [],
}: ColumnSelectProps) {
  const selectedTable = useQueryStore((state) => state.selectedTable);
  const selectedColumns = useQueryStore((state) => state.selectedColumns);
  const isDistinct = useQueryStore((state) => state.isDistinct);
  const handleColumnSelect = useQueryActionsStore((s) => s.handleColumnSelect);
  const handleDistinctChange = useQueryActionsStore(
    (s) => s.handleDistinctChange
  );

  // Compute table columns from schema
  const tableColumns = useMemo(() => {
    return schema.reduce((acc, table) => {
      acc[table.table_name] = table.columns.map((col) => col.column_name);
      return acc;
    }, {} as Record<string, string[]>);
  }, [schema]);

  // Create the aggregate functions
  const aggregateFunctions = useMemo(
    () => [{ value: "COUNT(*)", label: "COUNT(*)", isAggregate: true }],
    []
  );

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
            : Array.isArray(value)
            ? value
            : []
        );
      }
    }
  };
  // Create the label
  const label =
    // If the selected columns length is 1 and the first column value is the all columns
    selectedColumns.length === 1 && selectedColumns[0].value === "*"
      ? "Columns"
      : // If the selected columns length is greater than 1
      selectedColumns.length > 1
      ? // Return the columns
        "Columns"
      : "Column";

  // Handle alias change
  const handleAliasChange = (columnValue: string, alias: string) => {
    // Update the column with the new alias
    const updatedColumns = selectedColumns.map((col) =>
      col.value === columnValue ? { ...col, alias: alias || undefined } : col
    );
    handleColumnSelect(updatedColumns);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_6px_rgba(139,92,246,0.6)]"></div>
          <Label
            htmlFor="column-selector"
            id="column-label"
            className="text-xs font-semibold text-purple-400 uppercase tracking-wider"
          >
            {label}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="distinct-checkbox"
            aria-labelledby="distinct-checkbox-label"
            checked={isDistinct}
            onCheckedChange={handleDistinctChange}
            className="border-pink-400/50 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 data-[state=checked]:border-pink-400"
          />
          <Label
            htmlFor="distinct-checkbox"
            id="distinct-checkbox-label"
            className="text-xs text-slate-300 cursor-pointer hover:text-pink-300 transition-colors"
          >
            Distinct
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
      {selectedColumns.length > 0 && selectedColumns[0].value !== "*" && (
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] border border-purple-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_6px_rgba(244,114,182,0.6)]"></div>
            <Label className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
              Column Aliases (Optional)
            </Label>
          </div>
          <div className="flex flex-col gap-2">
            {selectedColumns.map((col) => (
              <div key={col.value} className="flex items-center gap-2 group">
                <Label className="text-xs text-slate-400 min-w-[120px] font-mono group-hover:text-purple-300 transition-colors">
                  {col.label}:
                </Label>
                <input
                  type="text"
                  value={col.alias || ""}
                  onChange={(e) => handleAliasChange(col.value, e.target.value)}
                  placeholder="Enter alias (e.g., 'Title')"
                  className="flex-1 px-3 py-1.5 text-xs bg-[#0f0f23] border border-purple-500/30 rounded-lg text-white placeholder-slate-500 font-mono transition-all duration-200 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

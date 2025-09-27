"use client";

import { useCallback, useMemo } from "react";
import Select, { MultiValue, SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";
import { Plus, Trash2 } from "lucide-react";
import { CteClause, SelectOption, TableColumn } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input";

// Props for the WithSelect component
interface WithSelectProps {
  selectedTable: SelectOption | null;
  tableNames: string[];
  tableColumns: TableColumn;
  cteClauses: CteClause[];
  uniqueValues: Record<string, SelectOption[]>;
  operatorOptions: SelectOption[];
  logicalOperatorOptions: SelectOption[];
  onCteAliasChange: (cteIndex: number, alias: string | null) => void;
  onCteTableSelect: (
    cteIndex: number,
    value: SingleValue<SelectOption>
  ) => void;
  onCteColumnSelect: (
    cteIndex: number,
    value: MultiValue<SelectOption>
  ) => void;
  onCteLogicalOperatorSelect: (
    cteIndex: number,
    value: SingleValue<SelectOption>
  ) => void;
  onCteWhereColumnSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SingleValue<SelectOption>
  ) => void;
  onCteOperatorSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SingleValue<SelectOption>
  ) => void;
  onCteValueSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SingleValue<SelectOption>,
    isValue2: boolean
  ) => void;
  onAddCteClause: () => void;
  onRemoveCteClause: (cteIndex: number) => void;
  metadataLoading: boolean;
}

// Props for the WithSelect component
export default function WithSelect({
  selectedTable,
  tableNames,
  tableColumns,
  cteClauses,
  uniqueValues,
  operatorOptions,
  logicalOperatorOptions,
  onCteAliasChange,
  onCteTableSelect,
  onCteColumnSelect,
  onCteLogicalOperatorSelect,
  onCteWhereColumnSelect,
  onCteOperatorSelect,
  onCteValueSelect,
  onAddCteClause,
  onRemoveCteClause,
  metadataLoading,
}: WithSelectProps) {
  // Create the table options
  const tableOptions: SelectOption[] = useMemo(
    () =>
      // Filter the table names to exclude the selected table
      tableNames
        .filter((table) => table !== selectedTable?.value)
        .map((table) => ({ value: table, label: table })),
      // Return the table options
    [tableNames, selectedTable]
  );

  // Create the column options
  const getColumnOptions = useCallback(
    (fromTable: SelectOption | null) => {
      // If the from table is not null
      if (!fromTable?.value) return [];
      // Return the column options
      return [
        { value: "*", label: "All Columns (*)" },
        // Create the column options
        ...(tableColumns[fromTable.value]?.map((col) => ({
          value: col,
          label: col,
        })) || []),
      ];
    },
    [tableColumns]
  );

  // Handle the add CTE
  const handleAddCte = useCallback(() => {
    onAddCteClause();
  }, [onAddCteClause]);

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-800 rounded-md">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-white">
          WITH Clause (CTEs)
        </Label>
        <Button
          onClick={handleAddCte}
          className="flex items-center gap-1 px-2 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={metadataLoading}
          title="Add new CTE"
        >
          <Plus className="w-4 h-4" />
          Add CTE
        </Button>
      </div>
      {cteClauses.length === 0 && (
        <p className="text-xs text-slate-400">
          No CTEs defined. Click &quot;Add CTE&quot; to start.
        </p>
      )}
      {cteClauses.map((cte, cteIndex) => (
        <div
          key={cteIndex}
          className="flex flex-col gap-2 p-2 border border-slate-600 rounded-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">
              CTE {cteIndex + 1}
            </span>
            <Button
              onClick={() => onRemoveCteClause(cteIndex)}
              className="text-red-400 hover:text-red-300"
              title="Remove CTE"
              disabled={metadataLoading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#f8f9fa] mb-1">CTE Alias</label>
              <Input
                type="text"
                value={cte.alias || ""}
                onChange={(e) =>
                  onCteAliasChange(
                    cteIndex,
                    e.target.value.trim() === "" ? null : e.target.value
                  )
                }
                placeholder="CTE Alias"
                className="p-2 text-sm text-white bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={metadataLoading}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-[#f8f9fa] mb-1">From Table</Label>
              <Select
                options={tableOptions}
                value={cte.fromTable}
                onChange={(value) => onCteTableSelect(cteIndex, value)}
                placeholder="Select table"
                isClearable
                isDisabled={metadataLoading}
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-[#f8f9fa] mb-1">Columns</Label>
              <Select
                isMulti
                options={getColumnOptions(cte.fromTable)}
                value={cte.selectedColumns}
                onChange={(value) => onCteColumnSelect(cteIndex, value)}
                placeholder="Select columns"
                isDisabled={metadataLoading || !cte.fromTable}
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-white">
                WHERE Clause
              </Label>
              {cte.whereClause.conditions.map((condition, conditionIndex) => (
                <div
                  key={conditionIndex}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  {conditionIndex === 0 && (
                    <Select
                      options={logicalOperatorOptions}
                      value={condition.logicalOperator}
                      onChange={(value) =>
                        onCteLogicalOperatorSelect(cteIndex, value)
                      }
                      placeholder="Logical Operator"
                      isDisabled={
                        metadataLoading || cte.whereClause.conditions.length < 2
                      }
                      styles={selectStyles}
                      className="w-24"
                    />
                  )}
                  <Select
                    options={getColumnOptions(cte.fromTable)}
                    value={condition.column}
                    onChange={(value) =>
                      onCteWhereColumnSelect(cteIndex, conditionIndex, value)
                    }
                    placeholder="Column"
                    isClearable
                    isDisabled={metadataLoading || !cte.fromTable}
                    styles={selectStyles}
                    className="flex-1"
                  />
                  <Select
                    options={operatorOptions}
                    value={condition.operator}
                    onChange={(value) =>
                      onCteOperatorSelect(cteIndex, conditionIndex, value)
                    }
                    placeholder="Operator"
                    isClearable
                    isDisabled={metadataLoading || !condition.column}
                    styles={selectStyles}
                    className="flex-1"
                  />
                  <CreatableSelect
                    options={
                      uniqueValues[
                        `cte${cteIndex}Condition${conditionIndex + 1}`
                      ] || []
                    }
                    value={condition.value}
                    onChange={(value) =>
                      onCteValueSelect(cteIndex, conditionIndex, value, false)
                    }
                    placeholder="Value"
                    isClearable
                    isDisabled={
                      metadataLoading ||
                      !condition.column ||
                      !condition.operator ||
                      condition.operator.value === "IS NULL" ||
                      condition.operator.value === "IS NOT NULL"
                    }
                    styles={selectStyles}
                    className="flex-1"
                    formatCreateLabel={(inputValue) => inputValue}
                  />
                  {condition.operator?.value === "BETWEEN" && (
                    <CreatableSelect
                      options={
                        uniqueValues[
                          `cte${cteIndex}Condition${conditionIndex + 1}`
                        ] || []
                      }
                      value={condition.value2}
                      onChange={(value) =>
                        onCteValueSelect(cteIndex, conditionIndex, value, true)
                      }
                      placeholder="Value 2"
                      isClearable
                      isDisabled={
                        metadataLoading ||
                        !condition.column ||
                        !condition.operator
                      }
                      styles={selectStyles}
                      className="flex-1"
                      formatCreateLabel={(inputValue) => inputValue}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

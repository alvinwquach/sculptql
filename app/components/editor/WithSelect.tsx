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
  onCteGroupBySelect: (cteIndex: number, value: readonly SelectOption[]) => void;
  onCteHavingAggregateSelect: (cteIndex: number, conditionIndex: number, value: SingleValue<SelectOption>) => void;
  onCteHavingOperatorSelect: (cteIndex: number, conditionIndex: number, value: SingleValue<SelectOption>) => void;
  onCteHavingValueSelect: (cteIndex: number, conditionIndex: number, value: SingleValue<SelectOption>) => void;
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
  onCteGroupBySelect,
  onCteHavingAggregateSelect,
  onCteHavingOperatorSelect,
  onCteHavingValueSelect,
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
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-lg border border-pink-500/20 shadow-[0_0_15px_rgba(244,114,182,0.1)]">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          WITH Clause (CTEs)
        </Label>
        <Button
          onClick={handleAddCte}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 rounded-lg border border-pink-400/30 shadow-[0_0_10px_rgba(244,114,182,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={metadataLoading}
          title="Add new CTE"
        >
          <Plus className="w-4 h-4" />
          Add CTE
        </Button>
      </div>
      {cteClauses.length === 0 && (
        <p className="text-xs text-pink-300/60 font-mono">
          No CTEs defined. Click &quot;Add CTE&quot; to start.
        </p>
      )}
      {cteClauses.map((cte, cteIndex) => (
        <div
          key={cteIndex}
          className="flex flex-col gap-3 p-3 border border-pink-500/30 rounded-lg bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] shadow-[0_0_10px_rgba(244,114,182,0.1)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              CTE {cteIndex + 1}
            </span>
            <Button
              onClick={() => onRemoveCteClause(cteIndex)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-all duration-200"
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
                className="w-full p-2 text-sm bg-[#0f0f23] text-white border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 font-mono"
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
        maxMenuHeight={300}
        menuPlacement="auto"
        
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
        maxMenuHeight={300}
        menuPlacement="auto"
        
              />
            </div>
            <div className="flex flex-col gap-3">
  <Label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
    WHERE Clause
  </Label>
  {cte.whereClause.conditions.map((condition, conditionIndex) => (
    <div
      key={conditionIndex}
      className="p-4 border border-pink-500/30 rounded-lg bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] shadow-[0_0_10px_rgba(244,114,182,0.1)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {conditionIndex === 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-pink-300/80 font-mono">Logical Op</label>
            <Select
              options={logicalOperatorOptions}
              value={condition.logicalOperator}
              onChange={(value) => onCteLogicalOperatorSelect(cteIndex, value)}
              placeholder="Logical Op"
              isDisabled={
                metadataLoading || cte.whereClause.conditions.length < 2
              }
              styles={selectStyles}
              className="w-full"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-pink-300/80 font-mono">Column</label>
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
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-pink-300/80 font-mono">Operator</label>
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
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-pink-300/80 font-mono">Value</label>
          <CreatableSelect
            options={
              uniqueValues[`cte${cteIndex}Condition${conditionIndex + 1}`] || []
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
              ["IS NULL", "IS NOT NULL"].includes(
                condition.operator?.value || ""
              )
            }
            styles={selectStyles}
            className="w-full"
            formatCreateLabel={(inputValue) => inputValue}
          />
        </div>
        {condition.operator?.value === "BETWEEN" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-pink-300/80 font-mono">Value 2</label>
            <CreatableSelect
              options={
                uniqueValues[`cte${cteIndex}Condition${conditionIndex + 1}`] ||
                []
              }
              value={condition.value2}
              onChange={(value) =>
                onCteValueSelect(cteIndex, conditionIndex, value, true)
              }
              placeholder="Value 2"
              isClearable
              isDisabled={
                metadataLoading || !condition.column || !condition.operator
              }
              styles={selectStyles}
              className="w-full"
              formatCreateLabel={(inputValue) => inputValue}
            />
          </div>
        )}
      </div>
    </div>
  ))}
</div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                GROUP BY (Optional)
              </Label>
              <Select
                isMulti
                options={getColumnOptions(cte.fromTable)}
                value={cte.groupByColumns}
                onChange={(value) => onCteGroupBySelect(cteIndex, value)}
                placeholder="Select columns to group by"
                isDisabled={metadataLoading || !cte.fromTable}
                styles={selectStyles}
                className="min-w-0 w-full"
        maxMenuHeight={300}
        menuPlacement="auto"
        
              />
            </div>
            {cte.groupByColumns && cte.groupByColumns.length > 0 && (
              <div className="flex flex-col gap-3">
                <Label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400">
                  HAVING (Filter Aggregates)
                </Label>
                {cte.havingClause.conditions.map((condition, conditionIndex) => (
                  <div
                    key={conditionIndex}
                    className="p-4 border border-amber-500/30 rounded-lg bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-amber-300/80 font-mono">Aggregate</label>
                        <Select
                          options={
                            cte.fromTable
                              ? [
                                  { value: "COUNT(*)", label: "COUNT(*)" },
                                  ...getColumnOptions(cte.fromTable)
                                    .filter((col) => col.value !== "*")
                                    .flatMap((col) => [
                                      { value: `COUNT(${col.value})`, label: `COUNT(${col.value})` },
                                      { value: `SUM(${col.value})`, label: `SUM(${col.value})` },
                                      { value: `AVG(${col.value})`, label: `AVG(${col.value})` },
                                      { value: `MAX(${col.value})`, label: `MAX(${col.value})` },
                                      { value: `MIN(${col.value})`, label: `MIN(${col.value})` },
                                    ]),
                                ]
                              : []
                          }
                          value={condition.aggregateColumn}
                          onChange={(value) =>
                            onCteHavingAggregateSelect(cteIndex, conditionIndex, value)
                          }
                          placeholder="COUNT(*), SUM(...)"
                          isClearable
                          isDisabled={metadataLoading || !cte.fromTable}
                          styles={selectStyles}
                          className="w-full"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-amber-300/80 font-mono">Operator</label>
                        <Select
                          options={operatorOptions}
                          value={condition.operator}
                          onChange={(value) =>
                            onCteHavingOperatorSelect(cteIndex, conditionIndex, value)
                          }
                          placeholder="Operator"
                          isClearable
                          isDisabled={metadataLoading || !condition.aggregateColumn}
                          styles={selectStyles}
                          className="w-full"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-amber-300/80 font-mono">Value</label>
                        <CreatableSelect
                          options={[]}
                          value={condition.value}
                          onChange={(value) =>
                            onCteHavingValueSelect(cteIndex, conditionIndex, value)
                          }
                          placeholder="Value"
                          isClearable
                          isDisabled={
                            metadataLoading ||
                            !condition.aggregateColumn ||
                            !condition.operator
                          }
                          styles={selectStyles}
                          className="w-full"
                          formatCreateLabel={(inputValue) => inputValue}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      ))}
    </div>
  );
}

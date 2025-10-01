"use client";

import { useState, useMemo, useCallback } from "react";
import Select, { SingleValue } from "react-select";
import {
  CaseClause,
  SelectOption,
  TableColumn,
  JoinClause,
} from "@/app/types/query";
import { Trash2, Plus } from "lucide-react";
import { selectStyles } from "../../utils/selectStyles";
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Props for the CaseSelector component
interface CaseSelectorProps {
  selectedTable: SelectOption | null;
  tableColumns: TableColumn;
  caseClause: CaseClause;
  uniqueValues: Record<string, SelectOption[]>;
  joinClauses: JoinClause[];
  operatorOptions: SelectOption[];
  onCaseColumnSelect: (
    newValue: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onCaseOperatorSelect: (
    newValue: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onCaseValueSelect: (
    newValue: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onCaseResultSelect: (
    newValue: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onElseResultSelect: (newValue: SingleValue<SelectOption>) => void;
  onCaseAliasChange: (alias: string | null) => void;
  onAddCaseCondition: () => void;
  onRemoveCaseCondition: (conditionIndex: number) => void;
  metadataLoading: boolean;
}

export default function CaseSelector({
  selectedTable,
  tableColumns,
  caseClause,
  uniqueValues,
  joinClauses,
  operatorOptions,
  onCaseColumnSelect,
  onCaseOperatorSelect,
  onCaseValueSelect,
  onCaseResultSelect,
  onElseResultSelect,
  onCaseAliasChange,
  onAddCaseCondition,
  onRemoveCaseCondition,
  metadataLoading,
}: CaseSelectorProps) {
  // State for the alias input
  const [aliasInput, setAliasInput] = useState<string>(caseClause.alias || "");

  // Create the column options
  const columnOptions = useMemo<SelectOption[]>(() => {
    // If no table is selected, return an empty array
    if (!selectedTable?.value) return [];
    // Create the main table columns
    const mainTableColumns =
      tableColumns[selectedTable.value]?.map((col) => ({
        // Create the column options
        value: `${selectedTable.value}.${col}`,
        // Create the label
        label: `${selectedTable.value}.${col}`,
      })) || [];
    // Create the join table columns
    const joinTableColumns = joinClauses
      // Filter the join clauses to only include join clauses with a table
      .filter((join) => join.table?.value)
      // Create the join table columns
      .flatMap(
        (join) =>
          tableColumns[join.table!.value]?.map((col) => ({
            // Create the column options
            value: `${join.table!.value}.${col}`,
            // Create the label
            label: `${join.table!.value}.${col}`,
          })) || []
      );
    // Return the column options
    return [...mainTableColumns, ...joinTableColumns];
    
  }, [selectedTable, tableColumns, joinClauses]);


  // Create the result options
  const resultOptions = useMemo<SelectOption[]>(() => {
    // Create the all values
    const allValues = Object.values(uniqueValues).flat();
    // Create the unique results
    const uniqueResults = Array.from(
      new Set(allValues.map((opt) => opt.value))
    ).map((value) => ({
      // Create the result options
      value,
      label: value,
    }));
    // Return the unique results
    return uniqueResults;
  }, [uniqueValues]);

  // Handle the alias change
  const handleAliasChange = useCallback(
    // Handle the alias change
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Get the value from the input
      const value = e.target.value;
      // Set the alias input
      setAliasInput(value);
      // On case alias change
      onCaseAliasChange(value.trim() === "" ? null : value);
    },
    [onCaseAliasChange]
  );

  return (
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_6px_rgba(139,92,246,0.6)]"></div>
          <Label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-wider">
            CASE Statement
          </Label>
        </div>
        <Button
          onClick={onAddCaseCondition}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 rounded-lg border border-purple-400/30 shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={metadataLoading || !selectedTable}
          title="Add new CASE condition"
        >
          <Plus className="w-4 h-4" />
          Add When
        </Button>
      </div>
      {caseClause.conditions.length === 0 && (
        <p className="text-xs text-pink-300/70 font-mono">
          No CASE conditions defined. Click &quot;Add When&quot; to start.
        </p>
      )}
      {caseClause.conditions.map((condition, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 p-3 border border-pink-500/30 rounded-lg bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] shadow-[0_0_10px_rgba(244,114,182,0.1)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 uppercase tracking-wide">
              WHEN {index + 1}
            </span>
            <Button
              onClick={() => onRemoveCaseCondition(index)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-all duration-200"
              title="Remove condition"
              disabled={metadataLoading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-pink-300/80 font-mono">
                Column
              </Label>
              <Select
                options={columnOptions}
                value={condition.column}
                onChange={(newValue) => onCaseColumnSelect(newValue, index)}
                placeholder="Select column"
                isDisabled={metadataLoading || !selectedTable}
                styles={selectStyles}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-pink-300/80 font-mono">
                Operator
              </Label>
              <Select
                options={operatorOptions}
                value={condition.operator}
                onChange={(newValue) => onCaseOperatorSelect(newValue, index)}
                placeholder="=, >, <, etc."
                isDisabled={metadataLoading || !condition.column}
                styles={selectStyles}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-pink-300/80 font-mono">
                Value
              </Label>
              <Select
                options={uniqueValues[`caseCondition${index + 1}`] || []}
                value={condition.value}
                onChange={(newValue) => onCaseValueSelect(newValue, index)}
                placeholder="Compare value"
                isDisabled={
                  metadataLoading ||
                  !condition.column ||
                  !condition.operator ||
                  condition.operator.value === "IS NULL" ||
                  condition.operator.value === "IS NOT NULL"
                }
                isClearable
                styles={selectStyles}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-cyan-300/80 font-mono">
                THEN Result
              </Label>
              <Select
                options={resultOptions}
                value={condition.result}
                onChange={(newValue) => onCaseResultSelect(newValue, index)}
                placeholder="Return value"
                isDisabled={
                  metadataLoading || !condition.column || !condition.operator
                }
                isClearable
                styles={selectStyles}
                className="w-full"
              />
            </div>
          </div>
        </div>
      ))}
      {caseClause.conditions.length > 0 && (
        <div className="flex flex-col gap-2.5 p-3 bg-[#0f0f23]/50 rounded-lg border border-cyan-500/20">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-amber-300/80 font-mono uppercase tracking-wider">
              ELSE (Default)
            </Label>
            <Select
              options={resultOptions}
              value={caseClause.elseValue}
              onChange={onElseResultSelect}
              placeholder="Default result if no conditions match"
              isDisabled={metadataLoading || caseClause.conditions.length === 0}
              isClearable
              styles={selectStyles}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-emerald-300/80 font-mono uppercase tracking-wider">
              AS (Alias)
            </Label>
            <Input
              type="text"
              value={aliasInput}
              onChange={handleAliasChange}
              placeholder="Column name (e.g., 'Mood' or 'Review')"
              className="w-full px-3 py-2 text-sm bg-[#0f0f23] border border-purple-500/30 rounded-lg text-white placeholder-slate-500 font-mono transition-all duration-200 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              disabled={metadataLoading || caseClause.conditions.length === 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}

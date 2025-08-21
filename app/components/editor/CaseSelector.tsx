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
  const [aliasInput, setAliasInput] = useState<string>(caseClause.alias || "");

  const columnOptions = useMemo<SelectOption[]>(() => {
    if (!selectedTable?.value) return [];
    const mainTableColumns =
      tableColumns[selectedTable.value]?.map((col) => ({
        value: `${selectedTable.value}.${col}`,
        label: `${selectedTable.value}.${col}`,
      })) || [];
    const joinTableColumns = joinClauses
      .filter((join) => join.table?.value)
      .flatMap(
        (join) =>
          tableColumns[join.table!.value]?.map((col) => ({
            value: `${join.table!.value}.${col}`,
            label: `${join.table!.value}.${col}`,
          })) || []
      );
    return [...mainTableColumns, ...joinTableColumns];
  }, [selectedTable, tableColumns, joinClauses]);

  const resultOptions = useMemo<SelectOption[]>(() => {
    const allValues = Object.values(uniqueValues).flat();
    const uniqueResults = Array.from(
      new Set(allValues.map((opt) => opt.value))
    ).map((value) => ({
      value,
      label: value,
    }));
    return uniqueResults;
  }, [uniqueValues]);

  const handleAliasChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAliasInput(value);
      onCaseAliasChange(value.trim() === "" ? null : value);
    },
    [onCaseAliasChange]
  );

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-800 rounded-md">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">CASE Clause</label>
        <button
          onClick={onAddCaseCondition}
          className="flex items-center gap-1 px-2 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={metadataLoading || !selectedTable}
          title="Add new CASE condition"
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </button>
      </div>
      {caseClause.conditions.length === 0 && (
        <p className="text-xs text-slate-400">
          No CASE conditions defined. Click &quot;Add Condition&quot; to start.
        </p>
      )}
      {caseClause.conditions.map((condition, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 p-2 border border-slate-600 rounded-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">
              WHEN Condition {index + 1}
            </span>
            <button
              onClick={() => onRemoveCaseCondition(index)}
              className="text-red-400 hover:text-red-300"
              title="Remove condition"
              disabled={metadataLoading}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              options={columnOptions}
              value={condition.column}
              onChange={(newValue) => onCaseColumnSelect(newValue, index)}
              placeholder="Select column"
              isDisabled={metadataLoading || !selectedTable}
              styles={selectStyles}
              className="flex-1"
            />
            <Select
              options={operatorOptions}
              value={condition.operator}
              onChange={(newValue) => onCaseOperatorSelect(newValue, index)}
              placeholder="Operator"
              isDisabled={metadataLoading || !condition.column}
              styles={selectStyles}
              className="flex-1"
            />
            <Select
              options={uniqueValues[`caseCondition${index + 1}`] || []}
              value={condition.value}
              onChange={(newValue) => onCaseValueSelect(newValue, index)}
              placeholder="Value"
              isDisabled={
                metadataLoading ||
                !condition.column ||
                !condition.operator ||
                condition.operator.value === "IS NULL" ||
                condition.operator.value === "IS NOT NULL"
              }
              isClearable
              styles={selectStyles}
              className="flex-1"
            />
            <Select
              options={resultOptions}
              value={condition.result}
              onChange={(newValue) => onCaseResultSelect(newValue, index)}
              placeholder="THEN Result"
              isDisabled={
                metadataLoading || !condition.column || !condition.operator
              }
              isClearable
              styles={selectStyles}
              className="flex-1"
            />
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-2 sm:flex-row items-center">
        <Select
          options={resultOptions}
          value={caseClause.elseValue}
          onChange={onElseResultSelect}
          placeholder="ELSE Result"
          isDisabled={metadataLoading || caseClause.conditions.length === 0}
          isClearable
          styles={selectStyles}
          className="flex-1"
        />
        <input
          type="text"
          value={aliasInput}
          onChange={handleAliasChange}
          placeholder="CASE Alias"
          className="flex-1 p-2 text-sm text-white bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={metadataLoading || caseClause.conditions.length === 0}
        />
      </div>
    </div>
  );
}

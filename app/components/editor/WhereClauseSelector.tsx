"use client";

import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { SingleValue } from "react-select";
import {
  SelectOption,
  TableColumn,
  WhereClause,
  JoinClause,
} from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface WhereClauseSelectorProps {
  selectedTable: SelectOption | null;
  tableColumns: TableColumn;
  whereClause: WhereClause;
  uniqueValues: Record<string, SelectOption[]>;
  onLogicalOperatorSelect: (value: SingleValue<SelectOption>) => void;
  onWhereColumnSelect: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onOperatorSelect: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onValueSelect: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void;
  metadataLoading: boolean;
  operatorOptions: SelectOption[];
  logicalOperatorOptions: SelectOption[];
  joinClauses: JoinClause[];
}

export default function WhereClauseSelector({
  selectedTable,
  tableColumns,
  whereClause,
  uniqueValues,
  onLogicalOperatorSelect,
  onWhereColumnSelect,
  onOperatorSelect,
  onValueSelect,
  metadataLoading,
  operatorOptions,
  logicalOperatorOptions,
  joinClauses,
}: WhereClauseSelectorProps) {
  const whereColumnOptions: SelectOption[] = selectedTable
    ? [
        ...(tableColumns[selectedTable.value]?.map((col) => ({
          value: `${selectedTable.value}.${col}`,
          label: `${selectedTable.value}.${col}`,
        })) || []),
        ...joinClauses
          .filter((join) => join.table?.value)
          .flatMap(
            (join) =>
              tableColumns[join.table!.value]?.map((col) => ({
                value: `${join.table!.value}.${col}`,
                label: `${join.table!.value}.${col}`,
              })) || []
          ),
      ]
    : [];

  return (
    <div className="flex flex-col gap-2">
      {whereClause.conditions.map((condition, index) => (
        <div key={index} className="flex flex-row items-center gap-2 w-full">
          {index === 1 && (
            <div className="flex flex-col gap-1 w-1/4">
              <label className="text-xs text-[#f8f9fa] mb-1">Filter</label>
              <Select
                options={logicalOperatorOptions}
                value={whereClause.conditions[0].logicalOperator}
                onChange={onLogicalOperatorSelect}
                placeholder="Filter"
                isDisabled={!selectedTable || metadataLoading}
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
          )}
          <div className="flex flex-col gap-1 w-1/4">
            <label className="text-xs text-[#f8f9fa] mb-1">
              {index === 0 ? "Column (Where)" : "Column (And)"}
            </label>
            <Select
              options={whereColumnOptions}
              value={condition.column}
              onChange={(value) => onWhereColumnSelect(value, index)}
              placeholder="Column"
              isClearable
              isDisabled={!selectedTable || metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-1/4">
            <label className="text-xs text-[#f8f9fa] mb-1">Operator</label>
            <Select
              options={operatorOptions}
              value={condition.operator}
              onChange={(value) => onOperatorSelect(value, index)}
              placeholder="Operator"
              isClearable
              isDisabled={
                !selectedTable || !condition.column || metadataLoading
              }
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          {condition.operator?.value === "BETWEEN" ? (
            <>
              <div className="flex flex-col gap-1 w-1/4">
                <label className="text-xs text-[#f8f9fa] mb-1">Value 1</label>
                <CreatableSelect
                  options={uniqueValues[`condition${index + 1}`]}
                  value={condition.value}
                  onChange={(value) => onValueSelect(value, index, false)}
                  placeholder="Value 1"
                  isClearable
                  isDisabled={
                    !selectedTable ||
                    !condition.column ||
                    !condition.operator ||
                    metadataLoading
                  }
                  styles={selectStyles}
                  className="min-w-0 w-full"
                  formatCreateLabel={(inputValue) => inputValue}
                />
              </div>
              <div className="flex flex-col gap-1 w-1/4">
                <label className="text-xs text-[#f8f9fa] mb-1">Value 2</label>
                <CreatableSelect
                  options={uniqueValues[`condition${index + 1}`]}
                  value={condition.value2}
                  onChange={(value) => onValueSelect(value, index, true)}
                  placeholder="Value 2"
                  isClearable
                  isDisabled={
                    !selectedTable ||
                    !condition.column ||
                    !condition.operator ||
                    !condition.value ||
                    metadataLoading
                  }
                  styles={selectStyles}
                  className="min-w-0 w-full"
                  formatCreateLabel={(inputValue) => inputValue}
                />
              </div>
            </>
          ) : (
            <div
              className={
                index === 0
                  ? "flex flex-col gap-1 w-1/2"
                  : "flex flex-col gap-1 w-1/4"
              }
            >
              <label className="text-xs text-[#f8f9fa] mb-1">Value</label>
              <CreatableSelect
                options={uniqueValues[`condition${index + 1}`]}
                value={condition.value}
                onChange={(value) => onValueSelect(value, index, false)}
                placeholder="Value"
                isClearable
                isDisabled={
                  !selectedTable ||
                  !condition.column ||
                  !condition.operator ||
                  condition.operator?.value === "IS NULL" ||
                  condition.operator?.value === "IS NOT NULL" ||
                  metadataLoading
                }
                styles={selectStyles}
                className="min-w-0 w-full"
                formatCreateLabel={(inputValue) => inputValue}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

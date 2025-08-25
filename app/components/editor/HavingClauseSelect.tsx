"use client";

import { useMemo } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  SelectOption,
  HavingCondition,
  TableColumn,
  JoinClause,
} from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface HavingClauseSelectProps {
  tableColumns: TableColumn;
  selectedTable: SelectOption | null;
  joinClauses: JoinClause[];
  havingClause: { conditions: HavingCondition[] };
  uniqueValues: Record<string, SelectOption[]>;
  onHavingAggregateSelect: (index: number, value: SelectOption | null) => void;
  onHavingColumnSelect: (index: number, value: SelectOption | null) => void;
  onHavingOperatorSelect: (index: number, value: SelectOption | null) => void;
  onHavingValueChange: (index: number, value: string | null) => void;
  metadataLoading: boolean;
  operatorOptions: SelectOption[];
}

const aggregateOptions: SelectOption[] = [
  { value: "COUNT(*)", label: "COUNT(*)" },
  { value: "COUNT", label: "COUNT" },
  { value: "SUM", label: "SUM" },
  { value: "AVG", label: "AVG" },
  { value: "MIN", label: "MIN" },
  { value: "MAX", label: "MAX" },
];

export default function HavingClauseSelect({
  tableColumns,
  selectedTable,
  joinClauses,
  havingClause,
  uniqueValues,
  onHavingAggregateSelect,
  onHavingColumnSelect,
  onHavingOperatorSelect,
  onHavingValueChange,
  metadataLoading,
  operatorOptions,
}: HavingClauseSelectProps) {
  const columnOptions = useMemo(() => {
    if (!selectedTable) return [];
    return [
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
    ];
  }, [selectedTable, tableColumns, joinClauses]);

  const condition = havingClause.conditions[0];

  const valueOptions =
    condition?.column?.value && uniqueValues[condition.column.value]
      ? uniqueValues[condition.column.value]
      : [];

  return (
    <div className="space-y-4">
      <label className="block font-medium text-gray-200">Having Clause</label>
      <div className="flex space-x-2 items-center">
        <Select
          options={aggregateOptions}
          value={condition?.aggregate}
          onChange={(val) => onHavingAggregateSelect(0, val)}
          placeholder="Aggregate"
          isClearable
          isDisabled={metadataLoading}
          styles={selectStyles}
          className="w-32"
          aria-label="Aggregate function"
        />
        {condition?.aggregate?.value !== "COUNT(*)" && (
          <Select
            options={columnOptions}
            value={condition?.column}
            onChange={(val) => onHavingColumnSelect(0, val)}
            placeholder="Column"
            isClearable
            isDisabled={metadataLoading}
            styles={selectStyles}
            className="w-40"
            aria-label="Column"
          />
        )}
        <Select
          options={operatorOptions}
          value={condition?.operator}
          onChange={(val) => onHavingOperatorSelect(0, val)}
          placeholder="Operator"
          isClearable
          isDisabled={metadataLoading}
          styles={selectStyles}
          className="w-24"
          aria-label="Operator"
        />
        <CreatableSelect
          options={valueOptions}
          value={
            condition?.value
              ? { label: condition.value, value: condition.value }
              : null
          }
          onChange={(val) => onHavingValueChange(0, val?.value || null)}
          placeholder="Value"
          isClearable
          isDisabled={metadataLoading}
          styles={selectStyles}
          className="w-32"
          aria-label="Condition value"
          formatCreateLabel={(inputValue) => inputValue}
        />
      </div>
    </div>
  );
}

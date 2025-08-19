"use client";

import Select from "react-select";
import { SingleValue } from "react-select";
import { SelectOption, TableColumn, JoinClause } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface AggregateSelectorProps {
  selectedTable: SelectOption | null;
  tableColumns: TableColumn;
  selectedAggregate: SelectOption | null;
  aggregateColumn: SelectOption | null;
  decimalPlaces: SelectOption | null;
  onAggregateSelect: (value: SingleValue<SelectOption>) => void;
  onAggregateColumnSelect: (value: SingleValue<SelectOption>) => void;
  onDecimalPlacesSelect: (value: SingleValue<SelectOption>) => void;
  metadataLoading: boolean;
  joinClauses: JoinClause[];
}

export default function AggregateSelector({
  selectedTable,
  tableColumns,
  selectedAggregate,
  aggregateColumn,
  decimalPlaces,
  onAggregateSelect,
  onAggregateColumnSelect,
  onDecimalPlacesSelect,
  metadataLoading,
  joinClauses,
}: AggregateSelectorProps) {
  const aggregateOptions: SelectOption[] = [
    { value: "COUNT(*)", label: "COUNT(*)", aggregate: true },
    { value: "SUM", label: "SUM()", aggregate: true },
    { value: "MAX", label: "MAX()", aggregate: true },
    { value: "MIN", label: "MIN()", aggregate: true },
    { value: "AVG", label: "AVG()", aggregate: true },
    { value: "ROUND", label: "ROUND()", aggregate: true },
  ];

  const columnOptions: SelectOption[] = selectedTable
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

  const decimalOptions: SelectOption[] = [
    { value: "0", label: "0" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#f8f9fa] mb-1">Aggregate</label>
        <Select
          options={aggregateOptions}
          value={selectedAggregate}
          onChange={onAggregateSelect}
          placeholder="Aggregate function"
          isClearable
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
        />
      </div>
      {selectedAggregate && selectedAggregate.value !== "COUNT(*)" && (
        <div className="flex flex-row gap-2 w-full">
          <div className="flex flex-col gap-1 w-1/2">
            <label className="text-xs text-[#f8f9fa] mb-1">Column</label>
            <Select
              options={columnOptions}
              value={aggregateColumn}
              onChange={onAggregateColumnSelect}
              placeholder="Aggregate column"
              isClearable
              isDisabled={!selectedTable || metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          {selectedAggregate.value === "ROUND" && (
            <div className="flex flex-col gap-1 w-1/2">
              <label className="text-xs text-[#f8f9fa] mb-1">Decimals</label>
              <Select
                options={decimalOptions}
                value={decimalPlaces}
                onChange={onDecimalPlacesSelect}
                placeholder="Decimal places"
                isClearable
                isDisabled={
                  !selectedTable || !aggregateColumn || metadataLoading
                }
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

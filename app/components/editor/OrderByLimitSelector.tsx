"use client";

import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { SingleValue } from "react-select";
import {
  SelectOption,
  TableColumn,
  OrderByClause,
  JoinClause,
} from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface OrderByLimitSelectorProps {
  selectedTable: SelectOption | null;
  tableColumns: TableColumn;
  orderByClause: OrderByClause;
  limit: SelectOption | null;
  onOrderByColumnSelect: (value: SingleValue<SelectOption>) => void;
  onOrderByDirectionSelect: (value: SingleValue<SelectOption>) => void;
  onLimitSelect: (value: SingleValue<SelectOption>) => void;
  metadataLoading: boolean;
  joinClauses: JoinClause[];
}

export default function OrderByLimitSelector({
  selectedTable,
  tableColumns,
  orderByClause,
  limit,
  onOrderByColumnSelect,
  onOrderByDirectionSelect,
  onLimitSelect,
  metadataLoading,
  joinClauses,
}: OrderByLimitSelectorProps) {
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

  const directionOptions: SelectOption[] = [
    { value: "ASC", label: "Ascending (A-Z, low-high)" },
    { value: "DESC", label: "Descending (Z-A, high-low)" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2 w-full">
        <div className="flex flex-col gap-1 w-1/2">
          <label className="text-xs text-[#f8f9fa] mb-1">Order By</label>
          <Select
            options={columnOptions}
            value={orderByClause.column}
            onChange={onOrderByColumnSelect}
            placeholder="Order by column"
            isClearable
            isDisabled={!selectedTable || metadataLoading}
            styles={selectStyles}
            className="min-w-0 w-full"
          />
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <label className="text-xs text-[#f8f9fa] mb-1">Direction</label>
          <Select
            options={directionOptions}
            value={orderByClause.direction}
            onChange={onOrderByDirectionSelect}
            placeholder="Direction"
            isClearable
            isDisabled={
              !selectedTable || !orderByClause.column || metadataLoading
            }
            styles={selectStyles}
            className="min-w-0 w-full"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 w-full">
        <label className="text-xs text-[#f8f9fa] mb-1">Limit</label>
        <CreatableSelect
          options={[
            { value: "10", label: "10" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
          value={limit}
          onChange={onLimitSelect}
          placeholder="Limit rows"
          isClearable
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
          formatCreateLabel={(inputValue) => inputValue}
        />
      </div>
    </div>
  );
}

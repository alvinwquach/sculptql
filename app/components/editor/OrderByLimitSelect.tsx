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

interface OrderByLimitSelectProps {
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

export default function OrderByLimitSelect({
  selectedTable,
  tableColumns,
  orderByClause,
  limit,
  onOrderByColumnSelect,
  onOrderByDirectionSelect,
  onLimitSelect,
  metadataLoading,
  joinClauses,
}: OrderByLimitSelectProps) {
  const columnOptions: SelectOption[] = selectedTable
    ? [
        ...(tableColumns[selectedTable.value]?.map((col) => ({
          value: col,
          label: col,
        })) || []),
        ...joinClauses
          .filter((join) => join.table?.value)
          .flatMap(
            (join) =>
              tableColumns[join.table!.value]?.map((col) => ({
                value: col,
                label: col,
              })) || []
          ),
      ]
    : [];

  const directionOptions: SelectOption[] = [
    { value: "ASC", label: "Ascending (A-Z, low-high)" },
    { value: "DESC", label: "Descending (Z-A, high-low)" },
  ];

  const limitOptions: SelectOption[] = [
    { value: "1", label: "1" },
    { value: "3", label: "3" },
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  const orderByColumnId = "order-by-column";
  const orderByDirectionId = "order-by-direction";
  const limitId = "limit-select";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2 w-full">
        <div className="flex flex-col gap-1 w-1/2">
          <label
            className="text-xs text-[#f8f9fa] mb-1"
            htmlFor={orderByColumnId}
          >
            Order By
          </label>
          <Select
            aria-label="Select a column to order by"
            instanceId={orderByColumnId}
            inputId={orderByColumnId}
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
          <label
            className="text-xs text-[#f8f9fa] mb-1"
            htmlFor={orderByDirectionId}
          >
            Direction
          </label>
          <Select
            aria-label="Select the direction for ordering"
            instanceId={orderByDirectionId}
            inputId={orderByDirectionId}
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
        <label className="text-xs text-[#f8f9fa] mb-1" htmlFor={limitId}>
          Limit
        </label>
        <CreatableSelect
          aria-label="Set the row limit"
          instanceId={limitId}
          inputId={limitId}
          options={limitOptions}
          value={limit}
          onChange={onLimitSelect}
          placeholder="Limit rows"
          isClearable
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
          formatCreateLabel={(inputValue) => `Use ${inputValue}`}
          isValidNewOption={(inputValue) =>
            /^\d+$/.test(inputValue) && parseInt(inputValue) > 0
          }
        />
      </div>
    </div>
  );
}

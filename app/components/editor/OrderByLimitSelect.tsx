"use client"

import { useEditorContext } from "@/app/context/EditorContext";
import { SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";
import { JoinClause, SelectOption, OrderByClause } from "@/app/types/query";
import { selectStyles } from "@/app/utils/selectStyles";
import { Label } from "@/components/ui/label"

// Props for the OrderByLimitSelect component
interface OrderByLimitSelectProps {
  metadataLoading: boolean;
  joinClauses: JoinClause[];
}

export default function OrderByLimitSelect({
  metadataLoading,
  joinClauses,
}: OrderByLimitSelectProps) {
  // Get the selected table, table columns, order by clause, limit, handle order by column select, handle order by direction select, and handle limit select from the editor context
  const {
    selectedTable,
    tableColumns,
    orderByClause,
    limit,
    handleOrderByColumnSelect,
    handleOrderByDirectionSelect,
    handleLimitSelect,
  } = useEditorContext();

  // Handle the order by column select
  const handleOrderByColumnSelectWrapper = (value: SingleValue<SelectOption>) => {
    // If the value is not null
    if (value) {
      handleOrderByColumnSelect(value);
    }
  };

  // Handle the order by direction select
  const handleOrderByDirectionSelectWrapper = (value: SingleValue<SelectOption>) => {
    // If the value is not null
    if (value) {
      handleOrderByDirectionSelect(value);
    }
  };

  // Handle the limit select
  const handleLimitSelectWrapper = (value: SingleValue<SelectOption>) => {
    if (value) {
      handleLimitSelect(value);
    }
  };

  // Create the direction options
  const directionOptions: SelectOption[] = [
    { value: "ASC", label: "Ascending (A-Z, low-high)" },
    { value: "DESC", label: "Descending (Z-A, high-low)" },
  ];

  // Create the limit options
  const limitOptions: SelectOption[] = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
    { value: "500", label: "500" },
    { value: "1000", label: "1000" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-white text-opacity-80 font-semibold">
          Order By
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex flex-col gap-1 w-full">
            <Label
              htmlFor="order-by-column"
              className="text-xs text-[#f8f9fa]"
            >
              Column
            </Label>
            <CreatableSelect
              inputId="order-by-column"
              instanceId="order-by-column"
              aria-label="Select column for ordering"
              options={
                selectedTable
                  ? tableColumns[selectedTable.value]?.map((col) => ({
                      value: col,
                      label: col,
                    })) || []
                  : []
              }
              value={orderByClause.column}
                  onChange={handleOrderByColumnSelectWrapper}
              placeholder="Column"
              isClearable
              isDisabled={!selectedTable || metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <Label
              htmlFor="order-by-direction"
              className="text-xs text-[#f8f9fa]"
            >
              Direction
            </Label>
            <CreatableSelect
              inputId="order-by-direction"
              instanceId="order-by-direction"
              aria-label="Select sort direction"
              options={directionOptions}
              value={orderByClause.direction}
                  onChange={handleOrderByDirectionSelectWrapper}
              placeholder="Direction"
              isClearable
              isDisabled={!orderByClause.column || metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <Label htmlFor="limit-select" className="text-xs text-[#f8f9fa]">
              Limit
            </Label>
            <CreatableSelect
              inputId="limit-select"
              instanceId="limit-select"
              aria-label="Select row limit"
              options={limitOptions}
              value={limit}
                  onChange={handleLimitSelectWrapper}
              placeholder="Limit"
              isClearable
              isDisabled={metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

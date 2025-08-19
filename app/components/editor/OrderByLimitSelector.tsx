import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { SingleValue } from "react-select";
import { SelectOption, TableColumn, OrderByClause } from "../../types/query";
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
}: OrderByLimitSelectorProps) {
  const orderByColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2 w-full">
        <div className="flex flex-col gap-1 w-1/3">
          <label className="text-xs text-[#f8f9fa] mb-1">
            Column (Order By)
          </label>
          <Select
            options={orderByColumnOptions}
            value={orderByClause.column}
            onChange={onOrderByColumnSelect}
            placeholder="Column"
            isClearable
            isDisabled={!selectedTable || metadataLoading}
            styles={selectStyles}
            className="min-w-0 w-full"
          />
        </div>
        <div className="flex flex-col gap-1 w-1/3">
          <label className="text-xs text-[#f8f9fa] mb-1">Direction</label>
          <Select
            options={directionOptions}
            value={orderByClause.direction}
            onChange={onOrderByDirectionSelect}
            placeholder="Select direction"
            isClearable
            isDisabled={
              !selectedTable || !orderByClause.column || metadataLoading
            }
            styles={selectStyles}
            className="min-w-0 w-full"
          />
        </div>
        <div className="flex flex-col gap-1 w-1/3">
          <label className="text-xs text-[#f8f9fa] mb-1">Limit</label>
          <CreatableSelect
            options={limitOptions}
            value={limit}
            onChange={onLimitSelect}
            placeholder="Set row limit"
            isClearable
            isDisabled={!selectedTable || metadataLoading}
            styles={selectStyles}
            className="min-w-0 w-full"
            formatCreateLabel={(inputValue) => inputValue}
          />
        </div>
      </div>
    </div>
  );
}

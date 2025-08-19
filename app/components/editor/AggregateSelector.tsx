import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { SingleValue } from "react-select";
import { SelectOption, TableColumn } from "@/app/types/query";
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
}: AggregateSelectorProps) {
  const aggregateOptions: SelectOption[] = [
    { value: "COUNT(*)", label: "COUNT(*) – Count all rows", aggregate: true },
    { value: "SUM", label: "SUM() – Total of values", aggregate: true },
    { value: "MAX", label: "MAX() – Largest value", aggregate: true },
    { value: "MIN", label: "MIN() – Smallest value", aggregate: true },
    { value: "AVG", label: "AVG() – Average value", aggregate: true },
    { value: "ROUND", label: "ROUND() – Round values", aggregate: true },
  ];

  const aggregateColumnOptions: SelectOption[] = selectedTable
    ? tableColumns[selectedTable.value]?.map((col) => ({
        value: col,
        label: col,
      })) || []
    : [];

  const decimalPlacesOptions: SelectOption[] = [
    { value: "0", label: "0" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
  ];

  return (
    <div className="flex flex-row items-center gap-2 w-full">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-[#f8f9fa] mb-1">
          Aggregate Function
        </label>
        <Select
          options={aggregateOptions}
          value={selectedAggregate}
          onChange={onAggregateSelect}
          placeholder="Select aggregate function"
          isClearable
          isDisabled={!selectedTable || metadataLoading}
          styles={selectStyles}
          className="min-w-0 w-full"
        />
      </div>
      {["SUM", "MAX", "MIN", "AVG", "ROUND"].includes(
        selectedAggregate?.value || ""
      ) && (
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-[#f8f9fa] mb-1">
            Aggregate Column
          </label>
          <Select
            options={aggregateColumnOptions}
            value={aggregateColumn}
            onChange={onAggregateColumnSelect}
            placeholder={`Select column for ${selectedAggregate?.value}`}
            isClearable
            isDisabled={!selectedTable || metadataLoading}
            styles={selectStyles}
            className="min-w-0 w-full"
          />
        </div>
      )}
      {selectedAggregate?.value === "ROUND" && aggregateColumn && (
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-[#f8f9fa] mb-1">Decimal Places</label>
          <CreatableSelect
            options={decimalPlacesOptions}
            value={decimalPlaces}
            onChange={onDecimalPlacesSelect}
            placeholder="Select or enter decimal places"
            isClearable
            isDisabled={!selectedTable || !aggregateColumn || metadataLoading}
            styles={selectStyles}
            className="min-w-0 w-full"
            formatCreateLabel={(inputValue) => inputValue}
          />
        </div>
      )}
    </div>
  );
}

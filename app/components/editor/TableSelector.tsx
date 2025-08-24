import Select, { SingleValue } from "react-select";
import { SelectOption } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface TableSelectorProps {
  tableNames: string[];
  selectedTable: SelectOption | null;
  onTableSelect: (value: SingleValue<SelectOption>) => void;
  metadataLoading: boolean;
}

export default function TableSelector({
  tableNames,
  selectedTable,
  onTableSelect,
  metadataLoading,
}: TableSelectorProps) {
  const tableOptions: SelectOption[] = tableNames.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-white text-opacity-80 font-semibold">
        Select
      </div>
      <label htmlFor="table-selector" className="text-xs text-[#f8f9fa] mb-1">
        Table
      </label>
      <Select
        inputId="table-selector"
        instanceId="table-selector"
        options={tableOptions}
        value={selectedTable}
        onChange={onTableSelect}
        placeholder="Select a table"
        isClearable
        isDisabled={metadataLoading}
        styles={selectStyles}
        className="min-w-0 w-full"
        aria-label="Select table"
      />
    </div>
  );
}

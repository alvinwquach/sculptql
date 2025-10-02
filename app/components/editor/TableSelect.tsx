import Select from "react-select";
import { SelectOption, TableSchema } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";
import { useQueryStore } from "@/app/stores/useQueryStore";
import { useQueryActionsStore } from "@/app/stores/useQueryActionsStore";
import { useMemo } from "react";

interface TableSelectProps {
  metadataLoading: boolean;
  schema?: TableSchema[];
}

export default function TableSelect({
  metadataLoading,
  schema = [],
}: TableSelectProps) {
  // Get state from Zustand stores
  const selectedTable = useQueryStore((state) => state.selectedTable);
  const handleTableSelect = useQueryActionsStore(
    (state) => state.handleTableSelect
  );

  // Compute table names from schema
  const tableNames = useMemo(
    () => schema.map((table) => table.table_name),
    [schema]
  );

  // Create the table options
  const tableOptions: SelectOption[] = (tableNames || []).map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_6px_rgba(139,92,246,0.6)]"></div>
        <label
          htmlFor="table-selector"
          className="text-xs font-semibold text-purple-400 uppercase tracking-wider"
        >
          Select Table
        </label>
      </div>
      <Select
        inputId="table-selector"
        instanceId="table-selector"
        options={tableOptions}
        value={selectedTable}
        onChange={handleTableSelect}
        placeholder="Choose a table..."
        isClearable
        isDisabled={metadataLoading}
        styles={selectStyles}
        className="min-w-0 w-full"
        aria-label="Select table"
      />
    </div>
  );
}

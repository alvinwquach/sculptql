import Select, { SingleValue } from "react-select";
import { SelectOption } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";
import { useEditorContext } from "@/app/context/EditorContext";

interface TableSelectProps {
  metadataLoading: boolean;
}

export default function TableSelect({
  metadataLoading,
}: TableSelectProps) {
  // Get the table names and selected table from the editor context
  const { tableNames, selectedTable, handleTableSelect } = useEditorContext();

  // Create the table options
  const tableOptions: SelectOption[] = tableNames.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="flex flex-col gap-1 ">
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
        onChange={handleTableSelect}
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

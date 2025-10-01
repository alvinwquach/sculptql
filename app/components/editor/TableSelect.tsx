import Select from "react-select";
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
  const tableOptions: SelectOption[] = (tableNames || []).map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_6px_rgba(139,92,246,0.6)]"></div>
        <label htmlFor="table-selector" className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
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

"use client";

import { useCallback } from "react";
import Select, { SingleValue } from "react-select";
import { X } from "lucide-react";
import { SelectOption, TableColumn, JoinClause } from "@/app/types/query";
import { selectStyles } from "../../utils/selectStyles";

interface JoinSelectProps {
  selectedTable: SelectOption | null;
  tableNames: string[];
  tableColumns: TableColumn;
  joinClauses: JoinClause[];
  onJoinTableSelect: (
    value: SingleValue<SelectOption>,
    joinIndex: number
  ) => void;
  onJoinTypeSelect: (
    value: SingleValue<SelectOption>,
    joinIndex: number
  ) => void;
  onJoinOnColumn1Select: (
    value: SingleValue<SelectOption>,
    joinIndex: number
  ) => void;
  onJoinOnColumn2Select: (
    value: SingleValue<SelectOption>,
    joinIndex: number
  ) => void;
  onAddJoinClause: () => void;
  onRemoveJoinClause: (joinIndex: number) => void;
  metadataLoading: boolean;
}

export default function JoinSelector({
  selectedTable,
  tableNames,
  tableColumns,
  joinClauses,
  onJoinTableSelect,
  onJoinTypeSelect,
  onJoinOnColumn1Select,
  onJoinOnColumn2Select,
  onAddJoinClause,
  onRemoveJoinClause,
  metadataLoading,
}: JoinSelectProps) {
  const tableOptions: SelectOption[] = tableNames
    .filter((table) => table !== selectedTable?.value)
    .map((table) => ({ value: table, label: table }));

  const joinTypeOptions: SelectOption[] = [
    { value: "INNER JOIN", label: "INNER JOIN" },
    { value: "LEFT JOIN", label: "LEFT JOIN" },
    { value: "RIGHT JOIN", label: "RIGHT JOIN" },
    { value: "CROSS JOIN", label: "CROSS JOIN" },
  ];

  const getColumnOptions = (table: string | null): SelectOption[] =>
    table && tableColumns[table]
      ? tableColumns[table].map((col) => ({ value: col, label: col }))
      : [];

  const handleAddJoin = useCallback(() => {
    onAddJoinClause();
  }, [onAddJoinClause]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end">
        <button
          onClick={handleAddJoin}
          className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition disabled:opacity-50"
          disabled={!selectedTable || metadataLoading}
        >
          Add Join
        </button>
      </div>
      <label className="text-sm font-medium text-[#f8f9fa]">Joins</label>
      {joinClauses.map((join, index) => {
        const isCrossJoin = join.joinType?.value === "CROSS JOIN";
        return (
          <div key={index} className="flex flex-row items-end gap-2 w-full">
            <div className="flex flex-col gap-1 w-1/5">
              <label className="text-xs text-[#f8f9fa]">Join Type</label>
              <Select
                options={joinTypeOptions}
                value={
                  join.joinType || { value: "INNER JOIN", label: "INNER JOIN" }
                }
                onChange={(value) => onJoinTypeSelect(value, index)}
                placeholder="Join Type"
                isClearable={false}
                isDisabled={!selectedTable || metadataLoading}
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-1/5">
              <label className="text-xs text-[#f8f9fa]">Join Table</label>
              <Select
                options={tableOptions}
                value={join.table}
                onChange={(value) => onJoinTableSelect(value, index)}
                placeholder="Table"
                isClearable
                isDisabled={!selectedTable || metadataLoading}
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
            {!isCrossJoin && (
              <>
                <div className="flex flex-col gap-1 w-1/5">
                  <label className="text-xs text-[#f8f9fa]">
                    {selectedTable?.value || "Table"} Column
                  </label>
                  <Select
                    options={getColumnOptions(selectedTable?.value || null)}
                    value={join.onColumn1}
                    onChange={(value) => onJoinOnColumn1Select(value, index)}
                    placeholder="Column"
                    isClearable
                    isDisabled={
                      !selectedTable || !join.table || metadataLoading
                    }
                    styles={selectStyles}
                    className="min-w-0 w-full"
                  />
                </div>
                <div className="flex flex-col gap-1 w-1/5">
                  <label className="text-xs text-[#f8f9fa]">
                    {join.table?.value || "Join"} Column
                  </label>
                  <Select
                    options={getColumnOptions(join.table?.value || null)}
                    value={join.onColumn2}
                    onChange={(value) => onJoinOnColumn2Select(value, index)}
                    placeholder="Column"
                    isClearable
                    isDisabled={
                      !selectedTable || !join.table || metadataLoading
                    }
                    styles={selectStyles}
                    className="min-w-0 w-full"
                  />
                </div>
              </>
            )}
            <button
              onClick={() => onRemoveJoinClause(index)}
              className="text-red-500 hover:text-red-600 transition p-1"
              title="Remove this join"
              disabled={metadataLoading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

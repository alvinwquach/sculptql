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
  // Set the table options to the table options
  const tableOptions: SelectOption[] = tableNames
    .filter((table) => table !== selectedTable?.value)
    .map((table) => ({ value: table, label: table }));

  // Set the join type options to the join type options
  const joinTypeOptions: SelectOption[] = [
    { value: "INNER JOIN", label: "INNER JOIN" },
    { value: "LEFT JOIN", label: "LEFT JOIN" },
    { value: "RIGHT JOIN", label: "RIGHT JOIN" },
    { value: "CROSS JOIN", label: "CROSS JOIN" },
  ];

  // Set the column options to the column options
  const getColumnOptions = (table: string | null): SelectOption[] =>
    // If the table and the table columns are not null
    table && tableColumns[table]
      // Add the column options
      ? tableColumns[table].map((col) => ({ value: col, label: col }))
      : [];

  // Set the handle add join to the handle add join
  const handleAddJoin = useCallback(() => {
    // Add the join clause
    onAddJoinClause();
  }, [onAddJoinClause]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-lg border border-pink-500/20 shadow-[0_0_15px_rgba(244,114,182,0.1)]">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Joins</label>
        <button
          onClick={handleAddJoin}
          className="text-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-3 py-1.5 rounded-lg border border-pink-400/30 shadow-[0_0_10px_rgba(244,114,182,0.3)] transition-all duration-200 disabled:opacity-50"
          disabled={!selectedTable || metadataLoading}
        >
          Add Join
        </button>
      </div>
      {joinClauses.map((join, index) => {
        const isCrossJoin = join.joinType?.value === "CROSS JOIN";
        return (
          <div key={index} className="p-4 border border-pink-500/30 rounded-lg bg-gradient-to-br from-[#0f0f23] to-[#1e1b4b] shadow-[0_0_10px_rgba(244,114,182,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                Join {index + 1}
              </span>
              <button
                onClick={() => onRemoveJoinClause(index)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-all duration-200"
                title="Remove this join"
                disabled={metadataLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-pink-300/80 font-mono">Join Type</label>
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
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-pink-300/80 font-mono">Join Table</label>
                <Select
                  options={tableOptions}
                  value={join.table}
                  onChange={(value) => onJoinTableSelect(value, index)}
                  placeholder="Table"
                  isClearable
                  isDisabled={!selectedTable || metadataLoading}
                  styles={selectStyles}
                  className="w-full"
                />
              </div>
              {!isCrossJoin && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-pink-300/80 font-mono">
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
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-pink-300/80 font-mono">
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
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

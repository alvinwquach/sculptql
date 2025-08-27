"use client";

import { useMemo } from "react";
import Select, { MultiValue } from "react-select";
import { SelectOption, TableColumn, JoinClause } from "@/app/types/query";
import { selectStyles } from "@/app/utils/selectStyles";

interface GroupBySelectProps {
  selectedTable: SelectOption | null;
  tableColumns: TableColumn;
  selectedGroupByColumns: SelectOption[];
  onGroupByColumnSelect: (value: MultiValue<SelectOption>) => void;
  metadataLoading: boolean;
  joinClauses: JoinClause[];
  isMySQL?: boolean;
}

export default function GroupBySelect({
  selectedTable,
  tableColumns,
  selectedGroupByColumns,
  onGroupByColumnSelect,
  metadataLoading,
  joinClauses,
  isMySQL = false,
}: GroupBySelectProps) {
  const aggregateFunctions: SelectOption[] = [
    { value: "COUNT(*)", label: "COUNT(*)", aggregate: true },
    ...(selectedTable
      ? tableColumns[selectedTable.value]?.flatMap((col) => {
          const aggregates: SelectOption[] = [
            {
              value: `SUM(${col})`,
              label: `SUM(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `AVG(${col})`,
              label: `AVG(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `MAX(${col})`,
              label: `MAX(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `MIN(${col})`,
              label: `MIN(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `COUNT(${col})`,
              label: `COUNT(${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `COUNT(DISTINCT ${col})`,
              label: `COUNT(DISTINCT ${col})`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 0)`,
              label: `ROUND(AVG(${col}), 0)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 1)`,
              label: `ROUND(AVG(${col}), 1)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 2)`,
              label: `ROUND(AVG(${col}), 2)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 3)`,
              label: `ROUND(AVG(${col}), 3)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(AVG(${col}), 4)`,
              label: `ROUND(AVG(${col}), 4)`,
              aggregate: true,
              column: col,
            },
            {
              value: `ROUND(${col}, 0)`,
              label: `ROUND(${col}, 0)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 1)`,
              label: `ROUND(${col}, 1)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 2)`,
              label: `ROUND(${col}, 2)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 3)`,
              label: `ROUND(${col}, 3)`,
              aggregate: false,
              column: col,
            },
            {
              value: `ROUND(${col}, 4)`,
              label: `ROUND(${col}, 4)`,
              aggregate: false,
              column: col,
            },
          ];

          if (isMySQL) {
            aggregates.push(
              {
                value: `SUM(DISTINCT ${col})`,
                label: `SUM(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
              {
                value: `AVG(DISTINCT ${col})`,
                label: `AVG(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
              {
                value: `MAX(DISTINCT ${col})`,
                label: `MAX(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
              {
                value: `MIN(DISTINCT ${col})`,
                label: `MIN(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              }
            );
          }

          return aggregates;
        }) || []
      : []),
  ];

  const columnOptions: SelectOption[] = useMemo(() => {
    return selectedTable
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
          ...aggregateFunctions,
        ]
      : [];
  }, [selectedTable, tableColumns, joinClauses, isMySQL]);

  const groupByColumnId = "group-by-column";

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs text-[#f8f9fa] mb-1" htmlFor={groupByColumnId}>
        Group By
      </label>
      <Select
        aria-label="Select columns or aggregates to group by"
        instanceId={groupByColumnId}
        inputId={groupByColumnId}
        options={columnOptions}
        value={selectedGroupByColumns}
        onChange={onGroupByColumnSelect}
        placeholder="Group by column(s) or aggregate(s)"
        isMulti
        isClearable
        isDisabled={!selectedTable || metadataLoading}
        styles={selectStyles}
        className="min-w-0 w-full"
      />
    </div>
  );
}

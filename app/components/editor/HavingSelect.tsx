"use client";

import { JoinClause, SelectOption, HavingClause } from "@/app/types/query";
import { SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { selectStyles } from "@/app/utils/selectStyles";

interface HavingSelectProps {
  selectedTable: SelectOption | null;
  tableColumns: Record<string, string[]>;
  havingClause: HavingClause;
  uniqueValues: Record<string, SelectOption[]>;
  onAggregateColumnSelect: (value: SingleValue<SelectOption>) => void;
  onOperatorSelect: (value: SingleValue<SelectOption>) => void;
  onValueSelect: (value: SingleValue<SelectOption>) => void;
  metadataLoading: boolean;
  operatorOptions: SelectOption[];
  logicalOperatorOptions: SelectOption[];
  joinClauses: JoinClause[];
  isMySQL?: boolean;
}

export default function HavingSelect({
  selectedTable,
  tableColumns,
  havingClause,
  uniqueValues,
  onAggregateColumnSelect,
  onOperatorSelect,
  onValueSelect,
  metadataLoading,
  operatorOptions,
  logicalOperatorOptions,
  joinClauses,
  isMySQL = false,
}: HavingSelectProps) {
  const aggregateOptions: SelectOption[] = selectedTable
    ? [
        { value: "COUNT(*)", label: "COUNT(*)", aggregate: true },
        ...(tableColumns[selectedTable.value]?.flatMap((col) => {
          const aggregates: SelectOption[] = [
            {
              value: `COUNT(${col})`,
              label: `COUNT(${col})`,
              aggregate: true,
              column: col,
            },
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
                value: `COUNT(DISTINCT ${col})`,
                label: `COUNT(DISTINCT ${col})`,
                aggregate: true,
                column: col,
              },
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
        }) || []),
      ]
    : [];

  const valueOptions =
    selectedTable && havingClause.condition.aggregateColumn?.column
      ? uniqueValues[
          `${stripQuotes(selectedTable.value)}.${stripQuotes(
            havingClause.condition.aggregateColumn.column
          )}`
        ] || []
      : [];

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-white text-opacity-80 font-semibold">
          Having
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="having-aggregate"
              className="text-xs text-[#f8f9fa]"
            >
              Aggregate
            </label>
            <CreatableSelect
              inputId="having-aggregate"
              instanceId="having-aggregate"
              aria-label="Select aggregate for having condition"
              options={aggregateOptions}
              value={havingClause.condition.aggregateColumn}
              onChange={(value) => onAggregateColumnSelect(value)}
              placeholder="Aggregate"
              isClearable
              isDisabled={!selectedTable || metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="having-operator" className="text-xs text-[#f8f9fa]">
              Operator
            </label>
            <CreatableSelect
              inputId="having-operator"
              instanceId="having-operator"
              aria-label="Select operator for having condition"
              options={operatorOptions}
              value={havingClause.condition.operator}
              onChange={(value) => onOperatorSelect(value)}
              placeholder="Operator"
              isClearable
              isDisabled={
                !havingClause.condition.aggregateColumn || metadataLoading
              }
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="having-value" className="text-xs text-[#f8f9fa]">
              Value
            </label>
            <CreatableSelect
              inputId="having-value"
              instanceId="having-value"
              aria-label="Select value for having condition"
              options={valueOptions}
              value={havingClause.condition.value}
              onChange={(value) => onValueSelect(value)}
              placeholder="Value"
              isClearable
              isDisabled={
                !selectedTable ||
                !havingClause.condition.aggregateColumn ||
                !havingClause.condition.operator ||
                metadataLoading
              }
              styles={selectStyles}
              className="min-w-0 w-full"
              formatCreateLabel={(inputValue) => inputValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

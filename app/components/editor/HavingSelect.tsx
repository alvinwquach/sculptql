"use client"

import { useEditorContext } from "@/app/context/EditorContext";
import { JoinClause, SelectOption } from "@/app/types/query";
import { SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { selectStyles } from "@/app/utils/selectStyles";
import { Label } from "@/components/ui/label"

// Props for the HavingSelect component
interface HavingSelectProps {
  metadataLoading: boolean;
  joinClauses: JoinClause[];
  isMySQL?: boolean;
}

export default function HavingSelect({
  metadataLoading,
  isMySQL = false,
}: HavingSelectProps) {
  // Get the selected table, table columns, having clause, unique values, operator options, logical operator options, handle aggregate column select, handle having operator select, and handle having value select from the editor context
  const {
    selectedTable,
    tableColumns,
    havingClause,
    uniqueValues,
    operatorOptions,
    handleAggregateColumnSelect,
    handleHavingOperatorSelect,
    handleHavingValueSelect,
  } = useEditorContext();


  // Handle the aggregate column select
  const handleAggregateColumnSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleAggregateColumnSelect(value, conditionIndex);
  };

  // Handle the having operator select
  const handleHavingOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleHavingOperatorSelect(value, conditionIndex);
  };

  // Handle the having value select
  const handleHavingValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    handleHavingValueSelect(value, conditionIndex);
  };

  // Create the aggregate options
  const aggregateOptions: SelectOption[] = selectedTable
    // If the selected table is not null
    ? tableColumns[selectedTable.value]?.flatMap((col) => {
        // Create the aggregates
        const aggregates = [
          // Sum aggregate
          {
            value: `SUM_${col}`,
            label: `SUM(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `AVG_${col}`,
            label: `AVG(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `MAX_${col}`,
            label: `MAX(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `MIN_${col}`,
            label: `MIN(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `COUNT_${col}`,
            label: `COUNT(${col})`,
            isAggregate: true,
            targetColumn: col,
          },
          {
            value: `COUNT_DISTINCT_${col}`,
            label: `COUNT(DISTINCT ${col})`,
            isAggregate: true,
            targetColumn: col,
          },
        ];
        // If MySQL, add the distinct aggregates
        if (isMySQL) {
          // Add the distinct aggregates
          aggregates.push(
            {
              value: `SUM_DISTINCT_${col}`,
              label: `SUM(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            },
            {
              value: `AVG_DISTINCT_${col}`,
              label: `AVG(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            },
            {
              value: `MAX_DISTINCT_${col}`,
              label: `MAX(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            },
            {
              value: `MIN_DISTINCT_${col}`,
              label: `MIN(DISTINCT ${col})`,
              isAggregate: true,
              targetColumn: col,
            }
          );
        }
        // Return the aggregates
        return aggregates;
      }) || []
    : [];
  // Create the value options for HAVING clause (aggregate comparisons)
  const valueOptions = selectedTable && havingClause.condition.aggregateColumn
    ? [
        // Common numeric values for aggregate comparisons
        { value: "0", label: "0" },
        { value: "1", label: "1" },
        { value: "5", label: "5" },
        { value: "10", label: "10" },
        { value: "100", label: "100" },
        { value: "1000", label: "1000" },
        // Common comparison values
        { value: "0.5", label: "0.5" },
        { value: "1.0", label: "1.0" },
        { value: "10.5", label: "10.5" },
        { value: "100.0", label: "100.0" },
        // SQL functions and expressions
        { value: "COUNT(*)", label: "COUNT(*)" },
        { value: "AVG(column)", label: "AVG(column)" },
        { value: "SUM(column)", label: "SUM(column)" },
        { value: "MAX(column)", label: "MAX(column)" },
        { value: "MIN(column)", label: "MIN(column)" },
        // Common thresholds
        { value: "> 0", label: "> 0" },
        { value: ">= 1", label: ">= 1" },
        { value: "< 10", label: "< 10" },
        { value: "<= 100", label: "<= 100" },
        // NULL checks
        { value: "IS NULL", label: "IS NULL" },
        { value: "IS NOT NULL", label: "IS NOT NULL" },
      ]
    : [];

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-white text-opacity-80 font-semibold">
          Having
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex flex-col gap-1 w-full">
            <Label
              htmlFor="having-aggregate-column"
              className="text-xs text-[#f8f9fa]"
            >
              Aggregate Column
            </Label>
            <CreatableSelect
              inputId="having-aggregate-column"
              instanceId="having-aggregate-column"
              aria-label="Select aggregate column for HAVING clause"
              options={aggregateOptions}
              value={havingClause.condition.aggregateColumn}
              onChange={(value) => handleAggregateColumnSelectWrapper(value, 0)}
              placeholder="Aggregate Column"
              isClearable
              isDisabled={!selectedTable || metadataLoading}
              styles={selectStyles}
              className="min-w-0 w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <Label
              htmlFor="having-operator"
              className="text-xs text-[#f8f9fa]"
            >
              Operator
            </Label>
            <CreatableSelect
              inputId="having-operator"
              instanceId="having-operator"
              aria-label="Select operator for HAVING clause"
              options={operatorOptions}
              value={havingClause.condition.operator}
              onChange={(value) => handleHavingOperatorSelectWrapper(value, 0)}
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
            <Label
              htmlFor="having-value"
              className="text-xs text-[#f8f9fa]"
            >
              Value
            </Label>
            <CreatableSelect
              inputId="having-value"
              instanceId="having-value"
              aria-label="Select value for HAVING clause"
              options={valueOptions}
              value={havingClause.condition.value}
              onChange={(value) => handleHavingValueSelectWrapper(value, 0)}
              placeholder="Value"
              isClearable
              isDisabled={
                !selectedTable ||
                !havingClause.condition.aggregateColumn ||
                !havingClause.condition.operator ||
                ["IS NULL", "IS NOT NULL"].includes(
                  havingClause.condition.operator?.value || ""
                ) ||
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

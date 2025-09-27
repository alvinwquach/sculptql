"use client"


import { useEditorContext } from "@/app/context/EditorContext";
import { JoinClause, SelectOption, WhereClause } from "@/app/types/query";
import { SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { selectStyles } from "@/app/utils/selectStyles";
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input";

// Props for the WhereClauseSelect component
interface WhereClauseSelectProps {
  metadataLoading: boolean;
  joinClauses: JoinClause[];
}

export default function WhereClauseSelect({
  metadataLoading,
  joinClauses,
}: WhereClauseSelectProps) {
  // Get the selected table, table columns, where clause, unique values, operator options, logical operator options, handle logical operator select, handle where column select, handle operator select, handle value select, and on delete condition from the editor context
  const {
    selectedTable,
    tableColumns,
    whereClause,
    uniqueValues,
    operatorOptions,
    logicalOperatorOptions,
    handleLogicalOperatorSelect,
    handleWhereColumnSelect,
    handleOperatorSelect,
    handleValueSelect,
    onDeleteCondition,
  } = useEditorContext();


  // Function to handle type conversion
  const handleWhereColumnSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    if (value) {
      handleWhereColumnSelect(value, conditionIndex);
    }
  };

  // Function to handle type conversion
  const handleOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    if (value) {
      handleOperatorSelect(value, conditionIndex);
    }
  };

  // Function to handle type conversion
  const handleValueSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    if (value) {
      handleValueSelect(value, conditionIndex);
    }
  };

  // Function to handle type conversion
  const handleLogicalOperatorSelectWrapper = (value: SingleValue<SelectOption>, conditionIndex: number) => {
    if (value) {
      handleLogicalOperatorSelect(value, conditionIndex);
    }
  };

  return (
    <div className="space-y-2">
      {whereClause.conditions.map((condition, index) => {
        // Create the value options
        const valueOptions =
          // If the selected table is not null and the condition column is not null
          selectedTable && condition.column
            // Create the value options
            ? uniqueValues[
                `${stripQuotes(selectedTable.value)}.${stripQuotes(
                  condition.column.value
                )}`
              ] || []
            : [];

        return (
          <div key={index} className="flex flex-col gap-1">
            <div className="text-xs text-white text-opacity-80 font-semibold">
              Where
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-1 w-full">
                <Label
                  htmlFor={`where-column-${index}`}
                  className="text-xs text-[#f8f9fa]"
                >
                  Column
                </Label>
                <CreatableSelect
                  inputId={`where-column-${index}`}
                  instanceId={`where-column-${index}`}
                  aria-label={`Select column for condition ${index + 1}`}
                  options={
                    selectedTable
                      ? tableColumns[selectedTable.value]?.map((col) => ({
                          value: col,
                          label: col,
                        })) || []
                      : []
                  }
                  value={condition.column}
                  onChange={(value) => handleWhereColumnSelectWrapper(value, index)}
                  placeholder="Column"
                  isClearable
                  isDisabled={!selectedTable || metadataLoading}
                  styles={selectStyles}
                  className="min-w-0 w-full"
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <Label
                  htmlFor={`where-operator-${index}`}
                  className="text-xs text-[#f8f9fa]"
                >
                  Operator
                </Label>
                <CreatableSelect
                  inputId={`where-operator-${index}`}
                  instanceId={`where-operator-${index}`}
                  aria-label={`Select operator for condition ${index + 1}`}
                  options={operatorOptions}
                  value={condition.operator}
                  onChange={(value) => handleOperatorSelectWrapper(value, index)}
                  placeholder="Operator"
                  isClearable
                  isDisabled={!condition.column || metadataLoading}
                  styles={selectStyles}
                  className="min-w-0 w-full"
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <Label
                  htmlFor={`where-value-${index}`}
                  className="text-xs text-[#f8f9fa]"
                >
                  Value
                </Label>
                <CreatableSelect
                  inputId={`where-value-${index}`}
                  instanceId={`where-value-${index}`}
                  aria-label={`Select value for condition ${index + 1}`}
                  options={valueOptions}
                  value={condition.value}
                  onChange={(value) => handleValueSelectWrapper(value, index)}
                  placeholder="Value"
                  isClearable
                  isDisabled={
                    !selectedTable ||
                    !condition.column ||
                    !condition.operator ||
                    ["IS NULL", "IS NOT NULL"].includes(
                      condition.operator?.value || ""
                    ) ||
                    metadataLoading
                  }
                  styles={selectStyles}
                  className="min-w-0 w-full"
                  formatCreateLabel={(inputValue) => inputValue}
                />
              </div>
              {condition.operator?.value === "BETWEEN" && (
                <div className="flex flex-col gap-1 w-full">
                  <Label
                    htmlFor={`where-value2-${index}`}
                    className="text-xs text-[#f8f9fa]"
                  >
                    Value 2
                  </Label>
                  <CreatableSelect
                    inputId={`where-value2-${index}`}
                    instanceId={`where-value2-${index}`}
                    aria-label={`Select second value for BETWEEN condition ${
                      index + 1
                    }`}
                    options={valueOptions}
                    value={condition.value2}
                    onChange={(value) => handleValueSelectWrapper(value, index)}
                    placeholder="Value 2"
                    isClearable
                    isDisabled={
                      !selectedTable ||
                      !condition.column ||
                      !condition.operator ||
                      !condition.value ||
                      metadataLoading
                    }
                    styles={selectStyles}
                    className="min-w-0 w-full"
                    formatCreateLabel={(inputValue) => inputValue}
                  />
                </div>
              )}
              {index === 0 && whereClause.conditions.length > 1 && (
                <div className="flex flex-col gap-1 w-full">
                  <Label
                    htmlFor={`where-logical-${index}`}
                    className="text-xs text-[#f8f9fa]"
                  >
                    Logical
                  </Label>
                  <CreatableSelect
                    inputId={`where-logical-${index}`}
                    instanceId={`where-logical-${index}`}
                    aria-label={`Select logical operator for conditions group`}
                    options={logicalOperatorOptions}
                    value={condition.logicalOperator}
                    onChange={(value) => handleLogicalOperatorSelectWrapper(value, index)}
                    placeholder="Logical"
                    isClearable
                    isDisabled={metadataLoading}
                    styles={selectStyles}
                    className="min-w-0 w-full"
                  />
                </div>
              )}
              {whereClause.conditions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteCondition(index)}
                  className="text-red-300 hover:bg-transparent hover:text-red-400"
                  aria-label={`Delete condition ${index + 1}`}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

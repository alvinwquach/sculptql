import { JoinClause, SelectOption, WhereClause } from "@/app/types/query";
import { SingleValue } from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";
import { selectStyles } from "@/app/utils/selectStyles";

interface WhereClauseSelectorProps {
  selectedTable: SelectOption | null;
  tableColumns: Record<string, string[]>;
  whereClause: WhereClause;
  uniqueValues: Record<string, SelectOption[]>;
  onLogicalOperatorSelect: (value: SingleValue<SelectOption>) => void;
  onWhereColumnSelect: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onOperatorSelect: (
    value: SingleValue<SelectOption>,
    conditionIndex: number
  ) => void;
  onValueSelect: (
    value: SingleValue<SelectOption>,
    conditionIndex: number,
    isValue2: boolean
  ) => void;
  metadataLoading: boolean;
  operatorOptions: SelectOption[];
  logicalOperatorOptions: SelectOption[];
  joinClauses: JoinClause[];
  onDeleteCondition?: (index: number) => void;
}

function WhereClauseSelector({
  selectedTable,
  tableColumns,
  whereClause,
  uniqueValues,
  onLogicalOperatorSelect,
  onWhereColumnSelect,
  onOperatorSelect,
  onValueSelect,
  metadataLoading,
  operatorOptions,
  logicalOperatorOptions,
  joinClauses,
  onDeleteCondition,
}: WhereClauseSelectorProps) {
  return (
    <div className="space-y-2">
      {whereClause.conditions.map((condition, index) => {
        const valueOptions =
          selectedTable && condition.column
            ? uniqueValues[
                `${stripQuotes(selectedTable.value)}.${stripQuotes(
                  condition.column.value
                )}`
              ] || []
            : [];

        return (
          <div key={index} className="flex gap-2 items-center">
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor={`where-column-${index}`}
                className="text-xs text-[#f8f9fa]"
              >
                Column
              </label>
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
                onChange={(value) => onWhereColumnSelect(value, index)}
                placeholder="Column"
                isClearable
                isDisabled={!selectedTable || metadataLoading}
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor={`where-operator-${index}`}
                className="text-xs text-[#f8f9fa]"
              >
                Operator
              </label>
              <CreatableSelect
                inputId={`where-operator-${index}`}
                instanceId={`where-operator-${index}`}
                aria-label={`Select operator for condition ${index + 1}`}
                options={operatorOptions}
                value={condition.operator}
                onChange={(value) => onOperatorSelect(value, index)}
                placeholder="Operator"
                isClearable
                isDisabled={!condition.column || metadataLoading}
                styles={selectStyles}
                className="min-w-0 w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor={`where-value-${index}`}
                className="text-xs text-[#f8f9fa]"
              >
                Value
              </label>
              <CreatableSelect
                inputId={`where-value-${index}`}
                instanceId={`where-value-${index}`}
                aria-label={`Select value for condition ${index + 1}`}
                options={valueOptions}
                value={condition.value}
                onChange={(value) => onValueSelect(value, index, false)}
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
                <label
                  htmlFor={`where-value2-${index}`}
                  className="text-xs text-[#f8f9fa]"
                >
                  Value 2
                </label>
                <CreatableSelect
                  inputId={`where-value2-${index}`}
                  instanceId={`where-value2-${index}`}
                  aria-label={`Select second value for BETWEEN condition ${
                    index + 1
                  }`}
                  options={valueOptions}
                  value={condition.value2}
                  onChange={(value) => onValueSelect(value, index, true)}
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
                <label
                  htmlFor={`where-logical-${index}`}
                  className="text-xs text-[#f8f9fa]"
                >
                  Logical
                </label>
                <CreatableSelect
                  inputId={`where-logical-${index}`}
                  instanceId={`where-logical-${index}`}
                  aria-label={`Select logical operator for conditions group`}
                  options={logicalOperatorOptions}
                  value={condition.logicalOperator}
                  onChange={onLogicalOperatorSelect}
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
                onClick={() => onDeleteCondition && onDeleteCondition(index)}
                className="text-red-300 hover:bg-transparent hover:text-red-400"
                aria-label={`Delete condition ${index + 1}`}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default WhereClauseSelector;

import { useCallback } from "react";
import { SelectOption } from "@/app/types/query";
import { useQueryStore } from "@/app/stores/useQueryStore";

export function useCaseHandlers() {
  const caseClause = useQueryStore((state) => state.caseClause);
  const setCaseClause = useQueryStore((state) => state.setCaseClause);

  const onCaseColumnSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number) => {
      const newConditions = [...caseClause.conditions];
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        column: value,
      };
      setCaseClause({
        ...caseClause,
        conditions: newConditions,
      });
    },
    [caseClause, setCaseClause]
  );

  const onCaseOperatorSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number) => {
      const newConditions = [...caseClause.conditions];
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        operator: value,
      };
      setCaseClause({
        ...caseClause,
        conditions: newConditions,
      });
    },
    [caseClause, setCaseClause]
  );

  const onCaseValueSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number) => {
      const newConditions = [...caseClause.conditions];
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        value: value,
      };
      setCaseClause({
        ...caseClause,
        conditions: newConditions,
      });
    },
    [caseClause, setCaseClause]
  );

  const onCaseResultSelect = useCallback(
    (value: SelectOption | null, conditionIndex: number) => {
      const newConditions = [...caseClause.conditions];
      newConditions[conditionIndex] = {
        ...newConditions[conditionIndex],
        result: value,
      };
      setCaseClause({
        ...caseClause,
        conditions: newConditions,
      });
    },
    [caseClause, setCaseClause]
  );

  const onElseResultSelect = useCallback(
    (value: SelectOption | null) => {
      setCaseClause({
        ...caseClause,
        elseValue: value,
      });
    },
    [caseClause, setCaseClause]
  );

  const onCaseAliasChange = useCallback(
    (alias: string | null) => {
      setCaseClause({
        ...caseClause,
        alias,
      });
    },
    [caseClause, setCaseClause]
  );

  const onAddCaseCondition = useCallback(() => {
    const newCondition = {
      column: null,
      operator: null,
      value: null,
      result: null,
    };
    setCaseClause({
      ...caseClause,
      conditions: [...caseClause.conditions, newCondition],
    });
  }, [caseClause, setCaseClause]);

  const onRemoveCaseCondition = useCallback(
    (conditionIndex: number) => {
      const newConditions = caseClause.conditions.filter(
        (_, index) => index !== conditionIndex
      );
      setCaseClause({
        ...caseClause,
        conditions: newConditions,
      });
    },
    [caseClause, setCaseClause]
  );

  return {
    onCaseColumnSelect,
    onCaseOperatorSelect,
    onCaseValueSelect,
    onCaseResultSelect,
    onElseResultSelect,
    onCaseAliasChange,
    onAddCaseCondition,
    onRemoveCaseCondition,
  };
}

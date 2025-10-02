import { useCallback } from "react";
import { SelectOption, CteClause } from "@/app/types/query";
import { useQueryStore } from "@/app/stores/useQueryStore";

export function useCteHandlers() {
  const cteClauses = useQueryStore((state) => state.cteClauses);
  const setCteClauses = useQueryStore((state) => state.setCteClauses);

  const onCteAliasChange = useCallback(
    (cteIndex: number, alias: string | null) => {
      const newCteClauses = [...cteClauses];
      newCteClauses[cteIndex] = {
        ...newCteClauses[cteIndex],
        alias,
      };
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteTableSelect = useCallback(
    (cteIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...cteClauses];
      newCteClauses[cteIndex] = {
        ...newCteClauses[cteIndex],
        fromTable: value,
      };
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteColumnSelect = useCallback(
    (cteIndex: number, value: readonly SelectOption[]) => {
      const newCteClauses = [...cteClauses];
      newCteClauses[cteIndex] = {
        ...newCteClauses[cteIndex],
        selectedColumns: [...value],
      };
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteLogicalOperatorSelect = useCallback(
    (cteIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions.length > 0) {
        newCteClauses[cteIndex].whereClause.conditions[0].logicalOperator =
          value;
      }
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteWhereColumnSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions[conditionIndex]) {
        newCteClauses[cteIndex].whereClause.conditions[conditionIndex].column =
          value;
      }
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteOperatorSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions[conditionIndex]) {
        newCteClauses[cteIndex].whereClause.conditions[
          conditionIndex
        ].operator = value;
      }
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteValueSelect = useCallback(
    (
      cteIndex: number,
      conditionIndex: number,
      value: SelectOption | null,
      isValue2: boolean
    ) => {
      const newCteClauses = [...cteClauses];
      if (newCteClauses[cteIndex].whereClause.conditions[conditionIndex]) {
        if (isValue2) {
          newCteClauses[cteIndex].whereClause.conditions[
            conditionIndex
          ].value2 = value;
        } else {
          newCteClauses[cteIndex].whereClause.conditions[conditionIndex].value =
            value;
        }
      }
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onAddCteClause = useCallback(() => {
    const newCteClause: CteClause = {
      alias: null,
      fromTable: null,
      selectedColumns: [],
      whereClause: {
        conditions: [
          { column: null, operator: null, value: null, value2: null },
        ],
      },
      groupByColumns: [],
      havingClause: {
        conditions: [
          {
            aggregateColumn: null,
            operator: null,
            value: null,
            logicalOperator: null,
          },
        ],
      },
    };
    setCteClauses([...cteClauses, newCteClause]);
  }, [cteClauses, setCteClauses]);

  const onRemoveCteClause = useCallback(
    (cteIndex: number) => {
      const newCteClauses = cteClauses.filter((_, index) => index !== cteIndex);
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteGroupBySelect = useCallback(
    (cteIndex: number, value: readonly SelectOption[]) => {
      const newCteClauses = [...cteClauses];
      newCteClauses[cteIndex] = {
        ...newCteClauses[cteIndex],
        groupByColumns: [...value],
      };
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteHavingAggregateSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...cteClauses];
      if (newCteClauses[cteIndex].havingClause.conditions[conditionIndex]) {
        newCteClauses[cteIndex].havingClause.conditions[
          conditionIndex
        ].aggregateColumn = value;
      }
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteHavingOperatorSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...cteClauses];
      if (newCteClauses[cteIndex].havingClause.conditions[conditionIndex]) {
        newCteClauses[cteIndex].havingClause.conditions[
          conditionIndex
        ].operator = value;
      }
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  const onCteHavingValueSelect = useCallback(
    (cteIndex: number, conditionIndex: number, value: SelectOption | null) => {
      const newCteClauses = [...cteClauses];
      if (newCteClauses[cteIndex].havingClause.conditions[conditionIndex]) {
        newCteClauses[cteIndex].havingClause.conditions[conditionIndex].value =
          value;
      }
      setCteClauses(newCteClauses);
    },
    [cteClauses, setCteClauses]
  );

  return {
    onCteAliasChange,
    onCteTableSelect,
    onCteColumnSelect,
    onCteLogicalOperatorSelect,
    onCteWhereColumnSelect,
    onCteOperatorSelect,
    onCteValueSelect,
    onAddCteClause,
    onRemoveCteClause,
    onCteGroupBySelect,
    onCteHavingAggregateSelect,
    onCteHavingOperatorSelect,
    onCteHavingValueSelect,
  };
}

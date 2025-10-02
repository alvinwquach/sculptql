import { useCallback } from "react";
import { SelectOption, UnionClause } from "@/app/types/query";
import { useQueryStore } from "@/app/stores/useQueryStore";

export function useUnionHandlers() {
  const unionClauses = useQueryStore((state) => state.unionClauses);
  const setUnionClauses = useQueryStore((state) => state.setUnionClauses);

  const onUnionTableSelect = useCallback(
    (value: SelectOption | null, unionIndex: number) => {
      const newUnionClauses = [...unionClauses];
      newUnionClauses[unionIndex] = {
        ...newUnionClauses[unionIndex],
        table: value,
      };
      setUnionClauses(newUnionClauses);
    },
    [unionClauses, setUnionClauses]
  );

  const onUnionTypeSelect = useCallback(
    (value: SelectOption | null, unionIndex: number) => {
      const newUnionClauses = [...unionClauses];
      newUnionClauses[unionIndex] = {
        ...newUnionClauses[unionIndex],
        unionType: value ?? undefined,
      };
      setUnionClauses(newUnionClauses);
    },
    [unionClauses, setUnionClauses]
  );

  const onAddUnionClause = useCallback(() => {
    const newUnionClause: UnionClause = {
      table: null,
      unionType: { value: "UNION", label: "UNION" } as SelectOption,
    };
    setUnionClauses([...unionClauses, newUnionClause]);
  }, [unionClauses, setUnionClauses]);

  const onRemoveUnionClause = useCallback(
    (unionIndex: number) => {
      const newUnionClauses = unionClauses.filter(
        (_, index) => index !== unionIndex
      );
      setUnionClauses(newUnionClauses);
    },
    [unionClauses, setUnionClauses]
  );

  return {
    onUnionTableSelect,
    onUnionTypeSelect,
    onAddUnionClause,
    onRemoveUnionClause,
  };
}

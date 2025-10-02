import { useCallback } from "react";
import { SelectOption, JoinClause } from "@/app/types/query";
import { useQueryStore } from "@/app/stores/useQueryStore";

export function useJoinHandlers() {
  const joinClauses = useQueryStore((state) => state.joinClauses);
  const setJoinClauses = useQueryStore((state) => state.setJoinClauses);

  const onJoinTableSelect = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      const newJoinClauses = [...joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        table: value,
      };
      setJoinClauses(newJoinClauses);
    },
    [joinClauses, setJoinClauses]
  );

  const onJoinTypeSelect = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      const newJoinClauses = [...joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        joinType: value,
      };
      setJoinClauses(newJoinClauses);
    },
    [joinClauses, setJoinClauses]
  );

  const onJoinOnColumn1Select = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      const newJoinClauses = [...joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        onColumn1: value,
      };
      setJoinClauses(newJoinClauses);
    },
    [joinClauses, setJoinClauses]
  );

  const onJoinOnColumn2Select = useCallback(
    (value: SelectOption | null, joinIndex: number) => {
      const newJoinClauses = [...joinClauses];
      newJoinClauses[joinIndex] = {
        ...newJoinClauses[joinIndex],
        onColumn2: value,
      };
      setJoinClauses(newJoinClauses);
    },
    [joinClauses, setJoinClauses]
  );

  const onAddJoinClause = useCallback(() => {
    const newJoinClause: JoinClause = {
      table: null,
      joinType: { value: "INNER JOIN", label: "INNER JOIN" } as SelectOption,
      onColumn1: null,
      onColumn2: null,
    };
    setJoinClauses([...joinClauses, newJoinClause]);
  }, [joinClauses, setJoinClauses]);

  const onRemoveJoinClause = useCallback(
    (joinIndex: number) => {
      const newJoinClauses = joinClauses.filter(
        (_, index) => index !== joinIndex
      );
      setJoinClauses(newJoinClauses);
    },
    [joinClauses, setJoinClauses]
  );

  return {
    onJoinTableSelect,
    onJoinTypeSelect,
    onJoinOnColumn1Select,
    onJoinOnColumn2Select,
    onAddJoinClause,
    onRemoveJoinClause,
  };
}

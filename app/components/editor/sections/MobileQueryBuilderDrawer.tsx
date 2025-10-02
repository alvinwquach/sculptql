import { memo } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useUIStore } from "@/app/stores/useUIStore";
import QueryBuilderSections from "./QueryBuilderSections";
import { TableSchema, SelectOption, JoinClause, UnionClause, CteClause, CaseClause } from "@/app/types/query";

interface MobileQueryBuilderDrawerProps {
  schema: TableSchema[];
  error: string | null;
  isMySQL: boolean;
  metadataLoading: boolean;
  dialect: string;
  selectedTable: SelectOption | null;
  tableNames: string[];
  tableColumns: Record<string, string[]>;
  uniqueValues: Record<string, SelectOption[]>;
  joinClauses: JoinClause[];
  unionClauses: UnionClause[];
  cteClauses: CteClause[];
  caseClause: CaseClause;
  operatorOptions: SelectOption[];
  logicalOperatorOptions: SelectOption[];
  onJoinTableSelect: (value: SelectOption | null, joinIndex: number) => void;
  onJoinTypeSelect: (value: SelectOption | null, joinIndex: number) => void;
  onJoinOnColumn1Select: (value: SelectOption | null, joinIndex: number) => void;
  onJoinOnColumn2Select: (value: SelectOption | null, joinIndex: number) => void;
  onAddJoinClause: () => void;
  onRemoveJoinClause: (joinIndex: number) => void;
  onUnionTableSelect: (value: SelectOption | null, unionIndex: number) => void;
  onUnionTypeSelect: (value: SelectOption | null, unionIndex: number) => void;
  onAddUnionClause: () => void;
  onRemoveUnionClause: (unionIndex: number) => void;
  onCteAliasChange: (cteIndex: number, alias: string | null) => void;
  onCteTableSelect: (cteIndex: number, value: SelectOption | null) => void;
  onCteColumnSelect: (cteIndex: number, value: readonly SelectOption[]) => void;
  onCteLogicalOperatorSelect: (cteIndex: number, value: SelectOption | null) => void;
  onCteWhereColumnSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null) => void;
  onCteOperatorSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null) => void;
  onCteValueSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null, isValue2: boolean) => void;
  onAddCteClause: () => void;
  onRemoveCteClause: (cteIndex: number) => void;
  onCteGroupBySelect: (cteIndex: number, value: readonly SelectOption[]) => void;
  onCteHavingAggregateSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null) => void;
  onCteHavingOperatorSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null) => void;
  onCteHavingValueSelect: (cteIndex: number, conditionIndex: number, value: SelectOption | null) => void;
  onCaseColumnSelect: (value: SelectOption | null, conditionIndex: number) => void;
  onCaseOperatorSelect: (value: SelectOption | null, conditionIndex: number) => void;
  onCaseValueSelect: (value: SelectOption | null, conditionIndex: number) => void;
  onCaseResultSelect: (value: SelectOption | null, conditionIndex: number) => void;
  onElseResultSelect: (value: SelectOption | null) => void;
  onCaseAliasChange: (alias: string | null) => void;
  onAddCaseCondition: () => void;
  onRemoveCaseCondition: (conditionIndex: number) => void;
  handleQueryChangeWithDrawerClose: (sql: string) => void;
}

const MobileQueryBuilderDrawer = memo(function MobileQueryBuilderDrawer(
  sectionsProps: MobileQueryBuilderDrawerProps
) {
  const showMobileSidebar = useUIStore((s) => s.showMobileSidebar);
  const setShowMobileSidebar = useUIStore((s) => s.setShowMobileSidebar);
  if (!showMobileSidebar) {
    return null;
  }

  return (
    <>
      <div
        className="sm:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={() => setShowMobileSidebar(false)}
      />
      <div className="sm:hidden fixed inset-y-0 left-0 w-full max-w-md bg-gradient-to-b from-[#0f0f23] to-[#1e1b4b] shadow-2xl overflow-y-auto z-[70] transform transition-transform duration-300">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#0f0f23] via-[#1e1b4b] to-[#312e81] border-b border-purple-500/30 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            Query Builder
          </h2>
          <Button
            onClick={() => setShowMobileSidebar(false)}
            className="p-2 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-all duration-200"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 pb-8 space-y-0">
          <QueryBuilderSections {...sectionsProps} />
        </div>
      </div>
    </>
  );
});

export default MobileQueryBuilderDrawer;

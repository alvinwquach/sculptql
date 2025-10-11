import { memo } from "react";
import {
  TableSchema,
  SelectOption,
  JoinClause,
  UnionClause,
  CteClause,
  CaseClause,
} from "@/app/types/query";
import { useUIStore } from "@/app/stores/useUIStore";
import CollapsibleSection from "./CollapsibleSection";
import TableSelect from "../TableSelect";
import ColumnSelect from "../ColumnSelect";
import WhereClauseSelect from "../WhereClauseSelect";
import OrderByLimitSelect from "../OrderByLimitSelect";
import GroupBySelect from "../GroupBySelect";
import HavingSelect from "../HavingSelect";
import JoinSelect from "../JoinSelect";
import UnionSelect from "../UnionSelect";
import CaseSelect from "../CaseSelect";
import WithSelect from "../WithSelect";

// Simple section header for always-visible sections
const SectionHeader = ({ title, color }: { title: string; color: string }) => {
  const colorClasses = {
    purple: {
      dot: "bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]",
      text: "text-purple-400",
    },
    cyan: {
      dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]",
      text: "text-cyan-400",
    },
    pink: {
      dot: "bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]",
      text: "text-pink-400",
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
      <h3 className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>
        {title}
      </h3>
    </div>
  );
};

interface QueryBuilderSectionsProps {
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
  onJoinOnColumn1Select: (
    value: SelectOption | null,
    joinIndex: number
  ) => void;
  onJoinOnColumn2Select: (
    value: SelectOption | null,
    joinIndex: number
  ) => void;
  onAddJoinClause: () => void;
  onRemoveJoinClause: (joinIndex: number) => void;
  onUnionTableSelect: (value: SelectOption | null, unionIndex: number) => void;
  onUnionTypeSelect: (value: SelectOption | null, unionIndex: number) => void;
  onAddUnionClause: () => void;
  onRemoveUnionClause: (unionIndex: number) => void;
  onCteAliasChange: (cteIndex: number, alias: string | null) => void;
  onCteTableSelect: (cteIndex: number, value: SelectOption | null) => void;
  onCteColumnSelect: (cteIndex: number, value: readonly SelectOption[]) => void;
  onCteLogicalOperatorSelect: (
    cteIndex: number,
    value: SelectOption | null
  ) => void;
  onCteWhereColumnSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SelectOption | null
  ) => void;
  onCteOperatorSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SelectOption | null
  ) => void;
  onCteValueSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SelectOption | null,
    isValue2: boolean
  ) => void;
  onAddCteClause: () => void;
  onRemoveCteClause: (cteIndex: number) => void;
  onCteGroupBySelect: (
    cteIndex: number,
    value: readonly SelectOption[]
  ) => void;
  onCteHavingAggregateSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SelectOption | null
  ) => void;
  onCteHavingOperatorSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SelectOption | null
  ) => void;
  onCteHavingValueSelect: (
    cteIndex: number,
    conditionIndex: number,
    value: SelectOption | null
  ) => void;
  onCaseColumnSelect: (
    value: SelectOption | null,
    conditionIndex: number
  ) => void;
  onCaseOperatorSelect: (
    value: SelectOption | null,
    conditionIndex: number
  ) => void;
  onCaseValueSelect: (
    value: SelectOption | null,
    conditionIndex: number
  ) => void;
  onCaseResultSelect: (
    value: SelectOption | null,
    conditionIndex: number
  ) => void;
  onElseResultSelect: (value: SelectOption | null) => void;
  onCaseAliasChange: (alias: string | null) => void;
  onAddCaseCondition: () => void;
  onRemoveCaseCondition: (conditionIndex: number) => void;
  handleQueryChangeWithDrawerClose?: (sql: string) => void;
}

const QueryBuilderSections = memo(function QueryBuilderSections({
  schema,
  error,
  isMySQL,
  metadataLoading,
  dialect,
  selectedTable,
  tableNames,
  tableColumns,
  uniqueValues,
  joinClauses,
  unionClauses,
  cteClauses,
  caseClause,
  operatorOptions,
  logicalOperatorOptions,
  onJoinTableSelect,
  onJoinTypeSelect,
  onJoinOnColumn1Select,
  onJoinOnColumn2Select,
  onAddJoinClause,
  onRemoveJoinClause,
  onUnionTableSelect,
  onUnionTypeSelect,
  onAddUnionClause,
  onRemoveUnionClause,
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
  onCaseColumnSelect,
  onCaseOperatorSelect,
  onCaseValueSelect,
  onCaseResultSelect,
  onElseResultSelect,
  onCaseAliasChange,
  onAddCaseCondition,
  onRemoveCaseCondition,
  handleQueryChangeWithDrawerClose,
}: QueryBuilderSectionsProps) {
  const sectionsExpanded = useUIStore((s) => s.sectionsExpanded);
  const toggleSection = useUIStore((s) => s.toggleSection);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Core Query Building - Always Visible */}
      <div className="space-y-4">
        <SectionHeader title="Select Tables & Columns" color="purple" />
        <TableSelect metadataLoading={metadataLoading} schema={schema} />
        <ColumnSelect
          metadataLoading={metadataLoading}
          isMySQL={isMySQL}
          schema={schema}
        />
        <CaseSelect
          selectedTable={selectedTable}
          tableColumns={tableColumns}
          caseClause={caseClause}
          uniqueValues={uniqueValues}
          joinClauses={joinClauses}
          operatorOptions={operatorOptions}
          onCaseColumnSelect={onCaseColumnSelect}
          onCaseOperatorSelect={onCaseOperatorSelect}
          onCaseValueSelect={onCaseValueSelect}
          onCaseResultSelect={onCaseResultSelect}
          onElseResultSelect={onElseResultSelect}
          onCaseAliasChange={onCaseAliasChange}
          onAddCaseCondition={onAddCaseCondition}
          onRemoveCaseCondition={onRemoveCaseCondition}
          metadataLoading={metadataLoading}
        />
      </div>

      <div className="space-y-4">
        <SectionHeader title="Filters" color="cyan" />
        <WhereClauseSelect
          metadataLoading={metadataLoading}
          joinClauses={joinClauses}
          tableColumns={tableColumns}
          uniqueValues={uniqueValues}
          operatorOptions={operatorOptions}
          logicalOperatorOptions={logicalOperatorOptions}
        />
      </div>

      <div className="space-y-4">
        <SectionHeader title="Group & Sort" color="pink" />
        <GroupBySelect
          metadataLoading={metadataLoading}
          joinClauses={joinClauses}
          tableColumns={tableColumns}
        />
        <HavingSelect
          metadataLoading={metadataLoading}
          joinClauses={joinClauses}
          isMySQL={isMySQL}
          tableColumns={tableColumns}
          uniqueValues={uniqueValues}
          operatorOptions={operatorOptions}
        />
        <OrderByLimitSelect
          metadataLoading={metadataLoading}
          joinClauses={joinClauses}
          tableColumns={tableColumns}
        />
      </div>

      {/* Advanced Features - Collapsible */}
      <CollapsibleSection
        title="Advanced"
        description="JOINs, UNIONs, and CTEs"
        color="purple"
        isExpanded={sectionsExpanded.advanced}
        onToggle={() => toggleSection("advanced")}
      >
        <div className="space-y-4">
          <JoinSelect
            selectedTable={selectedTable}
            tableNames={tableNames}
            tableColumns={tableColumns}
            joinClauses={joinClauses}
            schema={schema}
            onJoinTableSelect={onJoinTableSelect}
            onJoinTypeSelect={onJoinTypeSelect}
            onJoinOnColumn1Select={onJoinOnColumn1Select}
            onJoinOnColumn2Select={onJoinOnColumn2Select}
            onAddJoinClause={onAddJoinClause}
            onRemoveJoinClause={onRemoveJoinClause}
            metadataLoading={metadataLoading}
          />
          <UnionSelect
            selectedTable={selectedTable}
            tableNames={tableNames}
            unionClauses={unionClauses}
            onUnionTableSelect={onUnionTableSelect}
            onUnionTypeSelect={onUnionTypeSelect}
            onAddUnionClause={onAddUnionClause}
            onRemoveUnionClause={onRemoveUnionClause}
            metadataLoading={metadataLoading}
          />
          <WithSelect
            selectedTable={selectedTable}
            tableNames={tableNames}
            tableColumns={tableColumns}
            cteClauses={cteClauses}
            uniqueValues={uniqueValues}
            operatorOptions={operatorOptions}
            logicalOperatorOptions={logicalOperatorOptions}
            onCteAliasChange={onCteAliasChange}
            onCteTableSelect={onCteTableSelect}
            onCteColumnSelect={onCteColumnSelect}
            onCteLogicalOperatorSelect={onCteLogicalOperatorSelect}
            onCteWhereColumnSelect={onCteWhereColumnSelect}
            onCteOperatorSelect={onCteOperatorSelect}
            onCteValueSelect={onCteValueSelect}
            onAddCteClause={onAddCteClause}
            onRemoveCteClause={onRemoveCteClause}
            onCteGroupBySelect={onCteGroupBySelect}
            onCteHavingAggregateSelect={onCteHavingAggregateSelect}
            onCteHavingOperatorSelect={onCteHavingOperatorSelect}
            onCteHavingValueSelect={onCteHavingValueSelect}
            metadataLoading={metadataLoading}
          />
        </div>
      </CollapsibleSection>      
    </div>
  );
});

export default QueryBuilderSections;

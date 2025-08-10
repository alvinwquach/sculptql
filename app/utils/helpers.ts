import { ExplainPlanNode } from "../types/query";

export function formatTime(value?: number): string {
  if (value === undefined) return "0 ms";
  if (value <= 0) return "<0.000001 ms";
  return `${value.toFixed(6)} ms`;
}

export function formatSize(value?: number): string {
  if (value === undefined) return "0 KB";
  return `${value.toFixed(4)} KB`;
}

export function sumPlanStat(node: ExplainPlanNode, stat: string): number {
  let total = (node[stat as keyof ExplainPlanNode] as number) ?? 0;
  if (node.Plans) {
    total += node.Plans.reduce((sum, plan) => sum + sumPlanStat(plan, stat), 0);
  }
  return total;
}

import { ExplainPlanNode } from "../types/query";

// Function to format the time
export function formatTime(value?: number): string {
  // If the value is undefined, return 0 ms
  if (value === undefined) return "0 ms";
  // If the value is less than or equal to 0,
  // return less than 0.000001 ms
  if (value <= 0) return "<0.000001 ms";
  // Return the value formatted to 6 decimal places
  return `${value.toFixed(6)} ms`;
}

// Function to format the size
export function formatSize(value?: number): string {
  // If the value is undefined, return 0 KB
  if (value === undefined) return "0 KB";
  // Return the value formatted to 4 decimal places
  return `${value.toFixed(4)} KB`;
}

// Function to sum the plan stat
export function sumPlanStat(node: ExplainPlanNode, stat: string): number {
  // Set the total to the node stat
  let total = (node[stat as keyof ExplainPlanNode] as number) ?? 0;
  // If the node has plans, sum the plan stats
  if (node.Plans) {
    // Sum the plan stats
    total += node.Plans.reduce((sum, plan) => sum + sumPlanStat(plan, stat), 0);
  }
  // Return the total
  return total;
}

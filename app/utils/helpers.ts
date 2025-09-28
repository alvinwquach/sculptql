import { ExplainPlanNode, QueryResult } from "../types/query";

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

// Function to format query result
export function formatQueryResult(result: QueryResult): Record<string, unknown>[] {
  if (!result.fields || !result.rows) {
    // If the fields or rows are empty, 
    // return an empty array
    return [];
  }
  // Map the rows to the object
  return result.rows.map((row: Record<string, unknown>) => {
    // Create the object
    const obj: Record<string, unknown> = {};
    // Loop through the fields
    result.fields.forEach((column: string, index: number) => {
      // Set the object value to the row value
      obj[column] = (row as unknown as unknown[])[index];
    });
    // Return the object
    return obj;
  });
}

// Function to export data to CSV
export function exportToCSV(data: Record<string, unknown>[]): string {
  // If the data is empty, return an empty string
  if (data.length === 0) return '';
  // Get the headers from the data
  const headers = Object.keys(data[0]);
  // Get the CSV headers by joining the headers by a comma
  const csvHeaders = headers.join(',');
  // Get the CSV rows by mapping the data to the headers
  const csvRows = data.map(row => {
    return headers.map(header => {
      // Get the value from the row and the header
      const value = row[header];
      // If the value is null or undefined, return an empty string
      if (value === null || value === undefined) {
        return '';
      }
      // Get the string value from the value
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      // by replacing the quotes with double quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      // Return the string value
      return stringValue;
      // Join the headers by a comma
    }).join(',');
  });
  // Return the CSV headers and rows joined by a newline
  return [csvHeaders, ...csvRows].join('\n');
}

// Function to export data to JSON
export function exportToJSON(data: Record<string, unknown>[]): string {
  // Return the data as a JSON string
  return JSON.stringify(data, null, 2);
}

// Function to get operator detail
export function getOperatorDetail(operator: string): { label: string; description: string; requiresValue: boolean } {
  const operatorMap: Record<string, { label: string; description: string; requiresValue: boolean }> = {
    '=': { label: '=', description: 'Equal to', requiresValue: true },
    '!=': { label: '!=', description: 'Not equal to', requiresValue: true },
    '>': { label: '>', description: 'Greater than', requiresValue: true },
    '<': { label: '<', description: 'Less than', requiresValue: true },
    '>=': { label: '>=', description: 'Greater than or equal to', requiresValue: true },
    '<=': { label: '<=', description: 'Less than or equal to', requiresValue: true },
    'LIKE': { label: 'LIKE', description: 'Pattern matching', requiresValue: true },
    'IS NULL': { label: 'IS NULL', description: 'Is null', requiresValue: false },
    'IS NOT NULL': { label: 'IS NOT NULL', description: 'Is not null', requiresValue: false },
    'BETWEEN': { label: 'BETWEEN', description: 'Between two values', requiresValue: true },
  };
  // Return the operator map
  return operatorMap[operator] || { label: operator, description: operator, requiresValue: true };
}

// Function to check if a value needs quotes
export function needsQuotes(value: string): boolean {
  if (!value || value.trim() === '') return false;
  // Check if it's a number
  if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
    return false;
  }
  // Check if it's a boolean
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return false;
  }
  // Check if it's null
  if (value.toLowerCase() === 'null') {
    return false;
  }
  // Return true
  return true;
}

// Function to strip quotes from a string
export function stripQuotes(value: string): string {
  if (!value) return value;
  // Remove double quotes
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  // Remove single quotes
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  // Return the value
  return value;
}

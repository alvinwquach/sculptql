"use client";

import { useCallback } from "react";
import { QueryResult } from "@/app/types/query";

export interface ExportFunctions {
  exportToCsv: () => void;
  exportToJson: () => void;
  exportToMarkdown: () => void;
}

export function useExportFunctions(
  queryResult: QueryResult | null,
  query: string
): ExportFunctions {
  // Function to export the query result to CSV
  const exportToCsv = useCallback(() => {
    // If the query result is not null and the rows length is not 0, 
    // export the query result to CSV
    if (!queryResult || !queryResult.rows.length) {
      // Log the error
      console.log("No data to export");
      // Return
      return;
    }
    // Get the headers from the query result
    const headers = queryResult.fields;
    // Create the CSV content
    const csvContent = [
      // Join the headers with a comma
      headers.join(","),
      // Map the rows to the CSV content
      ...queryResult.rows.map((row) =>
        // Map the headers to the CSV content
        headers
          .map((header) => {
            const value = row[header];
            // If the value is a string and the value contains a comma, quote, or newline, 
            // escape the quotes and wrap in quotes
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"') || value.includes("\n"))
            ) {
              // Escape the quotes and wrap in quotes
              return `"${value.replace(/"/g, '""')}"`;
            }
            // Return the value
            return value ?? "";
          })
          .join(",")
      ),
    ].join("\n");
    // Create the blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    // Create the link
    const link = document.createElement("a");
    // Create the URL
    const url = URL.createObjectURL(blob);
    // Set the href to the URL
    link.setAttribute("href", url);
    // Set the download to the query result and the new date to ISO string
    link.setAttribute("download", `query_result_${new Date().toISOString().split("T")[0]}.csv`);
    // Set the visibility to hidden
    link.style.visibility = "hidden";
    // Append the link to the body
    document.body.appendChild(link);
    // Click the link
    link.click();
    // Remove the link from the body
    document.body.removeChild(link);
  }, [queryResult]);

  // Function to export the query result to JSON
  const exportToJson = useCallback(() => {
    // If the query result is not null, export the query result to JSON
    if (!queryResult) {
      // Log the error
      console.log("No data to export");
      // Return
      return;
    }
    // Create the JSON content
    const jsonContent = JSON.stringify(
      {
        query,
        timestamp: new Date().toISOString(),
        rowCount: queryResult.rowCount,
        fields: queryResult.fields,
        rows: queryResult.rows,
      },
      null,
      2
    );
    // Create the blob
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    // Create the link
    const link = document.createElement("a");
    // Create the URL
    const url = URL.createObjectURL(blob);
    // Set the href to the URL
    link.setAttribute("href", url);
    // Set the download to the query result and the new date to ISO string
    link.setAttribute("download", `query_result_${new Date().toISOString().split("T")[0]}.json`);
    // Set the visibility to hidden
    link.style.visibility = "hidden";
    // Append the link to the body
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [queryResult, query]);

  // Function to export the query result to Markdown  
  const exportToMarkdown = useCallback(() => {
    // If the query result is not null and the rows length is not 0, 
    // export the query result to Markdown
    if (!queryResult || !queryResult.rows.length) {
      // Log the error
      console.log("No data to export");
      // Return
      return;
    }
    // Get the headers from the query result
    const headers = queryResult.fields;
    // Create the markdown content
    const markdownContent = [
      `# Query Result`,
      ``,
      `**Query:** \`${query}\``,
      ``,
      `**Rows:** ${queryResult.rowCount || queryResult.rows.length}`,
      ``,
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => "---").join(" | ")} |`,
      ...queryResult.rows.map((row) =>
        `| ${headers.map((header) => String(row[header] ?? "")).join(" | ")} |`
      ),
    ].join("\n");
    // Create the blob
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
    // Create the link
    const link = document.createElement("a");
    // Create the URL
    const url = URL.createObjectURL(blob);
    // Set the href to the URL
    link.setAttribute("href", url);
    // Set the download to the query result and the new date to ISO string
    link.setAttribute("download", `query_result_${new Date().toISOString().split("T")[0]}.md`);
    // Set the visibility to hidden
    link.style.visibility = "hidden";
    // Append the link to the body
    document.body.appendChild(link);
    // Click the link
    link.click();
    document.body.removeChild(link);
  }, [queryResult, query]);

  return {
    exportToCsv,
    exportToJson,
    exportToMarkdown,
  };
}

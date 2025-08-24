"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TableSelector from "./TableSelector";
import CodeMirrorEditor from "./CodeMirrorEditor";
import { TableSchema, SelectOption } from "@/app/types/query";
import { needsQuotes } from "@/app/utils/sqlCompletion/needsQuotes";
import { stripQuotes } from "@/app/utils/sqlCompletion/stripQuotes";

interface EditorClientProps {
  schema: TableSchema[];
  error: string | null;
}

export default function EditorClient({ schema, error }: EditorClientProps) {
  const [selectedTable, setSelectedTable] = useState<SelectOption | null>(null);
  const [query, setQuery] = useState<string>("");

  const tableNames = schema.map((table) => table.table_name);
  const tableColumns = schema.reduce((acc, table) => {
    acc[table.table_name] = table.columns.map((col) => col.column_name);
    return acc;
  }, {} as Record<string, string[]>);

  const handleTableSelect = (value: SelectOption | null) => {
    setSelectedTable(value);
    if (value) {
      const tableName = needsQuotes(value.value)
        ? `"${value.value}"`
        : value.value;
      setQuery(`SELECT * FROM ${tableName};`);
    } else {
      setQuery("");
    }
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);

    const tableMatch = newQuery.match(/FROM\s+((?:"[\w]+"|'[\w]+'|[\w_]+))/i);
    if (tableMatch && tableMatch[1]) {
      const tableName = stripQuotes(tableMatch[1]);
      if (
        tableNames.includes(tableName) &&
        (!selectedTable || selectedTable.value !== tableName)
      ) {
        setSelectedTable({ value: tableName, label: tableName });
      }
    } else if (!tableMatch && selectedTable) {
      setSelectedTable(null);
    }
  };

  return (
    <Card className="mx-auto max-w-7xl bg-[#0f172a] border-slate-700/50 shadow-lg">
      <CardContent>
        {error ? (
          <p className="text-red-300">{error}</p>
        ) : (
          <div className="space-y-4">
            <TableSelector
              tableNames={tableNames}
              selectedTable={selectedTable}
              onTableSelect={handleTableSelect}
              metadataLoading={false}
            />
            <CodeMirrorEditor
              query={query}
              tableNames={tableNames}
              tableColumns={tableColumns}
              onQueryChange={handleQueryChange}
              onTableSelect={handleTableSelect}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

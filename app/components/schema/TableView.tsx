"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { TableSchema } from "@/app/types/query";

// Props for the TableView component
interface TableViewProps {
  schema: TableSchema[];
  tableSearch: string;
  columnSearch: string;
  updateUrl: (params: {
    tableSearch: string;
    columnSearch: string;
    viewMode: string;
  }) => void;
  viewMode: "table" | "erd";
}

export default function TableView({
  schema,
  tableSearch,
  columnSearch,
  updateUrl,
  viewMode,
}: TableViewProps) {
  // Set the open tables state
  const [openTables, setOpenTables] = useState<string[]>([]);

  // Function to toggle the table
  const toggleTable = (tableName: string) => {
    // Set the open tables state
    setOpenTables((prev) =>
      // Append the open tables and the table name
      prev.includes(tableName)
        // Filter the open tables by the table name
        ? prev.filter((t) => t !== tableName)
        : [...prev, tableName]
    );
  };

  // Function to handle the table search
  const handleTableSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Create the new table search by the event target value
    const newTableSearch = e.target.value;
    // Update the url by the table search and the column search and the view mode
    updateUrl({ tableSearch: newTableSearch, columnSearch, viewMode });
  };

  // Function to handle the column search
  const handleColumnSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Create the new column search by the event target value
    const newColumnSearch = e.target.value;
    // Update the url by the table search and the column search and the view mode
    updateUrl({ tableSearch, columnSearch: newColumnSearch, viewMode });
  };

  return (
    <div className="space-y-4">
      <form className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
          <Input
            type="text"
            placeholder="Search tables..."
            value={tableSearch}
            onChange={handleTableSearch}
            className="pl-10 bg-[#111827] text-green-300 border-slate-600 focus:border-green-400 focus:ring focus:ring-green-500/30 transition-all"
            aria-label="Search tables"
          />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
          <Input
            type="text"
            placeholder="Search columns..."
            value={columnSearch}
            onChange={handleColumnSearch}
            className="pl-10 bg-[#111827] text-green-300 border-slate-600 focus:border-green-400 focus:ring focus:ring-green-500/30 transition-all"
            aria-label="Search columns"
          />
        </div>
      </form>
      {schema.length > 0 ? (
        schema.map((table) => {
          const isOpen = openTables.includes(table.table_name);
          return (
            <Card
              key={table.table_name}
              className="bg-[#1e293b] border-slate-700/50 shadow-lg"
            >
              <CardHeader
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleTable(table.table_name)}
              >
                <h3 className="text-green-400 text-lg font-semibold truncate max-w-[90%]">
                  {table.table_name}
                </h3>
                {isOpen ? (
                  <ChevronUp className="text-green-400" />
                ) : (
                  <ChevronDown className="text-green-400" />
                )}
              </CardHeader>
              {isOpen && (
                <CardContent>
                  <Table>
                    <TableHeader className="bg-[#111827]">
                      <TableRow>
                        <TableHead className="text-green-400">
                          Column Name
                        </TableHead>
                        <TableHead className="text-green-400">
                          Data Type
                        </TableHead>
                        <TableHead className="text-green-400">
                          Nullable
                        </TableHead>
                        <TableHead className="text-green-400">
                          Primary Key
                        </TableHead>
                        <TableHead className="text-green-400">
                          Foreign Key
                        </TableHead>
                        <TableHead className="text-green-400">
                          Referenced Table
                        </TableHead>
                        <TableHead className="text-green-400">
                          References
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.columns.map((column) => {
                        const fk = table.foreign_keys.find(
                          (fk) => fk.column_name === column.column_name
                        );
                        return (
                          <TableRow
                            key={column.column_name}
                            className="border-slate-600 hover:bg-slate-700/50 transition-colors"
                          >
                            <TableCell className="text-green-300 truncate max-w-[150px]">
                              {column.column_name}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded bg-green-700 text-green-100 text-xs font-mono">
                                {column.data_type}
                              </span>
                            </TableCell>
                            <TableCell className="text-green-300">
                              {column.is_nullable ? "Yes" : "No"}
                            </TableCell>
                            <TableCell>
                              {column.is_primary_key && (
                                <span className="px-2 py-1 rounded bg-blue-600 text-blue-100 text-xs">
                                  PK
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {fk && (
                                <span className="px-2 py-1 rounded bg-purple-600 text-purple-100 text-xs">
                                  FK
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-green-300 truncate max-w-[150px]">
                              {fk ? fk.referenced_table : "-"}
                            </TableCell>
                            <TableCell className="text-green-300 truncate max-w-[150px]">
                              {fk
                                ? `${fk.referenced_table}.${fk.referenced_column}`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          );
        })
      ) : (
        <Card className="bg-[#1e293b] border-slate-700/50 shadow-lg">
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-gray-400">
              No tables match the search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

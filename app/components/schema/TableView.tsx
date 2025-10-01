"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Key,
  Link,
  Eye,
  EyeOff,
  Database,
  Filter,
  FileText,
  Folder,
  FolderOpen
} from "lucide-react";
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
  // Set the selected table state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  // Set the selected column state
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Function to toggle the table
  const toggleTable = (tableName: string) => {
    // Toggle the table
    setOpenTables((prev) =>
      prev.includes(tableName)
        ? prev.filter((t) => t !== tableName)
        : [...prev, tableName]
    );
  };

  // Function to handle the table search
  const handleTableSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the new table search
    const newTableSearch = e.target.value;
    // Update the url
    updateUrl({ tableSearch: newTableSearch, columnSearch, viewMode });
  };

  // Function to handle the column search
  const handleColumnSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the new column search
    const newColumnSearch = e.target.value;
    // Update the url
    updateUrl({ tableSearch, columnSearch: newColumnSearch, viewMode });
  };

  // Filter schema based on search
  const filteredSchema = schema.filter(table => {
    // Get the matches table search
    const matchesTableSearch = table.table_name.toLowerCase().includes(tableSearch.toLowerCase());
    // Get the matches column search
    const matchesColumnSearch = columnSearch === '' || 
      // Filter the columns by the column name and the column search
      table.columns.some(col => col.column_name.toLowerCase().includes(columnSearch.toLowerCase()));
    // Return the matches table search and the matches column search
    return matchesTableSearch && matchesColumnSearch;
  });

  // Sort schema alphabetically
  const sortedSchema = [...filteredSchema].sort((a, b) => a.table_name.localeCompare(b.table_name));

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
            <Input
              type="text"
              placeholder="Search tables..."
              value={tableSearch}
              onChange={handleTableSearch}
              className="pl-10 bg-slate-800/50 text-cyan-200 border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all rounded-lg font-mono"
              aria-label="Search tables"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" />
            <Input
              type="text"
              placeholder="Search columns..."
              value={columnSearch}
              onChange={handleColumnSearch}
              className="pl-10 bg-slate-800/50 text-pink-200 border-pink-500/30 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30 transition-all rounded-lg font-mono"
              aria-label="Search columns"
            />
          </div>
          <Button
            variant="outline"
            className="bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 font-mono"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-lg p-4 hover:shadow-cyan-500/20 transition-all">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-cyan-300 font-mono">TOTAL TABLES</p>
              <p className="text-2xl font-bold text-white font-mono">{schema.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-lg p-4 hover:shadow-purple-500/20 transition-all">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-purple-300 font-mono">PRIMARY KEYS</p>
              <p className="text-2xl font-bold text-white font-mono">
                {schema.reduce((acc, table) => acc + table.primary_keys.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-sm border border-pink-500/30 rounded-lg shadow-lg p-4 hover:shadow-pink-500/20 transition-all">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <Link className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-pink-300 font-mono">FOREIGN KEYS</p>
              <p className="text-2xl font-bold text-white font-mono">
                {schema.reduce((acc, table) => acc + table.foreign_keys.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-slate-800/50 border-b border-purple-500/20 p-4">
          <h3 className="text-lg font-bold text-cyan-300 font-mono tracking-wider">
            DATABASE SCHEMA
          </h3>
          <p className="text-sm text-purple-300 font-mono">
            {sortedSchema.length} tables • Click to expand column details
          </p>
        </div>
        {sortedSchema.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center space-x-2 text-cyan-300 font-mono text-sm font-bold">
                <Database className="w-4 h-4" />
                <span>Database</span>
                <span className="text-slate-500">({sortedSchema.length} tables)</span>
              </div>
              <div className="ml-4 mt-2 space-y-1">
                {sortedSchema.map((table) => {
                  // Get the is open state
                  const isOpen = openTables.includes(table.table_name);
                  // Get the is selected state
                  const isSelected = selectedTable === table.table_name;
                  // Get the column count
                  const columnCount = table.columns.length;
                  // Get the primary key count
                  const pkCount = table.primary_keys.length;
                  // Get the foreign key count
                  const fkCount = table.foreign_keys.length;
                  
                  return (
                    <div key={table.table_name} className="select-none">
                      <div
                        className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-slate-800/50 transition-colors group ${
                          isSelected ? 'bg-purple-500/20 border border-purple-500/30' : ''
                        }`}
                        onClick={() => {
                          setSelectedTable(table.table_name);
                          toggleTable(table.table_name);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          {isOpen ? (
                            <ChevronDown className="w-3 h-3 text-cyan-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-cyan-400" />
                          )}
                          {isOpen ? (
                            <FolderOpen className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Folder className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="font-mono text-white text-sm group-hover:text-cyan-200 transition-colors truncate">
                            {table.table_name}
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <span>({columnCount})</span>
                            {pkCount > 0 && (
                              <span className="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded text-xs">
                                {pkCount}PK
                              </span>
                            )}
                            {fkCount > 0 && (
                              <span className="bg-pink-500/20 text-pink-300 px-1 py-0.5 rounded text-xs">
                                {fkCount}FK
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                                            {isOpen && (
                        <div className="ml-6 mt-1 space-y-1">
                          {table.columns.map((column) => {
                            const fk = table.foreign_keys.find(
                              (fk) => fk.column_name === column.column_name
                            );
                            const isPrimary = column.is_primary_key;
                            const isColumnSelected = selectedColumn === `${table.table_name}.${column.column_name}`;
                            
                            return (
                              <div
                                key={column.column_name}
                                className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-slate-800/30 transition-colors group ${
                                  isColumnSelected ? 'bg-slate-700/50' : ''
                                }`}
                                onClick={() => setSelectedColumn(`${table.table_name}.${column.column_name}`)}
                              >
                                <FileText className="w-3 h-3 text-slate-400" />
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <span className="font-mono text-slate-300 text-sm group-hover:text-white transition-colors truncate">
                                    {column.column_name}
                                  </span>
                                  <div className="flex items-center space-x-2 text-xs">
                                    <span className="bg-slate-700/50 text-slate-200 px-1 py-0.5 rounded font-mono">
                                      {column.data_type}
                                    </span>
                                    {isPrimary && (
                                      <Key className="w-3 h-3 text-purple-400" />
                                    )}
                                    {fk && (
                                      <Link className="w-3 h-3 text-pink-400" />
                                    )}
                                    {column.is_nullable ? (
                                      <Eye className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-red-400" />
                                    )}
                                  </div>
                                </div>
                                {fk && (
                                  <div className="text-xs text-slate-500 font-mono">
                                    → {fk.referenced_table}.{fk.referenced_column}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Database className="w-12 h-12 text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg mb-2 font-mono">NO TABLES FOUND</p>
            <p className="text-slate-500 text-sm font-mono">
              Try adjusting your search criteria or check your database connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

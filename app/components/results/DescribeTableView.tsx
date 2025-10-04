import { ListTree, Table as TableIcon, Key } from "lucide-react";
import { TableDescription } from "@/app/types/query";

interface DescribeTableViewProps {
  selectedTable: string;
  tableDescription: TableDescription | null;
}

export default function DescribeTableView({
  selectedTable,
  tableDescription,
}: DescribeTableViewProps) {
  return selectedTable && tableDescription ? (
    <div className="h-full bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-4 sm:p-6 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.15)] border border-purple-500/30 flex flex-col">
      <div className="flex items-center mb-4">
        <ListTree className="w-5 h-5 text-green-400 mr-2" />
        <h2 className="text-lg sm:text-xl font-semibold text-green-300">
          Description for {selectedTable}
        </h2>
      </div>
      <p className="text-gray-400 mb-4 text-sm">
        Shows the structure of the queried table, including column names, data
        types, nullability, default values, and constraints.
      </p>
      <div className="flex-1 overflow-y-auto space-y-8">
        <div className="overflow-x-auto max-w-full">
          <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center">
            <TableIcon className="w-5 h-5 text-green-400 mr-2" />
            Columns
          </h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-[#0f0f23] to-[#1e1b4b] text-cyan-400 sticky top-0 z-10 border-b-2 border-purple-500/30">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                  Column
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                  Type
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                  Nullable
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                  Default
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                  Primary Key
                </th>
              </tr>
            </thead>
            <tbody>
              {tableDescription.columns.map((col, index) => (
                <tr
                  key={`column-${index}`}
                  className="border-b border-purple-500/20 hover:bg-purple-500/10 transition-colors duration-200"
                >
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                    {col.column_name}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">{col.data_type}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                    {col.is_nullable}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                    {col.column_default ?? "null"}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                    {col.is_primary_key ? (
                      <Key className="w-4 h-4 text-green-400 inline" />
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tableDescription.primary_keys &&
          tableDescription.primary_keys.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center">
                <Key className="w-5 h-5 text-green-400 mr-2" />
                Primary Keys
              </h3>
              <p className="text-gray-400 text-sm">
                {tableDescription.primary_keys.join(", ")}
              </p>
            </div>
          )}
        {tableDescription.foreign_keys &&
          tableDescription.foreign_keys.length > 0 && (
            <div className="overflow-x-auto max-w-full">
              <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center">
                <Key className="w-5 h-5 text-green-400 mr-2" />
                Foreign Keys
              </h3>
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-[#0f0f23] to-[#1e1b4b] text-cyan-400 sticky top-0 z-10 border-b-2 border-purple-500/30">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                      Column
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                      Referenced Table
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                      Referenced Column
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                      Constraint Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableDescription.foreign_keys.map((fk, index) => (
                    <tr
                      key={`foreign-key-${index}`}
                      className="border-b border-purple-500/20 hover:bg-purple-500/10 transition-colors duration-200"
                    >
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                        {fk.column_name}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                        {fk.referenced_table}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                        {fk.referenced_column}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                        {fk.constraint_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-4 sm:p-6 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.15)] border border-purple-500/30">
      <ListTree className="w-12 h-12 mb-4 text-green-400" />
      <p className="text-lg font-medium">
        {selectedTable
          ? "Loading table description..."
          : "Run a query to select a table to describe."}
      </p>
    </div>
  );
}

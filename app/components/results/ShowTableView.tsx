import { Database } from "lucide-react";
import { TableSchema } from "@/app/types/query";

interface ShowTableViewProps {
  selectedTable: string;
  table: TableSchema[];
}

export default function ShowTableView({
  selectedTable,
  table,
}: ShowTableViewProps) {
  // Return the selected table and the table length is greater than 0
  return selectedTable && table.length > 0 ? (
    <div className="h-full bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-4 sm:p-6 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.15)] border border-purple-500/30 flex flex-col">
      <div className="flex items-center mb-4">
        <Database className="w-5 h-5 text-green-400 mr-2" />
        <h2 className="text-lg sm:text-xl font-semibold text-green-300">Show Table</h2>
      </div>
      <p className="text-gray-400 mb-4 text-sm">
        Displays metadata for the queried table, including its name, database,
        schema, and type.
      </p>
      <div className="flex-1 overflow-x-auto max-w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-gradient-to-r from-[#0f0f23] to-[#1e1b4b] text-cyan-400 sticky top-0 z-10 border-b-2 border-purple-500/30">
            <tr>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                Name
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                Database
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                Schema
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                Type
              </th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold border-b border-purple-500/30 whitespace-nowrap text-shadow-[0_0_6px_rgba(6,182,212,0.3)]">
                Comment
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((table, index) => (
              <tr
                key={`table-${index}`}
                className="border-b border-purple-500/20 hover:bg-purple-500/10 transition-colors duration-200"
              >
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">{table.table_name}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                  {table.table_catalog}
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                  {table.table_schema}
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">{table.table_type}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-300 break-words max-w-[150px] sm:max-w-xs hover:text-green-200 transition-colors duration-200">
                  {table.comment ?? "null"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] p-4 sm:p-6 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.15)] border border-purple-500/30">
      <Database className="w-12 h-12 mb-4 text-green-400" />
      <p className="text-lg font-medium">Run a query to view table metadata.</p>
    </div>
  );
}

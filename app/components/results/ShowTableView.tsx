import { Database } from "lucide-react";
import { TableSchema } from "@/app/types/query";

// Props for the ShowTableView component
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
    <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
      <div className="flex items-center mb-4">
        <Database className="w-5 h-5 text-green-400 mr-2" />
        <h2 className="text-xl font-semibold text-green-300">Show Table</h2>
      </div>
      <p className="text-gray-400 mb-4 text-sm">
        Displays metadata for the queried table, including its name, database,
        schema, and type.
      </p>
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold border-b border-slate-600">
                Name
              </th>
              <th className="px-4 py-3 font-semibold border-b border-slate-600">
                Database
              </th>
              <th className="px-4 py-3 font-semibold border-b border-slate-600">
                Schema
              </th>
              <th className="px-4 py-3 font-semibold border-b border-slate-600">
                Type
              </th>
              <th className="px-4 py-3 font-semibold border-b border-slate-600">
                Comment
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((table, index) => (
              <tr
                key={`table-${index}`}
                className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
              >
                <td className="px-4 py-3 text-green-300">{table.table_name}</td>
                <td className="px-4 py-3 text-green-300">
                  {table.table_catalog}
                </td>
                <td className="px-4 py-3 text-green-300">
                  {table.table_schema}
                </td>
                <td className="px-4 py-3 text-green-300">{table.table_type}</td>
                <td className="px-4 py-3 text-green-300">
                  {table.comment ?? "null"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
      <Database className="w-12 h-12 mb-4 text-green-400" />
      <p className="text-lg font-medium">Run a query to view table metadata.</p>
    </div>
  );
}

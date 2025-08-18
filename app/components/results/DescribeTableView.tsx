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
    <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
      <div className="flex items-center mb-4">
        <ListTree className="w-5 h-5 text-green-400 mr-2" />
        <h2 className="text-xl font-semibold text-green-300">
          Description for {selectedTable}
        </h2>
      </div>
      <p className="text-gray-400 mb-4 text-sm">
        Shows the structure of the queried table, including column names, data
        types, nullability, default values, and constraints.
      </p>
      <div className="space-y-8">
        <div className="overflow-x-auto max-w-full">
          <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center">
            <TableIcon className="w-5 h-5 text-green-400 mr-2" />
            Columns
          </h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-slate-600">
                  Column
                </th>
                <th className="px-4 py-3 font-semibold border-b border-slate-600">
                  Type
                </th>
                <th className="px-4 py-3 font-semibold border-b border-slate-600">
                  Nullable
                </th>
                <th className="px-4 py-3 font-semibold border-b border-slate-600">
                  Default
                </th>
                <th className="px-4 py-3 font-semibold border-b border-slate-600">
                  Primary Key
                </th>
              </tr>
            </thead>
            <tbody>
              {tableDescription.columns.map((col, index) => (
                <tr
                  key={`column-${index}`}
                  className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-green-300">
                    {col.column_name}
                  </td>
                  <td className="px-4 py-3 text-green-300">{col.data_type}</td>
                  <td className="px-4 py-3 text-green-300">
                    {col.is_nullable}
                  </td>
                  <td className="px-4 py-3 text-green-300">
                    {col.column_default ?? "null"}
                  </td>
                  <td className="px-4 py-3 text-green-300">
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
                <thead className="bg-[#111827] text-green-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold border-b border-slate-600">
                      Column
                    </th>
                    <th className="px-4 py-3 font-semibold border-b border-slate-600">
                      Referenced Table
                    </th>
                    <th className="px-4 py-3 font-semibold border-b border-slate-600">
                      Referenced Column
                    </th>
                    <th className="px-4 py-3 font-semibold border-b border-slate-600">
                      Constraint Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableDescription.foreign_keys.map((fk, index) => (
                    <tr
                      key={`foreign-key-${index}`}
                      className="border-b border-slate-600 hover:bg-slate-700/50 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 text-green-300">
                        {fk.column_name}
                      </td>
                      <td className="px-4 py-3 text-green-300">
                        {fk.referenced_table}
                      </td>
                      <td className="px-4 py-3 text-green-300">
                        {fk.referenced_column}
                      </td>
                      <td className="px-4 py-3 text-green-300">
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
    <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-700/50">
      <ListTree className="w-12 h-12 mb-4 text-green-400" />
      <p className="text-lg font-medium">
        {selectedTable
          ? "Loading table description..."
          : "Run a query to select a table to describe."}
      </p>
    </div>
  );
}

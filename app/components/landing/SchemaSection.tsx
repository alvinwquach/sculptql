import { Database, BarChart2, Table2 } from "lucide-react";

export default function SchemaSection() {
  return (
    <section
      id="schema"
      className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-800/50 to-purple-900/30"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Explore your database schema
          </h2>
          <p className="text-xl text-pink-100 max-w-3xl mx-auto">
            Visualize table relationships and explore your database structure
            with interactive tools
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-pink-400 mb-6">
              Table View & ERD
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Table2 className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-pink-300 mb-2">
                    Table View
                  </h4>
                  <p className="text-pink-100">
                    Browse tables in a structured format with column details,
                    data types, and constraints.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-purple-300 mb-2">
                    ERD Visualization
                  </h4>
                  <p className="text-pink-100">
                    Interactive Entity Relationship Diagrams to understand table
                    relationships and foreign keys.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-cyan-300 mb-2">
                    Schema Filtering
                  </h4>
                  <p className="text-pink-100">
                    Search and filter tables and columns to quickly find what
                    you&apos;re looking for.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-xl p-8 border border-pink-500/30">
            <div className="text-center text-pink-300 mb-4">
              <Database className="w-12 h-12 mx-auto mb-4 text-pink-400" />
              <h4 className="text-lg font-semibold">Schema Explorer</h4>
              <p className="text-sm text-pink-200">
                Interactive database schema visualization
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-pink-300">users</span>
                <span className="text-cyan-400">1,234 rows</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-pink-300">orders</span>
                <span className="text-cyan-400">5,678 rows</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                <span className="text-pink-300">products</span>
                <span className="text-cyan-400">890 rows</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

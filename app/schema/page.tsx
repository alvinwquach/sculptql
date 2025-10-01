import { Suspense } from "react";
import SchemaWithProvider from "../components/schema/SchemaWithProvider";

export default async function SchemaPage({
  searchParams,
}: {
  searchParams: Promise<{
    tableSearch?: string;
    columnSearch?: string;
    view?: string;
  }>;
}) {
  // Get the table search, column search, and view 
  // from the search params
  const {
    tableSearch = "",
    columnSearch = "",
    view = "table",
  } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] overflow-x-hidden">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              SCHEMA EXPLORER
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-cyan-300 text-lg font-medium">
                Explore your database structure with interactive tables and relationships
              </p>
              <span className="hidden md:inline text-xs text-purple-300 font-mono tracking-wider bg-purple-500/20 px-2 py-1 rounded border border-purple-500/30">
                [SYNTHWAVE MODE]
              </span>
            </div>
          </div>
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading schema...</div>
            </div>
          }>
            <SchemaPageContent 
              initialTableSearch={tableSearch}
              initialColumnSearch={columnSearch}
              initialViewMode={view as "table" | "erd"}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function SchemaPageContent({
  initialTableSearch,
  initialColumnSearch,
  initialViewMode,
}: {
  initialTableSearch: string;
  initialColumnSearch: string;
  initialViewMode: "table" | "erd";
}) {
  return (
    <SchemaWithProvider
      initialTableSearch={initialTableSearch}
      initialColumnSearch={initialColumnSearch}
      initialViewMode={initialViewMode}
    />
  );
}

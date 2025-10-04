import { Suspense } from "react";
import SchemaWithProvider from "../components/schema/SchemaWithProvider";
import SchemaHeader from "../components/schema/SchemaHeader";

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
    <div className="flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white min-h-screen font-sans">
      <div
        className="flex-shrink-0 border-b border-purple-500/20 bg-gradient-to-r from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-sm shadow-[0_4px_20px_rgba(139,92,246,0.1)]"
      >
        <SchemaHeader />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  <div className="text-cyan-300 font-mono text-sm">
                    Loading schema...
                  </div>
                </div>
              </div>
            }
          >
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

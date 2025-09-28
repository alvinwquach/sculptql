import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-[#0f172a] py-6 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-7xl bg-[#0f172a] border-slate-700/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-green-400 text-2xl sm:text-3xl">
            Schema Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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

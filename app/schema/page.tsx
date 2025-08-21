import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientSchemaPage from "../components/schema/ClientSchemaPage";
import { TableSchema } from "@/app/types/query";

async function fetchSchema(
  tableSearch: string,
  columnSearch: string
): Promise<TableSchema[]> {
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schema`);
  if (tableSearch) url.searchParams.set("tableSearch", tableSearch);
  if (columnSearch) url.searchParams.set("columnSearch", columnSearch);
  const response = await fetch(url, {
    cache: tableSearch || columnSearch ? "no-store" : "force-cache",
    next: { revalidate: tableSearch || columnSearch ? 0 : 3600 },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch schema");
  }
  const data = await response.json();
  return data.schema;
}

export default async function SchemaPage({
  searchParams,
}: {
  searchParams: Promise<{
    tableSearch?: string;
    columnSearch?: string;
    view?: string;
  }>;
}) {
  const {
    tableSearch = "",
    columnSearch = "",
    view = "table",
  } = await searchParams;

  let schema: TableSchema[] = [];
  let error: string | null = null;

  try {
    schema = await fetchSchema(tableSearch, columnSearch);
  } catch (err) {
    error = (err as Error).message || "Failed to load schema";
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-6 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-7xl bg-[#1e293b] border-slate-700/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-green-400 text-2xl sm:text-3xl">
            Schema Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSchemaPage
            initialSchema={schema}
            initialTableSearch={tableSearch}
            initialColumnSearch={columnSearch}
            initialViewMode={view as "table" | "erd"}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}

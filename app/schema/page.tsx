import { getClient } from "../lib/client";
import { GET_SCHEMA } from "../graphql/queries/getSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientSchemaPage from "../components/schema/ClientSchemaPage";
import { TableSchema } from "@/app/types/query";

async function fetchSchema(
  tableSearch: string,
  columnSearch: string
): Promise<TableSchema[]> {
  try {
    const { data } = await getClient().query<{ schema: TableSchema[] }>({
      query: GET_SCHEMA,
      variables: {
        tableSearch: tableSearch || undefined,
        columnSearch: columnSearch || undefined,
      },
      fetchPolicy: tableSearch || columnSearch ? "no-cache" : "cache-first",
    });
    return data?.schema || [];
  } catch (error) {
    throw new Error("Failed to fetch schema");
  }
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
      <Card className="mx-auto max-w-7xl bg-[#0f172a] border-slate-700/50 shadow-lg">
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

import { getClient } from "../lib/client";
import { GET_SCHEMA } from "../graphql/queries/getSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientSchemaPage from "../components/schema/ClientSchemaPage";
import { TableSchema } from "@/app/types/query";

// Function to fetch the schema
async function fetchSchema(
  tableSearch: string,
  columnSearch: string
): Promise<TableSchema[]> {
  try {
    // Get the schema data from the client
    const { data } = await getClient().query<{ schema: TableSchema[] }>({
      // Get the schema query
      query: GET_SCHEMA,
      // Set the variables to the 
      // table search and column search or undefined
      variables: {
        tableSearch: tableSearch || undefined,
        columnSearch: columnSearch || undefined,
      },
      // Set the fetch policy to no cache if the table search or column search is true
      // otherwise set it to cache first
      fetchPolicy: tableSearch || columnSearch ? "no-cache" : "cache-first",
    });
    // Return the schema or an empty array
    return data?.schema || [];
  } catch (error) {
    // Throw an error if the schema fails to fetch
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
  // Get the table search, column search, and view 
  // from the search params
  const {
    tableSearch = "",
    columnSearch = "",
    view = "table",
  } = await searchParams;

  // Create the schema state as an empty array
  let schema: TableSchema[] = [];
  // Create the error state as null
  let error: string | null = null;

  try {
    // Fetch the schema by the table search 
    // and the column search
    schema = await fetchSchema(tableSearch, columnSearch);
  } catch (err) {
    // Set the error state to the error message
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

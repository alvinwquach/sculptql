import { GET_SCHEMA } from "@/app/graphql/queries/getSchema";
import { getClient } from "@/app/lib/client";
import { TableSchema } from "@/app/types/query";
import EditorWithProvider from "../components/editor/EditorWithProvider";

// Function to fetch the schema
async function fetchSchema(): Promise<TableSchema[]> {
  try {
    // Get the schema data from the client
    const { data } = await getClient().query<{ schema: TableSchema[] }>({
      // Get the schema query
      query: GET_SCHEMA,
      // Set the fetch policy to cache first
      fetchPolicy: "cache-first",
    });
    // Return the schema or an empty array
    return data?.schema ?? [];
    // Catch the error if the schema fails to fetch
  } catch (error) {
    // Log the error
    console.error(`fetchSchema: Error fetching schema`, error);
    // Throw an error if the schema fails to fetch
    throw new Error("Failed to fetch schema");
  }
}

export default async function EditorPage() {
  // Create the schema state as an empty array
  let schema: TableSchema[] = [];
  // Create the error state as null
  let error: string | null = null;
  try {
    // Fetch the schema
    schema = await fetchSchema();
  } catch (err) {
    // Set the error state to the error message
    error = (err as Error).message || "Failed to load schema";
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-6 px-4 sm:px-6 lg:px-8">
      <EditorWithProvider schema={schema} error={error} />
    </div>
  );
}

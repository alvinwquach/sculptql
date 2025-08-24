import { GET_SCHEMA } from "@/app/graphql/queries/getSchema";
import { getClient } from "@/app/lib/client";
import { TableSchema } from "@/app/types/query";
import EditorClient from "../components/editor/EditorClient";

async function fetchSchema(): Promise<TableSchema[]> {
  try {
    const { data } = await getClient().query<{ schema: TableSchema[] }>({
      query: GET_SCHEMA,
      fetchPolicy: "cache-first",
    });
    return data?.schema ?? [];
  } catch (error) {
    console.error(`fetchSchema: Error fetching schema`, error);
    throw new Error("Failed to fetch schema");
  }
}

export default async function EditorPage() {
  let schema: TableSchema[] = [];
  let error: string | null = null;

  try {
    schema = await fetchSchema();
  } catch (err) {
    error = (err as Error).message || "Failed to load schema";
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-6 px-4 sm:px-6 lg:px-8">
      <EditorClient schema={schema} error={error} />
    </div>
  );
}

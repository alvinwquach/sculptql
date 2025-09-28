"use client";

import { useUnifiedSchema } from "@/app/hooks/useUnifiedSchema";
import ClientSchemaPage from "./ClientSchemaPage";

// Props for the SchemaWithProvider component
interface SchemaWithProviderProps {
  initialTableSearch: string;
  initialColumnSearch: string;
  initialViewMode: "table" | "erd";
}

export default function SchemaWithProvider({
  initialTableSearch,
  initialColumnSearch,
  initialViewMode,
}: SchemaWithProviderProps) {
  // Use unified schema loading with caching
  const { schema, loading, error } = useUnifiedSchema({
    includeSampleData: true,
    tableSearch: initialTableSearch,
    columnSearch: initialColumnSearch,
    limit: 100,
  });

  return (
    <ClientSchemaPage
      initialSchema={schema}
      initialTableSearch={initialTableSearch}
      initialColumnSearch={initialColumnSearch}
      initialViewMode={initialViewMode}
      error={error}
    />
  );
}

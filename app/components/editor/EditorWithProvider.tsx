"use client";

import { EditorProvider } from "@/app/context/EditorContext";
import EditorClient from "./EditorClient";
import { TableSchema } from "@/app/types/query";
import { useUnifiedSchema } from "@/app/hooks/useUnifiedSchema";

// Props for the EditorWithProvider component
interface EditorWithProviderProps {
  schema?: TableSchema[];
  error?: string | null;
  isMySQL?: boolean;
}

export default function EditorWithProvider({
  schema: initialSchema,
  error: initialError,
  isMySQL = false,
}: EditorWithProviderProps = {}) {
  // Use unified schema loading with caching - include sample data for WHERE clause values
  const { schema, loading, error } = useUnifiedSchema({
    // Include sample data
    includeSampleData: true, 
  });

  return (
    <EditorProvider schema={schema} error={error} isMySQL={isMySQL}>
      <EditorClient
        schema={schema}
        error={error}
        isMySQL={isMySQL}
        metadataLoading={loading}
      />
    </EditorProvider>
  );
}

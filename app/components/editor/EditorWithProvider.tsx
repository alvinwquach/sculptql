"use client";

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
  const { schema, loading, error } = useUnifiedSchema({
    // Include sample data
    includeSampleData: true,
  });

  return (
    <EditorClient
      schema={schema}
      error={error}
      isMySQL={isMySQL}
      metadataLoading={loading}
    />
  );
}

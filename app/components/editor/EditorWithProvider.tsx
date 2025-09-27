"use client";

import { EditorProvider } from "@/app/context/EditorContext";
import EditorClient from "./EditorClient";
import { TableSchema } from "@/app/types/query";

// Props for the EditorWithProvider component
interface EditorWithProviderProps {
  schema: TableSchema[];
  error: string | null;
  isMySQL?: boolean;
}

export default function EditorWithProvider({
  schema,
  error,
  isMySQL = false,
}: EditorWithProviderProps) {
  return (
    <EditorProvider schema={schema} error={error} isMySQL={isMySQL}>
      <EditorClient
        schema={schema}
        error={error}
        isMySQL={isMySQL}
      />
    </EditorProvider>
  );
}

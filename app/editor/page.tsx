import { Suspense } from "react";
import EditorWithProvider from "../components/editor/EditorWithProvider";
import EditorSkeleton from "../components/editor/EditorSkeleton";

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1e1b4b] to-[#312e81] overflow-x-hidden">
      <Suspense fallback={<EditorSkeleton />}>
        <EditorPageContent />
      </Suspense>
    </div>
  );
}

function EditorPageContent() {
  return <EditorWithProvider />;
}

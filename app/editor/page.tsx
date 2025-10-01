import { Suspense } from "react";
import EditorWithProvider from "../components/editor/EditorWithProvider";
import EditorSkeleton from "../components/editor/EditorSkeleton";

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#16003b] overflow-x-hidden">
      <Suspense fallback={<EditorSkeleton />}>
        <EditorPageContent />
      </Suspense>
    </div>
  );
}

function EditorPageContent() {
  return <EditorWithProvider />;
}

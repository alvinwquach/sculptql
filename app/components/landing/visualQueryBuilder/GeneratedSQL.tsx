import { Database } from "lucide-react";

interface GeneratedSQLProps {
  query: string;
}

export default function GeneratedSQL({ query }: GeneratedSQLProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50 h-fit lg:sticky lg:top-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-cyan-400" />
        <h4 className="text-cyan-400 font-semibold">Generated SQL</h4>
      </div>
      <pre className="text-pink-200 text-xs sm:text-sm font-mono whitespace-pre-wrap bg-gray-900/50 p-4 rounded border border-gray-700/50 max-h-[500px] overflow-y-auto">
        {query}
      </pre>
    </div>
  );
}

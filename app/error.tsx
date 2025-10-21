"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">Error</h1>
        <p className="text-xl text-gray-400 mb-8">
          {error.message || "Something went wrong"}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}

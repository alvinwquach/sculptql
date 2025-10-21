import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Page Not Found | SculptQL",
};

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-900">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <p className="text-xl text-gray-400 mb-8">Page not found</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go back home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

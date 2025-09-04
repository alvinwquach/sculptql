import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ApolloWrapper } from "./ApolloWrapper";
import BottomNav from "./components/common/BottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SculptQL – Privacy-First SQL Tool for MySQL, PostgreSQL, and More",
  description:
    "SculptQL lets you query, visualize, and explore MySQL, PostgreSQL, SQLite, SQL Server, and Oracle databases with autocomplete, query history, exports, and charts—all without storing credentials. A privacy-first SQL interface that empowers developers and analysts.",
  keywords: [
    "SculptQL",
    "Privacy-First SQL Tool",
    "SQL CLI",
    "SQL Web Interface",
    "Database Query Tool",
    "SQL Autocomplete",
    "Database Visualization",
    "SQL Query History",
    "Data Export",
    "MySQL",
    "PostgreSQL",
    "SQLite",
    "SQL Server",
    "Oracle",
    "CSV Export",
    "JSON Export",
    "Markdown Export",
    "Data Charts",
    "Privacy-First Database Tool",
  ],
  authors: [{ name: "Alvin Quach", url: "https://github.com/alvinwquach" }],
  openGraph: {
    title: "SculptQL – Privacy-First SQL Tool for MySQL, PostgreSQL, and More",
    description:
      "SculptQL is a privacy-first tool to query, visualize, and explore MySQL, PostgreSQL, SQLite, SQL Server, and Oracle databases with autocomplete, query history, exports, and charts.",
    url: "https://www.sculptql.com",
    siteName: "SculptQL",
    images: [
      {
        url: "https://www.sculptql.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "SculptQL Screenshot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SculptQL – Privacy-First SQL Tool for MySQL, PostgreSQL, and More",
    description:
      "Query, visualize, and explore MySQL, PostgreSQL, SQLite, SQL Server, and Oracle databases with autocomplete, query history, exports, and charts.",
    images: ["https://www.sculptql.com/og-image.png"],
    creator: "@alvinwquach",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloWrapper>
          <div className="pb-16">{children}</div>
          <BottomNav />
        </ApolloWrapper>
      </body>
    </html>
  );
}

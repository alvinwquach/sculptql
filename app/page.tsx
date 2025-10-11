"use client";

import mysqlImg from "../public/databases/mysql.png";
import oracleImg from "../public/databases/oracle.jpeg";
import postgresqlImg from "../public/databases/Postgresql_elephant.svg";
import sqlServerImg from "../public/databases/sql-server.png";
import sqliteImg from "../public/databases/SQLite370.svg.png";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Database as DatabaseType } from "@/app/types/query";
import VisualQueryBuilder from "@/app/components/landing/VisualQueryBuilder";
import NaturalLanguageDemo from "@/app/components/landing/NaturalLanguageDemo";
import DatabaseCarousel from "./components/landing/DatabaseCarousel";
import HeroSection from "./components/landing/HeroSection";
import QueryTemplatesSection from "./components/landing/QueryTemplatesSection";
import HowItWorksSection from "./components/landing/HowItWorksSection";
import DemoSection from "./components/landing/DemoSection";
import SchemaSection from "./components/landing/SchemaSection";
import AnimatedSqlTooltips from "./components/landing/AnimatedSqlTooltips";
import BackgroundBlurs from "./components/landing/BackgroundBlurs";
import PermissionModesDemo from "./components/landing/PermissionModesDemo";
import { Database, LucideGithub } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const databases: DatabaseType[] = [
    {
      src: mysqlImg.src,
      alt: "MySQL",
      tooltip: "MySQL",
    },
    {
      src: oracleImg.src,
      alt: "Oracle",
      tooltip: "Oracle",
    },
    {
      src: postgresqlImg.src,
      alt: "PostgreSQL",
      tooltip: "PostgreSQL",
    },
    {
      src: sqlServerImg.src,
      alt: "SQL Server",
      tooltip: "SQL Server",
    },
    {
      src: sqliteImg.src,
      alt: "SQLite",
      tooltip: "SQLite",
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-pink-100 font-sans overflow-x-hidden">
      <BackgroundBlurs />
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-pink-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-pink-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              SculptQL
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#permission-modes"
              className="text-pink-200 hover:text-pink-400 transition-colors"
            >
              Permission Modes
            </a>
            <a
              href="#query-builder"
              className="text-pink-200 hover:text-pink-400 transition-colors"
            >
              Query Builder
            </a>
            <a
              href="#query-templates"
              className="text-pink-200 hover:text-pink-400 transition-colors"
            >
              Templates
            </a>
            <a
              href="#demo"
              className="text-pink-200 hover:text-pink-400 transition-colors"
            >
              Demo
            </a>
            <a
              href="#schema"
              className="text-pink-200 hover:text-pink-400 transition-colors"
            >
              Schema
            </a>
            <Link
              href="https://github.com/alvinwquach/sculptql"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <LucideGithub className="w-4 h-4" />
              <span className="text-sm font-medium">GitHub</span>
            </Link>
          </nav>
        </div>
      </header>
      <HeroSection />
      <AnimatedSqlTooltips />
      <PermissionModesDemo />
      <section
        id="query-builder"
        className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-cyan-900/20 to-pink-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Visual Query Builder
            </h2>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto">
              Build complex SQL queries with point-and-click interface. No need
              to remember syntax.
            </p>
          </div>
          <VisualQueryBuilder className="max-w-7xl mx-auto" />
        </div>
      </section>
      <QueryTemplatesSection />
      <HowItWorksSection />
      <DemoSection />
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-white">
        <DatabaseCarousel databases={databases} />
      </section>
      <SchemaSection />
    </div>
  );
}

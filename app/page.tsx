"use client";

import mysqlImg from "../public/databases/mysql.png";
import oracleImg from "../public/databases/oracle.jpeg";
import postgresqlImg from "../public/databases/Postgresql_elephant.svg";
import sqlServerImg from "../public/databases/sql-server.png";
import sqliteImg from "../public/databases/SQLite370.svg.png";
import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { Database as DatabaseType } from "@/app/types/query";
import AutocompleteSimulation from "@/app/components/landing/AutocompleteSimulation";
import VisualQueryBuilder from "@/app/components/landing/VisualQueryBuilder";
import {
  Database,
  BarChart2,
  Clock,
  Lightbulb,
  Download,
  History,
  Table2,
  LucideGithub,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import DatabaseCarousel from "./components/landing/DatabaseCarousel";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, MotionPathPlugin);

type LineDiv = HTMLDivElement & { orig?: string };


export default function Home() {
  const typewriterRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textLinesRef = useRef<LineDiv[]>([]);
  const featureRefs = useRef<HTMLDivElement[]>([]);
  const overviewRef = useRef<HTMLDivElement>(null);
  const animatedBoxRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  // Custom theme matching CodeMirrorEditor.tsx
  const customTheme = EditorView.theme({
    "&": {
      backgroundColor: "#0a0a0f",
      color: "#e0e6ed",
      fontSize: "clamp(14px, 2.5vw, 16px)",
      height: "100%",
      border: "2px solid transparent",
      borderRadius: "16px",
      background: "linear-gradient(#0a0a0f, #0a0a0f) padding-box, linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) border-box",
      boxShadow: "0 0 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      position: "relative",
      overflow: "hidden",
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(244, 114, 182, 0.05), rgba(16, 185, 129, 0.05))",
      pointerEvents: "none",
      zIndex: 0,
    },
    ".cm-content": {
      caretColor: "#f472b6",
      padding: "1rem",
      minHeight: "auto",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
      lineHeight: "1.7",
      position: "relative",
      zIndex: 1,
      background: "transparent",
    },
    ".cm-line": { 
      backgroundColor: "transparent",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
    },
    ".cm-keyword": { 
      color: "#f472b6 !important",
      fontWeight: "700",
      textShadow: "0 0 12px rgba(244, 114, 182, 0.6)",
      background: "linear-gradient(135deg, #f472b6, #ec4899)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    ".cm-operator": { 
      color: "#8b5cf6 !important",
      fontWeight: "600",
      textShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
    },
    ".cm-variableName": { 
      color: "#fbbf24 !important",
      textShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
      fontWeight: "600",
    },
    ".cm-string": { 
      color: "#10b981",
      textShadow: "0 0 8px rgba(16, 185, 129, 0.4)",
      fontWeight: "500",
    },
    ".cm-comment": { 
      color: "#6b7280",
      fontStyle: "italic",
      opacity: 0.8,
    },
    ".cm-attribute": { 
      color: "#f472b6",
      fontWeight: "600",
    },
    ".cm-property": { 
      color: "#10b981",
      fontWeight: "600",
    },
    ".cm-atom": { 
      color: "#f472b6",
      fontWeight: "600",
    },
    ".cm-number": { 
      color: "#f59e0b",
      fontWeight: "700",
      textShadow: "0 0 6px rgba(245, 158, 11, 0.4)",
    },
    ".cm-def": { 
      color: "#fbbf24",
      fontWeight: "600",
    },
    ".cm-variable-2": { 
      color: "#8b5cf6",
      fontWeight: "600",
    },
    ".cm-tag": { 
      color: "#8b5cf6",
      fontWeight: "600",
    },
    "&.cm-focused .cm-cursor": { 
      borderLeftColor: "#f472b6",
      borderLeftWidth: "3px",
      boxShadow: "0 0 20px rgba(244, 114, 182, 0.8), 0 0 40px rgba(244, 114, 182, 0.4)",
      animation: "pulse 2s infinite",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(244, 114, 182, 0.25)",
      border: "1px solid rgba(244, 114, 182, 0.5)",
      borderRadius: "4px",
    },
    ".cm-gutters": {
      backgroundColor: "#1a1a2e",
      color: "#8b5cf6",
      border: "none",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
      background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      boxShadow: "2px 0 15px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(139, 92, 246, 0.2)",
    },
    ".cm-gutter": { 
      background: "transparent", 
      border: "none",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
    },
    ".cm-lineNumbers": {
      color: "#8b5cf6",
      textShadow: "0 0 5px rgba(139, 92, 246, 0.4)",
    },
    ".cm-active-line": { 
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)",
      borderLeft: "3px solid #8b5cf6",
    },
  }, { dark: true });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("npx sculptql");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const sqlLines = useMemo(() => [
    "SELECT ranger_name, color, power_level",
    "FROM power_rangers",
    "WHERE team = 'Mighty Morphin'",
    "ORDER BY power_level DESC;",
  ], []);

  const tooltips = useMemo(() => [
    "Select these columns: ranger_name, color, power_level",
    "From the table: power_rangers",
    "Filter rows where team equals 'Mighty Morphin'",
    "Sort results by power_level descending",
  ], []);

  const overviewItems = [
    {
      icon: Lightbulb,
      title: "GUI Autocomplete",
      desc: "Build SQL queries effortlessly with a visual, context-aware autocomplete system.",
    },
    {
      icon: Table2,
      title: "Interactive Schema",
      desc: "Explore your database schema and relationships easily.",
    },
    {
      icon: History,
      title: "Query History",
      desc: "Save, pin, bookmark, and label queries for quick access.",
    },
    {
      icon: Download,
      title: "Export Options",
      desc: "Export query results to Markdown, JSON, or CSV formats.",
    },
    {
      icon: Clock,
      title: "Query Stats",
      desc: "Track execution time, payload size, and rows fetched.",
    },
    {
      icon: BarChart2,
      title: "Chart Exports",
      desc: "Visualize data with charts and export them easily.",
    },
  ];

  const queries = [
    {
      title: "Query 1",
      code: `-- Power Rangers: Track team stats
SELECT ranger_name, color, power_level
FROM power_rangers
WHERE team = 'Mighty Morphin'
ORDER BY power_level DESC;`,
    },
    {
      title: "Query 2",
      code: `-- Count total Rangers per team
SELECT team, COUNT(*) AS total_rangers
FROM power_rangers
GROUP BY team;`,
    },
    {
      title: "Query 3",
      code: `-- Find the top 3 most powerful Rangers
SELECT ranger_name, team, power_level
FROM power_rangers
ORDER BY power_level DESC
LIMIT 3;`,
    },
    {
      title: "Query 4",
      code: `-- Rangers with power > 80
SELECT ranger_name, team, power_level
FROM power_rangers
WHERE power_level > 80
ORDER BY power_level DESC;`,
    },
    {
      title: "Query 5",
      code: `-- Rangers grouped by color
SELECT color, COUNT(*) as count
FROM power_rangers
GROUP BY color
ORDER BY count DESC;`,
    },
  ];

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
    // Animate the typewriter
    if (typewriterRef.current) {
      gsap.fromTo(
        typewriterRef.current,
        { opacity: 0, scale: 0.8, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          delay: 0.5,
        }
      );
    }

    // Animate the background blur
    gsap.to(".bg-blur-1", {
      x: 100,
      y: -50,
      rotation: 10,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Animate the background blur
    gsap.to(".bg-blur-2", {
      x: -100,
      y: 50,
      rotation: -10,
      duration: 25,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Animate the background blur
    gsap.to(".bg-blur-3", {
      x: 50,
      y: -100,
      rotation: 5,
      duration: 30,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Animate the text lines
    const upperAndLowerCase =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Animate the text lines
    textLinesRef.current.forEach((lineEl, idx) => {
      // Set the original text for the line
      lineEl.orig = sqlLines[idx];
      // Add a mouse enter event listener to the line
      lineEl.addEventListener("mouseenter", () => {
        // Animate the text to the tooltip
        gsap.to(lineEl, {
          duration: 0.8,
          scrambleText: { text: tooltips[idx], chars: upperAndLowerCase },
          ease: "power2.out",
        });
      });
      // Add a mouse leave event listener to the line
      lineEl.addEventListener("mouseleave", () => {
        gsap.to(lineEl, {
          duration: 0.8,
          scrambleText: { text: sqlLines[idx], chars: upperAndLowerCase },
          ease: "power2.out",
        });
      });
    });

    tabRefs.current.forEach((tab, i) => {
      gsap.fromTo(
        tab,
        { opacity: 0, y: -20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: i * 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: editorRef.current, start: "top 85%" },
        }
      );
    });
    featureRefs.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            invalidateOnRefresh: true,
          },
        }
      );
    });


    if (overviewRef.current) {
      // Animate the features
      gsap.fromTo(
        overviewRef.current.querySelectorAll(".overview-item"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: overviewRef.current,
            start: "top 80%",
            invalidateOnRefresh: true,
          },
        }
      );
    }

    // Editor is static by default, only animates on scroll
    if (editorRef.current) {
      gsap.fromTo(editorRef.current, 
        {
          opacity: 0,
          scale: 0.95,
          y: 20,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: editorRef.current,
            start: "top 85%",
            end: "top 35%",
            scrub: 1.5,
            invalidateOnRefresh: true,
          },
        }
      );
    }

    const handleResize = () => {
      // Refresh the scroll trigger
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);
    // Return a function to kill the tweens
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      // Get the current lines
      const currentLines = textLinesRef.current;
      // Remove the mouse enter event listener from the lines
      currentLines.forEach((lineEl) => {
        // Remove the mouse enter event listener from the lines
        lineEl.removeEventListener("mouseenter", () => {});
        // Remove the mouse leave event listener from the lines
        lineEl.removeEventListener("mouseleave", () => {});
      });
      // Remove the resize event listener
      window.removeEventListener("resize", handleResize);
    };
  }, [sqlLines, tooltips]);

  const addLineRef = (el: LineDiv | null) => {
    // Add a line reference
    // If the element is not null and the line references do not include the element, add the element to the line references
    if (el && !textLinesRef.current.includes(el)) textLinesRef.current.push(el);
  };

  const addTabRef = (el: HTMLButtonElement | null) => {
    // Add a tab reference
    // If the element is not null and the tab references do not include the element, add the element to the tab references
    if (el && !tabRefs.current.includes(el)) tabRefs.current.push(el);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-pink-100 font-sans overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="bg-blur-1 absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="bg-blur-2 absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="bg-blur-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>
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
              href="#features"
              className="text-pink-200 hover:text-pink-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#query-builder"
              className="text-pink-200 hover:text-pink-400 transition-colors"
            >
              Query Builder
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
      <section className="relative py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-sm font-medium mb-4 border border-pink-500/30">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Read-Only Database Interface
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-white leading-tight">
                Build SQL queries with
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent synthwave-glow">
                  {" "}
                  intelligent autocomplete
                </span>
              </h1>
              <p className="text-xl text-pink-100 mb-8 leading-relaxed">
                Connect your database to a local web interface. Query, explore,
                and visualize your data with context-aware autocomplete and
                visual query building.{" "}
                <span className="text-cyan-300 font-semibold">
                  Read-only access
                </span>{" "}
                keeps your data safe.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  ref={typewriterRef}
                  onClick={handleCopy}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 synthwave-button text-pink-300 rounded-lg font-semibold text-lg hover:scale-105 synthwave-glow"
                >
                  <span>npx sculptql</span>
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="relative">
              <AutocompleteSimulation height="300px" className="w-full sm:h-[400px]" />
            </div>
          </div>
        </div>
      </section>
      <section className="py-12 px-4 sm:px-8 lg:px-16 bg-[#111827]">
        <div className="text-left font-mono text-base sm:text-lg mb-8 max-w-3xl mx-auto">
          {sqlLines.map((line, idx) => (
            <div
              key={idx}
              ref={addLineRef}
              className="relative group cursor-pointer py-1"
            >
              <span className="block">{line}</span>
              <div className="absolute left-full ml-4 px-3 py-1 rounded-md bg-slate-900 text-slate-200 text-sm opacity-0 group-hover:opacity-100 w-64 transition-all">
                {tooltips[idx]}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section
        id="features"
        className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-800/50 to-purple-900/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to build better SQL
            </h2>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto">
              Powerful features designed to make SQL development faster, safer,
              and more intuitive.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {overviewItems.map((item, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) featureRefs.current[i] = el;
                }}
                className="bg-gradient-to-br from-gray-800/80 to-purple-800/40 p-8 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-pink-500/25 transition-all duration-300 border border-pink-500/30 hover:border-pink-400/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <item.icon className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-pink-400">
                    {item.title}
                  </h3>
                </div>
                <p className="text-pink-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
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
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-900/80 to-purple-900/60"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto">
              Get started with SculptQL in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/30">
                <span className="text-2xl font-bold text-pink-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-400 mb-4">
                Install & Connect
              </h3>
              <p className="text-pink-100">
                Install SculptQL via npm and connect to your database with
                environment variables.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/30">
                <span className="text-2xl font-bold text-pink-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-400 mb-4">
                Build Queries
              </h3>
              <p className="text-pink-100">
                Use our intuitive interface with intelligent autocomplete to
                build complex SQL queries.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-500/30">
                <span className="text-2xl font-bold text-pink-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-400 mb-4">
                Explore & Visualize
              </h3>
              <p className="text-pink-100">
                Explore your schema, visualize relationships, and export results
                to multiple formats.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        id="demo"
        className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              See SculptQL in action
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the power of our visual SQL builder with real-time
              previews
            </p>
          </div>
          <div
            ref={animatedBoxRef}
            className="relative max-w-6xl mx-auto h-[600px] flex justify-center items-center"
          >
            <div
              ref={editorRef}
              className="relative w-full max-w-6xl shadow-2xl overflow-hidden bg-[#0f0f23] z-10"
              style={{
                minHeight: "500px",
                minWidth: "100%",
                border: "2px solid transparent",
                background: "linear-gradient(#0f0f23, #0f0f23) padding-box, linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) border-box",
                boxShadow: "0 0 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                borderRadius: "0px",
              }}
            >
              <div className="flex items-center justify-between bg-[#0f0f23] px-4 py-2 border-b border-purple-500/30">
                <div className="flex gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <Input
                  type="text"
                  value="https://sculptql.com/editor"
                  disabled
                  className="w-full max-w-sm px-3 py-1 rounded-md bg-[#1e1b4b] text-[#e0e6ed] text-sm font-mono border border-purple-500/30 text-center cursor-default mx-6"
                />
                <div className="w-16" />
              </div>
              <div className="flex items-start bg-[#1e1b4b] border-b border-purple-500/30">
                {queries.map((tab, idx) => (
                  <Button
                    key={idx}
                    ref={addTabRef}
                    onClick={() => setActiveTab(idx)}
                    className={`px-3.5 py-1 font-mono text-sm transition-colors ${
                      idx === activeTab
                        ? "bg-[#0f0f23] text-cyan-400 border border-b-0 border-purple-500/50"
                        : "bg-[#1e1b4b] text-[#e0e6ed] hover:text-cyan-400"
                    }`}
                  >
                    {tab.title}
                  </Button>
                ))}
              </div>
                <CodeMirror
                  value={queries[activeTab].code}
                  height="450px"
                  width="100%"
                  extensions={[
                    sql(),
                    customTheme,
                    syntaxHighlighting(defaultHighlightStyle, { fallback: true })
                  ]}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: false,
                    bracketMatching: true,
                    closeBrackets: false,
                    autocompletion: false,
                    highlightSelectionMatches: false,
                    searchKeymap: false,
                  }}
                />
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-white">
        <DatabaseCarousel databases={databases} />
      </section>
      <section
        id="schema"
        className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-gray-800/50 to-purple-900/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Explore your database schema
            </h2>
            <p className="text-xl text-pink-100 max-w-3xl mx-auto">
              Visualize table relationships and explore your database structure
              with interactive tools
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-pink-400 mb-6">
                Table View & ERD
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Table2 className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-pink-300 mb-2">
                      Table View
                    </h4>
                    <p className="text-pink-100">
                      Browse tables in a structured format with column details,
                      data types, and constraints.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-purple-300 mb-2">
                      ERD Visualization
                    </h4>
                    <p className="text-pink-100">
                      Interactive Entity Relationship Diagrams to understand
                      table relationships and foreign keys.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Database className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-300 mb-2">
                      Schema Filtering
                    </h4>
                    <p className="text-pink-100">
                      Search and filter tables and columns to quickly find what
                      you&apos;re looking for.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-xl p-8 border border-pink-500/30">
              <div className="text-center text-pink-300 mb-4">
                <Database className="w-12 h-12 mx-auto mb-4 text-pink-400" />
                <h4 className="text-lg font-semibold">Schema Explorer</h4>
                <p className="text-sm text-pink-200">
                  Interactive database schema visualization
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-pink-300">users</span>
                  <span className="text-cyan-400">1,234 rows</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-pink-300">orders</span>
                  <span className="text-cyan-400">5,678 rows</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-pink-300">products</span>
                  <span className="text-cyan-400">890 rows</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
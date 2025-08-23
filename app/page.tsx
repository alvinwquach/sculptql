"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import {
  Database,
  BarChart2,
  Clock,
  Lightbulb,
  Download,
  History,
  Table2,
  LayoutGrid,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

type LineDiv = HTMLDivElement & { orig?: string };

export default function Home() {
  const typewriterRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textLinesRef = useRef<LineDiv[]>([]);
  const featureRefs = useRef<HTMLDivElement[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);

  const sqlLines = [
    "SELECT ranger_name, color, power_level",
    "FROM power_rangers",
    "WHERE team = 'Mighty Morphin'",
    "ORDER BY power_level DESC;",
  ];

  const tooltips = [
    "Select these columns: ranger_name, color, power_level",
    "From the table: power_rangers",
    "Filter rows where team equals 'Mighty Morphin'",
    "Sort results by power_level descending",
  ];

  const features = [
    {
      icon: Database,
      title: "Schema Explorer",
      desc: "Navigate tables and columns with an interactive interface.",
      color: "teal",
    },
    {
      icon: BarChart2,
      title: "Dynamic Charts",
      desc: "Visualize queries with bar, line, and pie charts.",
      color: "teal",
    },
    {
      icon: Clock,
      title: "Query Insights",
      desc: "Monitor execution time, payload size, and rows fetched.",
      color: "teal",
    },
    {
      icon: Lightbulb,
      title: "Smart Autocomplete",
      desc: "Write SQL faster with intelligent autocomplete.",
      color: "teal",
    },
  ];

  const historyItems = [
    {
      title: "Pinned Queries",
      desc: "Keep your most-used queries at your fingertips.",
    },
    {
      title: "Bookmarked Queries",
      desc: "Save important queries for quick reference.",
    },
    {
      title: "Labeled Queries",
      desc: "Organize queries with custom labels for easy management.",
    },
  ];

  const exportOptions = [
    { format: "Markdown", desc: "Export query results as Markdown files." },
    { format: "JSON", desc: "Save results in structured JSON format." },
    { format: "CSV", desc: "Download query results as CSV for spreadsheets." },
  ];

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
    {
      icon: LayoutGrid,
      title: "Paginated Data",
      desc: "Navigate large datasets with user-friendly pagination.",
    },
  ];

  useEffect(() => {
    const typeText = "npx sculptql";
    if (typewriterRef.current) {
      const el = typewriterRef.current;
      gsap.set(el, { opacity: 0 });
      el.textContent = "";
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < typeText.length) {
          el.textContent = typeText.slice(0, i + 1) + "|";
          i++;
        } else {
          el.textContent = typeText;
          clearInterval(typeInterval);
        }
      }, 120);
      gsap.to(el, { opacity: 1, duration: 0.3 });
    }

    const upperAndLowerCase =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    textLinesRef.current.forEach((lineEl, idx) => {
      lineEl.orig = sqlLines[idx];
      lineEl.addEventListener("mouseenter", () => {
        gsap.to(lineEl, {
          duration: 0.8,
          scrambleText: { text: tooltips[idx], chars: upperAndLowerCase },
          ease: "power2.out",
        });
      });
      lineEl.addEventListener("mouseleave", () => {
        gsap.to(lineEl, {
          duration: 0.8,
          scrambleText: { text: sqlLines[idx], chars: upperAndLowerCase },
          ease: "power2.out",
        });
      });
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
          scrollTrigger: { trigger: el, start: "top 85%" },
        }
      );
    });

    if (historyRef.current) {
      gsap.fromTo(
        historyRef.current.querySelectorAll(".history-item"),
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: historyRef.current, start: "top 80%" },
        }
      );
    }

    if (exportRef.current) {
      gsap.fromTo(
        exportRef.current.querySelectorAll(".export-option"),
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: exportRef.current, start: "top 80%" },
        }
      );
    }

    if (overviewRef.current) {
      gsap.fromTo(
        overviewRef.current.querySelectorAll(".overview-item"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: overviewRef.current, start: "top 80%" },
        }
      );
    }

    if (editorRef.current) {
      gsap.fromTo(
        editorRef.current,
        { opacity: 0, scale: 0.95, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: editorRef.current, start: "top 80%" },
        }
      );
    }
  }, []);

  const addLineRef = (el: LineDiv | null) => {
    if (el && !textLinesRef.current.includes(el)) textLinesRef.current.push(el);
  };
  const addFeatureRef = (el: HTMLDivElement | null) => {
    if (el && !featureRefs.current.includes(el)) featureRefs.current.push(el);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      <section className="flex flex-col items-center text-center py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-green-900/20 to-[#0f172a]">
        <h1 className="text-green-400 text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6">
          SculptQL: Craft Your Data Story with Ease
        </h1>
        <p className="text-lg sm:text-xl max-w-2xl text-slate-300 mb-8">
          Build, visualize, and manage SQL queries in real-time with an
          intuitive GUI.
        </p>
        <div
          ref={typewriterRef}
          className="mb-8 px-6 py-3 bg-green-500/20 text-green-400 rounded-lg font-mono text-lg sm:text-xl min-h-[2.5rem]"
        ></div>
      </section>
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-[#111827]">
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
        <div
          ref={editorRef}
          className="w-full max-w-5xl mx-auto rounded-xl shadow-2xl overflow-hidden border border-green-700/50"
        >
          <CodeMirror
            value={`-- Power Rangers: Track team stats
SELECT ranger_name, color, power_level
FROM power_rangers
WHERE team = 'Mighty Morphin'
ORDER by power_level DESC;`}
            height="450px"
            width="100%"
            extensions={[sql()]}
            theme="dark"
            editable={false}
          />
        </div>
      </section>
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-teal-900/10 to-[#0f172a]">
        <h2 className="text-teal-400 text-3xl sm:text-4xl font-bold text-center mb-12">
          Core Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((f, i) => (
            <Card
              key={i}
              ref={addFeatureRef}
              className="bg-slate-800/80 hover:bg-slate-800 hover:shadow-2xl transition-all border border-teal-700/50 transform hover:-translate-y-2"
            >
              <CardHeader className="flex items-center gap-3">
                <f.icon className="w-6 h-6 text-teal-400" />
                <CardTitle className="text-teal-400">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300">
                  {f.desc}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section
        ref={historyRef}
        className="py-16 px-4 sm:px-8 lg:px-16 bg-[#111827]"
      >
        <h2 className="text-cyan-400 text-3xl sm:text-4xl font-bold text-center mb-12">
          Organize Your Queries
        </h2>
        <div className="max-w-4xl mx-auto space-y-6">
          {historyItems.map((item, i) => (
            <div
              key={i}
              className="history-item bg-slate-800/80 p-6 rounded-xl border border-cyan-700/50 hover:shadow-2xl transition-all transform hover:-translate-y-2"
            >
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-cyan-400 font-semibold">{item.title}</h3>
                  <p className="text-slate-300">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section
        ref={exportRef}
        className="py-16 px-4 sm:px-8 lg:px-16 bg-[#1f2937]"
      >
        <h2 className="text-lime-400 text-3xl sm:text-4xl font-bold text-center mb-12">
          Export Options
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {exportOptions.map((item, i) => (
            <div
              key={i}
              className="export-option bg-slate-800/80 p-6 rounded-xl border border-lime-700/50 hover:shadow-2xl transition-all text-center transform hover:-translate-y-2"
            >
              <Download className="w-6 h-6 text-lime-400 mx-auto mb-2" />
              <h3 className="text-lime-400 font-semibold">{item.format}</h3>
              <p className="text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section
        ref={overviewRef}
        className="py-16 px-4 sm:px-8 lg:px-16 bg-[#111827]"
      >
        <h2 className="text-green-400 text-3xl sm:text-4xl font-bold text-center mb-12">
          All-In-One Data Exploration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {overviewItems.map((item, i) => (
            <div
              key={i}
              className="overview-item bg-slate-800/80 p-6 rounded-xl border border-green-700/50 hover:shadow-2xl transition-all transform hover:-translate-y-2"
            >
              <div className="flex items-center gap-3 mb-2">
                <item.icon className="w-6 h-6 text-green-400" />
                <h3 className="text-green-400 font-semibold">{item.title}</h3>
              </div>
              <p className="text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-[#0f172a] text-center">
        <h2 className="text-green-400 text-3xl sm:text-4xl font-bold mb-6">
          Ready to Sculpt Your Data?
        </h2>
        <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
          Connect to your database via CLI and start exploring with SculptQL’s
          powerful, visual interface.
        </p>
        <Button className="bg-green-500 hover:bg-green-400 text-[#0f172a] font-semibold py-3 px-6 rounded-lg">
          Get Started with SculptQL
        </Button>
      </section>
    </div>
  );
}

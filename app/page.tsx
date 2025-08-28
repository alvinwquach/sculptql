"use client";

import mysqlImg from "../public/databases/mysql.png";
import oracleImg from "../public/databases/oracle.jpeg";
import postgresqlImg from "../public/databases/Postgresql_elephant.svg";
import sqlServerImg from "../public/databases/sql-server.png";
import sqliteImg from "../public/databases/SQLite370.svg.png";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { Card, CardContent } from "@/components/ui/card";
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
  LucideGithub,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, MotionPathPlugin);

type LineDiv = HTMLDivElement & { orig?: string };

interface Database {
  src: string;
  alt: string;
  tooltip: string;
}

function DatabaseCarousel({ databases }: { databases: Database[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const originalChildren = Array.from(scroller.children);
    originalChildren.forEach((child) => {
      const clone = child.cloneNode(true);
      scroller.appendChild(clone);
    });

    const totalWidth = scroller.scrollWidth;
    const containerWidth = scroller.clientWidth;

    gsap.fromTo(
      scroller,
      { x: 0 },
      {
        x: `${totalWidth / 2}px`, 
        ease: "none",
        duration: (totalWidth / containerWidth) * 15, 
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(
            (x) => -Math.abs(parseFloat(x) % (totalWidth / 2))
          ), 
        },
      }
    );

    return () => {
      gsap.killTweensOf(scroller);
    };
  }, [databases]);

  return (
    <div className="relative overflow-hidden bg-white py-12">
      <h2 className="text-3xl font-bold mb-12 text-center text-green-400">
        Works with the following databases
      </h2>
      <div ref={scrollerRef} className="flex flex-nowrap whitespace-nowrap">
        {databases.map((db, i) => (
          <Card
            key={i}
            className="flex items-center p-6 mx-3 transition-all duration-300 hover:scale-105 hover:shadow-xl "
          >
            <CardContent className="relative group flex items-center justify-center p-0">
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-6 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-slate-200 text-sm rounded-lg px-3 py-1 mb-2 shadow-lg whitespace-nowrap">
                {db.tooltip}
              </div>

              <div className="relative w-24 h-24">
                <Image
                  src={db.src}
                  alt={db.alt}
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const typewriterRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textLinesRef = useRef<LineDiv[]>([]);
  const featureRefs = useRef<HTMLDivElement[]>([]);
  const overviewRef = useRef<HTMLDivElement>(null);
  const animatedBoxRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const [activeTab, setActiveTab] = useState(0);

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

  const databases: Database[] = [
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

    if (editorRef.current) {
      gsap.set(editorRef.current, {
        opacity: 0,
        rotateX: 25,
        transformPerspective: 800,
        transformOrigin: "bottom center",
      });

      gsap.to(editorRef.current, {
        opacity: 1,
        rotateX: 0,
        duration: 3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: editorRef.current,
          start: "top 85%",
          end: "top 35%",
          scrub: 1.5,
          invalidateOnRefresh: true,
        },
      });
    }

    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      textLinesRef.current.forEach((lineEl) => {
        lineEl.removeEventListener("mouseenter", () => {});
        lineEl.removeEventListener("mouseleave", () => {});
      });
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const addLineRef = (el: LineDiv | null) => {
    if (el && !textLinesRef.current.includes(el)) textLinesRef.current.push(el);
  };

  const addTabRef = (el: HTMLButtonElement | null) => {
    if (el && !tabRefs.current.includes(el)) tabRefs.current.push(el);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-sm border-b border-green-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-green-400" />
            <h1 className="text-2xl font-bold text-green-400">SculptQL</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="https://github.com/alvinwquach/sculptql"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit the SculptQL GitHub repository"
              className="inline-flex items-center gap-2 px-4 py-2 border border-green-500 rounded-md text-slate-200 hover:text-green-400 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition"
            >
              <LucideGithub className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium">GitHub</span>
            </Link>
          </nav>
        </div>
      </header>
      <section className="flex flex-col items-center text-center py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-green-900/20 to-[#0f172a]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-300 leading-tight">
            SculptQL: Shape Your Data with Precision
          </h1>
          <p className="text-lg sm:text-xl max-w-3xl text-slate-200 mb-8 font-medium leading-relaxed">
            Seamlessly build, visualize, and optimize SQL queries in real-time
            with our intuitive, professional-grade interface.
          </p>
          <div
            ref={typewriterRef}
            className="inline-block px-6 py-3 bg-green-500/10 text-green-400 rounded-lg font-mono text-lg sm:text-xl border border-green-500/30 shadow-lg"
          ></div>
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
      <section className="py-12 px-4 sm:px-8 lg:px-16 bg-[#111827]">
        <div
          ref={animatedBoxRef}
          className="relative max-w-5xl mx-auto h-[600px] flex justify-center items-center"
        >
          <div
            ref={editorRef}
            className="relative w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden border border-green-700/50 z-10"
          >
            <div className="flex items-center justify-between bg-slate-900 px-4 py-2 border-b border-green-700/50">
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              </div>
              <input
                type="text"
                value="https://sculptql.com/"
                disabled
                className="w-full max-w-sm px-3 py-1 rounded-md bg-slate-800/70 text-slate-300 text-sm font-mono border border-slate-700 text-center cursor-default mx-6"
              />
              <div className="w-16" />
            </div>
            <div className="flex items-start bg-slate-800/60 border-b border-green-700/50">
              {queries.map((tab, idx) => (
                <button
                  key={idx}
                  ref={addTabRef}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3.5 py-1 font-mono text-sm transition-colors ${
                    idx === activeTab
                      ? "bg-slate-900 text-green-400 border border-b-0 border-green-700/50"
                      : "bg-slate-800/60 text-slate-400 hover:text-green-400"
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>
            <CodeMirror
              value={queries[activeTab].code}
              height="450px"
              width="100%"
              extensions={[sql()]}
              theme="dark"
              editable={false}
            />
          </div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-8 lg:px-16 bg-white">
        <DatabaseCarousel databases={databases} />
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
      </section>
    </div>
  );
}
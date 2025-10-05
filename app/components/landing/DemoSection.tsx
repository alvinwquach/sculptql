"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function DemoSection() {
  const editorRef = useRef<HTMLDivElement>(null);
  const animatedBoxRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const customTheme = EditorView.theme(
    {
      "&": {
        backgroundColor: "#0a0a0f",
        color: "#e0e6ed",
        fontSize: "clamp(14px, 2.5vw, 16px)",
        height: "100%",
        border: "2px solid transparent",
        borderRadius: "16px",
        background:
          "linear-gradient(#0a0a0f, #0a0a0f) padding-box, linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) border-box",
        boxShadow:
          "0 0 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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
        background:
          "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(244, 114, 182, 0.05), rgba(16, 185, 129, 0.05))",
        pointerEvents: "none",
        zIndex: 0,
      },
      ".cm-content": {
        caretColor: "#f472b6",
        padding: "1rem",
        minHeight: "auto",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
        lineHeight: "1.7",
        position: "relative",
        zIndex: 1,
        background: "transparent",
      },
      ".cm-line": {
        backgroundColor: "transparent",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
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
        boxShadow:
          "0 0 20px rgba(244, 114, 182, 0.8), 0 0 40px rgba(244, 114, 182, 0.4)",
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
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        boxShadow:
          "2px 0 15px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(139, 92, 246, 0.2)",
      },
      ".cm-gutter": {
        background: "transparent",
        border: "none",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', monospace",
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
    },
    { dark: true }
  );

  const queries = useMemo(
    () => [
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
    ],
    []
  );

  const addTabRef = (el: HTMLButtonElement | null) => {
    if (el && !tabRefs.current.includes(el)) tabRefs.current.push(el);
  };

  useEffect(() => {
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

    if (editorRef.current) {
      gsap.fromTo(
        editorRef.current,
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

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
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
            className="relative w-full min-w-full max-w-6xl min-h-[500px] shadow-2xl overflow-hidden bg-[#0f0f23] border-2 border-transparent rounded-none z-10"
            style={{
              background:
                "linear-gradient(#0f0f23, #0f0f23) padding-box, linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) border-box",
              boxShadow:
                "0 0 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
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
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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
  );
}

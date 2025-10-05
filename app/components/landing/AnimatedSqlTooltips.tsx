"use client";

import { useRef, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrambleTextPlugin);

type LineDiv = HTMLDivElement & { orig?: string };

export default function AnimatedSqlTooltips() {
  const textLinesRef = useRef<LineDiv[]>([]);

  const sqlLines = useMemo(
    () => [
      "SELECT ranger_name, color, power_level",
      "FROM power_rangers",
      "WHERE team = 'Mighty Morphin'",
      "ORDER BY power_level DESC;",
    ],
    []
  );

  const tooltips = useMemo(
    () => [
      "Select these columns: ranger_name, color, power_level",
      "From the table: power_rangers",
      "Filter rows where team equals 'Mighty Morphin'",
      "Sort results by power_level descending",
    ],
    []
  );

  useEffect(() => {
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

    return () => {
      const currentLines = textLinesRef.current;
      currentLines.forEach((lineEl) => {
        lineEl.removeEventListener("mouseenter", () => {});
        lineEl.removeEventListener("mouseleave", () => {});
      });
    };
  }, [sqlLines, tooltips]);

  const addLineRef = (el: LineDiv | null) => {
    if (el && !textLinesRef.current.includes(el)) textLinesRef.current.push(el);
  };

  return (
    <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#111827]">
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
  );
}

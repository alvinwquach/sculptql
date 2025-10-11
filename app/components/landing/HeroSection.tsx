"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import AutocompleteSimulation from "./AutocompleteSimulation";
import { gsap } from "gsap";

export default function HeroSection() {
  const typewriterRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("npx sculptql");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  useEffect(() => {
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
  }, []);

  return (
    <section className="relative py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-purple-900/20 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-sm font-medium mb-4 border border-pink-500/30">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Flexible Permission Modes
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
                Choose your permission mode
              </span>{" "}
              (read-only, read-write, or full access) and switch anytime to keep your data safe.
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
            <AutocompleteSimulation
              height="300px"
              className="w-full sm:h-[400px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

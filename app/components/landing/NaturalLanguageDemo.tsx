"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  MessageSquare,
  Database,
  ArrowRight,
  Star,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

gsap.registerPlugin(ScrambleTextPlugin, MotionPathPlugin, ScrollTrigger);

interface NaturalLanguageDemoProps {
  className?: string;
}

interface QueryExample {
  natural: string;
  sql: string;
  description: string;
}

export default function NaturalLanguageDemo({
  className = "",
}: NaturalLanguageDemoProps) {
  const [currentExample, setCurrentExample] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const naturalLanguageRef = useRef<HTMLParagraphElement>(null);
  const sqlQueryRef = useRef<HTMLPreElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const exampleButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const sparklesRef = useRef<(HTMLDivElement | null)[]>([]);
  const floatingElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const examples: QueryExample[] = [
    {
      natural: "Show me all users who signed up this month",
      sql: "SELECT * FROM users WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);",
      description: "Temporal filtering with date functions",
    },
    {
      natural: "Find the top 5 customers by total order value",
      sql: "SELECT c.name, SUM(o.total) as total_value FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total_value DESC LIMIT 5;",
      description: "Complex joins with aggregation and sorting",
    },
    {
      natural: "Get products that are low in stock",
      sql: "SELECT * FROM products WHERE stock_quantity < 10;",
      description: "Simple conditional filtering",
    },
    {
      natural: "Show me orders from customers in California",
      sql: "SELECT o.* FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.state = 'CA';",
      description: "Join operations with WHERE conditions",
    },
  ];

  // Function to start the 5-second interval for cycling examples
  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      animateExampleTransition();
    }, 5000);
  };

  useEffect(() => {
    const tl = gsap.timeline();

    // Animate badge
    if (badgeRef.current) {
      tl.fromTo(
        badgeRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }
      );
    }

    // Animate title
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
        "-=0.4"
      );
    }

    // Animate subtitle
    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.3"
      );
    }

    // Animate sparkles
    sparklesRef.current.forEach((sparkle, index) => {
      if (sparkle) {
        gsap.set(sparkle, {
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          scale: 0,
        });

        gsap.to(sparkle, {
          scale: 1,
          duration: 0.5,
          delay: index * 0.1,
          ease: "back.out(1.7)",
          repeat: -1,
          yoyo: true,
          rotation: 360,
          repeatDelay: 2 + Math.random() * 3,
        });
      }
    });

    // Animate floating elements
    floatingElementsRef.current.forEach((element, index) => {
      if (element) {
        gsap.to(element, {
          x: `+=${Math.random() * 50 - 25}`,
          y: `+=${Math.random() * 30 - 15}`,
          rotation: `+=${Math.random() * 360}`,
          duration: 8 + Math.random() * 4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 0.5,
        });
      }
    });

    // Start cycling examples every 5 seconds
    startInterval();

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  // Function to animate the transition between examples
  const animateExampleTransition = () => {
    const tl = gsap.timeline();

    // Fade out current example
    if (naturalLanguageRef.current) {
      tl.to(naturalLanguageRef.current, { opacity: 0, y: -10, duration: 0.3 });
    }
    if (sqlQueryRef.current) {
      tl.to(
        sqlQueryRef.current,
        { opacity: 0, scale: 0.95, duration: 0.3 },
        "-=0.2"
      );
    }
    if (descriptionRef.current) {
      tl.to(
        descriptionRef.current,
        { opacity: 0, y: 10, duration: 0.3 },
        "-=0.2"
      );
    }

    // Update to next example (cycles from 0 to 3 and loops back)
    tl.add(() => {
      setCurrentExample((prev) => {
        const next = (prev + 1) % examples.length;
        if (selectRef.current) {
          selectRef.current.value = next.toString(); // Sync select element
        }
        return next;
      });
    });

    // Fade in new example
    tl.fromTo(
      naturalLanguageRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5 }
    );
    tl.fromTo(
      sqlQueryRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5 },
      "-=0.3"
    );
    tl.fromTo(
      descriptionRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.4 },
      "-=0.2"
    );
  };

  // Handle button hover animations
  const handleExampleButtonHover = (index: number, isHovering: boolean) => {
    const button = exampleButtonsRef.current[index];
    if (!button) return;

    const tl = gsap.timeline();

    if (isHovering) {
      tl.to(button, {
        scale: 1.1,
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      tl.to(button, {
        scale: 1,
        backgroundColor:
          index === currentExample
            ? "rgba(139, 92, 246, 1)"
            : "rgba(55, 65, 81, 0.5)",
        boxShadow:
          index === currentExample
            ? "0 0 20px rgba(139, 92, 246, 0.5)"
            : "none",
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  // Handle select change
  const handleSelectChange = (value: string) => {
    const index = parseInt(value);
    setCurrentExample(index);
    if (intervalRef.current) clearInterval(intervalRef.current); // Stop cycling
    // Animate transition to the selected example
    const tl = gsap.timeline();
    if (naturalLanguageRef.current) {
      tl.to(naturalLanguageRef.current, { opacity: 0, y: -10, duration: 0.3 });
    }
    if (sqlQueryRef.current) {
      tl.to(
        sqlQueryRef.current,
        { opacity: 0, scale: 0.95, duration: 0.3 },
        "-=0.2"
      );
    }
    if (descriptionRef.current) {
      tl.to(
        descriptionRef.current,
        { opacity: 0, y: 10, duration: 0.3 },
        "-=0.2"
      );
    }
    tl.add(() => {
      setCurrentExample(index);
    });
    tl.fromTo(
      naturalLanguageRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5 }
    );
    tl.fromTo(
      sqlQueryRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5 },
      "-=0.3"
    );
    tl.fromTo(
      descriptionRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.4 },
      "-=0.2"
    );
  };

  // Handle example button click
  const handleExampleButtonClick = (index: number) => {
    setCurrentExample(index);
    if (selectRef.current) {
      selectRef.current.value = index.toString();
    }
    if (intervalRef.current) clearInterval(intervalRef.current); // Stop cycling
    // Animate transition to the selected example
    const tl = gsap.timeline();
    if (naturalLanguageRef.current) {
      tl.to(naturalLanguageRef.current, { opacity: 0, y: -10, duration: 0.3 });
    }
    if (sqlQueryRef.current) {
      tl.to(
        sqlQueryRef.current,
        { opacity: 0, scale: 0.95, duration: 0.3 },
        "-=0.2"
      );
    }
    if (descriptionRef.current) {
      tl.to(
        descriptionRef.current,
        { opacity: 0, y: 10, duration: 0.3 },
        "-=0.2"
      );
    }
    tl.add(() => {
      setCurrentExample(index);
    });
    tl.fromTo(
      naturalLanguageRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5 }
    );
    tl.fromTo(
      sqlQueryRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5 },
      "-=0.3"
    );
    tl.fromTo(
      descriptionRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.4 },
      "-=0.2"
    );
  };

  // Handle "Generate SQL" button click
  const handleGenerateClick = () => {
    if (selectRef.current) {
      const index = parseInt(selectRef.current.value);
      setCurrentExample(index);
      startInterval(); // Resume cycling
      // Animate transition to the selected example
      const tl = gsap.timeline();
      if (naturalLanguageRef.current) {
        tl.to(naturalLanguageRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.3,
        });
      }
      if (sqlQueryRef.current) {
        tl.to(
          sqlQueryRef.current,
          { opacity: 0, scale: 0.95, duration: 0.3 },
          "-=0.2"
        );
      }
      if (descriptionRef.current) {
        tl.to(
          descriptionRef.current,
          { opacity: 0, y: 10, duration: 0.3 },
          "-=0.2"
        );
      }
      tl.add(() => {
        setCurrentExample(index);
      });
      tl.fromTo(
        naturalLanguageRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5 }
      );
      tl.fromTo(
        sqlQueryRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5 },
        "-=0.3"
      );
      tl.fromTo(
        descriptionRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4 },
        "-=0.2"
      );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-gradient-to-br from-gray-900/80 to-purple-900/60 rounded-xl p-8 border border-pink-500/30 backdrop-blur-sm ${className} overflow-hidden`}
    >
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              sparklesRef.current[i] = el;
            }}
            className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
            style={{
              left: `${10 + i * 10}%`,
              top: `${15 + i * 8}%`,
            }}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <div
            key={`float-${i}`}
            ref={(el) => {
              floatingElementsRef.current[i] = el;
            }}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            style={{
              left: `${20 + i * 12}%`,
              top: `${25 + i * 10}%`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10">
        <div className="text-center mb-8">
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm font-medium mb-4 border border-purple-500/30"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI-Powered Query Generation</span>
          </div>
          <h2
            ref={titleRef}
            className="text-2xl sm:text-3xl font-bold text-white mb-3"
          >
            Write queries in{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              plain English
            </span>
          </h2>
          <p ref={subtitleRef} className="text-pink-100 text-lg">
            Describe what you want, and our AI converts it to perfect SQL
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600/50">
              <div className="flex items-center gap-2 mb-4">
                {/* <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-300">
                  Try it yourself
                </h3> */}
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Select
                    disabled
                    value={currentExample.toString()}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="w-full bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e] border-2 text-white placeholder:text-slate-400 rounded-lg focus-visible:ring-2 transition-all duration-200 py-2 px-3 pr-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examples.map((example, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {example.natural}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-pulse pointer-events-none" />
                </div>
                <Button
                  onClick={handleGenerateClick}
                  className="w-full text-white font-semibold transition-all duration-300 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #f472b6)",
                    boxShadow:
                      "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(244, 114, 182, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(244, 114, 182, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(244, 114, 182, 0.2)";
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Generate SQL
                </Button>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-pink-200 mb-3 flex items-center justify-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Or try one of these examples:
                <ChevronRight className="w-4 h-4" />
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {examples.map((example, idx) => (
                  <Button
                    key={idx}
                    ref={(el) => {
                      exampleButtonsRef.current[idx] = el;
                    }}
                    onClick={() => handleExampleButtonClick(idx)}
                    onMouseEnter={() => handleExampleButtonHover(idx, true)}
                    onMouseLeave={() => handleExampleButtonHover(idx, false)}
                    className={`px-4 py-2 text-sm rounded-full transition-all duration-200 border ${
                      idx === currentExample
                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50 border-purple-400"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Star
                        className={`w-3 h-3 ${
                          idx === currentExample
                            ? "text-yellow-300"
                            : "text-gray-400"
                        }`}
                      />
                      {idx + 1}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600/50">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-green-300">
                  Generated SQL
                </h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                  <p className="text-purple-300 font-medium text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Natural Language:
                  </p>
                  <p
                    ref={naturalLanguageRef}
                    className="text-pink-200 text-sm italic"
                  >
                    {`"${examples[currentExample].natural}"`}
                  </p>
                </div>
                <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                  <p className="text-green-300 font-medium text-sm mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    SQL Query:
                  </p>
                  <p
                    ref={naturalLanguageRef}
                    className="text-pink-200 text-sm italic"
                  >
                    {`"${examples[currentExample].natural}"`}
                  </p>
                </div>
                <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                  <p className="text-yellow-300 font-medium text-sm mb-2 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Description:
                  </p>
                  <p ref={descriptionRef} className="text-gray-300 text-sm">
                    {examples[currentExample].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-pink-200">
            Powered by advanced AI to understand context and table
            relationships.
            {/* and generate optimized SQL queries */}
          </p>
        </div>
      </div>
    </div>
  );
}

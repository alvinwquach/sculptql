"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MessageSquare,
  Database,
  ArrowRight,
  Star,
} from "lucide-react";

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

  const examples: QueryExample[] = [
    {
      natural: "Show me all users who signed up this month",
      sql: "SELECT * \nFROM users\nWHERE \n  created_at >= DATE_TRUNC('month', CURRENT_DATE);",
      description: "Temporal filtering with date functions",
    },
    {
      natural: "Find the top 5 customers by total order value",
      sql: "SELECT \n  c.name, \n  SUM(o.total) as total_value\nFROM customers c\nJOIN orders o \n  ON c.id = o.customer_id\nGROUP BY c.id, c.name\nORDER BY total_value DESC\nLIMIT 5;",
      description: "Complex joins with aggregation and sorting",
    },
    {
      natural: "Get products that are low in stock",
      sql: "SELECT * \nFROM products\nWHERE \n  stock_quantity < 10;",
      description: "Simple conditional filtering",
    },
    {
      natural: "Show me orders from customers in California",
      sql: "SELECT o.* \nFROM orders o\nJOIN customers c \n  ON o.customer_id = c.id\nWHERE \n  c.state = 'CA';",
      description: "Join operations with WHERE conditions",
    },
  ];

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-gradient-to-br from-gray-900/80 to-purple-900/60 rounded-2xl p-4 sm:p-6 lg:p-8 border border-pink-500/30 backdrop-blur-sm ${className} shadow-2xl`}
    >
      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm font-medium mb-4 border border-purple-500/30">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI-Powered Query Generation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Write queries in{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              plain English
            </span>
          </h2>
          <p className="text-pink-100 text-base sm:text-lg">
            Describe what you want, and our AI converts it to perfect SQL
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-600/50">
              <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Choose an example:
              </h3>
              <div className="grid gap-3">
                {examples.map((example, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setCurrentExample(idx)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 text-sm ${
                      idx === currentExample
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50 border-2 border-purple-400"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-2 border-gray-600/50 hover:border-purple-400/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Star
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          idx === currentExample
                            ? "text-yellow-300"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="flex-1">{example.natural}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-600/50">
              <h3 className="text-base sm:text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Generated SQL
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                  <p className="text-purple-300 font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Natural Language:
                  </p>
                  <p className="text-pink-200 text-sm italic">
                    &quot;{examples[currentExample].natural}&quot;
                  </p>
                </div>
                <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                  <p className="text-green-300 font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    SQL Query:
                  </p>
                  <pre className="text-pink-200 text-xs sm:text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto">
                    {examples[currentExample].sql}
                  </pre>
                </div>
                <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                  <p className="text-yellow-300 font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Description:
                  </p>
                  <p className="text-gray-300 text-sm">
                    {examples[currentExample].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm text-pink-200">
            Powered by advanced AI to understand context and table relationships
          </p>
        </div>
      </div>
    </div>
  );
}

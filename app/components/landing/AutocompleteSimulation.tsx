"use client";

import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";

// Props for the AutocompleteSimulation component
interface AutocompleteSimulationProps {
  height?: string;
  className?: string;
}

interface SimulationStep {
  text: string;
  delay: number;
  showAutocomplete: boolean;
  autocompleteType?: "column" | "table" | "value";
  pause?: number;
}


export default function AutocompleteSimulation({ 
  height = "300px",
  className = ""
}: AutocompleteSimulationProps) {
  // State for the displayed code
  const [displayedCode, setDisplayedCode] = useState("");
  // State for the typing indicator
  const [isTyping, setIsTyping] = useState(false);
  // State for the autocomplete dropdown
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  // State for the autocomplete type
  const [autocompleteType, setAutocompleteType] = useState<"column" | "table" | "value">("column");
  // Ref for the editor
  const editorRef = useRef<HTMLDivElement>(null);

  // Autocomplete simulation steps
  const simulationSteps: SimulationStep[] = [
    { text: "SELECT ", delay: 500, showAutocomplete: false },
    { text: "u", delay: 200, showAutocomplete: false },
    { text: "s", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false },
    { text: "r", delay: 200, showAutocomplete: false },
    { text: "_", delay: 200, showAutocomplete: false },
    { text: "n", delay: 200, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "m", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: true, autocompleteType: "column", pause: 2000 },
    { text: ", ", delay: 300, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false },
    { text: "m", delay: 200, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "i", delay: 200, showAutocomplete: false },
    { text: "l", delay: 200, showAutocomplete: true, autocompleteType: "column", pause: 2000 },
    { text: " ", delay: 200, showAutocomplete: false },
    { text: "FROM ", delay: 500, showAutocomplete: false },
    { text: "u", delay: 200, showAutocomplete: false },
    { text: "s", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false },
    { text: "r", delay: 200, showAutocomplete: false },
    { text: "s", delay: 200, showAutocomplete: true, autocompleteType: "table", pause: 2000 },
    { text: " ", delay: 200, showAutocomplete: false },
    { text: "WHERE ", delay: 500, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "c", delay: 200, showAutocomplete: false },
    { text: "t", delay: 200, showAutocomplete: false },
    { text: "i", delay: 200, showAutocomplete: false },
    { text: "v", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: true, autocompleteType: "column", pause: 2000 },
    { text: " = ", delay: 200, showAutocomplete: false },
    { text: "'", delay: 200, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "c", delay: 200, showAutocomplete: false },
    { text: "t", delay: 200, showAutocomplete: false },
    { text: "i", delay: 200, showAutocomplete: false },
    { text: "v", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: true, autocompleteType: "value", pause: 2000 },
    { text: "'", delay: 200, showAutocomplete: false },
    { text: ";", delay: 500, showAutocomplete: false },
  ];

  // Use effect for the autocomplete simulation
  useEffect(() => {
    // Initialize the current step and timeout id
    let currentStep = 0;
    // Initialize the timeout id
    let timeoutId: NodeJS.Timeout;

    // Function to simulate typing
    const simulateTyping = () => {
      // If the current step is less than the length of the simulation steps
      if (currentStep < simulationSteps.length) {
        const step = simulationSteps[currentStep];
        // Set the displayed code to the previous code and the current step text
        setDisplayedCode(prev => prev + step.text);
        // Set the typing indicator to true
        setIsTyping(true);
        // If the current step shows autocomplete
        if (step.showAutocomplete) {
          // Set the autocomplete type to the current step autocomplete type or column
          setAutocompleteType(step.autocompleteType || "column");
          // Set the autocomplete dropdown to true after a delay
          setTimeout(() => setShowAutocomplete(true), 100);
          // If there's a pause, wait longer before continuing
          if (step.pause) {
            // Increment the current step and set the timeout id
            currentStep++;
            // Set the timeout id to the current step pause
            timeoutId = setTimeout(simulateTyping, step.pause);
            // Return to stop the function
            return;
          }
        } else {
          // Set the autocomplete dropdown to false after a delay
          setTimeout(() => setShowAutocomplete(false), 100);
        }
        // Increment the current step and set the timeout id
        currentStep++;
        // Set the timeout id to the current step delay
        timeoutId = setTimeout(simulateTyping, step.delay);
      } else {
        setIsTyping(false);
        // Restart simulation after a delay
        setTimeout(() => {
          // Set the displayed code to empty
          setDisplayedCode("");
          // Set the autocomplete dropdown to false
          setShowAutocomplete(false);
          // Set the current step to 0
          currentStep = 0;
          simulateTyping();
        }, 5000);
      }
    };
    // Simulate typing
    simulateTyping();
    // Return a function to kill the timeout id
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);


  return (
    <div
      ref={editorRef}
      className={`autocomplete-simulation relative w-full rounded-xl shadow-2xl overflow-hidden border border-purple-500/30 bg-[#0f0f23] ${className}`}
      style={{
        minHeight: height,
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      }}
    >
      {/* Browser header */}
      <div className="flex items-center justify-between bg-[#0f0f23] px-4 py-2 border-b border-purple-500/30">
        <div className="flex gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></span>
          <span className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></span>
          <span className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></span>
        </div>
        <div className="text-cyan-400 text-sm font-mono">
          SQL EDITOR [SYNTHWAVE MODE]
        </div>
        <div className="w-16" />
      </div>

      {/* CodeMirror Editor */}
      <div className="relative">
        <CodeMirror
          value={displayedCode}
          height={height}
          width="100%"
          extensions={[sql()]}
          theme="dark"
          editable={false}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
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

        {/* Autocomplete dropdown simulation */}
        {showAutocomplete && (
          <div className="absolute top-12 left-4 bg-[#1e1b4b] border border-purple-500/30 rounded-lg shadow-xl backdrop-blur-sm z-10 min-w-48">
            <div className="p-2">
              <div className="text-cyan-400 text-xs font-mono mb-1">
                {autocompleteType === "column"
                  ? "Columns:"
                  : autocompleteType === "table"
                  ? "Tables:"
                  : "Values:"}
              </div>
              <div className="space-y-1">
                {autocompleteType === "column" ? (
                  <>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">user_name</span> -
                      VARCHAR(255)
                    </div>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">email</span> -
                      VARCHAR(255)
                    </div>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">created_at</span> -
                      TIMESTAMP
                    </div>
                  </>
                ) : autocompleteType === "table" ? (
                  <>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">users</span> - 1,234 rows
                    </div>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">orders</span> - 5,678 rows
                    </div>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">products</span> - 890 rows
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">&apos;active&apos;</span>{" "}
                      - 1,234 matches
                    </div>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">
                        &apos;inactive&apos;
                      </span>{" "}
                      - 56 matches
                    </div>
                    <div className="px-2 py-1 text-[#e0e6ed] text-sm hover:bg-purple-500/20 rounded cursor-pointer">
                      <span className="text-cyan-400">&apos;pending&apos;</span>{" "}
                      - 12 matches
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 text-cyan-400 text-sm">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="font-mono">Typing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

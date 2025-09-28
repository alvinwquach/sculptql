"use client";

import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { Input } from "@/components/ui/input";

// Props for the AutocompleteSimulation component
interface AutocompleteSimulationProps {
  height?: string;
  className?: string;
}

interface SimulationStep {
  text: string;
  delay: number;
  showAutocomplete: boolean;
  pause?: number;
}


export default function AutocompleteSimulation({ 
  height = "300px",
  className = ""
}: AutocompleteSimulationProps) {
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
  // State for the displayed code
  const [displayedCode, setDisplayedCode] = useState("");
  // State for the typing indicator
  const [isTyping, setIsTyping] = useState(false);
  // State for animation completion
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  // Ref for the editor
  const editorRef = useRef<HTMLDivElement>(null);

  // Typing simulation steps
  const simulationSteps: SimulationStep[] = [
    { text: "SELECT\n  ", delay: 500, showAutocomplete: false },
    { text: "u", delay: 200, showAutocomplete: false },
    { text: "s", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false },
    { text: "r", delay: 200, showAutocomplete: false },
    { text: "_", delay: 200, showAutocomplete: false },
    { text: "n", delay: 200, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "m", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false, pause: 1000 },
    { text: ",\n  ", delay: 300, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false },
    { text: "m", delay: 200, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "i", delay: 200, showAutocomplete: false },
    { text: "l", delay: 200, showAutocomplete: false, pause: 1000 },
    { text: "\nFROM\n  ", delay: 500, showAutocomplete: false },
    { text: "u", delay: 200, showAutocomplete: false },
    { text: "s", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false },
    { text: "r", delay: 200, showAutocomplete: false },
    { text: "s", delay: 200, showAutocomplete: false, pause: 1000 },
    { text: "\nWHERE\n  ", delay: 500, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "c", delay: 200, showAutocomplete: false },
    { text: "t", delay: 200, showAutocomplete: false },
    { text: "i", delay: 200, showAutocomplete: false },
    { text: "v", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false, pause: 1000 },
    { text: " = ", delay: 200, showAutocomplete: false },
    { text: "'", delay: 200, showAutocomplete: false },
    { text: "a", delay: 200, showAutocomplete: false },
    { text: "c", delay: 200, showAutocomplete: false },
    { text: "t", delay: 200, showAutocomplete: false },
    { text: "i", delay: 200, showAutocomplete: false },
    { text: "v", delay: 200, showAutocomplete: false },
    { text: "e", delay: 200, showAutocomplete: false, pause: 1000 },
    { text: "';", delay: 300, showAutocomplete: false },
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
        // If there's a pause, wait longer before continuing
        if (step.pause) {
          // Increment the current step and set the timeout id
          currentStep++;
          // Set the timeout id to the current step pause
          timeoutId = setTimeout(simulateTyping, step.pause);
          // Return to stop the function
          return;
        }
        // Increment the current step and set the timeout id
        currentStep++;
        // Set the timeout id to the current step delay
        timeoutId = setTimeout(simulateTyping, step.delay);
      } else {
        // Animation completed
        setIsTyping(false);
        setIsAnimationComplete(true);
        // Restart simulation after a longer delay (10 seconds)
        setTimeout(() => {
          // Set the displayed code to empty
          setDisplayedCode("");
          // Set the current step to 0
          currentStep = 0;
          setIsAnimationComplete(false);
          simulateTyping();
        }, 10000);
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
      className={`autocomplete-simulation relative w-full shadow-2xl overflow-hidden bg-[#0f0f23] ${className}`}
      style={{
        minHeight: height,
        opacity: 1,
        transform: "scale(1) translateY(0px)",
        maxWidth: "100%",
        border: "2px solid transparent",
        background: "linear-gradient(#0f0f23, #0f0f23) padding-box, linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) border-box",
        boxShadow: "0 0 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        borderRadius: "0px",
      }}
    >
      {/* Browser header */}
      <div className="flex items-center justify-between bg-[#0f0f23] px-2 sm:px-4 py-2 border-b border-purple-500/30">
        <div className="flex gap-1 sm:gap-2">
          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-lg"></span>
          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full shadow-lg"></span>
          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full shadow-lg"></span>
        </div>
        <Input
          type="text"
          value="SQL EDITOR [SYNTHWAVE MODE]"
          disabled
          className="w-full max-w-sm px-3 py-1 rounded-md bg-[#1e1b4b] text-[#e0e6ed] text-xs sm:text-sm font-mono border border-purple-500/30 text-center cursor-default mx-2 sm:mx-6"
        />
        <div className="w-8 sm:w-16" />
      </div>

      {/* CodeMirror Editor */}
      <div className="relative">
        <CodeMirror
          value={displayedCode}
          height={height}
          width="100%"
          extensions={[
            sql(),
            customTheme,
            syntaxHighlighting(defaultHighlightStyle, { fallback: true })
          ]}
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


        {/* Typing indicator */}
        {isTyping && !isAnimationComplete && (
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex items-center gap-1 sm:gap-2 text-cyan-400 text-xs sm:text-sm">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="font-mono hidden sm:inline">Typing...</span>
            <span className="font-mono sm:hidden">...</span>
          </div>
        )}
      </div>
    </div>
  );
}

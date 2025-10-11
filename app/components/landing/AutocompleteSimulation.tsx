"use client";

import { useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { Input } from "@/components/ui/input";
import { autocompleteEditorTheme } from "./autocompleteSimulation/editorTheme";
import { useTypingAnimation } from "./autocompleteSimulation/useTypingAnimation";
import { AutocompleteDropdown } from "./autocompleteSimulation/AutocompleteDropdown";

interface AutocompleteSimulationProps {
  height?: string;
  className?: string;
}

export default function AutocompleteSimulation({
  height = "300px",
  className = ""
}: AutocompleteSimulationProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const {
    displayedCode,
    autocompleteOptions,
    selectedIndex,
    showAutocomplete,
    cursorPosition
  } = useTypingAnimation();

  return (
    <div
      ref={editorRef}
      className={`autocomplete-simulation relative w-full max-w-full shadow-2xl overflow-hidden bg-[#0f0f23] border-2 border-transparent rounded-2xl ${className}`}
      style={{
        minHeight: height,
        background:
          "linear-gradient(#0f0f23, #0f0f23) padding-box, linear-gradient(135deg, #8b5cf6, #f472b6, #10b981, #fbbf24) border-box",
        boxShadow:
          "0 0 40px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="flex items-center justify-between bg-[#0f0f23] px-2 sm:px-4 py-2 border-b border-purple-500/30">
        <div className="flex gap-1 sm:gap-2">
          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-lg"></span>
          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full shadow-lg"></span>
          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full shadow-lg"></span>
        </div>
        <Input
          type="text"
          value="https://sculptql.com/editor"
          disabled
          className="w-full max-w-sm px-3 py-1 rounded-md bg-[#1e1b4b] text-[#e0e6ed] text-xs sm:text-sm font-mono border border-purple-500/30 text-center cursor-default mx-2 sm:mx-6"
        />
        <div className="w-8 sm:w-16" />
      </div>
      <div className="relative">
        <CodeMirror
          value={displayedCode}
          height={height}
          width="100%"
          extensions={[
            sql(),
            autocompleteEditorTheme,
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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
        {showAutocomplete && autocompleteOptions.length > 0 && (
          <AutocompleteDropdown
            options={autocompleteOptions}
            selectedIndex={selectedIndex}
            cursorPosition={cursorPosition}
          />
        )}
      </div>
    </div>
  );
}

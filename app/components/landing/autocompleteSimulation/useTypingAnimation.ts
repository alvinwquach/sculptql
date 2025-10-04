import { useEffect, useState } from "react";
import { AutocompleteOption, CursorPosition } from "./types";
import { getContextAwareSuggestions } from "./suggestions";

interface TypingStep {
  char?: string;
  complete?: string;
  pause?: number;
  delay?: number;
}

const TYPING_SEQUENCE: TypingStep[] = [
  { char: "S", delay: 200 },
  { char: "E", delay: 200 },
  { char: "L", delay: 300 },
  { complete: "SELECT\n  ", delay: 500 },
  { pause: 400 },
  { char: "r", delay: 200 },
  { char: "o", delay: 200 },
  { char: "l", delay: 300 },
  { complete: "role,\n  ", delay: 500 },
  { pause: 400 },
  { char: "d", delay: 200 },
  { char: "e", delay: 200 },
  { char: "p", delay: 300 },
  { complete: "department\n", delay: 500 },
  { pause: 400 },
  { char: "F", delay: 200 },
  { char: "R", delay: 200 },
  { char: "O", delay: 300 },
  { complete: "FROM ", delay: 500 },
  { pause: 400 },
  { char: "u", delay: 200 },
  { char: "s", delay: 200 },
  { char: "e", delay: 300 },
  { complete: "users\n", delay: 500 },
  { pause: 400 },
  { char: "W", delay: 200 },
  { char: "H", delay: 200 },
  { char: "E", delay: 300 },
  { complete: "WHERE ", delay: 500 },
  { pause: 400 },
  { char: "r", delay: 200 },
  { char: "o", delay: 200 },
  { char: "l", delay: 300 },
  { complete: "role ", delay: 500 },
  { pause: 400 },
  { char: "=", delay: 200 },
  { char: " ", delay: 300 },
  { pause: 400 },
  { char: "'", delay: 200 },
  { char: "a", delay: 180 },
  { char: "d", delay: 180 },
  { char: "m", delay: 300 },
  { complete: "'admin'", delay: 500 },
  { pause: 400 },
  { char: ";", delay: 300 },
  { pause: 2500 },
];

interface UseTypingAnimationReturn {
  displayedCode: string;
  autocompleteOptions: AutocompleteOption[];
  selectedIndex: number;
  showAutocomplete: boolean;
  cursorPosition: CursorPosition;
}

export const useTypingAnimation = (): UseTypingAnimationReturn => {
  // Set the displayed code to the displayed code
  const [displayedCode, setDisplayedCode] = useState("");
  // Set the autocomplete options to the autocomplete options
  const [autocompleteOptions, setAutocompleteOptions] = useState<
    AutocompleteOption[]
  >([]);
  // Set the selected index to the selected index
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Set the show autocomplete to the show autocomplete
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  // Set the cursor position to the cursor position
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 0,
    ch: 0,
  });

  useEffect(() => {
    // Set the timeout id to the timeout id
    let timeoutId: NodeJS.Timeout;
    // Set the current index to the current index
    let currentIndex = 0;

    // Set the calculate cursor position to the calculate cursor position
    const calculateCursorPosition = (code: string): CursorPosition => {
      // Set the lines to the lines
      const lines = code.split("\n");
      // Set the line to the line
      const line = lines.length - 1;
      // Set the ch to the ch
      const ch = lines[line].length;
      // Return the line and the ch
      return { line, ch };
    };

    const animate = () => {
      // If the current index is greater than the typing sequence length,
      // set the displayed code to an empty string,
      // set the show autocomplete to false,
      // set the current index to 0,
      // and set the cursor position to the cursor position
      if (currentIndex >= TYPING_SEQUENCE.length) {
        setTimeout(() => {
          setDisplayedCode("");
          setShowAutocomplete(false);
          currentIndex = 0;
          setCursorPosition({ line: 0, ch: 0 });
          animate();
        }, 2000);
        return;
      }

      // Set the step to the step
      const step = TYPING_SEQUENCE[currentIndex];

      // If the step is a char,
      // set the displayed code to the displayed code
      if ("char" in step) {
        setDisplayedCode((prev) => {
          // Set the new code to the new code
          const newCode = prev + step.char;
          // Set the new cursor position to the new cursor position
          const newCursorPos = calculateCursorPosition(newCode);
          // Set the cursor position to the cursor position
          setCursorPosition(newCursorPos);

          setTimeout(() => {
            // Set the suggestions to the suggestions
            const suggestions = getContextAwareSuggestions(newCode);
            // If the suggestions length is greater than 0,
            // set the autocomplete options to the suggestions,
            // set the selected index to 0,
            // set the show autocomplete to true,
            // otherwise set the show autocomplete to false
            if (suggestions.length > 0) {
              setAutocompleteOptions(suggestions);
              setSelectedIndex(0);
              setShowAutocomplete(true);
            } else {
              setShowAutocomplete(false);
            }
          }, 75);
          // Return the new code
          return newCode;
        });
      } else if ("complete" in step) {
        // Set the displayed code to the displayed code
        setDisplayedCode((prev) => {
          // Set the last word to the last word
          const lastWord =
            prev
              .split(/[\s\n,]/)
              .filter(Boolean)
              .pop() || "";
          // Set the new code to the new code
          let newCode = prev;
          // If the last word is not empty and the last word test the regex,
          // set the last word index to the last word index,
          // otherwise set the last word index to the last word index
          if (lastWord && /\w/.test(lastWord)) {
            const lastWordIndex = prev.lastIndexOf(lastWord);
            // Set the new code to the new code
            newCode = prev.substring(0, lastWordIndex) + step.complete!;
          } else {
            newCode = prev + step.complete!;
          }
          // Set the new cursor position to the new cursor position
          const newCursorPos = calculateCursorPosition(newCode);
          // Set the cursor position to the cursor position
          setCursorPosition(newCursorPos);
          // Set the show autocomplete to false
          setShowAutocomplete(false);
          // Return the new code
          return newCode;
        });
      } else if ("pause" in step) {
      }
      // Set the current index to the current index
      currentIndex++;
      // Set the timeout id to the timeout id
      timeoutId = setTimeout(animate, step.delay);
    };

    animate();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return {
    displayedCode,
    autocompleteOptions,
    selectedIndex,
    showAutocomplete,
    cursorPosition,
  };
};

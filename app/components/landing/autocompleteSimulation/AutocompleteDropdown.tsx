import { AutocompleteOption, CursorPosition } from "./types";

interface AutocompleteDropdownProps {
  options: AutocompleteOption[];
  selectedIndex: number;
  cursorPosition: CursorPosition;
}

const getTypeIcon = (type: AutocompleteOption['type']): string => {
  switch (type) {
    case 'keyword':
      return 'K';
    case 'table':
      return 'T';
    case 'field':
      return 'F';
    case 'value':
      return 'V';
    case 'text':
      return 'T';
    default:
      return '•';
  }
};

const getTypeColor = (type: AutocompleteOption['type']): string => {
  switch (type) {
    case 'keyword':
      return 'text-pink-400 bg-pink-500/20';
    case 'table':
      return 'text-yellow-400 bg-yellow-500/20';
    case 'field':
      return 'text-green-400 bg-green-500/20';
    case 'value':
      return 'text-blue-400 bg-blue-500/20';
    case 'text':
      return 'text-purple-400 bg-purple-500/20';
    default:
      return 'text-gray-400 bg-gray-500/20';
  }
};

export const AutocompleteDropdown = ({
  options,
  selectedIndex,
  cursorPosition
}: AutocompleteDropdownProps) => {
  const LINE_HEIGHT = 24;
  const CHAR_WIDTH = 9.6;
  const topPosition = 60 + (cursorPosition.line * LINE_HEIGHT);
  const leftPosition = Math.min(60 + (cursorPosition.ch * CHAR_WIDTH), 400);

  return (
    <div
      className="absolute z-50 bg-[#1a1a2e]/95 backdrop-blur-sm border border-purple-500/50 rounded-lg overflow-hidden transition-all duration-150 min-w-[280px] max-w-[380px] max-h-[280px] overflow-y-auto shadow-[0_0_30px_rgba(139,92,246,0.4),0_4px_20px_rgba(0,0,0,0.5)]"
      style={{
        top: `${topPosition}px`,
        left: `${leftPosition}px`
      }}
    >
      {options.slice(0, 10).map((option, index) => (
        <div
          key={`${option.label}-${index}`}
          className={`px-3 py-2 transition-all duration-100 font-mono text-sm flex items-center gap-2 ${
            index === selectedIndex
              ? 'bg-gradient-to-r from-purple-600/50 to-purple-500/40 border-l-2 border-purple-400 shadow-lg'
              : 'hover:bg-purple-600/10'
          }`}
        >
          <div className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold flex-shrink-0 ${getTypeColor(option.type)}`}>
            {getTypeIcon(option.type)}
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
            <span
              className={`font-semibold truncate ${
                option.type === 'keyword'
                  ? 'text-pink-300'
                  : option.type === 'table'
                  ? 'text-yellow-300'
                  : option.type === 'field'
                  ? 'text-green-300'
                  : option.type === 'value'
                  ? 'text-blue-300'
                  : 'text-purple-300'
              }`}
            >
              {option.label}
            </span>
            <span className="text-xs text-gray-400/90 truncate flex-shrink-0 ml-2">
              {option.detail}
            </span>
          </div>
        </div>
      ))}
      <div className="px-3 py-1.5 text-[10px] text-gray-500 border-t border-purple-500/30 flex items-center justify-between">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Close</span>
      </div>
    </div>
  );
};

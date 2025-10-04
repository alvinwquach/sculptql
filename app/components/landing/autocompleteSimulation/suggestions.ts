import { AutocompleteOption } from "./types";

// Set the mock tables to the mock tables
const MOCK_TABLES = ['users', 'activities', 'orders', 'products'];

// Set the mock columns to the mock columns
const MOCK_COLUMNS: Record<string, string[]> = {
  users: ['id', 'name', 'email', 'role', 'department', 'created_at'],
  activities: ['id', 'user_id', 'action', 'timestamp', 'metadata'],
  orders: ['id', 'user_id', 'total', 'status', 'created_at'],
  products: ['id', 'name', 'price', 'category', 'stock']
};

// Set the mock values to the mock values
const MOCK_VALUES: Record<string, string[]> = {
  role: ['admin', 'user', 'moderator', 'guest'],
  department: ['engineering', 'sales', 'marketing', 'support'],
  status: ['pending', 'completed', 'cancelled'],
  category: ['electronics', 'clothing', 'food', 'books']
};

// Set the detect context to the detect context
function detectContext(code: string): string {
  // Set the upper code to the upper code
  const upperCode = code.toUpperCase();
  // Set the trimmed code to the trimmed code
  const trimmedCode = code.trim();

  // If the trimmed code matches the regex, return after_operator
  if (/\b(WHERE|AND|OR)\s+[\w"']+\s*[=!><]+\s*$/i.test(trimmedCode)) {
    return 'after_operator';
  }

  // If the trimmed code matches the regex, return need_operator
  if (/\b(WHERE|AND|OR)\s+[\w"']+\s+$/i.test(trimmedCode)) {
    return 'need_operator';
  }

  // If the trimmed code matches the regex, return after_value
  if (/\b(WHERE|AND|OR)\s+[\w"']+\s*[=!><]+\s*['"]?\w+['"]?\s*$/i.test(trimmedCode)) {
    return 'after_value';
  }

  // If the trimmed code matches the regex, return where
  if (upperCode.includes('FROM') && upperCode.includes('WHERE') &&
      !/\b(GROUP\s+BY|ORDER\s+BY|LIMIT)\b/i.test(trimmedCode.split(/\bWHERE\b/i)[1] || '')) {
    return 'where';
  }

  // If the trimmed code matches the regex, return after_from
  if (upperCode.includes('FROM') && !/\bWHERE\b/i.test(trimmedCode)) {
    return 'after_from';
  }

  // If the trimmed code matches the regex, return select
  if (upperCode.includes('SELECT') && !upperCode.includes('FROM')) {
    return 'select';
  }

  // If the trimmed code matches the regex, return start
  return 'start';
}

// Set the get selected table to the get selected table
function getSelectedTable(code: string): string | null {
  // Set the match to the match
  const match = code.match(/\bFROM\s+([\w"']+)/i);
  // Return the match
  return match ? match[1].replace(/["']/g, '') : null;
}

// Set the get last word to the get last word
function getLastWord(code: string): string {
  // Set the words to the words
  const words = code.split(/[\s\n,()]+/).filter(Boolean);
  // Return the words
  return words[words.length - 1] || '';
}

// Set the get context aware suggestions to the get context aware suggestions
export function getContextAwareSuggestions(code: string): AutocompleteOption[] {
  // Set the context to the context
  const context = detectContext(code);
  // Set the last word to the last word
  const lastWord = getLastWord(code);
  // Set the selected table to the selected table
  const selectedTable = getSelectedTable(code);

  // Set the all columns to the all columns
  const allColumns = Array.from(
    // Set the new set to the new set
    new Set(Object.values(MOCK_COLUMNS).flat())
    // Sort the all columns
  ).sort();

  // Set the columns to the columns if the selected table is not null
  const columns = selectedTable ? MOCK_COLUMNS[selectedTable] || MOCK_COLUMNS.users : allColumns;

  // Set the options to the options
  let options: AutocompleteOption[] = [];

  switch (context) {
    case 'start':
      options = [
        { label: 'SELECT', type: 'keyword' as const, apply: 'SELECT ', detail: 'Select data from tables' },
        { label: 'WITH', type: 'keyword' as const, apply: 'WITH ', detail: 'Common Table Expression' },
      ];
      break;

    case 'select':
      options = [
        { label: '*', type: 'keyword' as const, apply: '*', detail: 'All columns' },
        { label: 'DISTINCT', type: 'keyword' as const, apply: 'DISTINCT ', detail: 'Select unique values only' },
        { label: 'COUNT(*)', type: 'keyword' as const, apply: 'COUNT(*)', detail: 'Count all rows' },
        { label: 'SUM()', type: 'keyword' as const, apply: 'SUM(', detail: 'Sum numeric values' },
        { label: 'AVG()', type: 'keyword' as const, apply: 'AVG(', detail: 'Average numeric values' },
        { label: 'FROM', type: 'keyword' as const, apply: 'FROM ', detail: 'Specify table to select from', boost: 10 },
        ...allColumns.map(col => ({
          label: col,
          type: 'field' as const,
          apply: col,
          detail: 'Column'
        }))
      ];
      break;

    case 'after_from':
      const hasWhere = /\bWHERE\b/i.test(code);
      options = [
        ...MOCK_TABLES.map(table => ({
          label: table,
          type: 'table' as const,
          apply: table,
          detail: 'Table'
        })),
        ...(hasWhere ? [] : [
          { label: 'WHERE', type: 'keyword' as const, apply: 'WHERE ', detail: 'Filter rows' },
          { label: 'INNER JOIN', type: 'keyword' as const, apply: 'INNER JOIN ', detail: 'Join tables' },
          { label: 'LEFT JOIN', type: 'keyword' as const, apply: 'LEFT JOIN ', detail: 'Left outer join' },
          { label: 'GROUP BY', type: 'keyword' as const, apply: 'GROUP BY ', detail: 'Group rows' },
          { label: 'ORDER BY', type: 'keyword' as const, apply: 'ORDER BY ', detail: 'Sort results' },
        ])
      ];
      break;

    case 'where':
      const whereColumns = selectedTable ? (MOCK_COLUMNS[selectedTable] || MOCK_COLUMNS.users) : MOCK_COLUMNS.users;
      options = [
        ...whereColumns.map(col => ({
          label: col,
          type: 'field' as const,
          apply: col,
          detail: 'Column'
        })),
        { label: 'AND', type: 'keyword' as const, apply: 'AND ', detail: 'Logical AND' },
        { label: 'OR', type: 'keyword' as const, apply: 'OR ', detail: 'Logical OR' },
      ];
      break;

    case 'need_operator':
      options = [
        { label: '=', type: 'keyword' as const, apply: '= ', detail: 'Equals' },
        { label: '!=', type: 'keyword' as const, apply: '!= ', detail: 'Not equals' },
        { label: '>', type: 'keyword' as const, apply: '> ', detail: 'Greater than' },
        { label: '<', type: 'keyword' as const, apply: '< ', detail: 'Less than' },
        { label: '>=', type: 'keyword' as const, apply: '>= ', detail: 'Greater than or equal' },
        { label: '<=', type: 'keyword' as const, apply: '<= ', detail: 'Less than or equal' },
        { label: 'LIKE', type: 'keyword' as const, apply: 'LIKE ', detail: 'Pattern matching' },
        { label: 'IN', type: 'keyword' as const, apply: 'IN (', detail: 'Value in list' },
        { label: 'BETWEEN', type: 'keyword' as const, apply: 'BETWEEN ', detail: 'Range of values' },
        { label: 'IS NULL', type: 'keyword' as const, apply: 'IS NULL ', detail: 'Check for null' },
        { label: 'IS NOT NULL', type: 'keyword' as const, apply: 'IS NOT NULL ', detail: 'Check for not null' },
      ];
      break;

    case 'after_operator':
      const columnMatch = code.match(/\b(WHERE|AND|OR)\s+(\w+)\s*[=!><]+\s*$/i);
      const column = columnMatch ? columnMatch[2] : null;
      const values = column && MOCK_VALUES[column] ? MOCK_VALUES[column] : [];

      if (values.length > 0) {
        options = values.map(val => ({
          label: val,
          type: 'value' as const,
          apply: `'${val}' `,
          detail: 'Unique value'
        }));
      } else {
        options = [
          { label: "'value'", type: 'text' as const, apply: "'value' ", detail: 'String value' },
          { label: '0', type: 'text' as const, apply: '0 ', detail: 'Numeric value' },
        ];
      }
      break;

    case 'after_value':
      options = [
        { label: 'AND', type: 'keyword' as const, apply: 'AND ', detail: 'Logical AND' },
        { label: 'OR', type: 'keyword' as const, apply: 'OR ', detail: 'Logical OR' },
        { label: 'GROUP BY', type: 'keyword' as const, apply: 'GROUP BY ', detail: 'Group rows' },
        { label: 'ORDER BY', type: 'keyword' as const, apply: 'ORDER BY ', detail: 'Sort results' },
        { label: 'LIMIT', type: 'keyword' as const, apply: 'LIMIT ', detail: 'Limit results' },
      ];
      break;
  }

  // If the last word is not empty 
  // and the last word does not match the regex, filter the options
  if (lastWord && lastWord.length > 0 && !/^[=!><'"]$/.test(lastWord)) {
    const filterWord = lastWord.startsWith("'") || lastWord.startsWith('"')
      ? lastWord.substring(1)
      : lastWord;

    options = options.filter(opt =>
      opt.label.toLowerCase().startsWith(filterWord.toLowerCase())
    );
  }

  return options;
}

"use client";

import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { TableColumn } from "@/app/types/query";

export function createLightweightSqlCompletion(
  tableNames: string[],
  tableColumns: TableColumn
) {
  // Pre-compute keyword maps for better performance
  const keywordMap = new Map<string, { type: string; category: string; boost: number }>();
  const tableMap = new Map<string, number>();
  
  // Enhanced SQL keywords with better categorization
  const sqlKeywords = [
      // Basic SQL keywords
      { keyword: 'select', type: 'keyword', category: 'query' },
      { keyword: 'from', type: 'keyword', category: 'query' },
      { keyword: 'where', type: 'keyword', category: 'clause' },
      { keyword: 'order by', type: 'keyword', category: 'clause' },
      { keyword: 'group by', type: 'keyword', category: 'clause' },
      { keyword: 'having', type: 'keyword', category: 'clause' },
      { keyword: 'limit', type: 'keyword', category: 'clause' },
      { keyword: 'offset', type: 'keyword', category: 'clause' },
      
      // Join keywords
      { keyword: 'inner join', type: 'keyword', category: 'join' },
      { keyword: 'left join', type: 'keyword', category: 'join' },
      { keyword: 'right join', type: 'keyword', category: 'join' },
      { keyword: 'full outer join', type: 'keyword', category: 'join' },
      { keyword: 'cross join', type: 'keyword', category: 'join' },
      
      // Set operations
      { keyword: 'union', type: 'keyword', category: 'set' },
      { keyword: 'union all', type: 'keyword', category: 'set' },
      { keyword: 'intersect', type: 'keyword', category: 'set' },
      { keyword: 'except', type: 'keyword', category: 'set' },
      
      // Modifiers
      { keyword: 'distinct', type: 'keyword', category: 'modifier' },
      { keyword: 'all', type: 'keyword', category: 'modifier' },
      
      // Logical operators
      { keyword: 'and', type: 'keyword', category: 'operator' },
      { keyword: 'or', type: 'keyword', category: 'operator' },
      { keyword: 'not', type: 'keyword', category: 'operator' },
      
      // Comparison operators
      { keyword: 'is null', type: 'keyword', category: 'operator' },
      { keyword: 'is not null', type: 'keyword', category: 'operator' },
      { keyword: 'like', type: 'keyword', category: 'operator' },
      { keyword: 'ilike', type: 'keyword', category: 'operator' },
      { keyword: 'in', type: 'keyword', category: 'operator' },
      { keyword: 'not in', type: 'keyword', category: 'operator' },
      { keyword: 'between', type: 'keyword', category: 'operator' },
      { keyword: 'not between', type: 'keyword', category: 'operator' },
      { keyword: 'exists', type: 'keyword', category: 'operator' },
      { keyword: 'not exists', type: 'keyword', category: 'operator' },
      
      // Aggregate functions
      { keyword: 'count', type: 'function', category: 'aggregate' },
      { keyword: 'sum', type: 'function', category: 'aggregate' },
      { keyword: 'avg', type: 'function', category: 'aggregate' },
      { keyword: 'max', type: 'function', category: 'aggregate' },
      { keyword: 'min', type: 'function', category: 'aggregate' },
      { keyword: 'stddev', type: 'function', category: 'aggregate' },
      { keyword: 'variance', type: 'function', category: 'aggregate' },
      
      // String functions
      { keyword: 'concat', type: 'function', category: 'string' },
      { keyword: 'substring', type: 'function', category: 'string' },
      { keyword: 'length', type: 'function', category: 'string' },
      { keyword: 'upper', type: 'function', category: 'string' },
      { keyword: 'lower', type: 'function', category: 'string' },
      { keyword: 'trim', type: 'function', category: 'string' },
      
      // Date functions
      { keyword: 'now', type: 'function', category: 'date' },
      { keyword: 'current_date', type: 'function', category: 'date' },
      { keyword: 'current_time', type: 'function', category: 'date' },
      { keyword: 'current_timestamp', type: 'function', category: 'date' },
      
      // Window functions
      { keyword: 'row_number', type: 'function', category: 'window' },
      { keyword: 'rank', type: 'function', category: 'window' },
      { keyword: 'dense_rank', type: 'function', category: 'window' },
      { keyword: 'lag', type: 'function', category: 'window' },
      { keyword: 'lead', type: 'function', category: 'window' },
    ];
    
    // Initialize keyword map for fast lookup
    sqlKeywords.forEach(({ keyword, type, category }) => {
      const key = keyword.toLowerCase();
      keywordMap.set(key, { type, category, boost: 5 });
    });
    
    // Initialize table map for fast lookup
    tableNames.forEach((tableName, index) => {
      tableMap.set(tableName.toLowerCase(), index);
    });
    
    // Return the sql completion function
    return function sqlCompletion(context: CompletionContext): CompletionResult | null {
      const word = context.matchBefore(/\w*/);
      // If the word is not found or the from and to are the same, return null
      if (!word || word.from == word.to) {
        return null;
      }
      
      // Get the current word and convert to lowercase
      const currentWord = word.text.toLowerCase();
      
      // Get the text before cursor and convert to lowercase
      const beforeCursor = context.state.sliceDoc(0, context.pos).toLowerCase();
      
      // Set the suggestions to an empty array
      let suggestions: { label: string; type: string; info?: string; boost?: number }[] = [];
      
      // Fast keyword matching using startsWith for better performance
      // Limit to first 10 matches for instant response
      let matchCount = 0;
      for (const [keyword, data] of keywordMap) {
        if (matchCount >= 10) break; // Limit for performance
        if (keyword.startsWith(currentWord)) {
          suggestions.push({
            label: keyword.toUpperCase(),
            type: data.type,
            info: `SQL ${data.type}: ${keyword}`,
            boost: currentWord === keyword ? 10 : data.boost
          });
          matchCount++;
        }
      }

    // Add table names when appropriate - optimized with startsWith
    if (beforeCursor.includes('from') || beforeCursor.includes('join') || beforeCursor.includes('update') || beforeCursor.includes('delete')) {
      let tableMatchCount = 0;
      for (const tableName of tableNames) {
        if (tableMatchCount >= 5) break; // Limit for performance
        const lowerTableName = tableName.toLowerCase();
        if (lowerTableName.startsWith(currentWord)) {
          suggestions.push({
            label: tableName,
            type: 'table',
            info: `Table: ${tableName}`,
            boost: currentWord === lowerTableName ? 10 : 5
          });
          tableMatchCount++;
        }
      }
    }

    // Add column names when appropriate - optimized with startsWith
    if (beforeCursor.includes('select') || beforeCursor.includes('where') || beforeCursor.includes('order by') || beforeCursor.includes('group by') || beforeCursor.includes('having')) {
      let columnMatchCount = 0;
      for (const [tableName, columns] of Object.entries(tableColumns)) {
        if (columnMatchCount >= 8) break; // Limit for performance
        for (const col of columns) {
          if (columnMatchCount >= 8) break; // Limit for performance
          const lowerCol = col.toLowerCase();
          if (lowerCol.startsWith(currentWord)) {
            suggestions.push({
              label: col,
              type: 'column',
              info: `Column: ${tableName}.${col}`,
              boost: currentWord === lowerCol ? 10 : 5
            });
            columnMatchCount++;
          }
        }
      }
    }
    
    // Sort suggestions by boost score (highest first) and then alphabetically
    suggestions.sort((a, b) => {
      const boostA = a.boost || 0;
      const boostB = b.boost || 0;
      if (boostA !== boostB) {
        return boostB - boostA;
      }
      return a.label.localeCompare(b.label);
    });
    
    // Early return if no suggestions
    if (suggestions.length === 0) return null;
    
    // Limit the suggestions to 15 for better performance
    suggestions = suggestions.slice(0, 15);

    return {
      from: word.from,
      to: word.to,
      options: suggestions.map(suggestion => ({
        label: suggestion.label,
        type: suggestion.type,
        info: suggestion.info,
        apply: suggestion.label
      }))
    };
  };
}

// Function to get the advanced sql completion
export async function getAdvancedSqlCompletion() {
  // Import the useSqlCompletion hook
  const { useSqlCompletion } = await import('@/app/hooks/useSqlCompletion');
  // Return the useSqlCompletion hook
  return useSqlCompletion;
}

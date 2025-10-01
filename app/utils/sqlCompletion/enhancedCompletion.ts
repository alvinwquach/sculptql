import { CompletionResult } from "@codemirror/autocomplete";
import { Parser } from "node-sql-parser";
import { TableColumn } from "@/app/types/query";

const parser = new Parser();

/**
 * Enhanced SQL completion that handles complex queries including UNION, CTEs, etc.
 */
export class EnhancedSQLCompletion {
  private tableNames: string[];
  private tableColumns: TableColumn;
  private stripQuotes: (s: string) => string;
  private needsQuotes: (id: string) => boolean;

  constructor(
    tableNames: string[],
    tableColumns: TableColumn,
    stripQuotes: (s: string) => string,
    needsQuotes: (id: string) => boolean
  ) {
    this.tableNames = tableNames;
    this.tableColumns = tableColumns;
    this.stripQuotes = stripQuotes;
    this.needsQuotes = needsQuotes;
  }

  /**
   * Get completion suggestions based on query context
   */
  getCompletion(
    docText: string,
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    try {
      // Fast context detection without parsing for better performance
      const textBeforeCursor = docText.slice(0, pos).trim();
      
      // Determine completion context quickly
      const context = this.getCompletionContext(textBeforeCursor);
      
      switch (context.type) {
        case 'select':
          return this.getSelectCompletion(currentWord, pos, word);
        case 'from':
          return this.getFromCompletion(currentWord, pos, word);
        case 'after_from':
          return this.getAfterFromCompletion(currentWord, pos, word);
        case 'where':
          return this.getWhereCompletion(currentWord, pos, word);
        case 'join':
          return this.getJoinCompletion(currentWord, pos, word);
        case 'union':
          return this.getUnionCompletion(currentWord, pos, word);
        case 'with':
          return this.getWithCompletion(currentWord, pos, word);
        case 'group_by':
          return this.getGroupByCompletion(currentWord, pos, word);
        case 'order_by':
          return this.getOrderByCompletion(currentWord, pos, word);
        case 'having':
          return this.getHavingCompletion(currentWord, pos, word);
        default:
          return this.getKeywordCompletion(currentWord, pos, word);
      }
    } catch (error) {
      console.warn('Enhanced completion failed, falling back to basic completion:', error);
      return this.getKeywordCompletion(currentWord, pos, word);
    }
  }

  /**
   * Parse query using node-sql-parser
   */
  private parseQuery(query: string): unknown {
    try {
      return parser.astify(query);
    } catch {
      return null;
    }
  }

  /**
   * Determine the completion context based on cursor position
   */
  private getCompletionContext(textBeforeCursor: string): { type: string; [key: string]: boolean | string } {
    
    // Check for CTE context
    if (/\bWITH\s+\w*\s*AS\s*\(\s*SELECT\b/i.test(textBeforeCursor)) {
      return { type: 'with', inCte: true };
    }
    
    // Check for UNION context
    if (/\bUNION\s+(?:ALL\s+)?\s*SELECT\b/i.test(textBeforeCursor)) {
      return { type: 'union', inUnion: true };
    }
    
    // Check for SELECT context
    if (/\bSELECT\s+(?:\w+\s*,?\s*)*\s*$/i.test(textBeforeCursor)) {
      return { type: 'select', inSelect: true };
    }
    
    // Check for FROM context
    if (/\bFROM\s+(\w+\s*,?\s*)*\s*$/i.test(textBeforeCursor)) {
      return { type: 'from', inFrom: true };
    }
    
    // Check for after FROM context - should show WHERE, GROUP BY, etc.
    if (/\bSELECT\s+.*\s+FROM\s+\w+\s*$/i.test(textBeforeCursor)) {
      return { type: 'after_from', inAfterFrom: true };
    }
    
    // Check for JOIN context
    if (/\b(?:INNER|LEFT|RIGHT|CROSS)\s+JOIN\s+\w*\s*$/i.test(textBeforeCursor)) {
      return { type: 'join', inJoin: true };
    }
    
    // Check for WHERE context
    if (/\bWHERE\s+.*\s*$/i.test(textBeforeCursor)) {
      return { type: 'where', inWhere: true };
    }
    
    // Check for GROUP BY context
    if (/\bGROUP\s+BY\s+.*\s*$/i.test(textBeforeCursor)) {
      return { type: 'group_by', inGroupBy: true };
    }
    
    // Check for HAVING context
    if (/\bHAVING\s+.*\s*$/i.test(textBeforeCursor)) {
      return { type: 'having', inHaving: true };
    }
    
    // Check for ORDER BY context
    if (/\bORDER\s+BY\s+.*\s*$/i.test(textBeforeCursor)) {
      return { type: 'order_by', inOrderBy: true };
    }
    
    return { type: 'keyword' };
  }

  /**
   * Get SELECT clause completion
   */
  private getSelectCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [];
    
    // Add aggregate functions
    const aggregateFunctions = [
      { label: 'COUNT(*)', apply: 'COUNT(*)', detail: 'Count all rows' },
      { label: 'SUM()', apply: 'SUM(', detail: 'Sum numeric values' },
      { label: 'AVG()', apply: 'AVG(', detail: 'Average numeric values' },
      { label: 'MIN()', apply: 'MIN(', detail: 'Minimum value' },
      { label: 'MAX()', apply: 'MAX(', detail: 'Maximum value' },
      { label: '*', apply: '*', detail: 'All columns' }
    ];
    
    options.push(...aggregateFunctions);
    
    // Add available columns
    const availableColumns = this.getAvailableColumns();
    options.push(...availableColumns.map(col => ({
      label: col,
      type: 'field',
      apply: this.needsQuotes(col) ? `"${col}"` : col,
      detail: 'Column'
    })));
    
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^[\w*"']*$/
    };
  }

  /**
   * Get FROM clause completion
   */
  private getFromCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const filteredTables = this.tableNames.filter(table =>
      currentWord ? this.stripQuotes(table).toLowerCase().startsWith(this.stripQuotes(currentWord).toLowerCase()) : true
    );

    return {
      from: word ? word.from : pos,
      options: filteredTables.map(table => ({
        label: table,
        type: 'table',
        apply: this.needsQuotes(table) ? `"${table}"` : table,
        detail: 'Table'
      })),
      filter: true,
      validFor: /^[\w"']*$/
    };
  }

  /**
   * Get completion after FROM clause - shows WHERE, GROUP BY, etc.
   */
  private getAfterFromCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [];
    
    // Add SQL keywords that can come after FROM
    const keywords = [
      { label: 'WHERE', apply: 'WHERE ', detail: 'Filter rows' },
      { label: 'GROUP BY', apply: 'GROUP BY ', detail: 'Group rows' },
      { label: 'HAVING', apply: 'HAVING ', detail: 'Filter groups' },
      { label: 'ORDER BY', apply: 'ORDER BY ', detail: 'Sort results' },
      { label: 'LIMIT', apply: 'LIMIT ', detail: 'Limit number of rows' },
      { label: 'JOIN', apply: 'JOIN ', detail: 'Join with another table' },
      { label: 'INNER JOIN', apply: 'INNER JOIN ', detail: 'Inner join' },
      { label: 'LEFT JOIN', apply: 'LEFT JOIN ', detail: 'Left join' },
      { label: 'RIGHT JOIN', apply: 'RIGHT JOIN ', detail: 'Right join' },
      { label: 'CROSS JOIN', apply: 'CROSS JOIN ', detail: 'Cross join' },
      { label: 'UNION', apply: 'UNION ', detail: 'Combine results' },
      { label: 'UNION ALL', apply: 'UNION ALL ', detail: 'Combine all results' }
    ];
    
    options.push(...keywords);
    
    return {
      from: word ? word.from : pos,
      options: options.map(opt => ({
        ...opt,
        type: 'keyword'
      })),
      filter: true,
      validFor: /^[\w\s]*$/
    };
  }

  /**
   * Get WHERE clause completion
   */
  private getWhereCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [];
    
    // Add operators
    const operators = [
      { label: '=', apply: '= ', detail: 'Equals' },
      { label: '!=', apply: '!= ', detail: 'Not equals' },
      { label: '>', apply: '> ', detail: 'Greater than' },
      { label: '<', apply: '< ', detail: 'Less than' },
      { label: '>=', apply: '>= ', detail: 'Greater than or equal' },
      { label: '<=', apply: '<= ', detail: 'Less than or equal' },
      { label: 'LIKE', apply: 'LIKE ', detail: 'Pattern matching' },
      { label: 'IN', apply: 'IN (', detail: 'Value in list' },
      { label: 'BETWEEN', apply: 'BETWEEN ', detail: 'Range of values' },
      { label: 'IS NULL', apply: 'IS NULL', detail: 'Check for null' },
      { label: 'IS NOT NULL', apply: 'IS NOT NULL', detail: 'Check for not null' }
    ];
    
    options.push(...operators);
    
    // Add logical operators
    const logicalOperators = [
      { label: 'AND', apply: 'AND ', detail: 'Logical AND' },
      { label: 'OR', apply: 'OR ', detail: 'Logical OR' }
    ];
    
    options.push(...logicalOperators);
    
    // Add available columns
    const availableColumns = this.getAvailableColumns();
    options.push(...availableColumns.map(col => ({
      label: col,
      type: 'field',
      apply: this.needsQuotes(col) ? `"${col}"` : col,
      detail: 'Column'
    })));
    
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^[\w"']*$/
    };
  }

  /**
   * Get JOIN clause completion
   */
  private getJoinCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [];
    
    // Add JOIN types
    const joinTypes = [
      { label: 'INNER JOIN', apply: 'INNER JOIN ', detail: 'Inner join' },
      { label: 'LEFT JOIN', apply: 'LEFT JOIN ', detail: 'Left outer join' },
      { label: 'RIGHT JOIN', apply: 'RIGHT JOIN ', detail: 'Right outer join' },
      { label: 'CROSS JOIN', apply: 'CROSS JOIN ', detail: 'Cross join' }
    ];
    
    options.push(...joinTypes);
    
    // Add available tables
    const filteredTables = this.tableNames.filter(table =>
      currentWord ? this.stripQuotes(table).toLowerCase().startsWith(this.stripQuotes(currentWord).toLowerCase()) : true
    );
    
    options.push(...filteredTables.map(table => ({
      label: table,
      type: 'table',
      apply: this.needsQuotes(table) ? `"${table}"` : table,
      detail: 'Table'
    })));
    
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^[\w"']*$/
    };
  }

  /**
   * Get UNION clause completion
   */
  private getUnionCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [
      { label: 'UNION', apply: 'UNION ', detail: 'Union (removes duplicates)' },
      { label: 'UNION ALL', apply: 'UNION ALL ', detail: 'Union all (keeps duplicates)' }
    ];
    
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^UNION$/
    };
  }

  /**
   * Get WITH clause completion
   */
  private getWithCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [
      { label: 'WITH', apply: 'WITH ', detail: 'Common Table Expression' },
      { label: 'WITH RECURSIVE', apply: 'WITH RECURSIVE ', detail: 'Recursive CTE' }
    ];
    
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^WITH$/
    };
  }

  /**
   * Get GROUP BY clause completion
   */
  private getGroupByCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const availableColumns = this.getAvailableColumns();

    return {
      from: word ? word.from : pos,
      options: availableColumns.map(col => ({
        label: col,
        type: 'field',
        apply: this.needsQuotes(col) ? `"${col}"` : col,
        detail: 'Group by column'
      })),
      filter: true,
      validFor: /^[\w"']*$/
    };
  }

  /**
   * Get HAVING clause completion
   */
  private getHavingCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [];
    
    // Add aggregate functions for HAVING
    const aggregateFunctions = [
      { label: 'COUNT(*)', apply: 'COUNT(*)', detail: 'Count all rows' },
      { label: 'SUM()', apply: 'SUM(', detail: 'Sum numeric values' },
      { label: 'AVG()', apply: 'AVG(', detail: 'Average numeric values' },
      { label: 'MIN()', apply: 'MIN(', detail: 'Minimum value' },
      { label: 'MAX()', apply: 'MAX(', detail: 'Maximum value' }
    ];
    
    options.push(...aggregateFunctions);
    
    // Add operators
    const operators = [
      { label: '>', apply: '> ', detail: 'Greater than' },
      { label: '<', apply: '< ', detail: 'Less than' },
      { label: '>=', apply: '>= ', detail: 'Greater than or equal' },
      { label: '<=', apply: '<= ', detail: 'Less than or equal' },
      { label: '=', apply: '= ', detail: 'Equals' },
      { label: '!=', apply: '!= ', detail: 'Not equals' }
    ];
    
    options.push(...operators);
    
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^[\w"']*$/
    };
  }

  /**
   * Get ORDER BY clause completion
   */
  private getOrderByCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    const options = [];
    
    // Add direction keywords
    const directions = [
      { label: 'ASC', apply: 'ASC', detail: 'Ascending order' },
      { label: 'DESC', apply: 'DESC', detail: 'Descending order' }
    ];
    
    options.push(...directions);
    
    // Add available columns
    const availableColumns = this.getAvailableColumns();
    options.push(...availableColumns.map(col => ({
      label: col,
      type: 'field',
      apply: this.needsQuotes(col) ? `"${col}"` : col,
      detail: 'Order by column'
    })));
    
    return {
      from: word ? word.from : pos,
      options,
      filter: true,
      validFor: /^[\w"']*$/
    };
  }

  /**
   * Get keyword completion - enhanced with all valid SQL starting keywords
   */
  private getKeywordCompletion(
    currentWord: string,
    pos: number,
    word: { from: number } | null
  ): CompletionResult | null {
    // Check if we're at the start of a query (beginning of line or after semicolon)
    const isQueryStart = pos === 0 || /\s*;\s*$/.test(this.getTextBeforeCursor(pos));
    
    const keywords = [
      // Query starting keywords
      { label: 'SELECT', apply: 'SELECT ', detail: 'Select data from tables' },
      { label: 'WITH', apply: 'WITH ', detail: 'Common Table Expression (CTE)' },
      { label: 'VALUES', apply: 'VALUES ', detail: 'Query literal rows of data' },
      { label: 'TABLE', apply: 'TABLE ', detail: 'Query table directly (PostgreSQL)' },
      
      // Query continuation keywords
      { label: 'FROM', apply: 'FROM ', detail: 'Specify source table' },
      { label: 'WHERE', apply: 'WHERE ', detail: 'Filter rows' },
      { label: 'GROUP BY', apply: 'GROUP BY ', detail: 'Group rows' },
      { label: 'HAVING', apply: 'HAVING ', detail: 'Filter groups' },
      { label: 'ORDER BY', apply: 'ORDER BY ', detail: 'Sort results' },
      { label: 'LIMIT', apply: 'LIMIT ', detail: 'Limit number of results' },
      { label: 'OFFSET', apply: 'OFFSET ', detail: 'Skip number of rows' },
      
      // Set operations
      { label: 'UNION', apply: 'UNION ', detail: 'Combine results (removes duplicates)' },
      { label: 'UNION ALL', apply: 'UNION ALL ', detail: 'Combine all results (keeps duplicates)' },
      { label: 'INTERSECT', apply: 'INTERSECT ', detail: 'Intersection of results' },
      { label: 'EXCEPT', apply: 'EXCEPT ', detail: 'Difference of results' },
      
      // Join operations
      { label: 'INNER JOIN', apply: 'INNER JOIN ', detail: 'Inner join tables' },
      { label: 'LEFT JOIN', apply: 'LEFT JOIN ', detail: 'Left outer join tables' },
      { label: 'LEFT OUTER JOIN', apply: 'LEFT OUTER JOIN ', detail: 'Left outer join tables' },
      { label: 'RIGHT JOIN', apply: 'RIGHT JOIN ', detail: 'Right outer join tables' },
      { label: 'RIGHT OUTER JOIN', apply: 'RIGHT OUTER JOIN ', detail: 'Right outer join tables' },
      { label: 'FULL JOIN', apply: 'FULL JOIN ', detail: 'Full outer join tables' },
      { label: 'FULL OUTER JOIN', apply: 'FULL OUTER JOIN ', detail: 'Full outer join tables' },
      { label: 'CROSS JOIN', apply: 'CROSS JOIN ', detail: 'Cross join tables' },
      
      // Modifiers
      { label: 'DISTINCT', apply: 'DISTINCT ', detail: 'Remove duplicate rows' },
      { label: 'ALL', apply: 'ALL ', detail: 'Include all rows' },
      
      // Functions
      { label: 'COUNT', apply: 'COUNT(', detail: 'Count rows or non-null values' },
      { label: 'SUM', apply: 'SUM(', detail: 'Sum numeric values' },
      { label: 'AVG', apply: 'AVG(', detail: 'Average numeric values' },
      { label: 'MIN', apply: 'MIN(', detail: 'Minimum value' },
      { label: 'MAX', apply: 'MAX(', detail: 'Maximum value' },
      { label: 'CASE', apply: 'CASE ', detail: 'Conditional expression' },
    ];

    // Filter keywords based on context
    let filteredKeywords = keywords;
    
    if (isQueryStart) {
      // At query start, only show query starting keywords
      filteredKeywords = keywords.filter(kw => 
        ['SELECT', 'WITH', 'VALUES', 'TABLE'].includes(kw.label)
      );
    }

    // Further filter based on current word
    filteredKeywords = filteredKeywords.filter(kw =>
      currentWord ? kw.label.toLowerCase().startsWith(currentWord.toLowerCase()) : true
    );

    return {
      from: word ? word.from : pos,
      options: filteredKeywords,
      filter: true,
      validFor: /^[A-Z\s]*$/i
    };
  }

  /**
   * Get text before cursor position for context analysis
   */
  private getTextBeforeCursor(): string {
    // This would need to be passed from the completion context
    // For now, return empty string - this should be enhanced
    return '';
  }

  /**
   * Get available columns based on context
   */
  private getAvailableColumns(): string[] {
    const columns = [];
    
    // Add columns from all tables for now
    // In a more sophisticated implementation, you'd determine which tables are in scope
    for (const tableName of this.tableNames) {
      if (this.tableColumns[tableName]) {
        columns.push(...this.tableColumns[tableName]);
      }
    }
    
    return [...new Set(columns)]; // Remove duplicates
  }
}

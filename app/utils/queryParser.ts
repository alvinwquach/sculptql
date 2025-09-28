import { SelectOption } from "@/app/types/query";
import { Parser } from "node-sql-parser";

// Create a parser instance for more robust SQL parsing
const parser = new Parser();

/**
 * Enhanced SQL parser that handles complex queries including UNION, CTEs, etc.
 */
export class EnhancedQueryParser {
  private static instance: EnhancedQueryParser;
  
  static getInstance(): EnhancedQueryParser {
    if (!this.instance) {
      this.instance = new EnhancedQueryParser();
    }
    return this.instance;
  }

  /**
   * Parse the SELECT clause from a SQL query and extract the selected columns
   * Handles complex queries including UNION, CTEs, subqueries
   */
  parseSelectedColumns(query: string): SelectOption[] {
    if (!query || !query.trim()) {
      return [];
    }

    try {
      // Try to parse with the SQL parser first for complex queries
      const ast = this.parseQuery(query);
      if (ast) {
        return this.extractColumnsFromAST(ast);
      }
    } catch (error) {
      console.warn('AST parsing failed, falling back to regex:', error);
    }

    // Fallback to regex parsing for simple queries
    return this.parseSelectedColumnsRegex(query);
  }

  /**
   * Parse query using node-sql-parser
   */
  private parseQuery(query: string): any {
    try {
      return parser.astify(query);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract columns from AST (handles complex queries)
   */
  private extractColumnsFromAST(ast: any): SelectOption[] {
    const columns: SelectOption[] = [];
    
    // Handle different AST structures
    const processColumns = (columnList: any[]) => {
      for (const col of columnList) {
        if (col.type === 'column_ref') {
          const columnName = col.table ? `${col.table}.${col.column}` : col.column;
          columns.push({
            value: columnName,
            label: columnName,
            targetColumn: col.column,
          });
        } else if (col.type === 'function') {
          const funcName = col.name?.toUpperCase();
          const isAggregate = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'].includes(funcName);
          
          if (col.args && col.args.expr) {
            const arg = col.args.expr;
            const targetColumn = arg.type === 'column_ref' ? arg.column : '';
            
            columns.push({
              value: col.name,
              label: col.name,
              isAggregate,
              targetColumn,
            });
          } else {
            columns.push({
              value: col.name,
              label: col.name,
              isAggregate,
            });
          }
        } else if (col.type === 'select') {
          // Handle subqueries
          const subQueryColumns = this.extractColumnsFromAST(col);
          columns.push(...subQueryColumns);
        }
      }
    };

    // Handle main query
    if (ast.columns) {
      processColumns(ast.columns);
    }

    // Handle UNION queries
    if (ast._next) {
      const unionColumns = this.extractColumnsFromAST(ast._next);
      return unionColumns; // UNION queries should have same column structure
    }

    // Handle CTEs
    if (ast.with) {
      for (const cte of ast.with) {
        if (cte.stmt && cte.stmt.columns) {
          processColumns(cte.stmt.columns);
        }
      }
    }

    return columns;
  }

  /**
   * Fallback regex-based parsing for simple queries
   */
  private parseSelectedColumnsRegex(query: string): SelectOption[] {
    try {
      // Extract the SELECT clause
      const selectMatch = query.match(/^SELECT\s+(DISTINCT\s+)?(.+?)(?=\s+FROM|\s*$)/i);
      if (!selectMatch) {
        return [];
      }

      const selectClause = selectMatch[2].trim();
      
      // Handle SELECT * case
      if (selectClause === '*') {
        return [{ value: "*", label: "All Columns (*)" }];
      }

      // Split by comma and parse each column
      const columns: SelectOption[] = [];
      const columnParts = selectClause.split(',').map(part => part.trim());

      for (const part of columnParts) {
        if (!part) continue;

        // Handle aggregate functions
        const aggregateMatch = part.match(/^(\w+)\s*\(\s*([^)]+)\s*\)$/i);
        if (aggregateMatch) {
          const [, func, column] = aggregateMatch;
          const isAggregate = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'].includes(func.toUpperCase());
          
          columns.push({
            value: part,
            label: part,
            isAggregate,
            targetColumn: column.replace(/['"]/g, ''),
          });
          continue;
        }

        // Handle ROUND functions
        const roundMatch = part.match(/^ROUND\s*\(\s*([^,)]+)(?:,\s*(\d+))?\s*\)$/i);
        if (roundMatch) {
          const [, innerExpr, precision] = roundMatch;
          const innerAggregate = innerExpr.match(/^(\w+)\s*\(\s*([^)]+)\s*\)$/i);
          
          if (innerAggregate) {
            const [, func, column] = innerAggregate;
            columns.push({
              value: part,
              label: part,
              isAggregate: true,
              targetColumn: column.replace(/['"]/g, ''),
            });
          } else {
            // Simple ROUND function
            columns.push({
              value: part,
              label: part,
              targetColumn: innerExpr.replace(/['"]/g, ''),
            });
          }
          continue;
        }

        // Handle aliased columns (e.g., "column AS alias" or "column alias")
        const aliasMatch = part.match(/^(.+?)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)$/i);
        if (aliasMatch) {
          const [, column, alias] = aliasMatch;
          const cleanColumn = column.replace(/['"]/g, '').trim();
          columns.push({
            value: part,
            label: `${cleanColumn} AS ${alias}`,
            targetColumn: cleanColumn,
          });
          continue;
        }

        // Handle simple column names
        const cleanColumn = part.replace(/['"]/g, '').trim();
        columns.push({
          value: cleanColumn,
          label: cleanColumn,
          targetColumn: cleanColumn,
        });
      }

      return columns;
    } catch (error) {
      console.error('Error parsing selected columns:', error);
      return [];
    }
  }

  /**
   * Parse the FROM clause from a SQL query and extract the table name
   * Handles complex queries including JOINs, CTEs, subqueries
   */
  parseSelectedTable(query: string): SelectOption | null {
    if (!query || !query.trim()) {
      return null;
    }

    try {
      // Try to parse with the SQL parser first
      const ast = this.parseQuery(query);
      if (ast) {
        return this.extractTableFromAST(ast);
      }
    } catch (error) {
      console.warn('AST parsing failed for table, falling back to regex:', error);
    }

    // Fallback to regex parsing
    return this.parseSelectedTableRegex(query);
  }

  /**
   * Extract table from AST
   */
  private extractTableFromAST(ast: any): SelectOption | null {
    if (ast.from) {
      if (Array.isArray(ast.from)) {
        // Handle multiple tables (JOINs)
        const firstTable = ast.from[0];
        if (firstTable.table) {
          return {
            value: firstTable.table,
            label: firstTable.table,
          };
        }
      } else if (ast.from.table) {
        return {
          value: ast.from.table,
          label: ast.from.table,
        };
      }
    }

    // Handle CTEs
    if (ast.with && ast.with.length > 0) {
      // For CTEs, we might want to return the first CTE name or main table
      return null; // CTE handling is complex, skip for now
    }

    return null;
  }

  /**
   * Fallback regex-based table parsing
   */
  private parseSelectedTableRegex(query: string): SelectOption | null {
    try {
      const fromMatch = query.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
      if (fromMatch) {
        const tableName = fromMatch[1];
        return {
          value: tableName,
          label: tableName,
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing selected table:', error);
      return null;
    }
  }

  /**
   * Parse the WHERE clause from a SQL query and extract the conditions
   * Enhanced to handle complex conditions
   */
  parseWhereClause(query: string) {
    if (!query || !query.trim()) {
      return { conditions: [{ column: null, operator: null, value: null, value2: null }] };
    }

    try {
      // Try to parse with the SQL parser first
      const ast = this.parseQuery(query);
      if (ast) {
        return this.extractWhereFromAST(ast);
      }
    } catch (error) {
      console.warn('AST parsing failed for WHERE, falling back to regex:', error);
    }

    // Fallback to regex parsing
    return this.parseWhereClauseRegex(query);
  }

  /**
   * Extract WHERE clause from AST
   */
  private extractWhereFromAST(ast: any) {
    const conditions = [];
    
    if (ast.where) {
      const whereConditions = this.processWhereExpression(ast.where);
      conditions.push(...whereConditions);
    }

    if (conditions.length === 0) {
      conditions.push({ column: null, operator: null, value: null, value2: null });
    }

    return { conditions };
  }

  /**
   * Process WHERE expression recursively
   */
  private processWhereExpression(expr: any): any[] {
    const conditions = [];

    if (expr.type === 'binary_expr') {
      if (expr.operator === 'AND' || expr.operator === 'OR') {
        const leftConditions = this.processWhereExpression(expr.left);
        const rightConditions = this.processWhereExpression(expr.right);
        
        // Add logical operator to right conditions
        rightConditions.forEach((cond, index) => {
          if (index === 0 && leftConditions.length > 0) {
            cond.logicalOperator = { value: expr.operator, label: expr.operator };
          }
        });
        
        conditions.push(...leftConditions, ...rightConditions);
      } else {
        // Simple binary expression
        const column = expr.left.type === 'column_ref' ? expr.left.column : null;
        const value = expr.right.type === 'string' || expr.right.type === 'number' ? 
          expr.right.value : null;
        
        conditions.push({
          column: column ? { value: column, label: column } : null,
          operator: { value: expr.operator, label: expr.operator },
          value: value ? { value: value, label: value } : null,
          value2: null,
        });
      }
    }

    return conditions;
  }

  /**
   * Fallback regex-based WHERE parsing
   */
  private parseWhereClauseRegex(query: string) {
    try {
      const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+HAVING|\s+LIMIT|\s*$)/i);
      if (!whereMatch) {
        return { conditions: [{ column: null, operator: null, value: null, value2: null }] };
      }

      const whereClause = whereMatch[1].trim();
      
      // Simple parsing for basic WHERE conditions
      const conditions = [];
      const parts = whereClause.split(/\s+(?:AND|OR)\s+/i);
      
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart) {
          // Try to parse basic condition patterns
          const conditionMatch = trimmedPart.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*([=!<>]+|LIKE|IN|BETWEEN|IS\s+(?:NOT\s+)?NULL)\s*(.+)?$/i);
          if (conditionMatch) {
            const [, column, operator, value] = conditionMatch;
            conditions.push({
              column: { value: column, label: column },
              operator: { value: operator, label: operator },
              value: value ? { value: value, label: value } : null,
              value2: null,
            });
          } else {
            conditions.push({
              column: null,
              operator: null,
              value: null,
              value2: null,
            });
          }
        }
      }

      if (conditions.length === 0) {
        conditions.push({ column: null, operator: null, value: null, value2: null });
      }

      return { conditions };
    } catch (error) {
      console.error('Error parsing WHERE clause:', error);
      return { conditions: [{ column: null, operator: null, value: null, value2: null }] };
    }
  }
}

// Export singleton instance
const queryParser = EnhancedQueryParser.getInstance();

// Export the original functions for backward compatibility
export function parseSelectedColumns(query: string): SelectOption[] {
  return queryParser.parseSelectedColumns(query);
}

export function parseSelectedTable(query: string): SelectOption | null {
  return queryParser.parseSelectedTable(query);
}

export function parseWhereClause(query: string) {
  return queryParser.parseWhereClause(query);
}

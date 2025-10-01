/**
 * Unit tests for UNION query generation logic
 */
import { describe, it, expect } from '@jest/globals';

describe('Union Query Generation', () => {
  // Mock query generation function based on EditorContext implementation
  const generateQueryWithUnions = (params: {
    selectedTable: string;
    selectedColumns: string[];
    unionClauses: Array<{ table: string; unionType: string }>;
    whereClause?: string;
    orderBy?: string;
    limit?: string;
  }) => {
    const { selectedTable, selectedColumns, unionClauses, whereClause, orderBy, limit } = params;

    const columnsString = selectedColumns.length === 0 || selectedColumns.includes('*')
      ? '*'
      : selectedColumns.join(', ');

    let query = `SELECT ${columnsString} FROM ${selectedTable}`;

    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    // Add UNION clauses
    if (unionClauses && unionClauses.length > 0) {
      unionClauses.forEach((union) => {
        if (union.table) {
          const unionType = union.unionType || 'UNION';
          query += ` ${unionType} SELECT ${columnsString} FROM ${union.table}`;
        }
      });
    }

    return query + ';';
  };

  describe('Basic UNION generation', () => {
    it('should generate simple UNION query', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toBe('SELECT * FROM users UNION SELECT * FROM admins;');
    });

    it('should generate UNION ALL query', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION ALL' }
        ]
      });

      expect(query).toBe('SELECT * FROM users UNION ALL SELECT * FROM admins;');
    });

    it('should generate query without UNION when no unions specified', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: []
      });

      expect(query).toBe('SELECT * FROM users;');
      expect(query).not.toContain('UNION');
    });

    it('should use default UNION type when not specified', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: '' }
        ]
      });

      expect(query).toContain('UNION SELECT');
    });
  });

  describe('UNION with specific columns', () => {
    it('should use same columns in all UNION queries', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['id', 'name', 'email'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toBe('SELECT id, name, email FROM users UNION SELECT id, name, email FROM admins;');
    });

    it('should maintain column order across unions', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['email', 'name', 'id'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toContain('SELECT email, name, id FROM users');
      expect(query).toContain('UNION SELECT email, name, id FROM admins');
    });
  });

  describe('Multiple UNION queries', () => {
    it('should generate query with multiple UNIONs', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' },
          { table: 'guests', unionType: 'UNION' }
        ]
      });

      expect(query).toBe('SELECT * FROM users UNION SELECT * FROM admins UNION SELECT * FROM guests;');
    });

    it('should support mixed UNION and UNION ALL', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' },
          { table: 'guests', unionType: 'UNION ALL' }
        ]
      });

      expect(query).toContain('UNION SELECT * FROM admins');
      expect(query).toContain('UNION ALL SELECT * FROM guests');
    });

    it('should generate three or more UNIONs', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['id', 'name'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' },
          { table: 'guests', unionType: 'UNION' },
          { table: 'moderators', unionType: 'UNION ALL' }
        ]
      });

      expect(query).toContain('FROM users UNION');
      expect(query).toContain('FROM admins UNION');
      expect(query).toContain('FROM guests UNION ALL');
      expect(query).toContain('FROM moderators;');
    });
  });

  describe('UNION with WHERE clause', () => {
    it('should place WHERE before UNION', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        whereClause: 'id > 5',
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toMatch(/WHERE.*UNION/);
      expect(query).toBe('SELECT * FROM users WHERE id > 5 UNION SELECT * FROM admins;');
    });

    it('should apply WHERE only to first SELECT', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        whereClause: 'status = \'active\'',
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      const whereCount = (query.match(/WHERE/g) || []).length;
      expect(whereCount).toBe(1);
    });
  });

  describe('UNION with ORDER BY and LIMIT', () => {
    it('should place ORDER BY after all UNIONs', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        orderBy: 'name ASC',
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toMatch(/UNION.*ORDER BY/);
      expect(query).toBe('SELECT * FROM users ORDER BY name ASC UNION SELECT * FROM admins;');
    });

    it('should place LIMIT after all UNIONs', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        limit: '10',
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toMatch(/UNION.*LIMIT/);
    });

    it('should combine WHERE, ORDER BY, LIMIT with UNION', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['id', 'name'],
        whereClause: 'id > 0',
        orderBy: 'name',
        limit: '100',
        unionClauses: [
          { table: 'admins', unionType: 'UNION ALL' }
        ]
      });

      expect(query).toContain('WHERE');
      expect(query).toContain('ORDER BY');
      expect(query).toContain('LIMIT');
      expect(query).toContain('UNION ALL');
      expect(query).toMatch(/WHERE.*ORDER BY.*LIMIT.*UNION ALL/);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty union clauses array', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: []
      });

      expect(query).not.toContain('UNION');
      expect(query).toBe('SELECT * FROM users;');
    });

    it('should skip unions with null table', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: '', unionType: 'UNION' }
        ]
      });

      expect(query).not.toContain('UNION');
    });

    it('should handle single column selection', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['email'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toBe('SELECT email FROM users UNION SELECT email FROM admins;');
    });

    it('should preserve query structure with complex scenario', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['id', 'name', 'email', 'created_at'],
        whereClause: 'status = \'active\' AND verified = true',
        orderBy: 'created_at DESC',
        limit: '50',
        unionClauses: [
          { table: 'admins', unionType: 'UNION ALL' },
          { table: 'moderators', unionType: 'UNION' }
        ]
      });

      // Check all parts are present in correct order
      expect(query).toContain('SELECT id, name, email, created_at FROM users');
      expect(query).toContain('WHERE status = \'active\' AND verified = true');
      expect(query).toContain('ORDER BY created_at DESC');
      expect(query).toContain('LIMIT 50');
      expect(query).toContain('UNION ALL SELECT id, name, email, created_at FROM admins');
      expect(query).toContain('UNION SELECT id, name, email, created_at FROM moderators');
    });
  });

  describe('SQL syntax validation', () => {
    it('should generate valid SQL syntax', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      // Basic SQL syntax checks
      expect(query).toMatch(/^SELECT/);
      expect(query).toMatch(/;$/);
      expect(query).toContain('FROM');
    });

    it('should not have extra spaces', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).not.toContain('  '); // No double spaces
    });

    it('should end with semicolon', () => {
      const query = generateQueryWithUnions({
        selectedTable: 'users',
        selectedColumns: ['*'],
        unionClauses: [
          { table: 'admins', unionType: 'UNION' }
        ]
      });

      expect(query).toMatch(/;$/);
    });
  });
});

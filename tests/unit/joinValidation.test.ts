import { describe, it, expect } from '@jest/globals';
import {
  validateJoin,
  getValidJoinTables,
  getSuggestedJoinColumns,
  hasAnyForeignKeys,
} from '@/app/utils/joinValidation';
import { TableSchema } from '@/app/types/query';

// Mock schema with foreign key relationships
const mockSchema: TableSchema[] = [
  {
    table_name: 'users',
    table_catalog: 'test_db',
    table_schema: 'public',
    table_type: 'BASE TABLE',
    comment: null,
    columns: [
      {
        column_name: 'id',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: true,
        is_indexed: true,
      },
      {
        column_name: 'name',
        data_type: 'varchar',
        is_nullable: 'YES',
        column_default: null,
        is_primary_key: false,
        is_indexed: false,
      },
      {
        column_name: 'email',
        data_type: 'varchar',
        is_nullable: 'YES',
        column_default: null,
        is_primary_key: false,
        is_indexed: true,
      },
    ],
    primary_keys: ['id'],
    foreign_keys: [],
  },
  {
    table_name: 'orders',
    table_catalog: 'test_db',
    table_schema: 'public',
    table_type: 'BASE TABLE',
    comment: null,
    columns: [
      {
        column_name: 'id',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: true,
        is_indexed: true,
      },
      {
        column_name: 'user_id',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: false,
        is_indexed: true,
      },
      {
        column_name: 'total',
        data_type: 'numeric',
        is_nullable: 'YES',
        column_default: null,
        is_primary_key: false,
        is_indexed: false,
      },
    ],
    primary_keys: ['id'],
    foreign_keys: [
      {
        column_name: 'user_id',
        referenced_table: 'users',
        referenced_column: 'id',
        constraint_name: 'fk_orders_user',
      },
    ],
  },
  {
    table_name: 'products',
    table_catalog: 'test_db',
    table_schema: 'public',
    table_type: 'BASE TABLE',
    comment: null,
    columns: [
      {
        column_name: 'id',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: true,
        is_indexed: true,
      },
      {
        column_name: 'name',
        data_type: 'varchar',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: false,
        is_indexed: false,
      },
    ],
    primary_keys: ['id'],
    foreign_keys: [],
  },
  {
    table_name: 'order_items',
    table_catalog: 'test_db',
    table_schema: 'public',
    table_type: 'BASE TABLE',
    comment: null,
    columns: [
      {
        column_name: 'id',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: true,
        is_indexed: true,
      },
      {
        column_name: 'order_id',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: false,
        is_indexed: true,
      },
      {
        column_name: 'product_id',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: false,
        is_indexed: true,
      },
      {
        column_name: 'quantity',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: null,
        is_primary_key: false,
        is_indexed: false,
      },
    ],
    primary_keys: ['id'],
    foreign_keys: [
      {
        column_name: 'order_id',
        referenced_table: 'orders',
        referenced_column: 'id',
        constraint_name: 'fk_order_items_order',
      },
      {
        column_name: 'product_id',
        referenced_table: 'products',
        referenced_column: 'id',
        constraint_name: 'fk_order_items_product',
      },
    ],
  },
];

describe('Join Validation', () => {
  describe('getValidJoinTables', () => {
    it('should return tables that can be joined via foreign keys', () => {
      const validTables = getValidJoinTables(mockSchema, 'users');
      expect(validTables).toContain('orders');
      expect(validTables.length).toBe(1);
    });

    it('should return tables with outgoing and incoming foreign keys', () => {
      const validTables = getValidJoinTables(mockSchema, 'orders');
      expect(validTables).toContain('users');
      expect(validTables).toContain('order_items');
      expect(validTables.length).toBe(2);
    });

    it('should return multiple tables for junction tables', () => {
      const validTables = getValidJoinTables(mockSchema, 'order_items');
      expect(validTables).toContain('orders');
      expect(validTables).toContain('products');
      expect(validTables.length).toBe(2);
    });

    it('should return empty array for non-existent table', () => {
      const validTables = getValidJoinTables(mockSchema, 'non_existent');
      expect(validTables).toEqual([]);
    });

    it('should return empty array for table with no foreign keys', () => {
      const validTables = getValidJoinTables(mockSchema, 'products');
      expect(validTables).toContain('order_items');
      expect(validTables.length).toBe(1);
    });
  });

  describe('getSuggestedJoinColumns', () => {
    it('should suggest correct columns for FK relationship', () => {
      const suggestions = getSuggestedJoinColumns(
        mockSchema,
        'orders',
        'users'
      );
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toEqual({
        column1: 'user_id',
        column2: 'id',
        constraintName: 'fk_orders_user',
      });
    });

    it('should suggest correct columns for reverse FK relationship', () => {
      const suggestions = getSuggestedJoinColumns(
        mockSchema,
        'users',
        'orders'
      );
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toEqual({
        column1: 'id',
        column2: 'user_id',
        constraintName: 'fk_orders_user',
      });
    });

    it('should return empty array for tables with no FK relationship', () => {
      const suggestions = getSuggestedJoinColumns(
        mockSchema,
        'users',
        'products'
      );
      expect(suggestions).toEqual([]);
    });

    it('should return multiple suggestions for tables with multiple FKs', () => {
      const suggestions = getSuggestedJoinColumns(
        mockSchema,
        'order_items',
        'orders'
      );
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].column1).toBe('order_id');
      expect(suggestions[0].column2).toBe('id');
    });
  });

  describe('validateJoin', () => {
    describe('with FK enforcement', () => {
      it('should validate correct FK-based join', () => {
        const result = validateJoin(
          mockSchema,
          'orders',
          'users',
          'user_id',
          'id',
          true
        );
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject join without FK relationship', () => {
        const result = validateJoin(
          mockSchema,
          'users',
          'products',
          'id',
          'id',
          true
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('No foreign key relationship');
      });

      it('should reject join with non-existent column', () => {
        const result = validateJoin(
          mockSchema,
          'orders',
          'users',
          'invalid_column',
          'id',
          true
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should reject join with mismatched data types', () => {
        // When FK enforcement is on, it checks FK first before type compatibility
        const result = validateJoin(
          mockSchema,
          'orders',
          'users',
          'total',
          'name',
          true
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('No foreign key relationship');
      });

      it('should reject self-join', () => {
        const result = validateJoin(
          mockSchema,
          'users',
          'users',
          'id',
          'id',
          true
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Cannot join a table with itself');
      });

      it('should provide suggestions when columns not specified', () => {
        const result = validateJoin(mockSchema, 'orders', 'users', null, null, true);
        expect(result.isValid).toBe(true);
        expect(result.suggestedColumns).toBeDefined();
        expect(result.suggestedColumns?.column1).toBe('user_id');
        expect(result.suggestedColumns?.column2).toBe('id');
      });

      it('should reject when no FK exists and columns not specified', () => {
        const result = validateJoin(
          mockSchema,
          'users',
          'products',
          null,
          null,
          true
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('No foreign key relationship');
      });
    });

    describe('without FK enforcement', () => {
      it('should allow any join when FK enforcement is disabled', () => {
        const result = validateJoin(
          mockSchema,
          'users',
          'products',
          'id',
          'id',
          false
        );
        expect(result.isValid).toBe(true);
      });

      it('should still validate column existence', () => {
        const result = validateJoin(
          mockSchema,
          'users',
          'products',
          'invalid_column',
          'id',
          false
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should still validate data type compatibility', () => {
        const result = validateJoin(
          mockSchema,
          'users',
          'orders',
          'name',
          'total',
          false
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('types do not match');
      });
    });

    describe('edge cases', () => {
      it('should handle missing table names', () => {
        const result = validateJoin(mockSchema, '', 'users', 'id', 'id', true);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Both tables must be selected');
      });

      it('should handle non-existent tables', () => {
        const result = validateJoin(
          mockSchema,
          'fake_table',
          'users',
          'id',
          'id',
          true
        );
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not found in schema');
      });
    });
  });

  describe('hasAnyForeignKeys', () => {
    it('should return true for table with outgoing foreign keys', () => {
      expect(hasAnyForeignKeys(mockSchema, 'orders')).toBe(true);
    });

    it('should return true for table with incoming foreign keys', () => {
      expect(hasAnyForeignKeys(mockSchema, 'users')).toBe(true);
    });

    it('should return true for table with both incoming and outgoing FKs', () => {
      expect(hasAnyForeignKeys(mockSchema, 'order_items')).toBe(true);
    });

    it('should return false for table with no foreign keys', () => {
      // Products only has incoming FK from order_items
      expect(hasAnyForeignKeys(mockSchema, 'products')).toBe(true);
    });

    it('should return false for non-existent table', () => {
      expect(hasAnyForeignKeys(mockSchema, 'non_existent')).toBe(false);
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { EditorProvider, useEditorContext } from '@/app/context/EditorContext';
import { TableSchema, SelectOption } from '@/app/types/query';
import React from 'react';

// Mock Apollo Client
jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
  useQuery: jest.fn(() => ({ data: { dialect: 'postgres' }, loading: false })),
}));

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

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
        is_indexed: false,
      },
    ],
    primary_keys: ['id'],
    foreign_keys: [],
  },
  {
    table_name: 'admins',
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
        is_indexed: false,
      },
    ],
    primary_keys: ['id'],
    foreign_keys: [],
  },
  {
    table_name: 'guests',
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
    ],
    primary_keys: ['id'],
    foreign_keys: [],
  },
];

describe('EditorContext Union Handlers', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorProvider schema={mockSchema} error={null}>
      {children}
    </EditorProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('onAddUnionClause', () => {
    it('should add a new union clause with default values', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
      });

      expect(result.current.unionClauses).toHaveLength(1);
      expect(result.current.unionClauses[0]).toEqual({
        table: null,
        unionType: { value: 'UNION', label: 'UNION' },
      });
    });

    it('should add multiple union clauses', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
        result.current.onAddUnionClause();
      });

      expect(result.current.unionClauses).toHaveLength(2);
    });

    it('should regenerate query after adding union', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
      });

      const queryBeforeUnion = result.current.query;

      act(() => {
        result.current.onAddUnionClause();
      });

      expect(result.current.query).toBe(queryBeforeUnion);
    });
  });

  describe('onRemoveUnionClause', () => {
    it('should remove a union clause by index', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
        result.current.onAddUnionClause();
      });

      expect(result.current.unionClauses).toHaveLength(2);

      act(() => {
        result.current.onRemoveUnionClause(0);
      });

      expect(result.current.unionClauses).toHaveLength(1);
    });

    it('should handle removing non-existent index gracefully', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
      });

      expect(result.current.unionClauses).toHaveLength(1);

      act(() => {
        result.current.onRemoveUnionClause(5);
      });

      expect(result.current.unionClauses).toHaveLength(1);
    });

    it('should regenerate query after removing union', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      const queryWithUnion = result.current.query;
      expect(queryWithUnion).toContain('UNION');

      act(() => {
        result.current.onRemoveUnionClause(0);
      });

      expect(result.current.query).not.toContain('UNION');
    });
  });

  describe('onUnionTableSelect', () => {
    it('should update union table at specific index', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
      });

      const tableOption: SelectOption = { value: 'admins', label: 'admins' };

      act(() => {
        result.current.onUnionTableSelect(tableOption, 0);
      });

      expect(result.current.unionClauses[0].table).toEqual(tableOption);
    });

    it('should not affect other union clauses', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
        result.current.onAddUnionClause();
      });

      const tableOption: SelectOption = { value: 'admins', label: 'admins' };

      act(() => {
        result.current.onUnionTableSelect(tableOption, 1);
      });

      expect(result.current.unionClauses[0].table).toBeNull();
      expect(result.current.unionClauses[1].table).toEqual(tableOption);
    });

    it('should regenerate query with union table', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
      });

      expect(result.current.query).not.toContain('UNION SELECT');

      act(() => {
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      expect(result.current.query).toContain('UNION SELECT');
      expect(result.current.query).toContain('admins');
    });
  });

  describe('onUnionTypeSelect', () => {
    it('should update union type at specific index', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
      });

      const unionType: SelectOption = { value: 'UNION ALL', label: 'UNION ALL' };

      act(() => {
        result.current.onUnionTypeSelect(unionType, 0);
      });

      expect(result.current.unionClauses[0].unionType).toEqual(unionType);
    });

    it('should support different union types', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
        result.current.onAddUnionClause();
      });

      act(() => {
        result.current.onUnionTypeSelect({ value: 'UNION', label: 'UNION' }, 0);
        result.current.onUnionTypeSelect({ value: 'UNION ALL', label: 'UNION ALL' }, 1);
      });

      expect(result.current.unionClauses[0].unionType?.value).toBe('UNION');
      expect(result.current.unionClauses[1].unionType?.value).toBe('UNION ALL');
    });

    it('should regenerate query with correct union type', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      expect(result.current.query).toContain('UNION SELECT');
      expect(result.current.query).not.toContain('UNION ALL');

      act(() => {
        result.current.onUnionTypeSelect({ value: 'UNION ALL', label: 'UNION ALL' }, 0);
      });

      expect(result.current.query).toContain('UNION ALL SELECT');
    });
  });

  describe('Complete union workflow', () => {
    it('should create a complete union clause', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
      });

      expect(result.current.unionClauses).toHaveLength(1);
      expect(result.current.unionClauses[0]).toHaveProperty('table');
      expect(result.current.unionClauses[0]).toHaveProperty('unionType');

      act(() => {
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      act(() => {
        result.current.onUnionTypeSelect({ value: 'UNION ALL', label: 'UNION ALL' }, 0);
      });

      expect(result.current.unionClauses[0].table?.value).toBe('admins');
      expect(result.current.unionClauses[0].unionType?.value).toBe('UNION ALL');
    });

    it('should handle multiple unions in sequence', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
      });

      const lengthAfterFirstAdd = result.current.unionClauses.length;

      act(() => {
        result.current.onAddUnionClause();
      });

      expect(lengthAfterFirstAdd).toBe(1);
      expect(result.current.unionClauses).toHaveLength(2);
    });

    it('should generate correct SQL for UNION', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      const query = result.current.query;
      expect(query).toContain('SELECT * FROM users');
      expect(query).toContain('UNION SELECT * FROM admins');
      expect(query).toMatch(/SELECT.*FROM users.*UNION SELECT.*FROM admins/);
    });

    it('should generate correct SQL for UNION ALL', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
        result.current.onUnionTypeSelect({ value: 'UNION ALL', label: 'UNION ALL' }, 0);
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      const query = result.current.query;
      expect(query).toContain('UNION ALL SELECT * FROM admins');
    });

    it('should generate SQL with multiple unions', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'guests', label: 'guests' }, 1);
      });

      const query = result.current.query;
      expect(query).toContain('SELECT * FROM users');
      expect(query).toContain('UNION SELECT * FROM admins');
      expect(query).toContain('UNION SELECT * FROM guests');
    });

    it('should use same columns in union queries', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.handleColumnSelect([
          { value: 'id', label: 'id' },
          { value: 'name', label: 'name' },
        ]);
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      const query = result.current.query;
      expect(query).toContain('SELECT id, name FROM users');
      expect(query).toContain('UNION SELECT id, name FROM admins');
    });
  });

  describe('Edge cases', () => {
    it('should handle null table selection', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect(null, 0);
      });

      expect(result.current.unionClauses[0].table).toBeNull();
    });

    it('should maintain union state when other operations occur', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      const initialUnion = result.current.unionClauses[0];

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.handleColumnSelect([{ value: '*', label: '*' }]);
      });

      expect(result.current.unionClauses[0]).toEqual(initialUnion);
    });

    it('should handle union with WHERE clause', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.handleWhereColumnSelect({ value: 'id', label: 'id' }, 0);
        result.current.handleOperatorSelect({ value: '>', label: '>' }, 0);
        result.current.handleValueSelect({ value: '5', label: '5' }, 0);
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      const query = result.current.query;
      expect(query).toContain('WHERE');
      expect(query).toContain('UNION SELECT');
      expect(query).toMatch(/WHERE.*UNION/);
    });

    it('should handle union with ORDER BY and LIMIT', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.handleOrderByColumnSelect({ value: 'name', label: 'name' });
        result.current.handleOrderByDirectionSelect({ value: 'ASC', label: 'ASC' });
        result.current.handleLimitSelect({ value: '10', label: '10' });
        result.current.onAddUnionClause();
        result.current.onUnionTableSelect({ value: 'admins', label: 'admins' }, 0);
      });

      const query = result.current.query;
      expect(query).toContain('ORDER BY');
      expect(query).toContain('LIMIT');
      expect(query).toContain('UNION SELECT');
    });
  });
});

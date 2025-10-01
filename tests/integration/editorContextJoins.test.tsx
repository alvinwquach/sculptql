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
];

describe('EditorContext Join Handlers', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorProvider schema={mockSchema} error={null}>
      {children}
    </EditorProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('onAddJoinClause', () => {
    it('should add a new join clause with default values', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
      });

      expect(result.current.joinClauses).toHaveLength(1);
      expect(result.current.joinClauses[0]).toEqual({
        table: null,
        joinType: { value: 'INNER JOIN', label: 'INNER JOIN' },
        onColumn1: null,
        onColumn2: null,
      });
    });

    it('should add multiple join clauses', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
        result.current.onAddJoinClause();
      });

      expect(result.current.joinClauses).toHaveLength(2);
    });
  });

  describe('onRemoveJoinClause', () => {
    it('should remove a join clause by index', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
        result.current.onAddJoinClause();
      });

      expect(result.current.joinClauses).toHaveLength(2);

      act(() => {
        result.current.onRemoveJoinClause(0);
      });

      expect(result.current.joinClauses).toHaveLength(1);
    });

    it('should handle removing non-existent index gracefully', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
      });

      expect(result.current.joinClauses).toHaveLength(1);

      act(() => {
        result.current.onRemoveJoinClause(5);
      });

      expect(result.current.joinClauses).toHaveLength(1);
    });
  });

  describe('onJoinTableSelect', () => {
    it('should update join table at specific index', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
      });

      const tableOption: SelectOption = { value: 'orders', label: 'orders' };

      act(() => {
        result.current.onJoinTableSelect(tableOption, 0);
      });

      expect(result.current.joinClauses[0].table).toEqual(tableOption);
    });

    it('should not affect other join clauses', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
        result.current.onAddJoinClause();
      });

      const tableOption: SelectOption = { value: 'orders', label: 'orders' };

      act(() => {
        result.current.onJoinTableSelect(tableOption, 1);
      });

      expect(result.current.joinClauses[0].table).toBeNull();
      expect(result.current.joinClauses[1].table).toEqual(tableOption);
    });
  });

  describe('onJoinTypeSelect', () => {
    it('should update join type at specific index', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
      });

      const joinType: SelectOption = { value: 'LEFT JOIN', label: 'LEFT JOIN' };

      act(() => {
        result.current.onJoinTypeSelect(joinType, 0);
      });

      expect(result.current.joinClauses[0].joinType).toEqual(joinType);
    });

    it('should support different join types', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
        result.current.onAddJoinClause();
        result.current.onAddJoinClause();
      });

      act(() => {
        result.current.onJoinTypeSelect({ value: 'LEFT JOIN', label: 'LEFT JOIN' }, 0);
        result.current.onJoinTypeSelect({ value: 'RIGHT JOIN', label: 'RIGHT JOIN' }, 1);
        result.current.onJoinTypeSelect({ value: 'CROSS JOIN', label: 'CROSS JOIN' }, 2);
      });

      expect(result.current.joinClauses[0].joinType?.value).toBe('LEFT JOIN');
      expect(result.current.joinClauses[1].joinType?.value).toBe('RIGHT JOIN');
      expect(result.current.joinClauses[2].joinType?.value).toBe('CROSS JOIN');
    });
  });

  describe('onJoinOnColumn1Select', () => {
    it('should update first column for join condition', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
      });

      const column: SelectOption = { value: 'id', label: 'id' };

      act(() => {
        result.current.onJoinOnColumn1Select(column, 0);
      });

      expect(result.current.joinClauses[0].onColumn1).toEqual(column);
    });
  });

  describe('onJoinOnColumn2Select', () => {
    it('should update second column for join condition', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
      });

      const column: SelectOption = { value: 'user_id', label: 'user_id' };

      act(() => {
        result.current.onJoinOnColumn2Select(column, 0);
      });

      expect(result.current.joinClauses[0].onColumn2).toEqual(column);
    });
  });

  describe('Complete join workflow', () => {
    it('should create a complete join clause', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      let joinClauseAfterAdd: typeof result.current.joinClauses;

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddJoinClause();
      });

      joinClauseAfterAdd = result.current.joinClauses;

      act(() => {
        result.current.onJoinTableSelect({ value: 'orders', label: 'orders' }, 0);
      });

      act(() => {
        result.current.onJoinTypeSelect({ value: 'INNER JOIN', label: 'INNER JOIN' }, 0);
      });

      act(() => {
        result.current.onJoinOnColumn1Select({ value: 'id', label: 'id' }, 0);
      });

      act(() => {
        result.current.onJoinOnColumn2Select({ value: 'user_id', label: 'user_id' }, 0);
      });

      // Verify join was added and has expected default structure
      expect(joinClauseAfterAdd).toHaveLength(1);
      expect(joinClauseAfterAdd[0]).toHaveProperty('table');
      expect(joinClauseAfterAdd[0]).toHaveProperty('joinType');
      expect(joinClauseAfterAdd[0]).toHaveProperty('onColumn1');
      expect(joinClauseAfterAdd[0]).toHaveProperty('onColumn2');
    });

    it('should handle multiple joins in sequence', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.onAddJoinClause();
      });

      const lengthAfterFirstAdd = result.current.joinClauses.length;

      act(() => {
        result.current.onAddJoinClause();
      });

      expect(lengthAfterFirstAdd).toBe(1);
      expect(result.current.joinClauses).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle null table selection', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
        result.current.onJoinTableSelect(null, 0);
      });

      expect(result.current.joinClauses[0].table).toBeNull();
    });

    it('should handle clearing columns', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
        result.current.onJoinOnColumn1Select({ value: 'id', label: 'id' }, 0);
        result.current.onJoinOnColumn1Select(null, 0);
      });

      expect(result.current.joinClauses[0].onColumn1).toBeNull();
    });

    it('should maintain join state when other operations occur', () => {
      const { result } = renderHook(() => useEditorContext(), { wrapper });

      act(() => {
        result.current.onAddJoinClause();
        result.current.onJoinTableSelect({ value: 'orders', label: 'orders' }, 0);
      });

      const initialJoin = result.current.joinClauses[0];

      act(() => {
        result.current.handleTableSelect({ value: 'users', label: 'users' });
        result.current.handleColumnSelect([{ value: '*', label: '*' }]);
      });

      expect(result.current.joinClauses[0]).toEqual(initialJoin);
    });
  });
});

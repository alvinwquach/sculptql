import { renderHook } from '@testing-library/react';
import { useSchemaVersioning } from '@/app/hooks/useSchemaVersioning';
import { useCacheInvalidation } from '@/app/hooks/useCacheInvalidation';
import { expect } from '@jest/globals';

// Interface for the schema version data
interface SchemaVersionData {
  schemaVersion: {
    version: string;
    lastModified: string;
    tableCount: number;
  };
}

// Interface for the mocked useQuery return type
interface UseQueryMockReturn<TData> {
  data: TData | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<{ data: TData }>;
  networkStatus: number;
}

// Mock the useCacheInvalidation hook
jest.mock('@/app/hooks/useCacheInvalidation');
// Define the mock useCacheInvalidation function
const mockUseCacheInvalidation = useCacheInvalidation as jest.MockedFunction<
  typeof useCacheInvalidation
>;

// Mock the useQuery hook from Apollo Client
jest.mock('@apollo/client/react', () => ({
  // Mock the useQuery function
  useQuery: jest.fn(),
}));

// Define a type-safe mocked useQuery
type MockedUseQuery<TData> = jest.MockedFunction<() => UseQueryMockReturn<TData>>;
// Define the mock useQuery function
const mockUseQuery = require('@apollo/client/react').useQuery as MockedUseQuery<SchemaVersionData>;
// Describe the useSchemaVersioning hook
describe('useSchemaVersioning', () => {
  // Mock the invalidateSchemaCache function
  const mockInvalidateSchemaCache = jest.fn();
  // Before each test 
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock the useCacheInvalidation function
    mockUseCacheInvalidation.mockReturnValue({
      invalidateSchemaCache: mockInvalidateSchemaCache,
      invalidateAllCaches: jest.fn(),
    });
    // Reset the invalidateSchemaCache mock
    mockInvalidateSchemaCache.mockResolvedValue(undefined);
  });

  // Test: should detect schema version changes and invalidate cache
  it('should detect schema version changes and invalidate cache', async () => {
    // Define the initial and updated version
    const initialVersion = '5-25-1234567890';
    // Define the updated version
    const updatedVersion = '5-26-1234567891';
    // Mock the useQuery function
    mockUseQuery
      // Mock the useQuery function to return the initial version
      .mockReturnValueOnce({
        data: { schemaVersion: { version: initialVersion, lastModified: '2024-01-01T00:00:00.000Z', tableCount: 5 } },
        error: null,
        loading: false,
        refetch: jest.fn(),
        networkStatus: 7,
      })
      // Mock the useQuery function to return the updated version
      .mockReturnValueOnce({
        data: { schemaVersion: { version: updatedVersion, lastModified: '2024-01-01T00:00:05.000Z', tableCount: 5 } },
        error: null,
        loading: false,
        refetch: jest.fn(),
        networkStatus: 7,
      });
    // Render the hook to get the result and rerender
    const { result, rerender } = renderHook(() => useSchemaVersioning());
    // Expect the initial version to match
    expect(result.current.currentVersion?.version).toBe(initialVersion);
    // Rerender to simulate hook update
    rerender();
    // Expect cache invalidation to have been called
    expect(mockInvalidateSchemaCache).toHaveBeenCalled();
    // Expect the version to have updated
    expect(result.current.currentVersion?.version).toBe(updatedVersion);
  });

  // Test: should not detect schema version changes if the version is the same
  it('should not detect schema version changes if the version is the same', async () => {
    const initialVersion = '5-25-1234567890';
    mockUseQuery
      // Mock the useQuery function to return the initial version
      .mockReturnValue({
        data: { schemaVersion: { version: initialVersion, lastModified: '2024-01-01T00:00:00.000Z', tableCount: 5 } },
        error: null,
        loading: false,
        refetch: jest.fn(),
        networkStatus: 7,
      });
    // Render the hook to get the result and rerender
    const { result, rerender } = renderHook(() => useSchemaVersioning());
    // Expect the initial version to match
    expect(result.current.currentVersion?.version).toBe(initialVersion);
    // Rerender to simulate hook update
    rerender();
    // Expect cache invalidation to not have been called because version didn't change
    expect(mockInvalidateSchemaCache).not.toHaveBeenCalled();
    // Expect the version to remain the same
    expect(result.current.currentVersion?.version).toBe(initialVersion);
  });


  // Test: should handle errors returned from useQuery
  it('should handle errors returned from useQuery', async () => {
    // Define the error
    const error = new Error('Failed to fetch schema version');
    // Mock the useQuery function to return an error
    mockUseQuery.mockReturnValue({
      data: null,
      error,
      loading: false,
      refetch: jest.fn(),
      networkStatus: 7,
    });
    // Render the hook to get the result and expect the error to be populated
    const { result } = renderHook(() => useSchemaVersioning());
    // Expect the error to be populated
    expect(result.current.error).toBe(error);
    // Expect the current version to be null
    expect(result.current.currentVersion).toBeNull();
  });
});

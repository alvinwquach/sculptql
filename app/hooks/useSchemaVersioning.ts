import { useEffect, useRef } from 'react';
import { GET_SCHEMA_VERSION } from '@/app/graphql/queries/getSchemaVersion';
import { useCacheInvalidation } from './useCacheInvalidation';
import { useQuery } from '@apollo/client/react';

// Interface for the schema version
interface SchemaVersion {
    version: string;
    lastModified: string;
    tableCount: number;
}

// Interface for the schema version data
interface SchemaVersionData {
    schemaVersion: SchemaVersion;
}

export function useSchemaVersioning() {
    // Get the invalidate schema cache function
    const { invalidateSchemaCache } = useCacheInvalidation();
    // Create a ref to store the last version
    const lastVersionRef = useRef<string | null>(null);
    // Create a ref to store the is invalidating flag
    const isInvalidatingRef = useRef(false);

    // Get the schema version data - only check when needed
    const { data, error } = useQuery<SchemaVersionData>(
        GET_SCHEMA_VERSION,
        {
            pollInterval: 0, // Disable polling - only check on manual refresh
            fetchPolicy: 'cache-first', // Use cache first to prevent unnecessary network requests
            errorPolicy: 'all',
            skip: true // Skip automatic fetching - only fetch when explicitly needed
        }
    );

    // Handle version changes in useEffect
    useEffect(() => {
        if (!data?.schemaVersion) return;

        const currentVersion = data.schemaVersion.version;
        
    // Handle initial version
    if (!lastVersionRef.current) {
        lastVersionRef.current = currentVersion;
        console.log('📋 Initial schema version:', currentVersion);
        // Only invalidate cache if we don't have cached data
        // This prevents unnecessary refetches on page load
        return;
    }

        // Handle version changes
        if (currentVersion !== lastVersionRef.current && !isInvalidatingRef.current) {
            console.log('🔄 Schema version changed:', {
                from: lastVersionRef.current,
                to: currentVersion,
                tableCount: data.schemaVersion.tableCount,
            });

            isInvalidatingRef.current = true;

            invalidateSchemaCache()
                .then(() => {
                    lastVersionRef.current = currentVersion;
                    isInvalidatingRef.current = false;
                    console.log('✅ Schema cache invalidated due to version change');
                })
                .catch((err: unknown) => {
                    console.error('❌ Failed to invalidate schema cache:', err);
                    isInvalidatingRef.current = false;
                });
        }
    }, [data?.schemaVersion, invalidateSchemaCache]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            isInvalidatingRef.current = false;
        };
    }, []);

    return {
        currentVersion: data?.schemaVersion,
        error,
        isPolling: true,
    };
}
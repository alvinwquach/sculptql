"use client";

import { useApolloClient } from "@apollo/client/react";
import { useEffect } from "react";
import { unifiedCache } from "@/app/utils/unifiedCache";
import { NormalizedCacheObject } from "@apollo/client";

export function useApolloCachePersistence(onCacheReady?: () => void) {
  // Get the client
  const client = useApolloClient();
  
  useEffect(() => {
    // Function to restore cache on mount
    const restoreCache = async () => {
      // Log the starting cache restoration
      console.log('🔄 Starting Apollo cache restoration...');
      try {
        // Get the cache data from the unified cache
        const cacheData = await unifiedCache.getApolloCache();
        // If the cache data is not null
        if (cacheData) {
          // Log cache data details
          console.log('📦 Found cached Apollo data with', Object.keys(cacheData).length, 'entries');
          // Restore the cache data
          client.cache.restore(cacheData);
          // Log the cache restored
          console.log('✅ Apollo cache restored on mount');
        } else {
          // Log no cached Apollo data found on mount
          console.log('ℹ️ No cached Apollo data found on mount');
        }
      } catch (error) {
        // Log the failed to restore Apollo cache
        console.log('❌ Failed to restore Apollo cache on mount:', error);
      } finally {
        // Log the Apollo cache restoration complete
        console.log('🏁 Apollo cache restoration complete');
        // Always call the callback when cache restoration is complete
        if (onCacheReady) {
          // Call the callback
          onCacheReady();
        }
      }
    };

    // Function to save the cache
    const saveCache = async () => {
      try {
        // Get the cache data
        const cacheData = client.cache.extract() as NormalizedCacheObject;
        // Log cache save attempt with the number of entries in the cache
        console.log('💾 Saving Apollo cache with', Object.keys(cacheData).length, 'entries');
        // Save to unified cache (IndexedDB first, localStorage fallback) 
        await unifiedCache.setApolloCache(cacheData, 10 * 60 * 1000); 
        // Log the Apollo cache saved successfully
        console.log('✅ Apollo cache saved successfully');
      } catch (error) {
        // Log the failed to save Apollo cache
        console.log('❌ Failed to save Apollo cache:', error);
      }
    };
    
    // Function to handle before unload
    const handleBeforeUnload = () => {
      try {
        // Get the cache data
        const cacheData = client.cache.extract() as NormalizedCacheObject;
        // Save to unified cache (IndexedDB first, localStorage fallback)
        unifiedCache.setApolloCache(cacheData, 10 * 60 * 1000).catch((error) => {
          // Log the failed to save cache on unload
          console.log('Failed to save cache on unload:', error);
        });
      } catch (error) {
        // Log the failed to save cache on unload
        console.log('Failed to save cache on unload:', error);
      }
    };
    // Restore cache on mount
    restoreCache();
    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    // Set up periodic cache saving every 2 minutes
    const saveInterval = setInterval(saveCache, 2 * 60 * 1000);
    // Return the cleanup function
    return () => {
      // Clear the interval
      clearInterval(saveInterval);
      // Remove the event listener for page unload
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save the cache
      saveCache(); 
    };
  }, [client]);
}
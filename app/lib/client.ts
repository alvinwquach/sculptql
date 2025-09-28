import { HttpLink, ApolloClient, InMemoryCache, from } from "@apollo/client";
// import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";

// Create the is browser state by the window object and the undefined check
const isBrowser = typeof window !== "undefined";
// Create the graphql url by the browser 
// or the next public graphql url
const graphqlUrl = isBrowser
  ? "/api/graphql"
  : process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://sculptql.com/api/graphql";


const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 2000,
    jitter: true
  },
  attempts: {
    max: 2,
    retryIf: (error) => !!error && !error.message.includes('timeout') 
  }
});

const httpLink = new HttpLink({
  uri: graphqlUrl,
  credentials: "include",
  fetch: (uri, options) => {
    if (isBrowser) {
      const startTime = performance.now();
      return fetch(uri, {
        ...options,
        headers: {
          ...options?.headers,
          'Cache-Control': 'max-age=300', 
        }
      }).then(response => {
        const endTime = performance.now();
        console.log(`GraphQL request took ${(endTime - startTime).toFixed(2)}ms`);
        return response;
      });
    }
    return fetch(uri, options);
  }
});

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          schema: {
            merge: (existing, incoming) => incoming,
          },
        },
      },
      Table: {
        keyFields: ['table_name'],
        fields: {
          values: {
            merge: false, // Don't cache large sample values
          },
        },
      },
    },
    // Performance optimizations
    resultCaching: true,
  }),
  // Link chain with error handling and retries
  link: from([
    // errorLink, // temporarily disabled
    retryLink,
    httpLink
  ]),
  // Optimized default options
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
      nextFetchPolicy: "cache-first",
      notifyOnNetworkStatusChange: true,
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  }
});

export const getClient = () => client;
export const query = client.query.bind(client);
export const PreloadQuery = client.query.bind(client);

// Utility functions for cache management
export const clearCache = () => client.cache.reset();
export const getCacheSize = () => client.cache.extract();